import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountUpText } from '@/components/CountUpText';
import { ProgressBar } from './ProgressBar';
import { TrustIndicator } from '@/utils/profileTrust';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  score: number;
  indicators: TrustIndicator[];
}

/** Signature Trust Center: an account-readiness score + security checklist. */
export function TrustCenterCard({ score, indicators }: Props) {
  const scoreColor = score >= 80 ? colors.secondary : score >= 50 ? colors.warning : colors.danger;
  return (
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <View style={styles.scoreCopy}>
          <Text style={styles.eyebrow}>TRUST SCORE</Text>
          <View style={styles.scoreValueRow}>
            <CountUpText value={score} format={(v) => String(Math.round(v))} style={[styles.score, { color: scoreColor }]} />
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
          <Text style={styles.caption}>Reflects account readiness & security — never a rating of people.</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}1A` }]}>
          <Ionicons name="shield-checkmark" size={30} color={scoreColor} />
        </View>
      </View>

      <ProgressBar percent={score} color={scoreColor} />

      <View style={styles.list}>
        {indicators.map((item) => (
          <View key={item.key} style={styles.row} accessible accessibilityLabel={`${item.label}: ${item.met ? 'complete' : item.future ? 'coming soon' : 'pending'}`}>
            <Ionicons
              name={item.met ? 'checkmark-circle' : item.future ? 'lock-closed-outline' : 'ellipse-outline'}
              size={19}
              color={item.met ? colors.secondary : colors.textMuted}
            />
            <Text style={[styles.rowLabel, item.met && styles.rowLabelMet]}>{item.label}</Text>
            {item.future ? <Text style={styles.futureTag}>Soon</Text> : item.met ? null : <Text style={styles.pendingTag}>Pending</Text>}
          </View>
        ))}
      </View>
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
    gap: spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  score: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  scoreMax: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: '900',
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 16,
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  rowLabelMet: {
    color: colors.text,
  },
  futureTag: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pendingTag: {
    color: colors.warning,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
