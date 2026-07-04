import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import {
  agreements as seedAgreements,
  currentUser as seedCurrentUser,
  notifications as seedNotifications,
  payments as seedPayments,
  timelineEvents as seedTimeline,
  users,
} from '@/data/mockData';
import { agreementService } from '@/services/agreementService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { subscriptionService } from '@/services/subscriptionService';
import {
  Agreement,
  AgreementInput,
  AgreementStatus,
  AgreementTimelineEvent,
  Contact,
  ContactInput,
  Notification,
  Payment,
  PaymentInput,
  SubscriptionStatus,
  User,
} from '@/types/models';
import { getConfirmedPayments, getRemainingBalance, shouldCompleteAgreement } from '@/utils/agreementRules';
import { formatMoney } from '@/utils/money';

interface TruvoStore {
  currentUser: User;
  users: User[];
  agreements: Agreement[];
  payments: Payment[];
  notifications: Notification[];
  contacts: Contact[];
  timelineEvents: AgreementTimelineEvent[];
  syncing: boolean;
  createAgreement: (input: AgreementInput) => Promise<Agreement>;
  createContact: (input: ContactInput) => Promise<Contact>;
  syncData: () => Promise<void>;
  updateAgreementStatus: (agreementId: string, status: AgreementStatus) => void;
  registerPayment: (input: PaymentInput) => Promise<Payment>;
  confirmPayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  subscribe: (plan: 'monthly' | 'yearly') => Promise<void>;
  setUserFromAuth: (user: User) => void;
  clearUserSessionData: () => void;
}

const StoreContext = createContext<TruvoStore | undefined>(undefined);

const id = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
const now = () => new Date().toISOString();
const normalizePhone = (value?: string) => value?.replace(/\D/g, '') || '';

export function TruvoProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState(seedCurrentUser);
  const [agreementState, setAgreementState] = useState(seedAgreements);
  const [paymentState, setPaymentState] = useState(seedPayments);
  const [notificationState, setNotificationState] = useState(seedNotifications);
  const [contactState, setContactState] = useState<Contact[]>([]);
  const [timelineState, setTimelineState] = useState(seedTimeline);
  const [syncing, setSyncing] = useState(false);

  const syncData = useCallback(async () => {
    setSyncing(true);
    try {
      const synced = await agreementService.syncAgreements();
      if (isSupabaseConfigured || synced.agreements.length || synced.payments.length) {
        setAgreementState(synced.agreements);
        setPaymentState(synced.payments);
        setNotificationState(synced.notifications);
        setContactState(synced.contacts);
      }
    } catch (error) {
      console.warn('Unable to sync Supabase data', error);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void syncData();
  }, [currentUser.id, syncData]);

  const addTimeline = (event: Omit<AgreementTimelineEvent, 'id' | 'createdAt'>) => {
    setTimelineState((items) => [{ ...event, id: id(), createdAt: now() }, ...items]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const nextNotification: Notification = { ...notification, id: id(), createdAt: now(), read: false };
    if (nextNotification.userId === currentUser.id) {
      setNotificationState((items) => [nextNotification, ...items]);
    }
    void agreementService.createNotification(nextNotification).catch((error) => console.warn('Unable to persist notification', error));
  };

  const isCurrentUserBorrower = (agreement: Agreement) =>
    agreement.borrowerId === currentUser.id ||
    agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
    agreement.borrowerPhone === currentUser.phone;

  const createAgreement = async (input: AgreementInput) => {
    const borrowerEmail = input.borrowerEmail?.trim().toLowerCase();
    const borrowerPhone = normalizePhone(input.borrowerPhone);
    const currentUserPhone = normalizePhone(currentUser.phone);
    if (!borrowerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(borrowerEmail)) {
      throw new Error('Add a valid borrower email.');
    }
    if (borrowerEmail === currentUser.email?.toLowerCase() || Boolean(borrowerPhone && borrowerPhone === currentUserPhone)) {
      throw new Error('You cannot create an agreement with yourself.');
    }

    const interestAmount = Math.max(input.totalRepaymentAmount - input.principalAmount, 0);
    const nextScheduledPayment = input.paymentSchedule?.[0];
    const agreement: Agreement = {
      id: id(),
      lenderId: currentUser.id,
      borrowerPhone: input.borrowerPhone,
      borrowerEmail,
      borrowerName: input.borrowerName,
      principalAmount: input.principalAmount,
      interestRate: input.interestRate,
      interestAmount,
      totalRepaymentAmount: input.totalRepaymentAmount,
      numberOfPayments: input.numberOfPayments,
      paymentFrequency: input.paymentFrequency,
      startDate: input.startDate,
      dueDate: input.dueDate,
      notes: input.notes,
      status: 'pending',
      createdAt: now(),
      nextPaymentDate: nextScheduledPayment?.due_date || input.startDate,
      paymentSchedule: input.paymentSchedule,
    };
    await agreementService.createAgreement(agreement);
    if (input.borrowerEmail) {
      void createContact({
        contactEmail: input.borrowerEmail,
        contactName: input.borrowerName,
      }).catch((error) => console.warn('Unable to save borrower contact', error));
    }

    setAgreementState((items) => [agreement, ...items]);
    addTimeline({
      agreementId: agreement.id,
      actorId: currentUser.id,
      type: 'agreement_created',
      title: 'Agreement request sent',
      description: `${formatMoney(input.totalRepaymentAmount)} requested from ${input.borrowerName || input.borrowerEmail || input.borrowerPhone}.`,
    });
    addNotification({
      userId: currentUser.id,
      type: 'new_agreement_request',
      title: 'Agreement request created',
      body: `${input.borrowerName || input.borrowerEmail || 'Borrower'} must accept before this agreement becomes active.`,
      relatedAgreementId: agreement.id,
    });
    return agreement;
  };

  const createContact = async (input: ContactInput) => {
    const contact = await agreementService.createContact(input, currentUser.id);
    setContactState((items) => {
      const existingIndex = items.findIndex((item) => item.contactEmail.toLowerCase() === contact.contactEmail.toLowerCase());
      if (existingIndex === -1) return [contact, ...items];
      return items.map((item, index) => (index === existingIndex ? contact : item));
    });
    return contact;
  };

  const updateAgreementStatus = (agreementId: string, status: AgreementStatus) => {
    const existingAgreement = agreementState.find((agreement) => agreement.id === agreementId);
    if (!existingAgreement) return;
    const persistedAgreement = existingAgreement
      ? {
          ...existingAgreement,
          status,
          borrowerId: status === 'active' && !existingAgreement.borrowerId && existingAgreement.lenderId !== currentUser.id ? currentUser.id : existingAgreement.borrowerId,
          acceptedAt: status === 'active' ? now() : existingAgreement.acceptedAt,
          completedAt: status === 'completed' ? now() : existingAgreement.completedAt,
        }
      : undefined;
    if (persistedAgreement) {
      void agreementService.updateAgreement(persistedAgreement);
    }
    setAgreementState((items) =>
      items.map((agreement) =>
        agreement.id === agreementId
          ? {
            ...agreement,
            status,
            borrowerId: status === 'active' && !agreement.borrowerId && agreement.lenderId !== currentUser.id ? currentUser.id : agreement.borrowerId,
            acceptedAt: status === 'active' ? now() : agreement.acceptedAt,
              completedAt: status === 'completed' ? now() : agreement.completedAt,
            }
          : agreement,
      ),
    );
    const type =
      status === 'active'
        ? 'agreement_accepted'
        : status === 'rejected'
          ? 'agreement_rejected'
          : status === 'cancelled'
            ? 'agreement_cancelled'
            : 'agreement_completed';
    addTimeline({ agreementId, actorId: currentUser.id, type, title: `Agreement ${status}` });

    const actorIsLender = existingAgreement.lenderId === currentUser.id;
    const otherUserId = actorIsLender ? existingAgreement.borrowerId : existingAgreement.lenderId;
    if (otherUserId) {
      addNotification({
        userId: otherUserId,
        type: status === 'active' ? 'agreement_accepted' : status === 'rejected' ? 'agreement_rejected' : 'payment_reminder',
        title: status === 'active' ? 'Agreement accepted' : status === 'rejected' ? 'Agreement rejected' : `Agreement ${status}`,
        body:
          status === 'active'
            ? `${currentUser.name} accepted the agreement.`
            : status === 'rejected'
              ? `${currentUser.name} rejected the agreement.`
              : 'The agreement status has been updated.',
        relatedAgreementId: agreementId,
      });
    }
  };

  const registerPayment = async (input: PaymentInput) => {
    const agreement = agreementState.find((item) => item.id === input.agreementId);
    if (!agreement) throw new Error('Agreement not found.');
    if (agreement.status !== 'active') throw new Error('Only active agreements can receive payments.');
    if (!isCurrentUserBorrower(agreement)) throw new Error('Only the borrower can register a payment.');

    await agreementService.registerPayment(input);
    const payment: Payment = {
      id: id(),
      agreementId: input.agreementId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      method: input.method,
      notes: input.notes,
      status: 'pending_confirmation',
      payerId: currentUser.id,
      receiverId: agreement.lenderId,
      createdAt: now(),
    };
    await agreementService.createPayment(payment);
    setPaymentState((items) => [payment, ...items]);
    addTimeline({
      agreementId: input.agreementId,
      actorId: currentUser.id,
      type: 'payment_registered',
      title: 'Payment registered',
      description: `${formatMoney(input.amount)} is pending confirmation.`,
    });
    addNotification({
      userId: agreement.lenderId,
      type: 'payment_registered',
      title: 'Payment waiting for confirmation',
      body: `${currentUser.name} registered a ${formatMoney(input.amount)} payment for your confirmation.`,
      relatedAgreementId: input.agreementId,
      relatedPaymentId: payment.id,
    });
    return payment;
  };

  const confirmPayment = (paymentId: string) => {
    const payment = paymentState.find((item) => item.id === paymentId);
    if (!payment) return;
    if (payment.receiverId !== currentUser.id) {
      throw new Error('Only the payment receiver can confirm this payment.');
    }

    let updatedPayments: Payment[] = [];
    setPaymentState((items) => {
      updatedPayments = items.map((payment) =>
        payment.id === paymentId ? { ...payment, status: 'confirmed', confirmedAt: now() } : payment,
      );
      return updatedPayments;
    });

    void agreementService.updatePayment({ ...payment, status: 'confirmed', confirmedAt: now() });
    addTimeline({
      agreementId: payment.agreementId,
      actorId: currentUser.id,
      type: 'payment_confirmed',
      title: 'Payment confirmed',
      description: `${formatMoney(payment.amount)} was applied to the balance.`,
    });
    addNotification({
      userId: payment.payerId,
      type: 'payment_confirmed',
      title: 'Payment confirmed',
      body: `${currentUser.name} confirmed your ${formatMoney(payment.amount)} payment.`,
      relatedAgreementId: payment.agreementId,
      relatedPaymentId: payment.id,
    });

    const agreement = agreementState.find((item) => item.id === payment.agreementId);
    if (agreement && shouldCompleteAgreement(agreement, updatedPayments)) {
      updateAgreementStatus(agreement.id, 'completed');
    }
  };

  const rejectPayment = (paymentId: string) => {
    const payment = paymentState.find((item) => item.id === paymentId);
    if (!payment) return;
    if (payment.receiverId !== currentUser.id) {
      throw new Error('Only the payment receiver can reject this payment.');
    }

    setPaymentState((items) =>
      items.map((payment) => (payment.id === paymentId ? { ...payment, status: 'rejected', rejectedAt: now() } : payment)),
    );
    void agreementService.updatePayment({ ...payment, status: 'rejected', rejectedAt: now() });
    addTimeline({
      agreementId: payment.agreementId,
      actorId: currentUser.id,
      type: 'payment_rejected',
      title: 'Payment rejected',
      description: `${formatMoney(payment.amount)} was not applied to the balance.`,
    });
    addNotification({
      userId: payment.payerId,
      type: 'payment_rejected',
      title: 'Payment rejected',
      body: `${currentUser.name} rejected your ${formatMoney(payment.amount)} payment.`,
      relatedAgreementId: payment.agreementId,
      relatedPaymentId: payment.id,
    });
  };

  const markNotificationRead = (notificationId: string) => {
    setNotificationState((items) =>
      items.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    );
    void agreementService.markNotificationRead(notificationId);
  };

  const subscribe = async (plan: 'monthly' | 'yearly') => {
    const result = await subscriptionService.startStripeCheckout(plan);
    setCurrentUser((user) => ({ ...user, subscription_status: result.status as SubscriptionStatus }));
  };

  const clearUserSessionData = () => {
    setCurrentUser(seedCurrentUser);
    setAgreementState(seedAgreements);
    setPaymentState(seedPayments);
    setNotificationState(seedNotifications);
    setContactState([]);
    setTimelineState(seedTimeline);
  };

  const value = {
    currentUser,
    users,
    agreements: agreementState,
    payments: paymentState,
    notifications: notificationState,
    contacts: contactState,
    timelineEvents: timelineState,
    syncing,
    createAgreement,
    createContact,
    syncData,
    updateAgreementStatus,
    registerPayment,
    confirmPayment,
    rejectPayment,
    markNotificationRead,
    subscribe,
    setUserFromAuth: setCurrentUser,
    clearUserSessionData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useTruvoStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useTruvoStore must be used inside TruvoProvider');
  }
  return context;
};

export const useAgreementMetrics = (agreement: Agreement) => {
  const { payments } = useTruvoStore();
  const confirmedPayments = getConfirmedPayments(agreement.id, payments);
  const totalPaid = confirmedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = getRemainingBalance(agreement, payments);
  const progress = agreement.totalRepaymentAmount > 0 ? totalPaid / agreement.totalRepaymentAmount : 0;
  return { confirmedPayments, totalPaid, remainingBalance, progress: Math.min(progress, 1) };
};
