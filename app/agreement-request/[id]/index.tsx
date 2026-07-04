import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SummaryCard } from '@/components/SummaryCard';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { formatDate, formatMoney } from '@/utils/money';

export default function AgreementRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agreements, currentUser, updateAgreementStatus } = useTruvoStore();
  const agreement = agreements.find((item) => item.id === id);

  if (!agreement) {
    return (
      <ScreenContainer>
        <EmptyState title="Request not found" message="This agreement request is unavailable." />
      </ScreenContainer>
    );
  }

  const accept = () => {
    updateAgreementStatus(agreement.id, 'active');
    router.replace(`/agreement/${agreement.id}`);
  };

  const reject = () => {
    updateAgreementStatus(agreement.id, 'rejected');
    router.replace('/(tabs)/agreements');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Agreement request</Text>
      <Text style={styles.copy}>{currentUser.name} is viewing the borrower acceptance screen.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Lender</Text>
        <Text style={styles.value}>Alex Morgan</Text>
        <Text style={styles.label}>Payment schedule</Text>
        <Text style={styles.value}>{agreement.numberOfPayments} {agreement.paymentFrequency} payment{agreement.numberOfPayments > 1 ? 's' : ''}</Text>
        <Text style={styles.label}>Due date</Text>
        <Text style={styles.value}>{formatDate(agreement.dueDate)}</Text>
      </View>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Principal" value={formatMoney(agreement.principalAmount)} />
        <SummaryCard label="Interest" value={formatMoney(agreement.interestAmount)} />
        <SummaryCard label="Total repayment" value={formatMoney(agreement.totalRepaymentAmount)} accent />
      </View>
      <PrimaryButton label="Accept agreement" onPress={accept} disabled={agreement.status !== 'pending'} />
      <PrimaryButton label="Reject agreement" variant="outline" onPress={reject} disabled={agreement.status !== 'pending'} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typography.h1, fontWeight: '900' },
  copy: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  card: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: typography.small, fontWeight: '800' },
  value: { color: colors.text, fontSize: typography.h3, fontWeight: '900', marginBottom: spacing.sm },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
