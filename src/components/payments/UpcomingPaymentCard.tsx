import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface UpcomingPaymentData {
  id: string;
  person: string;
  agreementName: string;
  amount: string;
  direction: 'Receive' | 'Pay';
  frequency: string;
  bucket: string; // Tomorrow / Friday / Next week
  onPress: () => void;
}

/** Row in the upcoming-payments timeline, grouped by a time bucket. */
export function UpcomingPaymentCard({ data }: { data: UpcomingPaymentData }) {
  const tone = data.direction === 'Receive' ? { accent: colors.secondary, tint: '#ECFDF5' } : { accent: '#F59E0B', tint: '#FFFBEB' };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${data.direction} ${data.amount} ${data.direction === 'Receive' ? 'from' : 'to'} ${data.person}, ${data.bucket}, ${data.frequency}`}
      onPress={data.onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, { backgroundColor: tone.tint }]}>
        <Text style={[styles.avatarText, { color: tone.accent }]}>{initials(data.person)}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.person} numberOfLines={1}>
          {data.person}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.sub} numberOfLines={1}>
            {data.agreementName}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.sub}>{data.frequency}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{data.amount}</Text>
        <View style={[styles.chip, { backgroundColor: tone.tint }]}>
          <Ionicons name={data.direction === 'Receive' ? 'arrow-down' : 'arrow-up'} size={10} color={tone.accent} />
          <Text style={[styles.chipText, { color: tone.accent }]}>{data.direction}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.78,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.small,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  person: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sub: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
  dot: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
