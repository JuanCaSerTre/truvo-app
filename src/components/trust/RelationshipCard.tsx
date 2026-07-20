import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { RelationshipHealthBadge } from './RelationshipHealthBadge';
import { Relationship } from '@/utils/trustNetwork';
import { initials } from '@/utils/dashboard';
import { getRelativeTime } from '@/utils/notifications';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface RelationshipAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface Props {
  relationship: Relationship;
  index?: number;
  actions: RelationshipAction[];
}

/** A trusted relationship as a rich card: identity, health, agreement summary, quick actions. */
export function RelationshipCard({ relationship, index = 0, actions }: Props) {
  return (
    <Reanimated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(320)} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(relationship.name)}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {relationship.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {relationship.email}
          </Text>
        </View>
        <RelationshipHealthBadge health={relationship.health} />
      </View>

      <View style={styles.summary}>
        <SummaryStat value={String(relationship.agreementsTotal)} label="Agreements" />
        <View style={styles.summaryDivider} />
        <SummaryStat value={String(relationship.agreementsActive)} label="Active" />
        <View style={styles.summaryDivider} />
        <SummaryStat value={String(relationship.agreementsCompleted)} label="Completed" />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {relationship.lastInteraction ? `Last activity ${getRelativeTime(relationship.lastInteraction)}` : 'No activity yet'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>Since {relationship.memberSince}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
        {actions.map((action, i) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={`${action.label} with ${relationship.name}`}
            onPress={action.onPress}
            style={({ pressed }) => [styles.action, i === 0 ? styles.actionPrimary : styles.actionOutline, pressed && styles.pressed]}
          >
            <Ionicons name={action.icon} size={14} color={i === 0 ? '#FFFFFF' : colors.primary} />
            <Text style={[styles.actionText, i === 0 ? styles.actionTextPrimary : styles.actionTextOutline]}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Reanimated.View>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '900',
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  email: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.72,
  },
  actionText: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
  actionTextPrimary: {
    color: '#FFFFFF',
  },
  actionTextOutline: {
    color: colors.primary,
  },
});
