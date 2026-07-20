import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { CountUpText } from '@/components/CountUpText';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  total: number;
  active: number;
  pending: number;
}

/** Hero card summarizing the user's trusted network. */
export function TrustNetworkHeader({ total, active, pending }: Props) {
  return (
    <Reanimated.View entering={FadeInDown.duration(360)} style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={20} color={colors.secondary} />
        </View>
        <Text style={styles.eyebrow}>YOUR TRUSTED NETWORK</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat value={total} label="People" highlight />
        <View style={styles.divider} />
        <Stat value={active} label="Active" />
        <View style={styles.divider} />
        <Stat value={pending} label="Pending" />
      </View>

      <Text style={styles.explain}>
        Your Trust Network contains the people you regularly create agreements with. As it grows, creating agreements becomes faster and more secure.
      </Text>
    </Reanimated.View>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <CountUpText value={value} format={(v) => String(Math.round(v))} style={[styles.statValue, highlight && styles.statValueHighlight]} />
      <Text style={styles.statLabel}>{label}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  statValueHighlight: {
    color: '#A7F3D0',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  explain: {
    color: '#CBD5E1',
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '600',
  },
});
