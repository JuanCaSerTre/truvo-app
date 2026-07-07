import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
  const { agreements, currentUser, syncing, syncData, updateAgreementStatus, users } = useTruvoStore();
  const [statusAction, setStatusAction] = useState<'active' | 'rejected' | null>(null);
  const agreement = agreements.find((item) => item.id === id);

  useEffect(() => {
    void syncData();
  }, [id, syncData]);

  if (!agreement) {
    return (
      <ScreenContainer refreshing={syncing} onRefresh={syncData}>
        <EmptyState
          title={syncing ? 'Loading request' : 'Request not found'}
          message={syncing ? 'Checking for the latest agreement request.' : 'Pull down to refresh if this invite was just sent.'}
        />
      </ScreenContainer>
    );
  }

  const accept = async () => {
    try {
      setStatusAction('active');
      await updateAgreementStatus(agreement.id, 'active');
      router.replace(`/agreement/${agreement.id}`);
    } catch (error) {
      Alert.alert('Could not accept agreement', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setStatusAction(null);
    }
  };

  const reject = async () => {
    try {
      setStatusAction('rejected');
      await updateAgreementStatus(agreement.id, 'rejected');
      router.replace('/(tabs)/agreements');
    } catch (error) {
      Alert.alert('Could not reject agreement', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setStatusAction(null);
    }
  };
  const canRespond =
    agreement.borrowerId === currentUser.id ||
    agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
    agreement.borrowerPhone === currentUser.phone;
  const isLender = agreement.lenderId === currentUser.id;
  if (!canRespond && !isLender) {
    return (
      <ScreenContainer refreshing={syncing} onRefresh={syncData}>
        <EmptyState title="Request not available" message="This agreement request is not linked to your account." />
      </ScreenContainer>
    );
  }

  const lender = users.find((user) => user.id === agreement.lenderId);
  const currency = currentUser.currency || 'USD';

  return (
    <ScreenContainer refreshing={syncing} onRefresh={syncData}>
      <Text style={styles.title}>Agreement request</Text>
      <Text style={styles.copy}>
        {canRespond ? `${currentUser.name} can accept or reject this request.` : `This request is assigned to ${agreement.borrowerEmail || agreement.borrowerPhone}.`}
      </Text>
      <View style={styles.card}>
        <Text style={styles.label}>Lender</Text>
        <Text style={styles.value}>{lender?.name || 'Lender'}</Text>
        <Text style={styles.label}>Payment schedule</Text>
        <Text style={styles.value}>{agreement.numberOfPayments} {agreement.paymentFrequency} payment{agreement.numberOfPayments > 1 ? 's' : ''}</Text>
        <Text style={styles.label}>Due date</Text>
        <Text style={styles.value}>{formatDate(agreement.dueDate)}</Text>
      </View>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Principal" value={formatMoney(agreement.principalAmount, currency)} />
        <SummaryCard label="Interest" value={formatMoney(agreement.interestAmount, currency)} />
        <SummaryCard label="Total repayment" value={formatMoney(agreement.totalRepaymentAmount, currency)} accent />
      </View>
      <PrimaryButton label="Accept agreement" onPress={accept} loading={statusAction === 'active'} disabled={agreement.status !== 'pending' || !canRespond || Boolean(statusAction)} />
      <PrimaryButton label="Reject agreement" variant="outline" onPress={reject} loading={statusAction === 'rejected'} disabled={agreement.status !== 'pending' || !canRespond || Boolean(statusAction)} />
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
