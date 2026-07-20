import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface Insight {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

/** Compact 2-column grid of payment insights. */
export function InsightsCard({ insights }: { insights: Insight[] }) {
  return (
    <View style={styles.grid}>
      {insights.map((insight) => (
        <View key={insight.id} style={styles.cell}>
          <View style={styles.iconWrap}>
            <Ionicons name={insight.icon} size={16} color={colors.secondary} />
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {insight.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {insight.label}
          </Text>
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
  cell: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 16,
  },
});
