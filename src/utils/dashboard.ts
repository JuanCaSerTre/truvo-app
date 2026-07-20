import { PaymentFrequency } from '@/types/models';

/** Time-of-day aware greeting. */
export const greeting = (name: string) => {
  const first = name.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${first}`;
  if (hour < 18) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
};

/** Two-letter initials for avatar fallbacks. */
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  once: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

export const frequencyLabel = (frequency?: PaymentFrequency) =>
  frequency ? FREQUENCY_LABELS[frequency] : 'Scheduled';

/** Human "due" phrasing from a day delta. */
export const dueLabel = (days: number) => {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return null;
};
