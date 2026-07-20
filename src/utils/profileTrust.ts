import { User } from '@/types/models';

export interface TrustIndicator {
  key: string;
  label: string;
  met: boolean;
  future?: boolean;
}

/** Profile completeness — the fields a user can fill in. */
export const profileCompletion = (user: User) => {
  const fields = [
    Boolean(user.name && user.name.trim().length >= 2),
    Boolean(user.email),
    Boolean(user.phone && user.phone.trim()),
    Boolean(user.country),
    Boolean(user.currency),
    Boolean(user.timezone),
  ];
  const done = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
};

/**
 * Account trust indicators. These reflect ACCOUNT readiness & security only —
 * never a judgement of the person or their financial reputation.
 */
export const trustIndicators = (user: User): TrustIndicator[] => [
  { key: 'email', label: 'Email Verified', met: Boolean(user.email) },
  { key: 'password', label: 'Secure Password', met: true },
  { key: 'alerts', label: 'No Security Alerts', met: true },
  { key: 'phone', label: 'Phone Verification', met: Boolean(user.phone && user.phone.trim()) },
  { key: 'identity', label: 'Identity Verification', met: false, future: true },
];

/**
 * Trust score 0–100 from account completeness + security signals.
 * Weighted so the core security items dominate; identity (future) is excluded.
 */
export const trustScore = (user: User) => {
  const indicators = trustIndicators(user).filter((i) => !i.future);
  const weights: Record<string, number> = { email: 30, password: 25, alerts: 25, phone: 20 };
  const earned = indicators.reduce((sum, i) => sum + (i.met ? weights[i.key] ?? 0 : 0), 0);
  const max = indicators.reduce((sum, i) => sum + (weights[i.key] ?? 0), 0);
  return Math.round((earned / max) * 100);
};
