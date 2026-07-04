import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Payment } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatDate, formatMoney } from '@/utils/money';
import { StatusBadge } from './StatusBadge';

interface Props {
  payment: Payment;
}

export function PaymentCard({ payment }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.amount}>{formatMoney(payment.amount)}</Text>
        <Text style={styles.meta}>{formatDate(payment.paymentDate)} · {payment.method.replace('_', ' ')}</Text>
      </View>
      <StatusBadge status={payment.status} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  amount: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: 4,
    textTransform: 'capitalize',
  },
});
