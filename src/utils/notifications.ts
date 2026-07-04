import { Ionicons } from '@expo/vector-icons';
import { Notification, NotificationCategory, NotificationType } from '@/types/models';

export type NotificationFilter = 'all' | NotificationCategory | 'unread';

export type NotificationMeta = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  category: NotificationCategory;
  important: boolean;
};

export const notificationMeta: Record<NotificationType, NotificationMeta> = {
  new_agreement_request: {
    label: 'New agreement request',
    icon: 'document-text-outline',
    color: '#0F766E',
    tint: '#CCFBF1',
    category: 'agreements',
    important: true,
  },
  agreement_accepted: {
    label: 'Agreement accepted',
    icon: 'checkmark-circle-outline',
    color: '#10B981',
    tint: '#D1FAE5',
    category: 'agreements',
    important: true,
  },
  agreement_rejected: {
    label: 'Agreement rejected',
    icon: 'close-circle-outline',
    color: '#EF4444',
    tint: '#FEE2E2',
    category: 'agreements',
    important: true,
  },
  agreement_cancelled: {
    label: 'Agreement cancelled',
    icon: 'ban-outline',
    color: '#F97316',
    tint: '#FFEDD5',
    category: 'agreements',
    important: true,
  },
  payment_registered: {
    label: 'Payment registered',
    icon: 'cash-outline',
    color: '#2563EB',
    tint: '#DBEAFE',
    category: 'payments',
    important: true,
  },
  payment_waiting_confirmation: {
    label: 'Waiting for confirmation',
    icon: 'hourglass-outline',
    color: '#7C3AED',
    tint: '#EDE9FE',
    category: 'payments',
    important: true,
  },
  payment_confirmed: {
    label: 'Payment confirmed',
    icon: 'shield-checkmark-outline',
    color: '#059669',
    tint: '#D1FAE5',
    category: 'payments',
    important: true,
  },
  payment_rejected: {
    label: 'Payment rejected',
    icon: 'alert-circle-outline',
    color: '#DC2626',
    tint: '#FEE2E2',
    category: 'payments',
    important: true,
  },
  upcoming_payment_reminder: {
    label: 'Upcoming payment',
    icon: 'calendar-outline',
    color: '#D97706',
    tint: '#FEF3C7',
    category: 'reminders',
    important: true,
  },
  overdue_payment_reminder: {
    label: 'Overdue payment',
    icon: 'alarm-outline',
    color: '#BE123C',
    tint: '#FFE4E6',
    category: 'reminders',
    important: true,
  },
  agreement_completed: {
    label: 'Agreement completed',
    icon: 'ribbon-outline',
    color: '#0891B2',
    tint: '#CFFAFE',
    category: 'agreements',
    important: true,
  },
  premium_subscription: {
    label: 'Premium subscription',
    icon: 'diamond-outline',
    color: '#A855F7',
    tint: '#F3E8FF',
    category: 'system',
    important: false,
  },
  system_update: {
    label: 'System update',
    icon: 'sparkles-outline',
    color: '#475569',
    tint: '#E2E8F0',
    category: 'system',
    important: false,
  },
};

export const notificationFilters: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'agreements', label: 'Agreements' },
  { id: 'payments', label: 'Payments' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'system', label: 'System' },
  { id: 'unread', label: 'Unread' },
];

export const isImportantNotification = (notification: Notification) => notificationMeta[notification.type].important;

export const getRelativeTime = (value: string) => {
  const then = new Date(value).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} min ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hr ago`;
  }
  if (diff < day * 2) return 'Yesterday';
  const days = Math.floor(diff / day);
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const getDateGroup = (value: string) => {
  const now = new Date();
  const itemDate = new Date(value);
  const dayDiff = Math.floor((startOfDay(now) - startOfDay(itemDate)) / (24 * 60 * 60 * 1000));

  if (dayDiff <= 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return 'Earlier This Week';
  if (now.getFullYear() === itemDate.getFullYear() && now.getMonth() === itemDate.getMonth()) return 'Earlier This Month';
  return 'Older';
};

export const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups = ['Today', 'Yesterday', 'Earlier This Week', 'Earlier This Month', 'Older'].map((title) => ({
    title,
    data: [] as Notification[],
  }));

  notifications.forEach((notification) => {
    const group = groups.find((item) => item.title === getDateGroup(notification.createdAt));
    group?.data.push(notification);
  });

  return groups.filter((group) => group.data.length > 0);
};
