import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { PaymentMethod } from '@/types/models';
import { getRemainingBalance } from '@/utils/agreementRules';
import { formatMoney, toNumber } from '@/utils/money';

const methods: PaymentMethod[] = ['cash', 'bank_transfer', 'other'];

export default function RegisterPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agreements, payments, registerPayment } = useTruvoStore();
  const agreement = agreements.find((item) => item.id === id);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!agreement) {
    return (
      <ScreenContainer>
        <EmptyState title="Agreement not found" message="A payment needs an active agreement." />
      </ScreenContainer>
    );
  }

  const remaining = getRemainingBalance(agreement, payments);

  const submit = async () => {
    const parsedAmount = toNumber(amount);
    if (agreement.status !== 'active') {
      Alert.alert('Only active agreements can receive payments');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Enter a valid payment amount');
      return;
    }
    setLoading(true);
    const payment = await registerPayment({
      agreementId: agreement.id,
      amount: parsedAmount,
      paymentDate,
      method,
      notes: notes || undefined,
    });
    setLoading(false);
    router.replace(`/payment-confirmation/${payment.id}`);
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Register payment</Text>
      <View style={styles.balance}>
        <Text style={styles.balanceLabel}>Remaining confirmed balance</Text>
        <Text style={styles.balanceValue}>{formatMoney(remaining)}</Text>
        <Text style={styles.balanceNote}>This payment will stay pending until the other party confirms it.</Text>
      </View>
      <FormInput label="Payment amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
      <FormInput label="Payment date" value={paymentDate} onChangeText={setPaymentDate} placeholder="YYYY-MM-DD" />
      <Text style={styles.fieldLabel}>Payment method</Text>
      <View style={styles.methodRow}>
        {methods.map((item) => (
          <Pressable key={item} onPress={() => setMethod(item)} style={[styles.method, method === item && styles.methodActive]}>
            <Text style={[styles.methodText, method === item && styles.methodTextActive]}>{item.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
      <FormInput label="Notes optional" value={notes} onChangeText={setNotes} multiline style={styles.notes} />
      <PrimaryButton label="Submit for confirmation" onPress={submit} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typography.h1, fontWeight: '900' },
  balance: { padding: spacing.xl, borderRadius: radii.lg, backgroundColor: colors.primary, gap: spacing.sm },
  balanceLabel: { color: '#CBD5E1', fontSize: typography.small, fontWeight: '800' },
  balanceValue: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  balanceNote: { color: '#CBD5E1', fontSize: typography.small, lineHeight: 20 },
  fieldLabel: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  method: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  methodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { color: colors.textMuted, fontSize: typography.small, fontWeight: '800', textTransform: 'capitalize' },
  methodTextActive: { color: '#FFFFFF' },
  notes: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
});
