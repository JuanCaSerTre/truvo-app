import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountUpText } from '@/components/CountUpText';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Numeric value; rendered with `format` and animated. */
  value: number;
  format: (value: number) => string;
  accent: string;
  tint: string;
}

/** Compact horizontal summary tile (icon + animated value + label). */
export function PaymentSummaryCard({ icon, label, value, format, accent, tint }: Props) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${format(value)}`}>
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <CountUpText value={value} format={format} style={styles.value} />
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 15,
  },
});
