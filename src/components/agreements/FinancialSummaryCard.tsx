import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountUpText } from '@/components/CountUpText';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  receive: number;
  pay: number;
  net: number;
  activeCount: number;
  attentionCount: number;
  format: (value: number) => string;
}

/** The "financial heartbeat": a hero Net Position card with a contextual line + receive/pay widgets. */
export function FinancialSummaryCard({ receive, pay, net, activeCount, attentionCount, format }: Props) {
  const positive = net >= 0;
  const context =
    attentionCount > 0
      ? `${attentionCount} ${attentionCount === 1 ? 'agreement requires' : 'agreements require'} your attention.`
      : positive
        ? 'You have more money to receive than to pay.'
        : "You currently owe more than you're owed.";

  return (
    <View style={styles.card}>
      <View style={styles.glowPrimary} pointerEvents="none" />
      <View style={styles.glowSecondary} pointerEvents="none" />

      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>NET POSITION</Text>
        <View style={styles.activePill}>
          <Ionicons name="flash" size={12} color="#FFFFFF" />
          <Text style={styles.activePillText}>
            {activeCount} active
          </Text>
        </View>
      </View>

      <CountUpText
        value={net}
        format={(v) => `${net >= 0 ? '+' : ''}${format(v)}`}
        style={[styles.net, { color: positive ? '#FFFFFF' : '#FCA5A5' }]}
      />
      <Text style={styles.context}>{context}</Text>

      <View style={styles.widgets}>
        <Widget label="To Receive" value={receive} icon="arrow-down" accent={colors.secondary} tint="rgba(16,185,129,0.16)" format={format} />
        <View style={styles.divider} />
        <Widget label="To Pay" value={pay} icon="arrow-up" accent={colors.warning} tint="rgba(245,158,11,0.16)" format={format} />
      </View>
    </View>
  );
}

function Widget({
  label,
  value,
  icon,
  accent,
  tint,
  format,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  tint: string;
  format: (value: number) => string;
}) {
  return (
    <View style={styles.widget}>
      <View style={styles.widgetHeader}>
        <View style={[styles.widgetIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={13} color={accent} />
        </View>
        <Text style={styles.widgetLabel}>{label}</Text>
      </View>
      <CountUpText value={value} format={format} style={styles.widgetValue} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.primary,
    gap: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 4,
  },
  glowPrimary: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  glowSecondary: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#CBD5E1',
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '900',
  },
  net: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
  },
  context: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '600',
  },
  widgets: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  widget: {
    flex: 1,
    gap: spacing.xs,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  widgetIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetLabel: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetValue: {
    color: '#FFFFFF',
    fontSize: typography.h2,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
