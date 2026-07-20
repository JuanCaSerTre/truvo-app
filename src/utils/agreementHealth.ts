import { Ionicons } from '@expo/vector-icons';
import { Agreement, Payment } from '@/types/models';
import { colors } from '@/constants/theme';
import { getPendingPayments } from '@/utils/agreementRules';

export type HealthState = 'on_track' | 'due_soon' | 'awaiting' | 'overdue' | 'completed' | 'cancelled';

export interface Health {
  state: HealthState;
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

/**
 * Derives an at-a-glance "health" for an agreement, distinct from its lifecycle status.
 * Priority: cancelled/completed lifecycle → overdue → awaiting confirmation → due soon → on track.
 */
export const getAgreementHealth = (agreement: Agreement, payments: Payment[]): Health => {
  if (agreement.status === 'cancelled' || agreement.status === 'rejected') {
    return { state: 'cancelled', label: 'Cancelled', detail: 'Ended before completion', icon: 'close-circle', color: colors.textMuted, tint: '#F1F5F9' };
  }
  if (agreement.status === 'completed') {
    return { state: 'completed', label: 'Completed', detail: 'Fully repaid', icon: 'ribbon', color: '#059669', tint: '#D1FAE5' };
  }

  const next = agreement.nextPaymentDate;
  const days = next ? daysUntil(next) : null;

  if (days !== null && days < 0) {
    return {
      state: 'overdue',
      label: 'Overdue',
      detail: `Payment ${Math.abs(days)}d overdue`,
      icon: 'alert-circle',
      color: colors.danger,
      tint: '#FEE2E2',
    };
  }

  if (getPendingPayments(agreement.id, payments).length > 0) {
    return { state: 'awaiting', label: 'Awaiting Confirmation', detail: 'Waiting for confirmation', icon: 'hourglass', color: colors.warning, tint: '#FEF3C7' };
  }

  if (days !== null && days <= 7) {
    return {
      state: 'due_soon',
      label: 'Payment Due Soon',
      detail: days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`,
      icon: 'time',
      color: colors.warning,
      tint: '#FEF3C7',
    };
  }

  return { state: 'on_track', label: 'On Track', detail: 'All payments up to date', icon: 'checkmark-circle', color: colors.secondary, tint: '#D1FAE5' };
};
