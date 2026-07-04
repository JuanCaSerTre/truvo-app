export type SubscriptionStatus = 'free' | 'premium_monthly' | 'premium_yearly';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  subscription_status: SubscriptionStatus;
  createdAt: string;
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
  | 'payment_registered'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'payment_reminder';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  relatedAgreementId?: string;
  relatedPaymentId?: string;
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

export interface PaymentInput {
  agreementId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
}
