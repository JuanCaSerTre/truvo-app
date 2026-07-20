import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface CalcRow {
  label: string;
  value: string;
  ready: boolean;
}

/** Inline live-calculation breakdown shown on the repayment step as values resolve. */
export function CalculationSummary({ rows }: { rows: CalcRow[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="calculator-outline" size={16} color={colors.secondary} />
        <Text style={styles.title}>Live calculation</Text>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={[styles.value, !row.ready && styles.pending]} numberOfLines={1}>
            {row.ready ? row.value : 'Will be calculated'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    color: '#047857',
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 26,
  },
  label: {
    color: '#047857',
    fontSize: typography.small,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
    flexShrink: 1,
    textAlign: 'right',
  },
  pending: {
    color: '#64748B',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
