import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionHubItem } from './actionHubConfig';
import { colors, radii, spacing, typography } from '@/constants/theme';

/** One tappable row in the Action Hub: large icon, title, description, chevron. */
export function ActionCard({ item, onPress }: { item: ActionHubItem; onPress: () => void }) {
  const disabled = Boolean(item.comingSoon);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.description}${disabled ? '. Coming soon' : ''}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, disabled && styles.cardDisabled, pressed && !disabled && styles.pressed]}
    >
      <View style={[styles.iconWrap, disabled && styles.iconWrapDisabled]}>
        <Ionicons name={item.icon} size={24} color={disabled ? colors.textMuted : colors.secondary} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, disabled && styles.titleDisabled]}>{item.title}</Text>
          {disabled ? (
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>Coming Soon</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      {!disabled ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDisabled: {
    backgroundColor: colors.background,
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: '#ECFDF5',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  titleDisabled: {
    color: colors.textMuted,
  },
  soonBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surfaceMuted,
  },
  soonText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '600',
  },
});
