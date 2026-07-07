import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { agreementService } from '@/services/agreementService';
import { authService } from '@/services/authService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { pushNotificationService } from '@/services/pushNotificationService';
import { SubscriptionCheckoutResult, subscriptionService } from '@/services/subscriptionService';
import {
  Agreement,
  AgreementInput,
  AgreementStatus,
  AgreementTimelineEvent,
  Contact,
  ContactInput,
  InviteEmailResult,
  Notification,
  NotificationSettings,
  Payment,
  PaymentInput,
  ScheduledPayment,
  SubscriptionStatus,
  User,
  UserProfileInput,
} from '@/types/models';
import { getConfirmedPayments, getRemainingBalance, shouldCompleteAgreement } from '@/utils/agreementRules';
import { logApiWarning } from '@/utils/apiErrors';
import { formatMoney } from '@/utils/money';
import { isValidEmail } from '@/utils/validation';

interface TruvoStore {
  currentUser: User;
  users: User[];
  agreements: Agreement[];
  payments: Payment[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  contacts: Contact[];
  timelineEvents: AgreementTimelineEvent[];
  syncing: boolean;
  createAgreement: (input: AgreementInput) => Promise<Agreement>;
  sendAgreementInvite: (agreementId: string) => Promise<InviteEmailResult>;
  createContact: (input: ContactInput) => Promise<Contact>;
  syncData: () => Promise<void>;
  updateAgreementStatus: (agreementId: string, status: AgreementStatus) => Promise<void>;
  registerPayment: (input: PaymentInput) => Promise<Payment>;
  confirmPayment: (paymentId: string) => Promise<void>;
  rejectPayment: (paymentId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  archiveNotification: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  updateNotificationSetting: (key: keyof NotificationSettings, enabled: boolean) => void;
  subscribe: (plan: 'monthly' | 'yearly') => Promise<SubscriptionCheckoutResult>;
  updateCurrentUserProfile: (input: UserProfileInput) => Promise<User>;
  setUserFromAuth: (user: User) => void;
  clearUserSessionData: () => void;
}

const StoreContext = createContext<TruvoStore | undefined>(undefined);

const id = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};
const now = () => new Date().toISOString();
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const unauthenticatedUser: User = {
  id: '',
  name: '',
  phone: '',
  subscription_status: 'free',
  createdAt: '',
};

const isPaymentForScheduledPayment = (payment: Payment, scheduledPayment: ScheduledPayment) =>
  Math.abs(payment.amount - scheduledPayment.amount) < 0.01 && payment.paymentDate <= scheduledPayment.due_date;

const getNextPaymentDate = (paymentSchedule?: ScheduledPayment[]) =>
  paymentSchedule?.find((payment) => payment.status === 'scheduled' || payment.status === 'pending_confirmation')?.due_date;

const applyPaymentToAgreementSchedule = (
  agreement: Agreement,
  payment: Payment,
  status: ScheduledPayment['status'],
  eligibleStatuses: ScheduledPayment['status'][] = ['scheduled', 'pending_confirmation'],
) => {
  if (!agreement.paymentSchedule?.length) return agreement;

  const targetIndex = agreement.paymentSchedule.findIndex(
    (scheduledPayment) => eligibleStatuses.includes(scheduledPayment.status) && isPaymentForScheduledPayment(payment, scheduledPayment),
  );

  if (targetIndex === -1) return agreement;

  const paymentSchedule = agreement.paymentSchedule.map((scheduledPayment, index) =>
    index === targetIndex ? { ...scheduledPayment, status } : scheduledPayment,
  );

  return {
    ...agreement,
    paymentSchedule,
    nextPaymentDate: getNextPaymentDate(paymentSchedule),
  };
};

const defaultNotificationSettings: NotificationSettings = {
  agreementRequests: true,
  paymentConfirmations: true,
  paymentReminders: true,
  overduePayments: true,
  marketingMessages: false,
  productUpdates: true,
  pushNotifications: true,
  emailNotifications: false,
};

const notificationSettingsStorageKey = (userId: string) => `truvo:${userId}:notificationSettings`;

const notificationTypeSetting: Partial<Record<Notification['type'], keyof NotificationSettings>> = {
  new_agreement_request: 'agreementRequests',
  agreement_accepted: 'agreementRequests',
  agreement_rejected: 'agreementRequests',
  agreement_cancelled: 'agreementRequests',
  agreement_completed: 'agreementRequests',
  payment_registered: 'paymentConfirmations',
  payment_waiting_confirmation: 'paymentConfirmations',
  payment_confirmed: 'paymentConfirmations',
  payment_rejected: 'paymentConfirmations',
  upcoming_payment_reminder: 'paymentReminders',
  overdue_payment_reminder: 'overduePayments',
  premium_subscription: 'marketingMessages',
  system_update: 'productUpdates',
};

type PushNotificationData = {
  route?: unknown;
  agreementId?: unknown;
  type?: unknown;
};

const allowedNotificationRoute = (data: PushNotificationData) => {
  if (data.type === 'new_agreement_request' && typeof data.agreementId === 'string' && isUuid(data.agreementId)) {
    return `/agreement-request/${encodeURIComponent(data.agreementId)}`;
  }

  if (typeof data.route !== 'string') return undefined;
  if (/^\/(agreement|agreement-request|payment-confirmation|payment-schedule)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.route)) {
    return data.route;
  }
  return undefined;
};

const loadNotificationSettings = (userId: string) => {
  try {
    const stored = globalThis.localStorage?.getItem(notificationSettingsStorageKey(userId));
    if (!stored) return defaultNotificationSettings;
    return { ...defaultNotificationSettings, ...(JSON.parse(stored) as Partial<NotificationSettings>) };
  } catch {
    return defaultNotificationSettings;
  }
};

const saveNotificationSettings = (userId: string, settings: NotificationSettings) => {
  try {
    globalThis.localStorage?.setItem(notificationSettingsStorageKey(userId), JSON.stringify(settings));
  } catch (error) {
    logApiWarning('Unable to persist notification settings', error);
  }
};

export function TruvoProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState(unauthenticatedUser);
  const [agreementState, setAgreementState] = useState<Agreement[]>([]);
  const [paymentState, setPaymentState] = useState<Payment[]>([]);
  const [notificationState, setNotificationState] = useState<Notification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState(() => defaultNotificationSettings);
  const [contactState, setContactState] = useState<Contact[]>([]);
  const [timelineState, setTimelineState] = useState<AgreementTimelineEvent[]>([]);
  const [syncing, setSyncing] = useState(false);

  const syncData = useCallback(async () => {
    setSyncing(true);
    try {
      if (isSupabaseConfigured && !isUuid(currentUser.id)) {
        setAgreementState([]);
        setPaymentState([]);
        setNotificationState([]);
        setContactState([]);
        setTimelineState([]);
        return;
      }
      const synced = await agreementService.syncAgreements(currentUser);
      if (isSupabaseConfigured || synced.agreements.length || synced.payments.length) {
        setAgreementState(synced.agreements);
        setPaymentState(synced.payments);
        setNotificationState(synced.notifications);
        setContactState(synced.contacts);
      }
    } catch (error) {
      logApiWarning('Unable to sync Supabase data', error);
    } finally {
      setSyncing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void syncData();
  }, [currentUser.id, syncData]);

  useEffect(() => {
    setNotificationSettings(loadNotificationSettings(currentUser.id));
    if (isSupabaseConfigured && isUuid(currentUser.id)) {
      void agreementService
        .getNotificationSettings(currentUser.id)
        .then((settings) => {
          if (!settings) return;
          saveNotificationSettings(currentUser.id, settings);
          setNotificationSettings(settings);
        })
        .catch((error) => logApiWarning('Unable to sync notification settings', error));
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(currentUser.id)) return undefined;
    return agreementService.subscribeToNotifications(currentUser.id, (notification) => {
      setNotificationState((items) => {
        if (items.some((item) => item.id === notification.id)) return items;
        return [notification, ...items];
      });
      if (notificationSettings.pushNotifications) {
        Alert.alert(notification.title, notification.body);
      }
    });
  }, [currentUser.id, notificationSettings.pushNotifications]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(currentUser.id) || !notificationSettings.pushNotifications) return;
    void pushNotificationService
      .registerDevice({ userId: currentUser.id })
      .catch((error) => logApiWarning('Unable to register push token', error));
  }, [currentUser.id, notificationSettings.pushNotifications]);

  useEffect(() => {
    return pushNotificationService.subscribeToNotificationResponses((data: PushNotificationData) => {
      const route = allowedNotificationRoute(data);
      if (route) {
        router.push(route as never);
      }
    });
  }, []);

  const addTimeline = (event: Omit<AgreementTimelineEvent, 'id' | 'createdAt'>) => {
    setTimelineState((items) => [{ ...event, id: id(), createdAt: now() }, ...items]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const settingKey = notificationTypeSetting[notification.type];
    if (notification.userId === currentUser.id && settingKey && !notificationSettings[settingKey]) return;

    const nextNotification: Notification = { ...notification, id: id(), createdAt: now(), read: false };
    if (nextNotification.userId === currentUser.id) {
      setNotificationState((items) => [nextNotification, ...items]);
      if (notificationSettings.pushNotifications) {
        Alert.alert(nextNotification.title, nextNotification.body);
      }
    }
    void agreementService.createNotification(nextNotification).catch((error) => logApiWarning('Unable to persist notification', error));
  };

  const persistAgreementWithSchedule = async (agreement: Agreement) => {
    await agreementService.updateAgreement(agreement);
    if (agreement.paymentSchedule?.length) {
      await agreementService.updateScheduledPayments(agreement.id, agreement.paymentSchedule);
    }
  };

  const isCurrentUserBorrower = (agreement: Agreement) =>
    agreement.borrowerId === currentUser.id ||
    agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase();

  const assertCanUpdateAgreementStatus = (agreement: Agreement, status: AgreementStatus) => {
    const isLender = agreement.lenderId === currentUser.id;
    const isBorrower = isCurrentUserBorrower(agreement);
    if (status === 'completed') {
      if (agreement.status !== 'active' || (!isLender && !isBorrower)) {
        throw new Error('Only active agreements linked to your account can be completed.');
      }
      return;
    }
    if (agreement.status !== 'pending') {
      throw new Error('Only pending agreements can be updated manually.');
    }
    if ((status === 'active' || status === 'rejected') && (!isBorrower || isLender)) {
      throw new Error('Only the assigned borrower can accept or reject this agreement.');
    }
    if (status === 'cancelled' && !isLender) {
      throw new Error('Only the lender can cancel this agreement.');
    }
  };

  const createAgreement = async (input: AgreementInput) => {
    const borrowerEmail = input.borrowerEmail?.trim().toLowerCase();
    if (!borrowerEmail || !isValidEmail(borrowerEmail)) {
      throw new Error('Add a valid borrower email.');
    }
    if (borrowerEmail === currentUser.email?.toLowerCase()) {
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
      }).catch((error) => logApiWarning('Unable to save borrower contact', error));
    }

    setAgreementState((items) => [agreement, ...items]);
    addTimeline({
      agreementId: agreement.id,
      actorId: currentUser.id,
      type: 'agreement_created',
      title: 'Agreement request sent',
      description: `${formatMoney(input.totalRepaymentAmount, currentUser.currency)} requested from ${input.borrowerName || input.borrowerEmail || input.borrowerPhone}.`,
    });
    addNotification({
      userId: currentUser.id,
      type: 'new_agreement_request',
      title: 'Agreement request created',
      body: 'The borrower must accept before this agreement becomes active.',
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

  const sendAgreementInvite = async (agreementId: string) => {
    return agreementService.sendAgreementInvite(agreementId);
  };

  const updateAgreementStatus = async (agreementId: string, status: AgreementStatus) => {
    const existingAgreement = agreementState.find((agreement) => agreement.id === agreementId);
    if (!existingAgreement) return;
    assertCanUpdateAgreementStatus(existingAgreement, status);
    const updatedAgreement: Agreement = {
      ...existingAgreement,
      status,
      borrowerId:
        status === 'active' && !existingAgreement.borrowerId && existingAgreement.lenderId !== currentUser.id
          ? currentUser.id
          : existingAgreement.borrowerId,
      acceptedAt: status === 'active' ? now() : existingAgreement.acceptedAt,
      completedAt: status === 'completed' ? now() : existingAgreement.completedAt,
    };
    await agreementService.updateAgreement(updatedAgreement);
    setAgreementState((items) => items.map((agreement) => (agreement.id === agreementId ? updatedAgreement : agreement)));
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
        type:
          status === 'active'
            ? 'agreement_accepted'
            : status === 'rejected'
              ? 'agreement_rejected'
              : status === 'cancelled'
                ? 'agreement_cancelled'
                : 'agreement_completed',
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
    const updatedAgreement = applyPaymentToAgreementSchedule(agreement, payment, 'pending_confirmation', ['scheduled']);
    if (updatedAgreement !== agreement) {
      await persistAgreementWithSchedule(updatedAgreement);
    }
    setPaymentState((items) => [payment, ...items]);
    setAgreementState((items) => items.map((item) => (item.id === agreement.id ? updatedAgreement : item)));
    addTimeline({
      agreementId: input.agreementId,
      actorId: currentUser.id,
      type: 'payment_registered',
      title: 'Payment registered',
      description: `${formatMoney(input.amount, currentUser.currency)} is pending confirmation.`,
    });
    addNotification({
      userId: agreement.lenderId,
      type: 'payment_waiting_confirmation',
      title: 'Payment waiting for confirmation',
      body: `${currentUser.name} registered a payment for your confirmation.`,
      relatedAgreementId: input.agreementId,
      relatedPaymentId: payment.id,
    });
    return payment;
  };

  const confirmPayment = async (paymentId: string) => {
    const payment = paymentState.find((item) => item.id === paymentId);
    if (!payment) return;
    if (payment.receiverId !== currentUser.id) {
      throw new Error('Only the payment receiver can confirm this payment.');
    }

    const confirmedAt = now();
    const confirmedPayment: Payment = { ...payment, status: 'confirmed', confirmedAt };
    const updatedPayments = paymentState.map((item) => (item.id === paymentId ? confirmedPayment : item));
    const agreement = agreementState.find((item) => item.id === payment.agreementId);
    let agreementToPersist: Agreement | undefined;
    if (agreement) {
      const updatedAgreement = applyPaymentToAgreementSchedule(agreement, confirmedPayment, 'confirmed', ['pending_confirmation', 'scheduled']);
      const completed = shouldCompleteAgreement(updatedAgreement, updatedPayments);
      agreementToPersist = completed
        ? { ...updatedAgreement, status: 'completed', completedAt: confirmedAt }
        : updatedAgreement;
      await persistAgreementWithSchedule(agreementToPersist);
    }

    await agreementService.updatePayment(confirmedPayment);
    setPaymentState(updatedPayments);
    if (agreement && agreementToPersist) {
      setAgreementState((items) => items.map((item) => (item.id === agreement.id ? agreementToPersist : item)));
    }

    addTimeline({
      agreementId: payment.agreementId,
      actorId: currentUser.id,
      type: 'payment_confirmed',
      title: 'Payment confirmed',
      description: `${formatMoney(payment.amount, currentUser.currency)} was applied to the balance.`,
    });
    addNotification({
      userId: payment.payerId,
      type: 'payment_confirmed',
      title: 'Payment confirmed',
      body: `${currentUser.name} confirmed your payment.`,
      relatedAgreementId: payment.agreementId,
      relatedPaymentId: payment.id,
    });

    if (agreement && agreementToPersist?.status === 'completed' && agreement.status !== 'completed') {
      addTimeline({ agreementId: agreement.id, actorId: currentUser.id, type: 'agreement_completed', title: 'Agreement completed' });
      const otherUserId = agreement.lenderId === currentUser.id ? agreement.borrowerId : agreement.lenderId;
      if (otherUserId) {
        addNotification({
          userId: otherUserId,
          type: 'agreement_completed',
          title: 'Agreement completed',
          body: 'The agreement has been fully repaid.',
          relatedAgreementId: agreement.id,
        });
      }
    }
  };

  const rejectPayment = async (paymentId: string) => {
    const payment = paymentState.find((item) => item.id === paymentId);
    if (!payment) return;
    if (payment.receiverId !== currentUser.id) {
      throw new Error('Only the payment receiver can reject this payment.');
    }

    const rejectedPayment: Payment = { ...payment, status: 'rejected', rejectedAt: now() };
    const agreement = agreementState.find((item) => item.id === payment.agreementId);
    let updatedAgreement: Agreement | undefined;
    if (agreement) {
      updatedAgreement = applyPaymentToAgreementSchedule(agreement, payment, 'scheduled', ['pending_confirmation']);
      if (updatedAgreement !== agreement) await persistAgreementWithSchedule(updatedAgreement);
    }
    await agreementService.updatePayment(rejectedPayment);
    setPaymentState((items) => items.map((payment) => (payment.id === paymentId ? rejectedPayment : payment)));
    if (agreement && updatedAgreement) {
      setAgreementState((items) => items.map((item) => (item.id === agreement.id ? updatedAgreement : item)));
    }
    addTimeline({
      agreementId: payment.agreementId,
      actorId: currentUser.id,
      type: 'payment_rejected',
      title: 'Payment rejected',
      description: `${formatMoney(payment.amount, currentUser.currency)} was not applied to the balance.`,
    });
    addNotification({
      userId: payment.payerId,
      type: 'payment_rejected',
      title: 'Payment rejected',
      body: `${currentUser.name} rejected your payment.`,
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

  const archiveNotification = (notificationId: string) => {
    const archivedAt = now();
    setNotificationState((items) =>
      items.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true, archivedAt } : notification,
      ),
    );
    void agreementService.archiveNotification(notificationId, archivedAt);
  };

  const deleteNotification = (notificationId: string) => {
    setNotificationState((items) => items.filter((notification) => notification.id !== notificationId));
    void agreementService.deleteNotification(notificationId);
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, enabled: boolean) => {
    setNotificationSettings((settings) => {
      const updatedSettings = { ...settings, [key]: enabled };
      saveNotificationSettings(currentUser.id, updatedSettings);
      if (isSupabaseConfigured && isUuid(currentUser.id)) {
        void agreementService
          .updateNotificationSettings(currentUser.id, updatedSettings)
          .catch((error) => logApiWarning('Unable to persist notification settings', error));
      }
      return updatedSettings;
    });
  };

  const subscribe = async (plan: 'monthly' | 'yearly') => {
    const result = await subscriptionService.startStripeCheckout(plan);
    if (result.status && result.status !== currentUser.subscription_status) {
      setCurrentUser((user) => ({ ...user, subscription_status: result.status as SubscriptionStatus }));
    }
    return result;
  };

  const updateCurrentUserProfile = async (input: UserProfileInput) => {
    const updatedUser = isSupabaseConfigured
      ? await authService.updateProfile(input)
      : {
          ...currentUser,
          ...input,
          name: input.name.trim(),
          phone: input.phone?.trim() || '',
          currency: input.currency?.trim().toUpperCase() || currentUser.currency,
          country: input.country?.trim() || undefined,
          timezone: input.timezone?.trim() || undefined,
        };
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  const clearUserSessionData = useCallback(() => {
    setCurrentUser(unauthenticatedUser);
    setAgreementState([]);
    setPaymentState([]);
    setNotificationState([]);
    setNotificationSettings(defaultNotificationSettings);
    setContactState([]);
    setTimelineState([]);
  }, []);

  const setUserFromAuth = useCallback((user: User) => {
    setCurrentUser(user);
    setAgreementState([]);
    setPaymentState([]);
    setNotificationState([]);
    setContactState([]);
    setTimelineState([]);
  }, []);

  const value = {
    currentUser,
    users: [],
    agreements: agreementState,
    payments: paymentState,
    notifications: notificationState,
    notificationSettings,
    contacts: contactState,
    timelineEvents: timelineState,
    syncing,
    createAgreement,
    sendAgreementInvite,
    createContact,
    syncData,
    updateAgreementStatus,
    registerPayment,
    confirmPayment,
    rejectPayment,
    markNotificationRead,
    archiveNotification,
    deleteNotification,
    updateNotificationSetting,
    subscribe,
    updateCurrentUserProfile,
    setUserFromAuth,
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
