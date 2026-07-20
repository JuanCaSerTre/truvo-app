import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  amount: string;
  remaining: string;
  nextPaymentDate: string;
  frequency: string;
  amountColor: string;
}

/** Amount + remaining balance headline, with next-payment and frequency meta chips. */
export function AgreementSummary({ amount, remaining, nextPaymentDate, frequency, amountColor }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.label}>Total</Text>
          <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {amount}
          </Text>
        </View>
        <View style={styles.remainingBlock}>
          <Text style={styles.label}>Remaining</Text>
          <Text style={styles.remaining} numberOfLines={1} adjustsFontSizeToFit>
            {remaining}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{nextPaymentDate}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="repeat-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{frequency}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
  },
  amountBlock: {
    flex: 1,
    gap: 2,
  },
  remainingBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amount: {
    fontSize: 30,
    fontWeight: '900',
  },
  remaining: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
});
