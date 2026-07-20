import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

/**
 * Compact fintech hero for the final onboarding step: two aligned people, a handshake,
 * and a confirmed-progress chip — communicating trust, transparency and momentum.
 */
export function HeroIllustration() {
  return (
    <View style={styles.stage} accessible accessibilityRole="image" accessibilityLabel="Two people aligned on a tracked agreement">
      <View style={[styles.blob, styles.blobPrimary]} />
      <View style={[styles.blob, styles.blobSecondary]} />

      <View style={styles.row}>
        <View style={[styles.avatar, styles.avatarPrimary]}>
          <Ionicons name="person" size={26} color="#FFFFFF" />
        </View>
        <View style={styles.connector}>
          <View style={styles.connectorLine} />
          <View style={styles.handshake}>
            <Ionicons name="git-compare" size={18} color={colors.secondary} />
          </View>
          <View style={styles.connectorLine} />
        </View>
        <View style={[styles.avatar, styles.avatarMuted]}>
          <Ionicons name="person" size={26} color={colors.primary} />
        </View>
      </View>

      <View style={styles.chip}>
        <View style={styles.chipDot}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
        <Text style={styles.chipText}>On track together</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  blob: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  blobPrimary: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    top: 0,
    left: 40,
  },
  blobSecondary: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    bottom: 0,
    right: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPrimary: {
    backgroundColor: colors.primary,
  },
  avatarMuted: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectorLine: {
    width: 22,
    height: 2,
    backgroundColor: colors.border,
  },
  handshake: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chipDot: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
