import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { PaymentCard } from '@/components/PaymentCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressBar } from '@/components/ProgressBar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { SummaryCard } from '@/components/SummaryCard';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { canEditAgreement, getRemainingBalance, getTotalPaid } from '@/utils/agreementRules';
import { formatDate, formatMoney } from '@/utils/money';

export default function AgreementDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agreements, currentUser, payments, timelineEvents, sendAgreementInvite, syncing, syncData, updateAgreementStatus } = useTruvoStore();
  const [sendingInvite, setSendingInvite] = useState(false);
  const [statusAction, setStatusAction] = useState<'active' | 'rejected' | 'cancelled' | null>(null);
  const agreement = agreements.find((item) => item.id === id);

  useEffect(() => {
    void syncData();
  }, [id, syncData]);

  if (!agreement) {
    return (
      <ScreenContainer refreshing={syncing} onRefresh={syncData}>
        <EmptyState
          title={syncing ? 'Loading agreement' : 'Agreement not found'}
          message={syncing ? 'Checking for the latest agreement data.' : 'Pull down to refresh if this agreement was just sent.'}
        />
      </ScreenContainer>
    );
  }

  const isLender = agreement.lenderId === currentUser.id;
  const isBorrower =
    agreement.borrowerId === currentUser.id ||
    agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase();
  if (!isLender && !isBorrower) {
    return (
      <ScreenContainer refreshing={syncing} onRefresh={syncData}>
        <EmptyState title="Agreement not available" message="This agreement is not linked to your account." />
      </ScreenContainer>
    );
  }

  const totalPaid = getTotalPaid(agreement.id, payments);
  const remainingBalance = getRemainingBalance(agreement, payments);
  const currency = currentUser.currency || 'USD';
  const progress = agreement.totalRepaymentAmount > 0 ? Math.min(totalPaid / agreement.totalRepaymentAmount, 1) : 0;
  const agreementPayments = payments.filter((payment) => payment.agreementId === agreement.id);
  const timeline = timelineEvents.filter((event) => event.agreementId === agreement.id);
  const canRespondToPending = agreement.status === 'pending' && isBorrower && !isLender;
  const canManagePending = agreement.status === 'pending' && isLender;
  const resendInvite = async () => {
    try {
      setSendingInvite(true);
      const result = await sendAgreementInvite(agreement.id);
      Alert.alert(result.status === 'sent' ? 'Invite sent' : 'Invite not sent', result.message);
    } catch (error) {
      Alert.alert('Could not send invite', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };
  const updateStatus = async (status: 'active' | 'rejected' | 'cancelled') => {
    try {
      setStatusAction(status);
      await updateAgreementStatus(agreement.id, status);
      if (status === 'rejected') router.replace('/(tabs)/agreements');
    } catch (error) {
      Alert.alert('Could not update agreement', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setStatusAction(null);
    }
  };
  const accept = () => updateStatus('active');
  const reject = () => {
    updateStatus('rejected');
  };

  if (canRespondToPending) {
    return (
      <ScreenContainer refreshing={syncing} onRefresh={syncData}>
        <View style={styles.header}>
          <Text style={styles.title}>Review agreement</Text>
          <StatusBadge status={agreement.status} />
        </View>
        <Text style={styles.cardText}>This agreement was sent to {currentUser.email}. Accept only if the terms match what you agreed with the lender.</Text>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total to repay</Text>
          <Text style={styles.total}>{formatMoney(agreement.totalRepaymentAmount, currency)}</Text>
        </View>
        <View style={styles.summaryGrid}>
          <SummaryCard label="Principal" value={formatMoney(agreement.principalAmount, currency)} />
          <SummaryCard label="Interest" value={formatMoney(agreement.interestAmount, currency)} />
          <SummaryCard label="Payments" value={`${agreement.numberOfPayments} ${agreement.paymentFrequency}`} />
          <SummaryCard label="Due date" value={formatDate(agreement.dueDate)} accent />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Before accepting</Text>
          <Text style={styles.cardText}>If something is wrong, reject this request and ask the lender to create a corrected agreement. Change requests that require lender confirmation will be added as a dedicated workflow.</Text>
        </View>
        <PrimaryButton label="Accept agreement" onPress={accept} loading={statusAction === 'active'} disabled={Boolean(statusAction)} />
        <PrimaryButton label="Reject agreement" variant="outline" onPress={reject} loading={statusAction === 'rejected'} disabled={Boolean(statusAction)} />
        <PrimaryButton label="Request changes" variant="outline" onPress={() => Alert.alert('Request changes', 'For now, reject this agreement and ask the lender to send updated terms.')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={syncing} onRefresh={syncData}>
      <View style={styles.header}>
        <Text style={styles.title}>{agreement.borrowerName || agreement.borrowerEmail || agreement.borrowerPhone}</Text>
        <StatusBadge status={agreement.status} />
      </View>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total agreement</Text>
        <Text style={styles.total}>{formatMoney(agreement.totalRepaymentAmount, currency)}</Text>
        <ProgressBar value={progress} />
      </View>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Total paid" value={formatMoney(totalPaid, currency)} />
        <SummaryCard label="Remaining" value={formatMoney(remainingBalance, currency)} accent />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next payment</Text>
        <Text style={styles.cardText}>{agreement.nextPaymentDate ? formatDate(agreement.nextPaymentDate) : 'No payment scheduled'}</Text>
        <Text style={styles.cardText}>Due date {formatDate(agreement.dueDate)}</Text>
        {agreement.borrowerEmail ? <Text style={styles.cardText}>Borrower {agreement.borrowerEmail}</Text> : null}
      </View>
      {agreement.status === 'active' && isBorrower ? <PrimaryButton label="Register payment" onPress={() => router.push(`/register-payment/${agreement.id}`)} /> : null}
      {canEditAgreement(agreement) && isLender ? <PrimaryButton label="Edit agreement" variant="outline" onPress={() => router.push('/create')} /> : null}
      {canManagePending ? <PrimaryButton label="Resend email invite" onPress={resendInvite} loading={sendingInvite} /> : null}
      {canManagePending ? <PrimaryButton label="Cancel pending agreement" variant="danger" onPress={() => updateStatus('cancelled')} loading={statusAction === 'cancelled'} disabled={Boolean(statusAction)} /> : null}
      {canManagePending ? <PrimaryButton label="Preview borrower request" variant="outline" onPress={() => router.push(`/agreement-request/${agreement.id}`)} /> : null}

      <Text style={styles.sectionTitle}>Payment history</Text>
      {agreementPayments.length === 0 ? <EmptyState title="No payments yet" message="Registered payments will appear here." /> : agreementPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} currency={currency} />)}

      <Text style={styles.sectionTitle}>Timeline</Text>
      {timeline.map((event) => (
        <View key={event.id} style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineText}>
            <Text style={styles.timelineTitle}>{event.title}</Text>
            {event.description ? <Text style={styles.timelineDescription}>{event.description}</Text> : null}
            <Text style={styles.timelineDate}>{formatDate(event.createdAt)}</Text>
          </View>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { flex: 1, color: colors.text, fontSize: typography.h1, fontWeight: '900' },
  totalCard: { padding: spacing.xl, borderRadius: radii.lg, backgroundColor: colors.primary, gap: spacing.md },
  totalLabel: { color: '#CBD5E1', fontSize: typography.small, fontWeight: '800' },
  total: { color: '#FFFFFF', fontSize: 42, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: typography.h3, fontWeight: '900' },
  cardText: { color: colors.textMuted, fontSize: typography.body },
  sectionTitle: { color: colors.text, fontSize: typography.h2, fontWeight: '900' },
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.secondary, marginTop: 5 },
  timelineText: { flex: 1, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  timelineTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  timelineDescription: { color: colors.textMuted, fontSize: typography.small, marginTop: 4, lineHeight: 20 },
  timelineDate: { color: colors.textMuted, fontSize: typography.caption, marginTop: 6, fontWeight: '700' },
});
