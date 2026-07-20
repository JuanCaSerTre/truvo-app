import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInRight } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface ActivityItem {
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

/** Compact horizontal timeline of recent events shown above the agreement list. */
export function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  if (!items.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item, index) => (
        <Reanimated.View key={item.id} entering={FadeInRight.delay(index * 60).duration(320)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.agreementName}, ${item.time}${item.amount ? `, ${item.amount}` : ''}`}
            onPress={item.onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.headerRow}>
              <View style={[styles.icon, { backgroundColor: item.tint }]}>
                <Ionicons name={item.icon} size={15} color={item.color} />
              </View>
              {item.amount ? <Text style={[styles.amount, { color: item.color }]}>{item.amount}</Text> : null}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.agreement} numberOfLines={1}>
              {item.agreementName}
            </Text>
            <Text style={styles.time}>{item.time}</Text>
          </Pressable>
        </Reanimated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  card: {
    width: 168,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: typography.small,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
    marginTop: spacing.xs,
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
