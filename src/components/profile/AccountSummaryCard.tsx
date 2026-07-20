import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountUpText } from '@/components/CountUpText';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface SummaryMetric {
  key: string;
  label: string;
  value: number;
  format: (v: number) => string;
  insight?: string;
  highlight?: boolean;
}

/** Account activity tiles with animated values + contextual insight lines. */
export function AccountSummaryCard({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <View style={styles.grid}>
      {metrics.map((m) => (
        <View key={m.key} style={[styles.tile, m.highlight && styles.tileHighlight]}>
          <CountUpText value={m.value} format={m.format} style={[styles.value, m.highlight && styles.valueHighlight]} />
          <Text style={styles.label} numberOfLines={2}>
            {m.label}
          </Text>
          {m.insight ? (
            <View style={styles.insightRow}>
              <Ionicons name="ellipse" size={6} color={m.highlight ? colors.secondary : colors.textMuted} />
              <Text style={styles.insight} numberOfLines={1}>
                {m.insight}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tileHighlight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  value: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  valueHighlight: {
    color: '#047857',
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  insight: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
