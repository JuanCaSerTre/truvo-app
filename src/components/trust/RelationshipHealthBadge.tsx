import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RelationshipHealth } from '@/utils/trustNetwork';
import { radii, spacing, typography } from '@/constants/theme';

/** Icon + label pill reflecting the state of the RELATIONSHIP (not the person). */
export function RelationshipHealthBadge({ health, showDetail }: { health: RelationshipHealth; showDetail?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${health.label}. ${health.detail}`}>
      <View style={[styles.badge, { backgroundColor: health.tint }]}>
        <Ionicons name={health.icon} size={13} color={health.color} />
        <Text style={[styles.label, { color: health.color }]}>{health.label}</Text>
      </View>
      {showDetail ? <Text style={styles.detail}>{health.detail}</Text> : null}
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
  detail: {
    color: '#64748B',
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
});
