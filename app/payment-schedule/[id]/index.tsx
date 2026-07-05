import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { formatDate, formatMoney } from '@/utils/money';

export default function PaymentScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agreements, currentUser, payments } = useTruvoStore();
  const agreement = agreements.find((item) => item.id === id);

  if (!agreement) {
    return (
      <ScreenContainer>
        <EmptyState title="Schedule not found" message="This payment schedule is unavailable." />
      </ScreenContainer>
    );
  }

  const schedule =
    agreement.paymentSchedule && agreement.paymentSchedule.length
      ? agreement.paymentSchedule
      : Array.from({ length: agreement.numberOfPayments }).map((_, index) => ({
          payment_number: index + 1,
          due_date: index === 0 ? agreement.nextPaymentDate || agreement.dueDate : agreement.dueDate,
          amount: agreement.totalRepaymentAmount / Math.max(agreement.numberOfPayments, 1),
          status: 'scheduled' as const,
        }));
  const agreementPayments = payments.filter((payment) => payment.agreementId === agreement.id);
  const matchedPaymentIds = new Set<string>();
  const currency = currentUser.currency || 'USD';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Payment schedule</Text>
          <Text style={styles.title}>{agreement.borrowerName || agreement.borrowerEmail || agreement.borrowerPhone}</Text>
        </View>
        <StatusBadge status={agreement.status} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total repayment</Text>
        <Text style={styles.summaryValue}>{formatMoney(agreement.totalRepaymentAmount, currency)}</Text>
        <Text style={styles.summaryMeta}>Next payment {agreement.nextPaymentDate ? formatDate(agreement.nextPaymentDate) : 'not scheduled'}</Text>
      </View>

      <View style={styles.scheduleList}>
        {schedule.map((payment) => {
          const matchingPayment = agreementPayments.find(
            (item) =>
              !matchedPaymentIds.has(item.id) &&
              Math.abs(item.amount - payment.amount) < 0.01 &&
              item.paymentDate <= payment.due_date,
          );
          if (matchingPayment) matchedPaymentIds.add(matchingPayment.id);
          const status = matchingPayment?.status || payment.status;
          return (
            <View key={`${payment.payment_number}-${payment.due_date}`} style={styles.scheduleRow}>
              <View style={styles.scheduleNumber}>
                <Text style={styles.scheduleNumberText}>{payment.payment_number}</Text>
              </View>
              <View style={styles.scheduleCopy}>
                <Text style={styles.scheduleTitle}>{formatMoney(payment.amount, currency)}</Text>
                <Text style={styles.scheduleDate}>Due {formatDate(payment.due_date)}</Text>
              </View>
              <StatusBadge status={status} />
            </View>
          );
        })}
      </View>

      <PrimaryButton label="Open agreement" onPress={() => router.push(`/agreement/${agreement.id}`)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  summaryCard: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  summaryLabel: {
    color: '#A7F3D0',
    fontSize: typography.small,
    fontWeight: '900',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
  },
  summaryMeta: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '700',
  },
  scheduleList: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleRow: {
    minHeight: 78,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
  },
  scheduleNumberText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  scheduleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  scheduleTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  scheduleDate: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
});
