import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface SettingsRow {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  trailing?: string;
  onPress: () => void;
}

export function SettingsSection({ title, rows }: { title: string; rows: SettingsRow[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <SettingsItem key={row.title} row={row} last={index === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

export function SettingsItem({ row, last }: { row: SettingsRow; last?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.title}
      onPress={row.onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={row.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        {row.description ? <Text style={styles.rowDesc}>{row.description}</Text> : null}
      </View>
      {row.trailing ? <Text style={styles.trailing}>{row.trailing}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  card: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    minHeight: 62,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  rowDesc: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 17,
  },
  trailing: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
});
