import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Health } from '@/utils/agreementHealth';
import { radii, spacing, typography } from '@/constants/theme';

/** Prominent icon+text health pill — the primary at-a-glance signal on each card. */
export function AgreementHealthBadge({ health }: { health: Health }) {
  return (
    <View
      style={[styles.badge, { backgroundColor: health.tint }]}
      accessible
      accessibilityLabel={`Health: ${health.label}. ${health.detail}`}
    >
      <Ionicons name={health.icon} size={15} color={health.color} />
      <Text style={[styles.label, { color: health.color }]}>{health.label}</Text>
      <Text style={styles.detail} numberOfLines={1}>
        {health.detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detail: {
    color: 'rgba(15, 23, 42, 0.55)',
    fontSize: typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
});
