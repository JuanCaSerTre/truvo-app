import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ActivityTimeline,
  AgreementStatsCard,
  AttentionCard,
  DashboardHeader,
  DashboardSummaryCard,
  InsightCard,
  ProgressWidget,
  QuickActionCard,
  UpcomingPaymentCard,
} from '@/components/DashboardComponents';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { Agreement, User } from '@/types/models';
import { getRemainingBalance, getTotalPaid } from '@/utils/agreementRules';
import { formatDate, formatMoney } from '@/utils/money';
import { getRelativeTime } from '@/utils/notifications';

type AttentionItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  onPress?: () => void;
};

type UpcomingPayment = {
  id: string;
  agreementId: string;
  person: string;
  amount: number;
  date: string;
  direction: 'Receive' | 'Pay';
  status: string;
};

const isSameOrBeforeDay = (value: string, reference: Date) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() <= new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()).getTime();
};

const daysUntil = (value: string) => {
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const date = new Date(value);
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((startDate - startToday) / (24 * 60 * 60 * 1000));
};

const isUserBorrower = (agreement: Agreement, user: User) =>
  agreement.borrowerId === user.id ||
  agreement.borrowerEmail?.toLowerCase() === user.email?.toLowerCase() ||
  agreement.borrowerPhone === user.phone;

const isUserAgreement = (agreement: Agreement, user: User) => agreement.lenderId === user.id || isUserBorrower(agreement, user);

const getCounterpartyName = (agreement: Agreement, user: User, users: User[]) => {
  if (agreement.lenderId === user.id) {
    return agreement.borrowerName || agreement.borrowerEmail || agreement.borrowerPhone || 'Borrower';
  }
  return users.find((item) => item.id === agreement.lenderId)?.name || 'Lender';
};

const statusLabel = (status: string) => status.replace(/_/g, ' ');

export default function HomeDashboard() {
  const { agreements, currentUser, payments, notifications, timelineEvents, users, syncing, syncData } = useTruvoStore();
  const dashboard = useMemo(() => {
    const userAgreements = agreements.filter((agreement) => isUserAgreement(agreement, currentUser));
    const activeAgreements = userAgreements.filter((agreement) => agreement.status === 'active');
    const lenderActive = activeAgreements.filter((agreement) => agreement.lenderId === currentUser.id);
    const borrowerActive = activeAgreements.filter((agreement) => isUserBorrower(agreement, currentUser));
    const toReceive = lenderActive.reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
    const toPay = borrowerActive.reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
    const confirmedReceived = payments
      .filter((payment) => payment.status === 'confirmed' && payment.receiverId === currentUser.id)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const confirmedPaid = payments
      .filter((payment) => payment.status === 'confirmed' && payment.payerId === currentUser.id)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const activeTotal = activeAgreements.reduce((sum, agreement) => sum + agreement.totalRepaymentAmount, 0);
    const activePaid = activeAgreements.reduce((sum, agreement) => sum + getTotalPaid(agreement.id, payments), 0);
    const repaymentProgress = activeTotal > 0 ? (activePaid / activeTotal) * 100 : 0;
    const collectionTotal = lenderActive.reduce((sum, agreement) => sum + agreement.totalRepaymentAmount, 0);
    const collectionPaid = lenderActive.reduce((sum, agreement) => sum + getTotalPaid(agreement.id, payments), 0);
    const collectionRate = collectionTotal > 0 ? Math.round((collectionPaid / collectionTotal) * 100) : 0;
    const confirmedPayments = payments.filter((payment) => payment.status === 'confirmed' && (payment.payerId === currentUser.id || payment.receiverId === currentUser.id));
    const averageWeeklyPayment = confirmedPayments.length
      ? confirmedPayments.reduce((sum, payment) => sum + payment.amount, 0) / confirmedPayments.length
      : 0;

    return {
      userAgreements,
      activeAgreements,
      toReceive,
      toPay,
      netPosition: toReceive - toPay,
      confirmedReceived,
      confirmedPaid,
      collectionRate,
      averageWeeklyPayment,
      repaymentProgress,
      agreementCounts: {
        active: activeAgreements.length,
        pending: userAgreements.filter((agreement) => agreement.status === 'pending').length,
        completed: userAgreements.filter((agreement) => agreement.status === 'completed').length,
        cancelled: userAgreements.filter((agreement) => agreement.status === 'cancelled').length,
      },
    };
  }, [agreements, currentUser, payments]);

  const upcomingPayments = useMemo<UpcomingPayment[]>(() => {
    const today = new Date();
    return dashboard.activeAgreements
      .flatMap((agreement) => {
        const direction: UpcomingPayment['direction'] = agreement.lenderId === currentUser.id ? 'Receive' : 'Pay';
        const person = getCounterpartyName(agreement, currentUser, users);
        const fallbackAmount = agreement.numberOfPayments > 0 ? agreement.totalRepaymentAmount / agreement.numberOfPayments : getRemainingBalance(agreement, payments);
        const schedule = agreement.paymentSchedule?.length
          ? agreement.paymentSchedule
          : agreement.nextPaymentDate
            ? [{ payment_number: 1, due_date: agreement.nextPaymentDate, amount: fallbackAmount, status: 'scheduled' as const }]
            : [];

        return schedule
          .filter((payment) => payment.status !== 'confirmed' && !isSameOrBeforeDay(payment.due_date, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)))
          .map((payment) => ({
            id: `${agreement.id}-${payment.payment_number}-${payment.due_date}`,
            agreementId: agreement.id,
            person,
            amount: payment.amount,
            date: payment.due_date,
            direction,
            status: payment.status,
          }));
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [currentUser, dashboard.activeAgreements, payments, users]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    const pendingAgreement = dashboard.userAgreements.find((agreement) => agreement.status === 'pending' && isUserBorrower(agreement, currentUser) && agreement.lenderId !== currentUser.id);
    if (pendingAgreement) {
      items.push({
        id: `pending-${pendingAgreement.id}`,
        icon: 'document-text-outline',
        title: 'Agreement waiting acceptance',
        description: `${getCounterpartyName(pendingAgreement, currentUser, users)} needs your review.`,
        tone: 'info',
        onPress: () => router.push(`/agreement/${pendingAgreement.id}`),
      });
    }

    const pendingPayment = payments.find((payment) => payment.status === 'pending_confirmation' && payment.receiverId === currentUser.id);
    if (pendingPayment) {
      items.push({
        id: `payment-${pendingPayment.id}`,
        icon: 'hourglass-outline',
        title: 'Payment waiting confirmation',
        description: `${formatMoney(pendingPayment.amount)} is waiting for your confirmation.`,
        tone: 'warning',
        onPress: () => router.push(`/payment-confirmation/${pendingPayment.id}`),
      });
    }

    const dueTomorrow = upcomingPayments.find((payment) => daysUntil(payment.date) === 1);
    if (dueTomorrow) {
      items.push({
        id: `tomorrow-${dueTomorrow.id}`,
        icon: 'calendar-outline',
        title: 'Payment due tomorrow',
        description: `${dueTomorrow.direction} ${formatMoney(dueTomorrow.amount)} with ${dueTomorrow.person}.`,
        tone: 'warning',
        onPress: () => router.push(`/payment-schedule/${dueTomorrow.agreementId}` as never),
      });
    }

    const overdueAgreement = dashboard.activeAgreements.find((agreement) => agreement.nextPaymentDate && daysUntil(agreement.nextPaymentDate) < 0);
    if (overdueAgreement) {
      items.push({
        id: `overdue-${overdueAgreement.id}`,
        icon: 'alarm-outline',
        title: 'Overdue payment',
        description: `${getCounterpartyName(overdueAgreement, currentUser, users)} has a missed scheduled payment.`,
        tone: 'danger',
        onPress: () => router.push(`/payment-schedule/${overdueAgreement.id}` as never),
      });
    }

    const rejectedPayment = payments.find((payment) => payment.status === 'rejected' && (payment.payerId === currentUser.id || payment.receiverId === currentUser.id));
    if (rejectedPayment) {
      items.push({
        id: `rejected-${rejectedPayment.id}`,
        icon: 'alert-circle-outline',
        title: 'Rejected payment',
        description: `${formatMoney(rejectedPayment.amount)} was rejected and needs follow-up.`,
        tone: 'danger',
        onPress: () => router.push(`/payment-confirmation/${rejectedPayment.id}`),
      });
    }

    return items.slice(0, 4);
  }, [currentUser, dashboard.activeAgreements, dashboard.userAgreements, payments, upcomingPayments, users]);

  const recentActivity = useMemo(
    () =>
      timelineEvents
        .filter((event) => dashboard.userAgreements.some((agreement) => agreement.id === event.agreementId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((event) => {
          const tone: AttentionItem['tone'] =
            event.type.includes('rejected') || event.type.includes('cancelled')
              ? 'danger'
              : event.type.includes('payment')
                ? 'success'
                : 'info';
          const icon: keyof typeof Ionicons.glyphMap =
            event.type === 'payment_confirmed'
              ? 'checkmark-circle-outline'
              : event.type === 'payment_rejected'
                ? 'alert-circle-outline'
                : event.type === 'agreement_completed'
                  ? 'ribbon-outline'
                  : event.type === 'agreement_accepted'
                    ? 'shield-checkmark-outline'
                    : 'document-text-outline';

          return {
            id: event.id,
            title: event.title,
            description: event.description || 'Agreement activity updated.',
            time: getRelativeTime(event.createdAt),
            tone,
            icon,
          };
        }),
    [dashboard.userAgreements, timelineEvents],
  );

  if (dashboard.userAgreements.length === 0) {
    return (
      <ScreenContainer refreshing={syncing} onRefresh={syncData}>
        <DashboardHeader name={currentUser.name} unread={notifications.some((item) => item.userId === currentUser.id && !item.read)} onNotifications={() => router.push('/notifications')} />
        <View style={styles.emptyCard}>
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyDocument}>
              <View style={styles.emptyLine} />
              <View style={styles.emptyLineShort} />
              <View style={styles.emptyAmount} />
            </View>
            <View style={styles.emptyBadge}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>No agreements yet.</Text>
          <Text style={styles.emptyText}>Create your first agreement and start tracking repayments with confidence.</Text>
          <PrimaryButton label="Create Agreement" onPress={() => router.push('/create')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={syncing} onRefresh={syncData}>
      <DashboardHeader name={currentUser.name} unread={notifications.some((item) => item.userId === currentUser.id && !item.read)} onNotifications={() => router.push('/notifications')} />

      <DashboardSummaryCard
        toReceive={formatMoney(dashboard.toReceive)}
        toPay={formatMoney(dashboard.toPay)}
        netPosition={formatMoney(dashboard.netPosition)}
      />

      <View style={styles.quickActionsGrid}>
        <QuickActionCard icon="add-circle-outline" label="New Agreement" tone="success" onPress={() => router.push('/create')} />
        <QuickActionCard icon="cash-outline" label="Register Payment" tone="info" onPress={() => router.push('/(tabs)/payments')} />
        <QuickActionCard icon="documents-outline" label="View Agreements" tone="neutral" onPress={() => router.push('/(tabs)/agreements')} />
        <QuickActionCard icon="person-add-outline" label="Invite Friend" tone="warning" onPress={() => router.push('/invite-contact')} />
      </View>

      <DashboardSection title="Needs Your Attention">
        {attentionItems.length ? (
          attentionItems.map((item) => (
            <AttentionCard key={item.id} icon={item.icon} title={item.title} description={item.description} tone={item.tone} onPress={item.onPress} />
          ))
        ) : (
          <View style={styles.allGoodCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.secondary} />
            <Text style={styles.allGoodText}>Everything is up to date.</Text>
          </View>
        )}
      </DashboardSection>

      <DashboardSection title="Upcoming Payments">
        {upcomingPayments.length ? (
          upcomingPayments.map((payment) => (
            <UpcomingPaymentCard
              key={payment.id}
              person={payment.person}
              amount={formatMoney(payment.amount)}
              date={formatDate(payment.date)}
              direction={payment.direction}
              status={statusLabel(payment.status)}
              onPress={() => router.push(`/agreement/${payment.agreementId}`)}
            />
          ))
        ) : (
          <View style={styles.allGoodCard}>
            <Ionicons name="calendar-clear-outline" size={22} color={colors.textMuted} />
            <Text style={styles.allGoodText}>No scheduled payments are coming up.</Text>
          </View>
        )}
      </DashboardSection>

      <DashboardSection title="Agreement Overview">
        <View style={styles.cardGrid}>
          <AgreementStatsCard label="Active Agreements" value={String(dashboard.agreementCounts.active)} tone="success" />
          <AgreementStatsCard label="Pending Agreements" value={String(dashboard.agreementCounts.pending)} tone="warning" />
          <AgreementStatsCard label="Completed Agreements" value={String(dashboard.agreementCounts.completed)} tone="info" />
          <AgreementStatsCard label="Cancelled Agreements" value={String(dashboard.agreementCounts.cancelled)} tone="danger" />
        </View>
      </DashboardSection>

      <ProgressWidget
        percent={dashboard.repaymentProgress}
        message={`${Math.round(dashboard.repaymentProgress)}% of active agreements have been repaid.`}
      />

      <DashboardSection title="Financial Insights">
        <View style={styles.cardGrid}>
          <InsightCard label="You have received" value={formatMoney(dashboard.confirmedReceived)} tone="success" />
          <InsightCard label="You have paid" value={formatMoney(dashboard.confirmedPaid)} tone="warning" />
          <InsightCard label="Collection Rate" value={`${dashboard.collectionRate}%`} tone="info" />
          <InsightCard label="Average Weekly Payment" value={formatMoney(dashboard.averageWeeklyPayment)} tone="neutral" />
        </View>
      </DashboardSection>

      <DashboardSection title="Recent Activity">
        <ActivityTimeline events={recentActivity} />
      </DashboardSection>
    </ScreenContainer>
  );
}

function DashboardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  sectionBody: {
    gap: spacing.md,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  allGoodCard: {
    minHeight: 72,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  allGoodText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: '800',
  },
  emptyCard: {
    flex: 1,
    minHeight: 520,
    padding: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  emptyIllustration: {
    width: 152,
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDocument: {
    width: 104,
    height: 126,
    borderRadius: 26,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptyLine: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#CBD5E1',
  },
  emptyLineShort: {
    width: '72%',
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#E2E8F0',
  },
  emptyAmount: {
    width: 52,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: '#D1FAE5',
  },
  emptyBadge: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
});
