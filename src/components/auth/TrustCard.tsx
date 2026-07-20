import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface TrustItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: 'lock-closed', label: 'Secure authentication' },
  { icon: 'eye-off', label: 'Your agreements remain private' },
  { icon: 'card', label: 'No financial information is shared' },
];

/** Row of small premium trust indicators shown near the bottom of auth screens. */
export function TrustSection({ items = DEFAULT_ITEMS }: { items?: TrustItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <Ionicons name={item.icon} size={18} color={colors.secondary} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});
