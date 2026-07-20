import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface AgreementAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  primary?: boolean;
  onPress: () => void;
}

/** Contextual quick-action row. The first (primary) action is filled; the rest are outline. */
export function AgreementActions({ actions }: { actions: AgreementAction[] }) {
  if (!actions.length) return null;
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, action.primary ? styles.primary : styles.outline, pressed && styles.pressed]}
        >
          <Ionicons name={action.icon} size={15} color={action.primary ? '#FFFFFF' : colors.primary} />
          <Text style={[styles.label, action.primary ? styles.primaryLabel : styles.outlineLabel]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 40,
    flexGrow: 1,
    flexBasis: '30%',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  outlineLabel: {
    color: colors.primary,
  },
});
