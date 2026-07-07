import { Agreement, Contact, ContactInput, InviteEmailResult, Notification, NotificationSettings, Payment, PaymentInput, User } from '@/types/models';
import { supabase } from '@/lib/supabase';

type AgreementRow = {
  id: string;
  lender_id: string;
  borrower_id: string | null;
  borrower_phone: string | null;
  borrower_email: string | null;
  borrower_name: string | null;
  principal_amount: number | string;
  interest_rate: number | string | null;
  interest_amount: number | string;
  total_repayment_amount: number | string;
  number_of_payments: number;
  payment_frequency: Agreement['paymentFrequency'];
  start_date: string;
  due_date: string;
  notes: string | null;
  status: Agreement['status'];
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  next_payment_date: string | null;
  scheduled_payments?: ScheduledPaymentRow[];
};

type ScheduledPaymentRow = {
  payment_number: number;
  due_date: string;
  amount: number | string;
  status: NonNullable<Agreement['paymentSchedule']>[number]['status'];
};

type PaymentRow = {
  id: string;
  agreement_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number | string;
  payment_date: string;
  method: Payment['method'];
  notes: string | null;
  status: Payment['status'];
  created_at: string;
  confirmed_at: string | null;
  rejected_at: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: Notification['type'] | 'payment_reminder';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  archived_at: string | null;
  related_agreement_id: string | null;
  related_payment_id: string | null;
};

type NotificationSettingsRow = {
  user_id: string;
  agreement_requests: boolean;
  payment_confirmations: boolean;
  payment_reminders: boolean;
  overdue_payments: boolean;
  marketing_messages: boolean;
  product_updates: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  updated_at: string | null;
};

type ContactRow = {
  id: string;
  owner_id: string;
  contact_email: string;
  contact_name: string | null;
  created_at: string;
  updated_at: string | null;
};

const asNumber = (value: number | string | null | undefined) => Number(value || 0);

const toAgreementRow = (agreement: Agreement) => ({
  id: agreement.id,
  lender_id: agreement.lenderId,
  borrower_id: agreement.borrowerId,
  borrower_phone: agreement.borrowerPhone,
  borrower_email: agreement.borrowerEmail,
  borrower_name: agreement.borrowerName,
  principal_amount: agreement.principalAmount,
  interest_rate: agreement.interestRate,
  interest_amount: agreement.interestAmount,
  total_repayment_amount: agreement.totalRepaymentAmount,
  number_of_payments: agreement.numberOfPayments,
  payment_frequency: agreement.paymentFrequency,
  start_date: agreement.startDate,
  due_date: agreement.dueDate,
  notes: agreement.notes,
  status: agreement.status,
  created_at: agreement.createdAt,
  accepted_at: agreement.acceptedAt,
  completed_at: agreement.completedAt,
  next_payment_date: agreement.nextPaymentDate,
});

const toPaymentRow = (payment: Payment) => ({
  id: payment.id,
  agreement_id: payment.agreementId,
  payer_id: payment.payerId,
  receiver_id: payment.receiverId,
  amount: payment.amount,
  payment_date: payment.paymentDate,
  method: payment.method,
  notes: payment.notes,
  status: payment.status,
  created_at: payment.createdAt,
  confirmed_at: payment.confirmedAt,
  rejected_at: payment.rejectedAt,
});

const toNotificationRow = (notification: Notification) => ({
  id: notification.id,
  user_id: notification.userId,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  read: notification.read,
  created_at: notification.createdAt,
  archived_at: notification.archivedAt,
  related_agreement_id: notification.relatedAgreementId,
  related_payment_id: notification.relatedPaymentId,
});

const toNotificationSettingsRow = (userId: string, settings: NotificationSettings) => ({
  user_id: userId,
  agreement_requests: settings.agreementRequests,
  payment_confirmations: settings.paymentConfirmations,
  payment_reminders: settings.paymentReminders,
  overdue_payments: settings.overduePayments,
  marketing_messages: settings.marketingMessages,
  product_updates: settings.productUpdates,
  push_notifications: settings.pushNotifications,
  email_notifications: settings.emailNotifications,
  updated_at: new Date().toISOString(),
});

const toContactRow = (contact: Contact) => ({
  id: contact.id,
  owner_id: contact.ownerId,
  contact_email: contact.contactEmail,
  contact_name: contact.contactName,
  created_at: contact.createdAt,
  updated_at: contact.updatedAt,
});

const fromAgreementRow = (row: AgreementRow): Agreement => ({
  id: row.id,
  lenderId: row.lender_id,
  borrowerId: row.borrower_id || undefined,
  borrowerPhone: row.borrower_phone || '',
  borrowerEmail: row.borrower_email || undefined,
  borrowerName: row.borrower_name || undefined,
  principalAmount: asNumber(row.principal_amount),
  interestRate: row.interest_rate === null ? undefined : asNumber(row.interest_rate),
  interestAmount: asNumber(row.interest_amount),
  totalRepaymentAmount: asNumber(row.total_repayment_amount),
  numberOfPayments: row.number_of_payments,
  paymentFrequency: row.payment_frequency,
  startDate: row.start_date,
  dueDate: row.due_date,
  notes: row.notes || undefined,
  status: row.status,
  createdAt: row.created_at,
  acceptedAt: row.accepted_at || undefined,
  completedAt: row.completed_at || undefined,
  nextPaymentDate: row.next_payment_date || undefined,
  paymentSchedule: row.scheduled_payments
    ?.sort((a, b) => a.payment_number - b.payment_number)
    .map((payment) => ({
      payment_number: payment.payment_number,
      due_date: payment.due_date,
      amount: asNumber(payment.amount),
      status: payment.status,
    })),
});

const fromPaymentRow = (row: PaymentRow): Payment => ({
  id: row.id,
  agreementId: row.agreement_id,
  payerId: row.payer_id,
  receiverId: row.receiver_id,
  amount: asNumber(row.amount),
  paymentDate: row.payment_date,
  method: row.method,
  notes: row.notes || undefined,
  status: row.status,
  createdAt: row.created_at,
  confirmedAt: row.confirmed_at || undefined,
  rejectedAt: row.rejected_at || undefined,
});

const fromNotificationRow = (row: NotificationRow): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type === 'payment_reminder' ? 'upcoming_payment_reminder' : row.type,
  title: row.title,
  body: row.body,
  read: row.read,
  createdAt: row.created_at,
  archivedAt: row.archived_at || undefined,
  relatedAgreementId: row.related_agreement_id || undefined,
  relatedPaymentId: row.related_payment_id || undefined,
});

const fromNotificationSettingsRow = (row: NotificationSettingsRow): NotificationSettings => ({
  agreementRequests: row.agreement_requests,
  paymentConfirmations: row.payment_confirmations,
  paymentReminders: row.payment_reminders,
  overduePayments: row.overdue_payments,
  marketingMessages: row.marketing_messages,
  productUpdates: row.product_updates,
  pushNotifications: row.push_notifications,
  emailNotifications: row.email_notifications,
});

const fromContactRow = (row: ContactRow): Contact => ({
  id: row.id,
  ownerId: row.owner_id,
  contactEmail: row.contact_email,
  contactName: row.contact_name || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at || undefined,
});

export const agreementService = {
  async createAgreement(agreement: Agreement): Promise<Agreement> {
    if (!supabase) {
      return agreement;
    }

    const { error } = await supabase.from('agreements').insert(toAgreementRow(agreement));
    if (error) throw error;

    if (agreement.paymentSchedule?.length) {
      const { error: scheduleError } = await supabase.from('scheduled_payments').insert(
        agreement.paymentSchedule.map((payment) => ({
          agreement_id: agreement.id,
          payment_number: payment.payment_number,
          due_date: payment.due_date,
          amount: payment.amount,
          status: payment.status,
        })),
      );
      if (scheduleError) {
        await supabase.from('agreements').delete().eq('id', agreement.id);
        throw scheduleError;
      }
    }

    return agreement;
  },

  async updateAgreement(agreement: Agreement): Promise<Agreement> {
    if (!supabase) return agreement;
    const { error } = await supabase.from('agreements').update(toAgreementRow(agreement)).eq('id', agreement.id);
    if (error) throw error;
    return agreement;
  },

  async updateScheduledPayments(agreementId: string, paymentSchedule: NonNullable<Agreement['paymentSchedule']>): Promise<void> {
    if (!supabase) return;
    const client = supabase;
    const updates = paymentSchedule.map((payment) =>
      client
        .from('scheduled_payments')
        .update({ status: payment.status, due_date: payment.due_date, amount: payment.amount })
        .eq('agreement_id', agreementId)
        .eq('payment_number', payment.payment_number),
    );
    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;
    if (error) throw error;
  },

  async sendAgreementInvite(agreementId: string): Promise<InviteEmailResult> {
    if (!supabase) {
      return {
        status: 'skipped',
        message: 'Supabase is not configured, so no email invite was sent.',
      };
    }

    const { data, error } = await supabase.functions.invoke<InviteEmailResult>('send-agreement-invite', {
      body: { agreementId },
    });

    if (error) throw error;
    if (!data) throw new Error('The invite function did not return a response.');
    return data;
  },

  async registerPayment(input: PaymentInput): Promise<PaymentInput> {
    return input;
  },

  async createPayment(payment: Payment): Promise<Payment> {
    if (!supabase) return payment;
    const { error } = await supabase.from('payments').insert(toPaymentRow(payment));
    if (error) throw error;
    return payment;
  },

  async updatePayment(payment: Payment): Promise<Payment> {
    if (!supabase) return payment;
    const { error } = await supabase.from('payments').update(toPaymentRow(payment)).eq('id', payment.id);
    if (error) throw error;
    return payment;
  },

  async createNotification(notification: Notification): Promise<Notification> {
    if (!supabase) return notification;
    const { error } = await supabase.from('notifications').insert(toNotificationRow(notification));
    if (error) throw error;
    return notification;
  },

  subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void): () => void {
    if (!supabase) return () => {};
    const client = supabase;
    const channel = client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => onNotification(fromNotificationRow(payload.new as NotificationRow)),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    if (error) throw error;
  },

  async archiveNotification(notificationId: string, archivedAt: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('notifications').update({ read: true, archived_at: archivedAt }).eq('id', notificationId);
    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
    if (error) throw error;
  },

  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error && (error as { code?: string }).code !== '42P01') throw error;
    return data ? fromNotificationSettingsRow(data as NotificationSettingsRow) : undefined;
  },

  async updateNotificationSettings(userId: string, settings: NotificationSettings): Promise<NotificationSettings> {
    if (!supabase) return settings;
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(toNotificationSettingsRow(userId, settings), { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw error;
    return fromNotificationSettingsRow(data as NotificationSettingsRow);
  },

  async upsertContact(contact: Contact): Promise<Contact> {
    if (!supabase) return contact;
    const { data, error } = await supabase
      .from('contacts')
      .upsert(toContactRow(contact), { onConflict: 'owner_id,contact_email' })
      .select('*')
      .single();
    if (error) throw error;
    return fromContactRow(data as ContactRow);
  },

  async createContact(input: ContactInput, ownerId: string): Promise<Contact> {
    const now = new Date().toISOString();
    const contact: Contact = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        const value = char === 'x' ? random : (random & 0x3) | 0x8;
        return value.toString(16);
      }),
      ownerId,
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactName: input.contactName?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    return this.upsertContact(contact);
  },

  async syncAgreements(currentUser?: User): Promise<{ agreements: Agreement[]; payments: Payment[]; notifications: Notification[]; contacts: Contact[] }> {
    if (!supabase) {
      return { agreements: [], payments: [], notifications: [], contacts: [] };
    }
    if (!currentUser) return { agreements: [], payments: [], notifications: [], contacts: [] };

    const agreementFilters = [`lender_id.eq.${currentUser.id}`, `borrower_id.eq.${currentUser.id}`];
    if (currentUser.email) agreementFilters.push(`borrower_email.eq.${currentUser.email.toLowerCase()}`);

    const [
      { data: agreementRows, error: agreementError },
      { data: paymentRows, error: paymentError },
      { data: notificationRows, error: notificationError },
      { data: contactRows, error: contactError },
    ] = await Promise.all([
      supabase
        .from('agreements')
        .select('*, scheduled_payments(payment_number, due_date, amount, status)')
        .or(agreementFilters.join(','))
        .order('created_at', { ascending: false }),
      supabase
        .from('payments')
        .select('*')
        .or(`payer_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('owner_id', currentUser.id).order('contact_name', { ascending: true }),
    ]);

    if (agreementError) throw agreementError;
    if (paymentError) throw paymentError;
    if (notificationError) throw notificationError;
    if (contactError && (contactError as { code?: string }).code !== '42P01') throw contactError;

    return {
      agreements: ((agreementRows || []) as AgreementRow[]).map(fromAgreementRow),
      payments: ((paymentRows || []) as PaymentRow[]).map(fromPaymentRow),
      notifications: ((notificationRows || []) as NotificationRow[]).map(fromNotificationRow),
      contacts: ((contactRows || []) as ContactRow[]).map(fromContactRow),
    };
  },
};
