import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  accent?: boolean;
}

export function SummaryCard({ label, value, accent }: Props) {
  return (
    <View style={[styles.card, accent && styles.accent]}>
      <Text style={[styles.label, accent && styles.accentLabel]}>{label}</Text>
      <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  accent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '600',
  },
  value: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  accentLabel: {
    color: '#CBD5E1',
  },
  accentValue: {
    color: '#FFFFFF',
  },
});
