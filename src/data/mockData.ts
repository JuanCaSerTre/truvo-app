import { Agreement, AgreementTimelineEvent, Notification, Payment, User } from '@/types/models';

const today = new Date();
const iso = (offsetDays: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date.toISOString();
};

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Morgan',
  phone: '+1 555 0134',
  subscription_status: 'free',
  createdAt: iso(-90),
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Maya Chen',
    phone: '+1 555 0198',
    subscription_status: 'free',
    createdAt: iso(-180),
  },
  {
    id: 'user-3',
    name: 'Jordan Lee',
    phone: '+1 555 0162',
    subscription_status: 'premium_monthly',
    createdAt: iso(-120),
  },
];

export const agreements: Agreement[] = [
  {
    id: 'agreement-1',
    lenderId: 'user-1',
    borrowerId: 'user-2',
    borrowerPhone: '+1 555 0198',
    borrowerName: 'Maya Chen',
    principalAmount: 1200,
    interestRate: 5,
    interestAmount: 60,
    totalRepaymentAmount: 1260,
    numberOfPayments: 6,
    paymentFrequency: 'monthly',
    startDate: iso(-45),
    dueDate: iso(135),
    notes: 'Shared appliance loan.',
    status: 'active',
    createdAt: iso(-50),
    acceptedAt: iso(-48),
    nextPaymentDate: iso(15),
  },
  {
    id: 'agreement-2',
    lenderId: 'user-3',
    borrowerId: 'user-1',
    borrowerPhone: '+1 555 0134',
    borrowerName: 'Alex Morgan',
    principalAmount: 400,
    interestAmount: 0,
    totalRepaymentAmount: 400,
    numberOfPayments: 4,
    paymentFrequency: 'weekly',
    startDate: iso(-14),
    dueDate: iso(14),
    status: 'active',
    createdAt: iso(-18),
    acceptedAt: iso(-17),
    nextPaymentDate: iso(7),
  },
  {
    id: 'agreement-3',
    lenderId: 'user-1',
    borrowerPhone: '+1 555 0177',
    borrowerName: 'Sam Rivera',
    principalAmount: 250,
    interestAmount: 0,
    totalRepaymentAmount: 250,
    numberOfPayments: 1,
    paymentFrequency: 'once',
    startDate: iso(3),
    dueDate: iso(30),
    status: 'pending',
    createdAt: iso(-2),
    nextPaymentDate: iso(30),
  },
];

export const payments: Payment[] = [
  {
    id: 'payment-1',
    agreementId: 'agreement-1',
    payerId: 'user-2',
    receiverId: 'user-1',
    amount: 210,
    paymentDate: iso(-20),
    method: 'bank_transfer',
    status: 'confirmed',
    createdAt: iso(-20),
    confirmedAt: iso(-19),
  },
  {
    id: 'payment-2',
    agreementId: 'agreement-1',
    payerId: 'user-2',
    receiverId: 'user-1',
    amount: 210,
    paymentDate: iso(-1),
    method: 'cash',
    notes: 'Handed over after dinner.',
    status: 'pending_confirmation',
    createdAt: iso(-1),
  },
  {
    id: 'payment-3',
    agreementId: 'agreement-2',
    payerId: 'user-1',
    receiverId: 'user-3',
    amount: 100,
    paymentDate: iso(-7),
    method: 'bank_transfer',
    status: 'confirmed',
    createdAt: iso(-7),
    confirmedAt: iso(-7),
  },
];

export const notifications: Notification[] = [
  {
    id: 'notification-1',
    userId: 'user-1',
    type: 'payment_registered',
    title: 'Payment waiting for confirmation',
    body: 'Maya registered a $210 payment for your agreement.',
    read: false,
    createdAt: iso(-1),
    relatedAgreementId: 'agreement-1',
    relatedPaymentId: 'payment-2',
  },
  {
    id: 'notification-2',
    userId: 'user-1',
    type: 'payment_reminder',
    title: 'Upcoming payment',
    body: 'Your next payment to Jordan is due soon.',
    read: false,
    createdAt: iso(-2),
    relatedAgreementId: 'agreement-2',
  },
];

export const timelineEvents: AgreementTimelineEvent[] = [
  {
    id: 'timeline-1',
    agreementId: 'agreement-1',
    actorId: 'user-1',
    type: 'agreement_created',
    title: 'Agreement request sent',
    createdAt: iso(-50),
  },
  {
    id: 'timeline-2',
    agreementId: 'agreement-1',
    actorId: 'user-2',
    type: 'agreement_accepted',
    title: 'Agreement accepted',
    createdAt: iso(-48),
  },
  {
    id: 'timeline-3',
    agreementId: 'agreement-1',
    actorId: 'user-2',
    type: 'payment_confirmed',
    title: 'Payment confirmed',
    description: '$210 confirmed and applied to the balance.',
    createdAt: iso(-19),
  },
];
