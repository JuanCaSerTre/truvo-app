import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Payment } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatDate, formatMoney } from '@/utils/money';
import { StatusBadge } from './StatusBadge';

interface Props {
  payment: Payment;
  currency?: string;
  onPress?: () => void;
}

export function PaymentCard({ payment, currency = 'USD', onPress }: Props) {
  const content = (
    <>
      <View>
        <Text style={styles.amount}>{formatMoney(payment.amount, currency)}</Text>
        <Text style={styles.meta}>{formatDate(payment.paymentDate)} · {payment.method.replace('_', ' ')}</Text>
      </View>
      <StatusBadge status={payment.status} />
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {content}
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
  pressed: {
    opacity: 0.76,
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
