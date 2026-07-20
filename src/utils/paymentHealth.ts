import { Ionicons } from '@expo/vector-icons';
import { Payment } from '@/types/models';
import { colors } from '@/constants/theme';

export type PaymentHealthState = 'confirmed' | 'awaiting' | 'due_soon' | 'overdue' | 'rejected';

export interface PaymentHealth {
  state: PaymentHealthState;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
}

const daysUntil = (value: string) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const date = new Date(value);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((target - start) / 86_400_000);
};

/** At-a-glance health for a registered payment. */
export const getPaymentHealth = (payment: Payment): PaymentHealth => {
  if (payment.status === 'confirmed') {
    return { state: 'confirmed', label: 'Confirmed', detail: 'Payment confirmed', icon: 'checkmark-circle', color: colors.secondary, tint: '#D1FAE5' };
  }
  if (payment.status === 'rejected') {
    return { state: 'rejected', label: 'Rejected', detail: 'Payment rejected', icon: 'close-circle', color: colors.textMuted, tint: '#F1F5F9' };
  }
  // pending_confirmation
  const days = daysUntil(payment.paymentDate);
  if (days < 0) {
    return { state: 'overdue', label: 'Overdue', detail: `${Math.abs(days)}d past due`, icon: 'alert-circle', color: colors.danger, tint: '#FEE2E2' };
  }
  if (days <= 2) {
    return { state: 'due_soon', label: 'Due Soon', detail: days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`, icon: 'time', color: colors.warning, tint: '#FEF3C7' };
  }
  return { state: 'awaiting', label: 'Awaiting Confirmation', detail: 'Waiting for confirmation', icon: 'hourglass', color: colors.warning, tint: '#FEF3C7' };
};
