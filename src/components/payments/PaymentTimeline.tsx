import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface TimelineItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  title: string;
  time: string;
  agreementName: string;
  amount?: string;
  onPress: () => void;
}

/** Vertical recent-activity timeline with staggered entrance. */
export function PaymentTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <View style={styles.timeline}>
      {items.map((item, index) => (
        <Reanimated.View key={item.id} entering={FadeInDown.delay(index * 60).duration(320)} style={styles.row}>
          <View style={styles.iconWrap}>
            <View style={[styles.icon, { backgroundColor: item.tint }]}>
              <Ionicons name={item.icon} size={15} color={item.color} />
            </View>
            {index < items.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <Pressable accessibilityRole="button" onPress={item.onPress} style={({ pressed }) => [styles.copy, pressed && styles.pressed]}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {item.amount ? <Text style={[styles.amount, { color: item.color }]}>{item.amount}</Text> : null}
            </View>
            <Text style={styles.agreement} numberOfLines={1}>
              {item.agreementName}
            </Text>
            <Text style={styles.time}>{item.time}</Text>
          </Pressable>
        </Reanimated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 1,
    minHeight: 20,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  copy: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
  amount: {
    fontSize: typography.small,
    fontWeight: '900',
  },
  agreement: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  time: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: 2,
  },
});
