import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { ProgressBar } from './ProgressBar';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  name: string;
  email?: string;
  avatarUrl?: string;
  country?: string;
  memberSince: string;
  subscriptionLabel: string;
  completion: number;
  emailVerified: boolean;
  phonePending: boolean;
  onEdit: () => void;
}

/** Rich identity header — avatar, verified badge, trust level, completion. */
export function IdentityCard({
  name,
  email,
  avatarUrl,
  country,
  memberSince,
  subscriptionLabel,
  completion,
  emailVerified,
  phonePending,
  onEdit,
}: Props) {
  return (
    <Reanimated.View entering={FadeInDown.duration(360)} style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
        )}
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.emailRow}>
            <Text style={styles.email} numberOfLines={1}>
              {email || 'No email added'}
            </Text>
            {emailVerified ? <Ionicons name="checkmark-circle" size={15} color={colors.secondary} /> : null}
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" hitSlop={8} onPress={onEdit} style={styles.editBtn}>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        <Badge icon="shield-checkmark" label={emailVerified ? 'Verified Account' : 'Account Protected'} highlight />
        <Badge icon="diamond-outline" label={subscriptionLabel} />
      </View>

      <View style={styles.metaRow}>
        {country ? <MetaItem icon="location-outline" text={country} /> : null}
        <MetaItem icon="calendar-outline" text={`Member since ${memberSince}`} />
        {phonePending ? <MetaItem icon="call-outline" text="Phone pending" /> : null}
      </View>

      <View style={styles.completionWrap}>
        <View style={styles.completionRow}>
          <Text style={styles.completionLabel}>Profile {completion}% Complete</Text>
          {completion < 100 ? <Text style={styles.completionHint}>Finish for a stronger account</Text> : <Text style={styles.completionDone}>All set</Text>}
        </View>
        <ProgressBar percent={completion} color={colors.secondary} track="rgba(255,255,255,0.16)" />
      </View>
    </Reanimated.View>
  );
}

function Badge({ icon, label, highlight }: { icon: keyof typeof Ionicons.glyphMap; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.badge, highlight && styles.badgeHighlight]}>
      <Ionicons name={icon} size={13} color={highlight ? colors.secondary : '#CBD5E1'} />
      <Text style={[styles.badgeText, highlight && styles.badgeTextHighlight]}>{label}</Text>
    </View>
  );
}

function MetaItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color="#94A3B8" />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: 26,
    backgroundColor: colors.primary,
    gap: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 6,
  },
  glow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: '#FFFFFF',
    fontSize: typography.h2,
    fontWeight: '900',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  email: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '600',
    flexShrink: 1,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: typography.caption,
    fontWeight: '900',
  },
  badgeTextHighlight: {
    color: '#A7F3D0',
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
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  completionWrap: {
    gap: spacing.sm,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  completionLabel: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '900',
  },
  completionHint: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  completionDone: {
    color: '#A7F3D0',
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
