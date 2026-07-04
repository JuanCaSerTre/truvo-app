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

export default function PaymentConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { payments, agreements, confirmPayment, rejectPayment } = useTruvoStore();
  const payment = payments.find((item) => item.id === id);
  const agreement = payment ? agreements.find((item) => item.id === payment.agreementId) : undefined;

  if (!payment || !agreement) {
    return (
      <ScreenContainer>
        <EmptyState title="Payment not found" message="This payment confirmation is unavailable." />
      </ScreenContainer>
    );
  }

  const confirm = () => {
    confirmPayment(payment.id);
    router.replace(`/agreement/${agreement.id}`);
  };

  const reject = () => {
    rejectPayment(payment.id);
    router.replace(`/agreement/${agreement.id}`);
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Confirm payment</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Payment amount</Text>
        <Text style={styles.amount}>{formatMoney(payment.amount)}</Text>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{formatDate(payment.paymentDate)}</Text>
        <Text style={styles.label}>Agreement</Text>
        <Text style={styles.value}>{agreement.borrowerName || agreement.borrowerPhone}</Text>
        <StatusBadge status={payment.status} />
      </View>
      <Text style={styles.note}>Confirmed payments reduce the remaining balance. Pending payments do not.</Text>
      <PrimaryButton label="Confirm payment" onPress={confirm} disabled={payment.status !== 'pending_confirmation'} />
      <PrimaryButton label="Reject payment" variant="outline" onPress={reject} disabled={payment.status !== 'pending_confirmation'} />
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
