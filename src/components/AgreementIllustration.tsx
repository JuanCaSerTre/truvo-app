import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

/**
 * Flat, brand-colored fintech illustration for the Welcome hero.
 * Composed entirely from Views (no image/SVG dependency) so it stays crisp at any size
 * and speaks TRUVO's story: two people making an agreement, tracked money, confirmed payments.
 */
export function AgreementIllustration() {
  return (
    <View style={styles.stage} accessible accessibilityRole="image" accessibilityLabel="Two people agreeing on a tracked, confirmed loan">
      {/* Soft ambient blobs behind the card */}
      <View style={[styles.blob, styles.blobPrimary]} />
      <View style={[styles.blob, styles.blobSecondary]} />

      {/* The agreement card */}
      <View style={styles.card}>
        {/* Two people + handshake */}
        <View style={styles.peopleRow}>
          <View style={[styles.avatar, styles.avatarLender]}>
            <Ionicons name="person" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.handshakePill}>
            <Ionicons name="git-compare" size={16} color={colors.secondary} />
          </View>
          <View style={[styles.avatar, styles.avatarBorrower]}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
        </View>

        {/* Amount tracking */}
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Repayment progress</Text>
          <Text style={styles.amountValue}>$1,200</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressMetaText}>$750 confirmed</Text>
            <Text style={styles.progressMetaMuted}>$450 left</Text>
          </View>
        </View>

        {/* Confirmed payment row */}
        <View style={styles.confirmRow}>
          <View style={styles.confirmIcon}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.confirmText}>
            <Text style={styles.confirmTitle}>Payment confirmed</Text>
            <Text style={styles.confirmSub}>Both sides agreed · today</Text>
          </View>
        </View>
      </View>

      {/* Floating confirmation badge */}
      <View style={styles.floatingBadge}>
        <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  blobPrimary: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    top: 10,
    left: 24,
  },
  blobSecondary: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    bottom: 6,
    right: 30,
  },
  card: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLender: {
    backgroundColor: colors.primary,
  },
  avatarBorrower: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.border,
  },
  handshakePill: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBlock: {
    gap: spacing.sm,
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amountValue: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    width: '62%',
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    color: colors.secondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  progressMetaMuted: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#ECFDF5',
  },
  confirmIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    flex: 1,
  },
  confirmTitle: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  confirmSub: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '500',
  },
  floatingBadge: {
    position: 'absolute',
    top: 18,
    right: 26,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
});
