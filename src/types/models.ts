export type SubscriptionStatus = 'free' | 'premium_monthly' | 'premium_yearly';
export type ContactPreference = 'email' | 'phone' | 'whatsapp';
export type UserRolePreference = 'lender' | 'borrower' | 'both';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  contactPreference?: ContactPreference;
  userRole?: UserRolePreference;
  avatarUrl?: string;
  subscription_status: SubscriptionStatus;
  createdAt: string;
}

export interface UserProfileInput {
  name: string;
  phone?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  contactPreference?: ContactPreference;
  userRole?: UserRolePreference;
}

export interface Contact {
  id: string;
  ownerId: string;
  contactEmail: string;
  contactName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactInput {
  contactEmail: string;
  contactName?: string;
}

export type AgreementStatus = 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled';
export type PaymentFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly';
export type AgreementRole = 'lender' | 'borrower';
export type ScheduledPaymentStatus = 'scheduled' | 'pending_confirmation' | 'confirmed' | 'missed';

export interface ScheduledPayment {
  payment_number: number;
  due_date: string;
  amount: number;
  status: ScheduledPaymentStatus;
}

export interface Agreement {
  id: string;
  lenderId: string;
  borrowerId?: string;
  borrowerPhone: string;
  borrowerEmail?: string;
  borrowerName?: string;
  principalAmount: number;
  interestRate?: number;
  interestAmount: number;
  totalRepaymentAmount: number;
  numberOfPayments: number;
  paymentFrequency: PaymentFrequency;
  startDate: string;
  dueDate: string;
  notes?: string;
  status: AgreementStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  nextPaymentDate?: string;
  paymentSchedule?: ScheduledPayment[];
}

export type PaymentStatus = 'pending_confirmation' | 'confirmed' | 'rejected';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export interface Payment {
  id: string;
  agreementId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  rejectedAt?: string;
}

export type NotificationType =
  | 'new_agreement_request'
  | 'agreement_accepted'
  | 'agreement_rejected'
  | 'agreement_cancelled'
  | 'agreement_completed'
  | 'payment_registered'
  | 'payment_waiting_confirmation'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'upcoming_payment_reminder'
  | 'overdue_payment_reminder'
  | 'premium_subscription'
  | 'system_update';

export type NotificationCategory = 'agreements' | 'payments' | 'reminders' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  archivedAt?: string;
  relatedAgreementId?: string;
  relatedPaymentId?: string;
}

export interface NotificationSettings {
  agreementRequests: boolean;
  paymentConfirmations: boolean;
  paymentReminders: boolean;
  overduePayments: boolean;
  marketingMessages: boolean;
  productUpdates: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export type TimelineEventType =
  | 'agreement_created'
  | 'agreement_accepted'
  | 'agreement_rejected'
  | 'agreement_cancelled'
  | 'payment_registered'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'agreement_completed';

export interface AgreementTimelineEvent {
  id: string;
  agreementId: string;
  actorId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  createdAt: string;
}

export interface AgreementInput {
  borrowerPhone: string;
  borrowerEmail?: string;
  borrowerName?: string;
  principalAmount: number;
  interestRate?: number;
  totalRepaymentAmount: number;
  numberOfPayments: number;
  paymentFrequency: PaymentFrequency;
  startDate: string;
  dueDate: string;
  notes?: string;
  paymentSchedule?: ScheduledPayment[];
}

export type InviteEmailStatus = 'sent' | 'skipped';

export interface InviteEmailResult {
  status: InviteEmailStatus;
  message: string;
  providerMessageId?: string;
}

export interface PaymentInput {
  agreementId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
}
