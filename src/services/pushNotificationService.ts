import { Agreement, NotificationType, Payment } from '@/types/models';

export type RegisteredDevice = {
  userId: string;
  platform?: 'ios' | 'android' | 'web';
  token?: string;
};

export type ReminderInput = {
  agreementId: string;
  userId: string;
  fireAt: string;
  type: Extract<NotificationType, 'upcoming_payment_reminder' | 'overdue_payment_reminder'>;
};

export const pushNotificationService = {
  async registerDevice(input: RegisteredDevice): Promise<{ registered: boolean; token?: string }> {
    console.log('Push device registration placeholder', input);
    return { registered: false, token: input.token };
  },

  async sendAgreementNotification(input: {
    agreement: Agreement;
    recipientUserId: string;
    type: Extract<
      NotificationType,
      'new_agreement_request' | 'agreement_accepted' | 'agreement_rejected' | 'agreement_cancelled' | 'agreement_completed'
    >;
  }): Promise<void> {
    console.log('Agreement push notification placeholder', input.type, input.agreement.id, input.recipientUserId);
  },

  async sendPaymentNotification(input: {
    payment: Payment;
    recipientUserId: string;
    type: Extract<NotificationType, 'payment_registered' | 'payment_waiting_confirmation' | 'payment_confirmed' | 'payment_rejected'>;
  }): Promise<void> {
    console.log('Payment push notification placeholder', input.type, input.payment.id, input.recipientUserId);
  },

  async scheduleReminder(input: ReminderInput): Promise<{ reminderId: string }> {
    console.log('Payment reminder scheduling placeholder', input);
    return { reminderId: `${input.agreementId}-${input.userId}-${input.fireAt}` };
  },

  async cancelReminder(reminderId: string): Promise<void> {
    console.log('Payment reminder cancellation placeholder', reminderId);
  },
};

export const registerDevice = pushNotificationService.registerDevice;
export const sendAgreementNotification = pushNotificationService.sendAgreementNotification;
export const sendPaymentNotification = pushNotificationService.sendPaymentNotification;
export const scheduleReminder = pushNotificationService.scheduleReminder;
export const cancelReminder = pushNotificationService.cancelReminder;
