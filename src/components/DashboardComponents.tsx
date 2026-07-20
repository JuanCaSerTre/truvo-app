import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { CountUpText } from '@/components/CountUpText';
import { initials } from '@/utils/dashboard';

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

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);
const truvoMark = require('../../assets/icon.png');

export function DashboardHeader({
  name,
  greeting,
  insight,
  insightTone = 'neutral',
  unread,
  unreadCount,
  onNotifications,
}: {
  name: string;
  greeting: string;
  insight: string;
  insightTone?: Tone;
  unread: boolean;
  unreadCount?: number;
  onNotifications: () => void;
}) {
  return (
    <View style={styles.header}>
      <Image source={truvoMark} style={styles.headerLogo} resizeMode="contain" accessibilityLabel="TRUVO" />
      <View style={styles.headerCopy}>
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting}
        </Text>
        <View style={styles.insightRow}>
          <View style={[styles.insightPulse, { backgroundColor: toneColor[insightTone] }]} />
          <Text style={styles.insightText} numberOfLines={2}>
            {insight}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread ? `Notifications, ${unreadCount ?? 'new'} unread` : 'Notifications'}
        onPress={onNotifications}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        {unread ? (
          <View style={styles.notificationBadge}>
            {unreadCount ? <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text> : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export function FinancialOverviewCard({
  toReceive,
  toPay,
  netPosition,
  receiveCount,
  payCount,
  currency,
  format,
}: {
  toReceive: number;
  toPay: number;
  netPosition: number;
  receiveCount: number;
  payCount: number;
  currency: string;
  format: (value: number) => string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const netTone: Tone = netPosition < 0 ? 'warning' : netPosition === 0 ? 'neutral' : 'success';
  const story =
    netPosition > 0
      ? "You're in a positive position."
      : netPosition < 0
        ? "You currently owe more than you're owed."
        : "You're all squared up.";

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.985, duration: 120, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [netPosition, pulse, toPay, toReceive]);

  return (
    <Animated.View style={[styles.summaryCard, { transform: [{ scale: pulse }] }]}>
      {/* subtle gradient accents */}
      <View style={styles.summaryGlowPrimary} pointerEvents="none" />
      <View style={styles.summaryGlowSecondary} pointerEvents="none" />

      <View style={styles.summaryTop}>
        <Text style={styles.summaryEyebrow}>NET POSITION</Text>
        <View style={[styles.summaryBadge, { backgroundColor: toneTint[netTone] }]}>
          <Text style={[styles.summaryBadgeText, { color: toneColor[netTone] }]}>
            {netTone === 'success' ? 'Positive' : netTone === 'warning' ? 'Owing' : 'Balanced'}
          </Text>
        </View>
      </View>
      <CountUpText value={netPosition} format={format} style={[styles.netValue, { color: netTone === 'warning' ? '#FCA5A5' : '#FFFFFF' }]} />
      <Text style={styles.summaryStory}>{story}</Text>

      <View style={styles.summaryMetrics}>
        <MiniSummary
          label="To Receive"
          value={toReceive}
          count={receiveCount}
          icon="arrow-down"
          tint="rgba(16, 185, 129, 0.16)"
          accent={colors.secondary}
          format={format}
        />
        <View style={styles.metricDivider} />
        <MiniSummary
          label="To Pay"
          value={toPay}
          count={payCount}
          icon="arrow-up"
          tint="rgba(245, 158, 11, 0.16)"
          accent={colors.warning}
          format={format}
        />
      </View>
    </Animated.View>
  );
}

function MiniSummary({
  label,
  value,
  count,
  icon,
  tint,
  accent,
  format,
}: {
  label: string;
  value: number;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  accent: string;
  format: (value: number) => string;
}) {
  return (
    <View style={styles.miniSummary} accessible accessibilityLabel={`${label}: ${format(value)} across ${count} agreements`}>
      <View style={styles.miniHeaderRow}>
        <View style={[styles.miniIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={14} color={accent} />
        </View>
        <Text style={styles.miniLabel}>{label}</Text>
      </View>
      <CountUpText value={value} format={format} style={styles.miniValue} />
      <Text style={styles.miniCount}>
        {count} {count === 1 ? 'agreement' : 'agreements'}
      </Text>
    </View>
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
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      style={[styles.quickAction, animatedStyle]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: toneTint[tone] }]}>
        <Ionicons name={icon} size={26} color={toneColor[tone]} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </AnimatedPressable>
  );
}

export function AttentionCard({
  icon,
  title,
  description,
  tone,
  agreementName,
  amount,
  dueLabel,
  statusLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tone: Tone;
  agreementName?: string;
  amount?: string;
  dueLabel?: string;
  statusLabel?: string;
  onPress?: () => void;
}) {
  const hasMeta = agreementName || amount || dueLabel || statusLabel;
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => [styles.attentionCard, pressed && styles.pressed]}>
      <View style={[styles.priorityBar, { backgroundColor: toneColor[tone] }]} />
      <View style={styles.attentionBody}>
        <View style={styles.attentionHeaderRow}>
          <View style={[styles.smallIcon, { backgroundColor: toneTint[tone] }]}>
            <Ionicons name={icon} size={19} color={toneColor[tone]} />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
          {amount ? <Text style={[styles.attentionAmount, { color: toneColor[tone] }]}>{amount}</Text> : null}
        </View>
        {hasMeta ? (
          <View style={styles.attentionMeta}>
            {agreementName ? (
              <View style={styles.metaChip}>
                <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaChipText}>{agreementName}</Text>
              </View>
            ) : null}
            {dueLabel ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaChipText}>{dueLabel}</Text>
              </View>
            ) : null}
            {statusLabel ? (
              <View style={[styles.statusBadge, { backgroundColor: toneTint[tone] }]}>
                <Text style={[styles.statusBadgeText, { color: toneColor[tone] }]}>{statusLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function UpcomingPaymentCard({
  person,
  amount,
  date,
  direction,
  frequency,
  status,
  onPress,
}: {
  person: string;
  amount: string;
  date: string;
  direction: 'Receive' | 'Pay';
  frequency: string;
  status: string;
  onPress: () => void;
}) {
  const tone: Tone = direction === 'Receive' ? 'success' : 'warning';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${direction} ${amount} ${direction === 'Receive' ? 'from' : 'to'} ${person}, due ${date}, ${frequency}`}
      onPress={onPress}
      style={({ pressed }) => [styles.paymentCard, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, { backgroundColor: toneTint[tone] }]}>
        <Text style={[styles.avatarText, { color: toneColor[tone] }]}>{initials(person)}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{person}</Text>
        <View style={styles.paymentSubRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cardDescription}>{date}</Text>
          <Text style={styles.dotSeparator}>·</Text>
          <Text style={styles.cardDescription}>{frequency}</Text>
        </View>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{amount}</Text>
        <View style={[styles.directionBadge, { backgroundColor: toneTint[tone] }]}>
          <Ionicons name={direction === 'Receive' ? 'arrow-down' : 'arrow-up'} size={11} color={toneColor[tone]} />
          <Text style={[styles.directionText, { color: toneColor[tone] }]}>{direction}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ActivityTimeline({
  events,
}: {
  events: { id: string; title: string; description: string; time: string; tone: Tone; icon: keyof typeof Ionicons.glyphMap; amount?: string }[];
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
        <Reanimated.View key={event.id} entering={FadeInDown.delay(index * 70).duration(340)} style={styles.timelineRow}>
          <View style={styles.timelineIconWrap}>
            <View style={[styles.timelineIcon, { backgroundColor: toneTint[event.tone] }]}>
              <Ionicons name={event.icon} size={16} color={toneColor[event.tone]} />
            </View>
            {index < events.length - 1 ? <View style={styles.timelineLine} /> : null}
          </View>
          <View style={styles.timelineCopy}>
            <View style={styles.timelineTitleRow}>
              <Text style={[styles.cardTitle, styles.flexOne]}>{event.title}</Text>
              {event.amount ? <Text style={[styles.timelineAmount, { color: toneColor[event.tone] }]}>{event.amount}</Text> : null}
            </View>
            <Text style={styles.cardDescription}>{event.description}</Text>
            <Text style={styles.timelineTime}>{event.time}</Text>
          </View>
        </Reanimated.View>
      ))}
    </View>
  );
}

export function InsightCard({ icon, message, tone = 'info' }: { icon: keyof typeof Ionicons.glyphMap; message: string; tone?: Tone }) {
  return (
    <View style={styles.smartInsightCard}>
      <View style={[styles.insightIcon, { backgroundColor: toneTint[tone] }]}>
        <Ionicons name={icon} size={20} color={toneColor[tone]} />
      </View>
      <Text style={styles.smartInsightText}>{message}</Text>
    </View>
  );
}

export function EmptyStateCard({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyStateCard}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name={icon} size={22} color={colors.textMuted} />
      </View>
      <View style={styles.flexOne}>
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyCompactText}>{message}</Text>
      </View>
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
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  insightText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '600',
    lineHeight: 18,
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
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  summaryCard: {
    padding: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.primary,
    gap: spacing.md,
    overflow: 'hidden',
    ...cardShadow,
  },
  summaryGlowPrimary: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  summaryGlowSecondary: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryEyebrow: {
    color: '#CBD5E1',
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 1,
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
  summaryStory: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '600',
    marginTop: -spacing.xs,
  },
  summaryMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
  },
  miniSummary: {
    flex: 1,
    gap: spacing.xs,
  },
  miniHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniValue: {
    color: '#FFFFFF',
    fontSize: typography.h2,
    fontWeight: '900',
  },
  miniCount: {
    color: '#94A3B8',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickAction: {
    width: '48%',
    minHeight: 112,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 19,
  },
  attentionCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...cardShadow,
  },
  priorityBar: {
    width: 5,
  },
  attentionBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  attentionAmount: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  attentionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingLeft: 52,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  metaChipText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  statusBadge: {
    minHeight: 22,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'capitalize',
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
  flexOne: {
    flex: 1,
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
    ...cardShadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.small,
    fontWeight: '900',
  },
  paymentSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotSeparator: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
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
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 22,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  directionText: {
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
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineAmount: {
    fontSize: typography.small,
    fontWeight: '900',
  },
  timelineTime: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  smartInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartInsightText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 20,
  },
  emptyStateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 84,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
    marginBottom: 2,
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
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
