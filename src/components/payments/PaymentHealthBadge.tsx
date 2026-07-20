import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentHealth } from '@/utils/paymentHealth';
import { radii, spacing, typography } from '@/constants/theme';

/** Icon + text health pill — the primary at-a-glance signal on each payment. */
export function PaymentHealthBadge({ health }: { health: PaymentHealth }) {
  return (
    <View
      style={[styles.badge, { backgroundColor: health.tint }]}
      accessible
      accessibilityLabel={`Health: ${health.label}. ${health.detail}`}
    >
      <Ionicons name={health.icon} size={14} color={health.color} />
      <Text style={[styles.label, { color: health.color }]}>{health.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
