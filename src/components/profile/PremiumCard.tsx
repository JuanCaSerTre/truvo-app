import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  isPremium: boolean;
  onUpgrade: () => void;
}

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'infinite', label: 'Unlimited Agreements' },
  { icon: 'headset', label: 'Priority Support' },
  { icon: 'bar-chart', label: 'Advanced Reports' },
  { icon: 'document-attach', label: 'PDF Agreements' },
  { icon: 'create', label: 'Digital Signatures' },
  { icon: 'cloud-upload', label: 'Cloud Backup' },
];

/** Premium marketing card highlighting benefits + upgrade CTA. */
export function PremiumCard({ isPremium, onUpgrade }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="diamond" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{isPremium ? 'TRUVO Premium' : 'Upgrade to Premium'}</Text>
          <Text style={styles.subtitle}>{isPremium ? 'Your premium benefits are active.' : 'Unlock the full TRUVO experience.'}</Text>
        </View>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.label} style={styles.benefit}>
            <Ionicons name={b.icon} size={15} color={colors.secondary} />
            <Text style={styles.benefitText}>{b.label}</Text>
          </View>
        ))}
      </View>

      {!isPremium ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Upgrade to Premium" onPress={onUpgrade} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
          <Ionicons name="diamond-outline" size={18} color={colors.primary} />
          <Text style={styles.ctaText}>Upgrade to Premium</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Manage plan" onPress={onUpgrade} style={({ pressed }) => [styles.manage, pressed && styles.pressed]}>
          <Text style={styles.manageText}>Manage plan</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    bottom: -70,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: typography.h3,
    fontWeight: '900',
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '600',
  },
  benefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    rowGap: spacing.md,
  },
  benefit: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    color: '#E2E8F0',
    fontSize: typography.small,
    fontWeight: '700',
    flexShrink: 1,
  },
  cta: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
  },
  ctaText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  manage: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  manageText: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.8,
  },
});
