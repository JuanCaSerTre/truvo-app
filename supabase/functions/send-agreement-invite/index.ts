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

const configuredRequestTimeoutMs = Number(Deno.env.get('EXTERNAL_REQUEST_TIMEOUT_MS') || 10000);
const DEFAULT_REQUEST_TIMEOUT_MS = Number.isFinite(configuredRequestTimeoutMs) && configuredRequestTimeoutMs > 0 ? configuredRequestTimeoutMs : 10000;
const EXPO_PUSH_URL = Deno.env.get('EXPO_PUSH_URL') || 'https://exp.host/--/api/v2/push/send';
const RESEND_EMAIL_URL = Deno.env.get('RESEND_EMAIL_URL') || 'https://api.resend.com/emails';

const getAllowedOrigin = (request: Request) => {
  const origin = request.headers.get('Origin');
  const configured = Deno.env.get('INVITE_ALLOWED_ORIGINS');
  if (!origin) return '*';
  if (!configured) return '';

  const allowedOrigins = configured
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin) ? origin : '';
};

const corsHeaders = (request: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(request),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });

const isOriginAllowed = (request: Request) => {
  const origin = request.headers.get('Origin');
  return !origin || Boolean(getAllowedOrigin(request));
};

const fetchWithTimeout = async (url: string, init?: RequestInit, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: init?.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

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
  const response = await fetchWithTimeout(url, {
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
  const response = await fetchWithTimeout(url, {
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
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  const response = await fetchWithTimeout(EXPO_PUSH_URL, {
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
  if (!serviceRoleKey) return 'App notification skipped.';
  if (!agreement.borrower_email) return 'App notification skipped.';

  const borrowerEmail = normalizeEmail(agreement.borrower_email);
  const borrowerProfiles = await serviceRequest<ProfileRow[]>(
    `${supabaseUrl}/rest/v1/profiles?select=id,name,email,currency&email=ilike.${encodeURIComponent(borrowerEmail)}&limit=1`,
    serviceRoleKey,
  );
  const borrower = borrowerProfiles[0];
  if (!borrower) return 'App notification skipped.';

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
    return 'App notification skipped.';
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
    return 'App notification sent.';
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
      type: 'new_agreement_request',
      route: `/agreement-request/${agreement.id}`,
    },
  );

  return tokens.length ? 'App notification and push sent.' : 'App notification sent.';
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
  const borrowerName = escapeHtml(agreement.borrower_name || 'there');
  const lenderName = escapeHtml(lender.name);
  const safeInviteLink = escapeHtml(inviteLink);
  return `
    <div style="font-family: Arial, sans-serif; color: #0F172A; line-height: 1.5; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 16px;">Review your TRUVO agreement</h1>
      <p>Hi ${borrowerName},</p>
      <p><strong>${lenderName}</strong> sent you a TRUVO agreement request.</p>
      <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Principal:</strong> ${formatMoney(agreement.principal_amount, currency)}</p>
        <p style="margin: 0 0 8px;"><strong>Total repayment:</strong> ${formatMoney(agreement.total_repayment_amount, currency)}</p>
        <p style="margin: 0 0 8px;"><strong>Payments:</strong> ${agreement.number_of_payments} ${agreement.payment_frequency}</p>
        <p style="margin: 0;"><strong>Due date:</strong> ${formatDate(agreement.due_date)}</p>
      </div>
      <p>
        <a href="${safeInviteLink}" style="display: inline-block; background: #0F172A; color: #FFFFFF; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
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
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { status: headers['Access-Control-Allow-Origin'] ? 200 : 403, headers });
  if (!isOriginAllowed(request)) return json(request, { error: 'Origin not allowed.' }, 403);
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405);

  try {
    const jwt = getJwt(request);
    if (!jwt) return json(request, { error: 'Missing authorization token.' }, 401);

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') return json(request, { error: 'Invalid JSON body.' }, 400);

    const { agreementId } = payload as { agreementId?: unknown };
    if (!agreementId || typeof agreementId !== 'string' || !isUuid(agreementId)) {
      return json(request, { error: 'A valid agreement id is required.' }, 400);
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
    if (!agreement) return json(request, { error: 'Agreement not found.' }, 404);
    if (agreement.lender_id !== authUser.id) return json(request, { error: 'Invite is not available for this agreement.' }, 403);
    if (agreement.status !== 'pending') return json(request, { error: 'Invite is not available for this agreement.' }, 400);
    if (!agreement.borrower_email) return json(request, { error: 'Invite is not available for this agreement.' }, 400);

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
      return json(request, {
        status: 'skipped',
        message: `${appNotificationMessage} Email invite is not configured.`,
      });
    }

    const emailResponse = await fetchWithTimeout(RESEND_EMAIL_URL, {
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

    await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      return json(request, { error: 'Email provider rejected the invite.' }, 502);
    }

    return json(request, {
      status: 'sent',
      message: `Invite email sent. ${appNotificationMessage}`,
    });
  } catch {
    return json(request, { error: 'Unexpected invite error.' }, 500);
  }
});
