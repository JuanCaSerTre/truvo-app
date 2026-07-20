import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentHealthBadge } from './PaymentHealthBadge';
import { PaymentHealth } from '@/utils/paymentHealth';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface PaymentCardData {
  id: string;
  person: string;
  agreementName: string;
  amount: string;
  direction: 'Receive' | 'Pay';
  dateLabel: string;
  health: PaymentHealth;
  actionLabel: string;
  actionIcon: keyof typeof Ionicons.glyphMap;
  onAction: () => void;
  index?: number;
}

/** Modern payment card: avatar, person, agreement, amount, direction, health, quick action. */
export function PaymentCard({ data }: { data: PaymentCardData }) {
  const tone = data.direction === 'Receive' ? { accent: colors.secondary, tint: '#ECFDF5' } : { accent: '#F59E0B', tint: '#FFFBEB' };
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 260, delay: Math.min(data.index ?? 0, 6) * 55, useNativeDriver: true }).start();
  }, [entrance, data.index]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: tone.tint }]}>
          <Text style={[styles.avatarText, { color: tone.accent }]}>{initials(data.person)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.person} numberOfLines={1}>
            {data.person}
          </Text>
          <Text style={styles.agreement} numberOfLines={1}>
            {data.agreementName}
          </Text>
        </View>
        <View style={styles.amountBlock}>
          <Text style={[styles.amount, { color: tone.accent }]} numberOfLines={1}>
            {data.amount}
          </Text>
          <View style={[styles.directionChip, { backgroundColor: tone.tint }]}>
            <Ionicons name={data.direction === 'Receive' ? 'arrow-down' : 'arrow-up'} size={10} color={tone.accent} />
            <Text style={[styles.directionText, { color: tone.accent }]}>{data.direction}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <PaymentHealthBadge health={data.health} />
        <View style={styles.dateChip}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dateText}>{data.dateLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={data.actionLabel}
        onPress={data.onAction}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Ionicons name={data.actionIcon} size={16} color="#FFFFFF" />
        <Text style={styles.actionText}>{data.actionLabel}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  person: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  agreement: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: typography.h3,
    fontWeight: '900',
  },
  directionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.78,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '900',
  },
});
