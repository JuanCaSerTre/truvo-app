import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  name?: string;
  email: string;
  onChange: () => void;
}

/** After a borrower is chosen, the input is replaced by this beautiful contact card. */
export function BorrowerCard({ name, email, onChange }: Props) {
  const display = name?.trim() || email;
  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.card}>
      <View style={[styles.avatar]}>
        <Text style={styles.avatarText}>{initials(display)}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {display}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Change contact" hitSlop={8} onPress={onChange} style={({ pressed }) => [styles.changeBtn, pressed && styles.pressed]}>
        <Ionicons name="swap-horizontal" size={15} color={colors.primary} />
        <Text style={styles.changeText}>Change</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  email: {
    color: '#047857',
    fontSize: typography.small,
    fontWeight: '700',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  changeText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
