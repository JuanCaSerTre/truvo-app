import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { PaymentStatus } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';

const theme: Record<PaymentStatus, { background: string; text: string; label: string }> = {
  confirmed: { background: '#D1FAE5', text: '#059669', label: 'Confirmed' },
  pending_confirmation: { background: '#FEF3C7', text: '#B45309', label: 'Pending' },
  rejected: { background: '#FEE2E2', text: colors.danger, label: 'Rejected' },
};

/** Lifecycle status pill, separate from the health indicator. */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const t = theme[status];
  return (
    <Text style={[styles.badge, { backgroundColor: t.background, color: t.text }]}>{t.label}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    overflow: 'hidden',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
