import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
}

/** Filter pill with an inline count badge. */
export function FilterChip({ label, count, icon, color, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count} agreements`}
      style={[styles.chip, selected && { backgroundColor: `${color}18`, borderColor: color }]}
    >
      <Ionicons name={icon} size={15} color={selected ? color : colors.textMuted} />
      <Text style={[styles.label, selected && { color }]}>{label}</Text>
      <View style={[styles.countBadge, selected ? { backgroundColor: color } : styles.countBadgeIdle]}>
        <Text style={[styles.countText, selected ? styles.countTextSelected : styles.countTextIdle]}>{count}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '900',
  },
  countBadge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeIdle: {
    backgroundColor: colors.surfaceMuted,
  },
  countText: {
    fontSize: 11,
    fontWeight: '900',
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
  countTextIdle: {
    color: colors.textMuted,
  },
});
