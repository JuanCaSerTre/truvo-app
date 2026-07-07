import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { userSafeMessage } from '@/utils/errors';
import { formatDate, formatMoney } from '@/utils/money';

export default function PaymentConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { payments, agreements, currentUser, confirmPayment, rejectPayment } = useTruvoStore();
  const [paymentAction, setPaymentAction] = useState<'confirm' | 'reject' | null>(null);
  const payment = payments.find((item) => item.id === id);
  const agreement = payment ? agreements.find((item) => item.id === payment.agreementId) : undefined;

  if (!payment || !agreement) {
    return (
      <ScreenContainer>
        <EmptyState title="Payment not found" message="This payment confirmation is unavailable." />
      </ScreenContainer>
    );
  }

  const canConfirmPayment = payment.receiverId === currentUser.id;
  const currency = currentUser.currency || 'USD';

  const confirm = async () => {
    try {
      setPaymentAction('confirm');
      await confirmPayment(payment.id);
      router.replace(`/agreement/${agreement.id}`);
    } catch {
      Alert.alert('Could not confirm payment', userSafeMessage('Please try again.'));
    } finally {
      setPaymentAction(null);
    }
  };

  const reject = async () => {
    try {
      setPaymentAction('reject');
      await rejectPayment(payment.id);
      router.replace(`/agreement/${agreement.id}`);
    } catch {
      Alert.alert('Could not reject payment', userSafeMessage('Please try again.'));
    } finally {
      setPaymentAction(null);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Confirm payment</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Payment amount</Text>
        <Text style={styles.amount}>{formatMoney(payment.amount, currency)}</Text>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{formatDate(payment.paymentDate)}</Text>
        <Text style={styles.label}>Agreement</Text>
        <Text style={styles.value}>{agreement.borrowerName || agreement.borrowerPhone}</Text>
        <StatusBadge status={payment.status} />
      </View>
      <Text style={styles.note}>
        {canConfirmPayment
          ? 'Confirmed payments reduce the remaining balance. Pending payments do not.'
          : 'Only the payment receiver can confirm or reject this payment.'}
      </Text>
      <PrimaryButton label="Confirm payment" onPress={confirm} loading={paymentAction === 'confirm'} disabled={payment.status !== 'pending_confirmation' || !canConfirmPayment || Boolean(paymentAction)} />
      <PrimaryButton label="Reject payment" variant="outline" onPress={reject} loading={paymentAction === 'reject'} disabled={payment.status !== 'pending_confirmation' || !canConfirmPayment || Boolean(paymentAction)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typography.h1, fontWeight: '900' },
  card: { padding: spacing.xl, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: typography.small, fontWeight: '800' },
  amount: { color: colors.primary, fontSize: 42, fontWeight: '900', marginBottom: spacing.sm },
  value: { color: colors.text, fontSize: typography.h3, fontWeight: '900', marginBottom: spacing.sm },
  note: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
});
