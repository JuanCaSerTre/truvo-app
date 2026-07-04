import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/constants/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const toneColor: Record<Tone, string> = {
  success: colors.secondary,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.textMuted,
  info: colors.info,
};

const toneTint: Record<Tone, string> = {
  success: '#D1FAE5',
  warning: '#FEF3C7',
  danger: '#FEE2E2',
  neutral: '#E2E8F0',
  info: '#DBEAFE',
};

export function DashboardHeader({
  name,
  unread,
  onNotifications,
}: {
  name: string;
  unread: boolean;
  onNotifications: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.greeting}>Good day, {name.split(' ')[0]}</Text>
        <Text style={styles.headerTitle}>Financial overview</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onNotifications} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        {unread ? <View style={styles.notificationDot} /> : null}
      </Pressable>
    </View>
  );
}

export function DashboardSummaryCard({
  toReceive,
  toPay,
  netPosition,
}: {
  toReceive: string;
  toPay: string;
  netPosition: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const netTone: Tone = netPosition.startsWith('-') ? 'warning' : netPosition === '$0' ? 'neutral' : 'success';

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.985, duration: 120, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [netPosition, pulse, toPay, toReceive]);

  return (
    <Animated.View style={[styles.summaryCard, { transform: [{ scale: pulse }] }]}>
      <View style={styles.summaryTop}>
        <Text style={styles.summaryEyebrow}>Net position</Text>
        <View style={[styles.summaryBadge, { backgroundColor: toneTint[netTone] }]}>
          <Text style={[styles.summaryBadgeText, { color: toneColor[netTone] }]}>
            {netTone === 'success' ? 'Positive' : netTone === 'warning' ? 'Owing' : 'Balanced'}
          </Text>
        </View>
      </View>
      <Text style={[styles.netValue, { color: toneColor[netTone] }]}>{netPosition}</Text>
      <View style={styles.summaryMetrics}>
        <View style={styles.summaryMetric}>
          <Text style={styles.metricLabel}>Money To Receive</Text>
          <Text style={styles.metricValue}>{toReceive}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.summaryMetric}>
          <Text style={styles.metricLabel}>Money To Pay</Text>
          <Text style={styles.metricValue}>{toPay}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function QuickActionCard({
  icon,
  label,
  onPress,
  tone = 'neutral',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: Tone;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <View style={[styles.quickActionIcon, { backgroundColor: toneTint[tone] }]}>
        <Ionicons name={icon} size={22} color={toneColor[tone]} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

export function AttentionCard({
  icon,
  title,
  description,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tone: Tone;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => [styles.attentionCard, pressed && styles.pressed]}>
      <View style={[styles.smallIcon, { backgroundColor: toneTint[tone] }]}>
        <Ionicons name={icon} size={19} color={toneColor[tone]} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

export function UpcomingPaymentCard({
  person,
  amount,
  date,
  direction,
  status,
  onPress,
}: {
  person: string;
  amount: string;
  date: string;
  direction: 'Receive' | 'Pay';
  status: string;
  onPress: () => void;
}) {
  const tone: Tone = direction === 'Receive' ? 'success' : 'warning';
  return (
    <View style={styles.paymentCard}>
      <View style={[styles.paymentAvatar, { backgroundColor: toneTint[tone] }]}>
        <Ionicons name={direction === 'Receive' ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={toneColor[tone]} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{person}</Text>
        <Text style={styles.cardDescription}>{date}</Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{amount}</Text>
        <View style={styles.paymentMeta}>
          <View style={[styles.directionBadge, { backgroundColor: toneTint[tone] }]}>
            <Text style={[styles.directionText, { color: toneColor[tone] }]}>{direction}</Text>
          </View>
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.miniButton, pressed && styles.pressed]}>
          <Text style={styles.miniButtonText}>View Agreement</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ActivityTimeline({
  events,
}: {
  events: { id: string; title: string; description: string; time: string; tone: Tone; icon: keyof typeof Ionicons.glyphMap }[];
}) {
  if (!events.length) {
    return (
      <View style={styles.emptyCompact}>
        <Ionicons name="pulse-outline" size={22} color={colors.textMuted} />
        <Text style={styles.emptyCompactText}>Activity will appear as agreements and payments move.</Text>
      </View>
    );
  }

  return (
    <View style={styles.timeline}>
      {events.map((event, index) => (
        <View key={event.id} style={styles.timelineRow}>
          <View style={styles.timelineIconWrap}>
            <View style={[styles.timelineIcon, { backgroundColor: toneTint[event.tone] }]}>
              <Ionicons name={event.icon} size={16} color={toneColor[event.tone]} />
            </View>
            {index < events.length - 1 ? <View style={styles.timelineLine} /> : null}
          </View>
          <View style={styles.timelineCopy}>
            <Text style={styles.cardTitle}>{event.title}</Text>
            <Text style={styles.cardDescription}>{event.description}</Text>
            <Text style={styles.timelineTime}>{event.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function InsightCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={styles.insightCard}>
      <View style={[styles.insightDot, { backgroundColor: toneColor[tone] }]} />
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  );
}

export function AgreementStatsCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIndicator, { backgroundColor: toneColor[tone] }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ProgressWidget({ percent, message }: { percent: number; message: string }) {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: Math.max(0, Math.min(percent, 100)),
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [animated, percent]);

  const width = animated.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressLabel}>Repayment progress</Text>
          <Text style={styles.progressValue}>{Math.round(percent)}%</Text>
        </View>
        <View style={styles.progressIcon}>
          <Ionicons name="trending-up-outline" size={22} color={colors.secondary} />
        </View>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width }]} />
      </View>
      <Text style={styles.progressMessage}>{message}</Text>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 2,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  summaryCard: {
    padding: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.primary,
    gap: spacing.lg,
    ...cardShadow,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryEyebrow: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '900',
  },
  summaryBadge: {
    minHeight: 28,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
  netValue: {
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
  },
  summaryMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: spacing.lg,
  },
  summaryMetric: {
    flex: 1,
    gap: spacing.xs,
  },
  metricDivider: {
    width: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: typography.h2,
    fontWeight: '900',
  },
  quickAction: {
    width: '48%',
    minHeight: 104,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    gap: spacing.md,
    ...cardShadow,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
    lineHeight: 21,
  },
  attentionCard: {
    minHeight: 76,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  smallIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
    lineHeight: 19,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  paymentCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  paymentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  paymentAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  directionBadge: {
    minHeight: 22,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionText: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
  statusText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  miniButton: {
    minHeight: 30,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  miniButtonText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '900',
  },
  timeline: {
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineIconWrap: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    width: 1,
    minHeight: 24,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  timelineTime: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  insightCard: {
    width: '48%',
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  insightValue: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  statCard: {
    width: '48%',
    minHeight: 88,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  statIndicator: {
    width: 26,
    height: 4,
    borderRadius: radii.pill,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...cardShadow,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressValue: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  progressIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
  },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
  },
  progressMessage: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptyCompact: {
    minHeight: 96,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyCompactText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
