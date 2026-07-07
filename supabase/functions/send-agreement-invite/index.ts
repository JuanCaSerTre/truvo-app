// @ts-nocheck
type AgreementRow = {
  id: string;
  lender_id: string;
  borrower_id: string | null;
  borrower_email: string | null;
  borrower_name: string | null;
  principal_amount: number | string;
  total_repayment_amount: number | string;
  number_of_payments: number;
  payment_frequency: string;
  due_date: string;
  status: string;
};

type ProfileRow = {
  id: string;
  name: string;
  email: string | null;
  currency: string | null;
};

type DevicePushTokenRow = {
  token: string;
};

type NotificationSettingsRow = {
  agreement_requests: boolean;
  push_notifications: boolean;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} is not configured.`);
  return value;
};

const getJwt = (request: Request) => {
  const authorization = request.headers.get('Authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
};

const getJson = async <T>(url: string, jwt: string, anonKey: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}.`);
  }
  return response.json();
};

const serviceRequest = async <T>(url: string, serviceRoleKey: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Service request failed with ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
};

const isMissingRelationError = (message: string) =>
  message.includes('PGRST205') ||
  message.includes('42P01') ||
  message.toLowerCase().includes('could not find the table') ||
  message.toLowerCase().includes('relation') && message.toLowerCase().includes('does not exist');

const optionalServiceRequest = async <T>(url: string, serviceRoleKey: string, fallback: T, init?: RequestInit): Promise<T> => {
  try {
    return await serviceRequest<T>(url, serviceRoleKey, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isMissingRelationError(message)) return fallback;
    throw error;
  }
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const sendExpoPush = async (tokens: string[], title: string, body: string, data: Record<string, string>) => {
  const messages = tokens
    .filter((token) => /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token))
    .map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));
  if (!messages.length) return;

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Expo push notification request failed.');
  }
};

const notifyBorrowerAccount = async ({
  supabaseUrl,
  serviceRoleKey,
  agreement,
  lender,
}: {
  supabaseUrl: string;
  serviceRoleKey?: string;
  agreement: AgreementRow;
  lender: ProfileRow;
}) => {
  if (!serviceRoleKey) return 'App notification skipped: SUPABASE_SERVICE_ROLE_KEY is not configured.';
  if (!agreement.borrower_email) return 'App notification skipped: agreement has no borrower email.';

  const borrowerEmail = normalizeEmail(agreement.borrower_email);
  const borrowerProfiles = await serviceRequest<ProfileRow[]>(
    `${supabaseUrl}/rest/v1/profiles?select=id,name,email,currency&email=ilike.${encodeURIComponent(borrowerEmail)}&limit=1`,
    serviceRoleKey,
  );
  const borrower = borrowerProfiles[0];
  if (!borrower) return `App notification skipped: ${borrowerEmail} does not have a TRUVO account yet.`;

  if (agreement.borrower_id !== borrower.id) {
    await serviceRequest(
      `${supabaseUrl}/rest/v1/agreements?id=eq.${encodeURIComponent(agreement.id)}`,
      serviceRoleKey,
      {
        method: 'PATCH',
        body: JSON.stringify({ borrower_id: borrower.id }),
      },
    );
  }

  const settingsRows = await optionalServiceRequest<NotificationSettingsRow[]>(
    `${supabaseUrl}/rest/v1/notification_settings?select=agreement_requests,push_notifications&user_id=eq.${encodeURIComponent(borrower.id)}&limit=1`,
    serviceRoleKey,
    [],
  );
  const settings = settingsRows[0];
  if (settings?.agreement_requests === false) {
    return `App notification skipped: ${borrowerEmail} has agreement notifications disabled.`;
  }

  const title = 'New agreement request';
  const body = `${lender.name} sent you a TRUVO agreement request to review.`;
  await serviceRequest(
    `${supabaseUrl}/rest/v1/notifications`,
    serviceRoleKey,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: borrower.id,
        type: 'new_agreement_request',
        title,
        body,
        read: false,
        related_agreement_id: agreement.id,
      }),
    },
  );

  if (settings?.push_notifications === false) {
    return `App notification sent to ${borrowerEmail}; push is disabled in notification settings.`;
  }

  const pushTokens = await optionalServiceRequest<DevicePushTokenRow[]>(
    `${supabaseUrl}/rest/v1/device_push_tokens?select=token&user_id=eq.${encodeURIComponent(borrower.id)}`,
    serviceRoleKey,
    [],
  );
  const tokens = pushTokens.map((item) => item.token);
  await sendExpoPush(
    tokens,
    title,
    body,
    {
      agreementId: agreement.id,
      type: 'new_agreement_request',
      route: `/agreement-request/${agreement.id}`,
      url: `truvo://agreement-request/${agreement.id}`,
    },
  );

  return tokens.length
    ? `App notification and push sent to ${borrowerEmail}.`
    : `App notification sent to ${borrowerEmail}; no registered push token yet.`;
};

const formatMoney = (amount: number | string, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

const buildInviteLink = (agreementId: string) => {
  const baseUrl = Deno.env.get('INVITE_BASE_URL') || 'truvo://';
  if (baseUrl.endsWith('://')) return `${baseUrl}agreement-request/${agreementId}`;
  return `${baseUrl.replace(/\/+$/, '')}/agreement-request/${agreementId}`;
};

const renderText = (agreement: AgreementRow, lender: ProfileRow, inviteLink: string, currency: string) => {
  const borrowerName = agreement.borrower_name || 'there';
  return [
    `Hi ${borrowerName},`,
    '',
    `${lender.name} sent you a TRUVO agreement request.`,
    '',
    `Principal: ${formatMoney(agreement.principal_amount, currency)}`,
    `Total repayment: ${formatMoney(agreement.total_repayment_amount, currency)}`,
    `Payments: ${agreement.number_of_payments} ${agreement.payment_frequency}`,
    `Due date: ${formatDate(agreement.due_date)}`,
    '',
    `Review the request here: ${inviteLink}`,
    '',
    'TRUVO does not provide loans or financial services. TRUVO only records and tracks agreements between individuals.',
  ].join('\n');
};

const renderHtml = (agreement: AgreementRow, lender: ProfileRow, inviteLink: string, currency: string) => {
  const borrowerName = agreement.borrower_name || 'there';
  return `
    <div style="font-family: Arial, sans-serif; color: #0F172A; line-height: 1.5; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 16px;">Review your TRUVO agreement</h1>
      <p>Hi ${borrowerName},</p>
      <p><strong>${lender.name}</strong> sent you a TRUVO agreement request.</p>
      <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Principal:</strong> ${formatMoney(agreement.principal_amount, currency)}</p>
        <p style="margin: 0 0 8px;"><strong>Total repayment:</strong> ${formatMoney(agreement.total_repayment_amount, currency)}</p>
        <p style="margin: 0 0 8px;"><strong>Payments:</strong> ${agreement.number_of_payments} ${agreement.payment_frequency}</p>
        <p style="margin: 0;"><strong>Due date:</strong> ${formatDate(agreement.due_date)}</p>
      </div>
      <p>
        <a href="${inviteLink}" style="display: inline-block; background: #0F172A; color: #FFFFFF; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
          Review agreement
        </a>
      </p>
      <p style="font-size: 13px; color: #64748B;">
        TRUVO does not provide loans or financial services. TRUVO only records and tracks agreements between individuals.
      </p>
    </div>
  `;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const jwt = getJwt(request);
    if (!jwt) return json({ error: 'Missing authorization token.' }, 401);

    const { agreementId } = await request.json();
    if (!agreementId || typeof agreementId !== 'string') {
      return json({ error: 'agreementId is required.' }, 400);
    }

    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const anonKey = getRequiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('INVITE_FROM_EMAIL');

    const authUser = await getJson<{ id: string; email?: string }>(`${supabaseUrl}/auth/v1/user`, jwt, anonKey);
    const agreementRows = await getJson<AgreementRow[]>(
      `${supabaseUrl}/rest/v1/agreements?select=id,lender_id,borrower_id,borrower_email,borrower_name,principal_amount,total_repayment_amount,number_of_payments,payment_frequency,due_date,status&id=eq.${encodeURIComponent(agreementId)}&limit=1`,
      jwt,
      anonKey,
    );
    const agreement = agreementRows[0];
    if (!agreement) return json({ error: 'Agreement not found.' }, 404);
    if (agreement.lender_id !== authUser.id) return json({ error: 'Only the lender can send this invite.' }, 403);
    if (agreement.status !== 'pending') return json({ error: 'Only pending agreements can be invited.' }, 400);
    if (!agreement.borrower_email) return json({ error: 'Agreement does not have a borrower email.' }, 400);

    const profileRows = await getJson<ProfileRow[]>(
      `${supabaseUrl}/rest/v1/profiles?select=name,email,currency&id=eq.${encodeURIComponent(authUser.id)}&limit=1`,
      jwt,
      anonKey,
    );
    const lender = profileRows[0] || { name: 'A TRUVO user', email: authUser.email || null, currency: 'USD' };
    const currency = lender.currency || 'USD';
    const inviteLink = buildInviteLink(agreement.id);
    const appNotificationMessage = await notifyBorrowerAccount({ supabaseUrl, serviceRoleKey, agreement, lender });

    if (!resendApiKey || !fromEmail) {
      return json({
        status: 'skipped',
        message: `${appNotificationMessage} Email skipped: set RESEND_API_KEY and INVITE_FROM_EMAIL in Supabase secrets.`,
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [agreement.borrower_email],
        reply_to: lender.email || undefined,
        subject: `${lender.name} sent you a TRUVO agreement request`,
        text: renderText(agreement, lender, inviteLink, currency),
        html: renderHtml(agreement, lender, inviteLink, currency),
      }),
    });

    const emailBody = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      return json({ error: emailBody.message || 'Email provider rejected the invite.' }, 502);
    }

    return json({
      status: 'sent',
      message: `Invite email sent to ${agreement.borrower_email}. ${appNotificationMessage}`,
      providerMessageId: emailBody.id,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected invite error.' }, 500);
  }
});
