import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Agreement, Payment, User } from '@/types/models';
import { colors, radii, spacing } from '@/constants/theme';
import { formatDate, formatMoneyPrecise } from '@/utils/money';
import { frequencyLabel } from '@/utils/dashboard';
import { getAgreementHealth } from '@/utils/agreementHealth';
import { getConfirmedPayments, getPendingPayments, getProgress, getRemainingBalance } from '@/utils/agreementRules';
import { AgreementHeader } from '@/components/agreements/AgreementHeader';
import { AgreementHealthBadge } from '@/components/agreements/AgreementHealthBadge';
import { AgreementStatusBadge } from '@/components/agreements/AgreementStatusBadge';
import { AgreementSummary } from '@/components/agreements/AgreementSummary';
import { AgreementProgress } from '@/components/agreements/AgreementProgress';
import { AgreementActions, AgreementAction } from '@/components/agreements/AgreementActions';

interface Props {
  agreement: Agreement;
  currentUser: User;
  payments: Payment[];
  currency?: string;
  index?: number;
  onPress: () => void;
}

const receiveTheme = { accent: colors.secondary, amount: colors.secondary, tint: '#ECFDF5', background: '#F6FEFB' };
const payTheme = { accent: '#F59E0B', amount: '#D97706', tint: '#FFFBEB', background: '#FFFDF6' };

export function AgreementCard({ agreement, currentUser, payments, currency = currentUser.currency || 'USD', index = 0, onPress }: Props) {
  const isLender = agreement.lenderId === currentUser.id;
  const isBorrower = agreement.borrowerId === currentUser.id || agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase();
  const theme = isLender ? receiveTheme : payTheme;
  const person = isLender ? agreement.borrowerName || agreement.borrowerEmail || agreement.borrowerPhone || 'Borrower' : 'Lender';

  const remaining = getRemainingBalance(agreement, payments);
  const progress = getProgress(agreement, payments);
  const confirmedCount = getConfirmedPayments(agreement.id, payments).length;
  const health = getAgreementHealth(agreement, payments);
  const progressColor = agreement.status === 'completed' ? '#059669' : theme.accent;
  const money = (value: number) => formatMoneyPrecise(value, currency);

  // Contextual actions: only what's relevant to the current state.
  const actions: AgreementAction[] = [];
  const pendingForMe = getPendingPayments(agreement.id, payments).some((p) => p.receiverId === currentUser.id);
  if (pendingForMe) {
    actions.push({ key: 'confirm', label: 'Confirm Payment', icon: 'checkmark-circle-outline', primary: true, onPress: () => router.push(`/(tabs)/payments`) });
  }
  if (agreement.status === 'active' && isBorrower && !pendingForMe) {
    actions.push({ key: 'register', label: 'Register Payment', icon: 'cash-outline', primary: true, onPress: () => router.push(`/register-payment/${agreement.id}`) });
  }
  actions.push({ key: 'view', label: 'View Details', icon: 'arrow-forward-outline', primary: actions.length === 0, onPress });

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 260, delay: Math.min(index, 6) * 60, useNativeDriver: true }).start();
  }, [entrance, index]);

  return (
    <Animated.View
      style={[
        styles.animatedWrap,
        {
          opacity: entrance,
          transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${isLender ? 'You receive from' : 'You pay'} ${person}, ${money(agreement.totalRepaymentAmount)} total, ${health.label}, status ${agreement.status}`}
        style={({ pressed }) => [styles.card, { backgroundColor: theme.background, borderLeftColor: theme.accent }, pressed && styles.pressed]}
      >
        <View style={styles.topRow}>
          <AgreementHealthBadge health={health} />
          <AgreementStatusBadge status={agreement.status} />
        </View>

        <AgreementHeader person={person} direction={isLender ? 'Receive' : 'Pay'} accent={theme.accent} tint={theme.tint} />

        <AgreementSummary
          amount={money(agreement.totalRepaymentAmount)}
          remaining={money(remaining)}
          nextPaymentDate={agreement.nextPaymentDate ? formatDate(agreement.nextPaymentDate) : 'Not scheduled'}
          frequency={frequencyLabel(agreement.paymentFrequency)}
          amountColor={theme.amount}
        />

        <AgreementProgress progress={progress} confirmedCount={confirmedCount} totalPayments={agreement.numberOfPayments} color={progressColor} />

        <AgreementActions actions={actions} />
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
    opacity: 0.82,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
