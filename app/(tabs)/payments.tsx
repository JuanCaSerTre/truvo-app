import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { PaymentCard } from '@/components/PaymentCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';

export default function PaymentsScreen() {
  const { agreements, currentUser, payments } = useTruvoStore();
  const pending = payments.filter((payment) => payment.status === 'pending_confirmation' && payment.receiverId === currentUser.id);
  const payableAgreements = agreements.filter(
    (agreement) =>
      agreement.status === 'active' &&
      (agreement.borrowerId === currentUser.id ||
        agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
        agreement.borrowerPhone === currentUser.phone),
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>Payments</Text>
      {pending.length === 0 ? (
        <EmptyState
          title="No pending confirmations"
          message="Register a payment from an active agreement. It will stay pending until the other person confirms it."
          actionLabel="Open agreements"
          onAction={() => router.push('/(tabs)/agreements')}
        />
      ) : (
        pending.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} onPress={() => router.push(`/payment-confirmation/${payment.id}`)} />
        ))
      )}
      {payableAgreements
        .map((agreement) => (
          <EmptyState
            key={agreement.id}
            title={agreement.borrowerName || agreement.borrowerPhone}
            message="Register a new payment for this active agreement."
            actionLabel="Register payment"
            onAction={() => router.push(`/register-payment/${agreement.id}`)}
          />
        ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
});
