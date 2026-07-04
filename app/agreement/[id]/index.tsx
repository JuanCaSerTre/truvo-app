import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  const { agreements, payments, timelineEvents, updateAgreementStatus } = useTruvoStore();
  const agreement = agreements.find((item) => item.id === id);

  if (!agreement) {
    return (
      <ScreenContainer>
        <EmptyState title="Agreement not found" message="This agreement may have moved or is no longer available." />
      </ScreenContainer>
    );
  }

  const totalPaid = getTotalPaid(agreement.id, payments);
  const remainingBalance = getRemainingBalance(agreement, payments);
  const progress = agreement.totalRepaymentAmount > 0 ? Math.min(totalPaid / agreement.totalRepaymentAmount, 1) : 0;
  const agreementPayments = payments.filter((payment) => payment.agreementId === agreement.id);
  const timeline = timelineEvents.filter((event) => event.agreementId === agreement.id);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{agreement.borrowerName || agreement.borrowerEmail || agreement.borrowerPhone}</Text>
        <StatusBadge status={agreement.status} />
      </View>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total agreement</Text>
        <Text style={styles.total}>{formatMoney(agreement.totalRepaymentAmount)}</Text>
        <ProgressBar value={progress} />
      </View>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Total paid" value={formatMoney(totalPaid)} />
        <SummaryCard label="Remaining" value={formatMoney(remainingBalance)} accent />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next payment</Text>
        <Text style={styles.cardText}>{agreement.nextPaymentDate ? formatDate(agreement.nextPaymentDate) : 'No payment scheduled'}</Text>
        <Text style={styles.cardText}>Due date {formatDate(agreement.dueDate)}</Text>
        {agreement.borrowerEmail ? <Text style={styles.cardText}>Borrower {agreement.borrowerEmail}</Text> : null}
      </View>
      <PrimaryButton label="Register payment" onPress={() => router.push(`/register-payment/${agreement.id}`)} disabled={agreement.status !== 'active'} />
      {canEditAgreement(agreement) ? <PrimaryButton label="Edit agreement" variant="outline" onPress={() => router.push('/create')} /> : null}
      {agreement.status === 'pending' ? <PrimaryButton label="Cancel pending agreement" variant="danger" onPress={() => updateAgreementStatus(agreement.id, 'cancelled')} /> : null}
      {agreement.status === 'pending' ? <PrimaryButton label="Preview borrower request" variant="outline" onPress={() => router.push(`/agreement-request/${agreement.id}`)} /> : null}

      <Text style={styles.sectionTitle}>Payment history</Text>
      {agreementPayments.length === 0 ? <EmptyState title="No payments yet" message="Registered payments will appear here." /> : agreementPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)}

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
