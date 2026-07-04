import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Agreement, Payment, User } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatDate, formatMoney } from '@/utils/money';
import { getConfirmedPayments, getProgress, getRemainingBalance } from '@/utils/agreementRules';

interface Props {
  agreement: Agreement;
  currentUser: User;
  payments: Payment[];
  onPress: () => void;
}

const receiveTheme = {
  label: 'You Receive',
  background: '#ECFDF5',
  accent: colors.secondary,
  amount: colors.secondary,
  icon: 'arrow-down-circle-outline' as const,
};

const payTheme = {
  label: 'You Pay',
  background: '#FFFBEB',
  accent: '#F59E0B',
  amount: '#D97706',
  icon: 'arrow-up-circle-outline' as const,
};

const statusTheme = (status: Agreement['status']) => {
  if (status === 'active') return { background: '#DBEAFE', text: colors.info };
  if (status === 'completed') return { background: '#D1FAE5', text: '#059669' };
  if (status === 'rejected') return { background: '#FEE2E2', text: colors.danger };
  if (status === 'cancelled') return { background: '#F1F5F9', text: colors.textMuted };
  return { background: '#F1F5F9', text: colors.textMuted };
};

const readableStatus = (status: string) => status.replace(/_/g, ' ');

export function AgreementCard({ agreement, currentUser, payments, onPress }: Props) {
  const isLender = agreement.lenderId === currentUser.id;
  const theme = isLender ? receiveTheme : payTheme;
  const person = isLender ? agreement.borrowerName || agreement.borrowerPhone : 'Lender';
  const remaining = getRemainingBalance(agreement, payments);
  const progress = getProgress(agreement, payments);
  const confirmedCount = getConfirmedPayments(agreement.id, payments).length;
  const progressColor = agreement.status === 'completed' ? '#059669' : theme.accent;
  const status = statusTheme(agreement.status);
  const progressAnim = useRef(new Animated.Value(progress)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 360,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    statusPulse.setValue(0.96);
    Animated.spring(statusPulse, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [agreement.status, statusPulse]);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.animatedWrap,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${theme.label}. ${person}. ${formatMoney(agreement.totalRepaymentAmount)} total. ${readableStatus(agreement.status)}.`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.background, borderLeftColor: theme.accent },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.directionBadge, { backgroundColor: '#FFFFFF', borderColor: theme.accent }]}>
            <Ionicons name={theme.icon} size={17} color={theme.accent} />
            <Text style={[styles.directionText, { color: theme.accent }]}>{theme.label}</Text>
          </View>
          <Animated.View style={[styles.statusBadge, { backgroundColor: status.background, transform: [{ scale: statusPulse }] }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{readableStatus(agreement.status)}</Text>
          </Animated.View>
        </View>

        <View style={styles.middle}>
          <View style={styles.personRow}>
            <View style={[styles.iconBubble, { backgroundColor: '#FFFFFF' }]}>
              <Ionicons name={isLender ? 'wallet-outline' : 'card-outline'} size={20} color={theme.accent} />
            </View>
            <Text style={styles.person} numberOfLines={1}>{person}</Text>
          </View>
          <Text style={[styles.amount, { color: theme.amount }]}>{formatMoney(agreement.totalRepaymentAmount)}</Text>
          <Text style={styles.remaining}>{formatMoney(remaining)} remaining</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width, backgroundColor: progressColor }]} />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.nextRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={styles.next}>{agreement.nextPaymentDate ? formatDate(agreement.nextPaymentDate) : 'Not scheduled'}</Text>
          </View>
          <Text style={styles.counter}>{confirmedCount} / {agreement.numberOfPayments} payments</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrap: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 22,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    gap: spacing.lg,
  },
  pressed: {
    opacity: 0.78,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  directionBadge: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  directionText: {
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  middle: {
    gap: spacing.xs,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  person: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
    flex: 1,
  },
  amount: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  remaining: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  progressTrack: {
    height: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.09)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  next: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  counter: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
});
