import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
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

const getProjectId = () =>
  Constants.easConfig?.projectId ||
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

let notificationHandlerConfigured = false;

const shouldSkipRemotePush = () => Platform.OS === 'web' || Constants.appOwnership === 'expo';

const loadNotifications = async () => {
  const Notifications = await import('expo-notifications');
  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }
  return Notifications;
};

const isMissingDeviceTokenTable = (error: unknown) =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'PGRST205',
  );

export const pushNotificationService = {
  async registerDevice(input: RegisteredDevice): Promise<{ registered: boolean; token?: string; message?: string }> {
    if (!supabase) return { registered: false, token: input.token, message: 'Supabase is not configured.' };
    if (shouldSkipRemotePush()) {
      return {
        registered: false,
        token: input.token,
        message: 'Remote push notifications require a development build or production app.',
      };
    }
    if (!Device.isDevice) return { registered: false, token: input.token, message: 'Push notifications require a physical device.' };

    const Notifications = await loadNotifications();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TRUVO',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }

    const currentPermissions = await Notifications.getPermissionsAsync();
    const finalPermissions =
      currentPermissions.status === 'granted' ? currentPermissions : await Notifications.requestPermissionsAsync();

    if (finalPermissions.status !== 'granted') {
      return { registered: false, message: 'Notification permission was not granted.' };
    }

    const projectId = getProjectId();
    if (!projectId) return { registered: false, message: 'Expo project id is missing.' };

    const token = input.token || (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.from('device_push_tokens').upsert(
      {
        user_id: input.userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
    if (isMissingDeviceTokenTable(error)) {
      return { registered: false, token, message: 'The device_push_tokens table is missing in Supabase.' };
    }
    if (error) throw error;

    return { registered: true, token };
  },

  async deleteRegisteredDevices(userId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('device_push_tokens').delete().eq('user_id', userId);
    if (isMissingDeviceTokenTable(error)) return;
    if (error) throw error;
  },

  subscribeToNotificationResponses(onResponse: (data: Record<string, unknown>) => void): () => void {
    if (shouldSkipRemotePush()) return () => {};

    let active = true;
    let subscription: { remove: () => void } | undefined;

    void loadNotifications()
      .then((Notifications) => {
        if (!active) return;
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          onResponse(response.notification.request.content.data as Record<string, unknown>);
        });
      })
      .catch((error) => console.warn('Unable to subscribe to push notification responses', error));

    return () => {
      active = false;
      subscription?.remove();
    };
  },

  async sendAgreementNotification(input: {
    agreement: Agreement;
    recipientUserId: string;
    type: Extract<
      NotificationType,
      'new_agreement_request' | 'agreement_accepted' | 'agreement_rejected' | 'agreement_cancelled' | 'agreement_completed'
    >;
  }): Promise<void> {
    console.log('Agreement push notifications are sent by the Supabase invite function.', input.type, input.agreement.id, input.recipientUserId);
  },

  async sendPaymentNotification(input: {
    payment: Payment;
    recipientUserId: string;
    type: Extract<NotificationType, 'payment_registered' | 'payment_waiting_confirmation' | 'payment_confirmed' | 'payment_rejected'>;
  }): Promise<void> {
    console.log('Payment push notifications are not wired to a server dispatcher yet.', input.type, input.payment.id, input.recipientUserId);
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
