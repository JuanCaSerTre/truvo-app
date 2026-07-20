import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FilterChip } from '@/components/agreements/FilterChip';
import { PaymentSummaryCard } from '@/components/payments/PaymentSummaryCard';
import { PaymentCard, PaymentCardData } from '@/components/payments/PaymentCard';
import { UpcomingPaymentCard, UpcomingPaymentData } from '@/components/payments/UpcomingPaymentCard';
import { PaymentTimeline, TimelineItem } from '@/components/payments/PaymentTimeline';
import { InsightsCard, Insight } from '@/components/payments/InsightsCard';
import { EmptyStateCard } from '@/components/payments/EmptyStateCard';
import { colors, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { Agreement, Payment } from '@/types/models';
import { getPaymentHealth } from '@/utils/paymentHealth';
import { getRemainingBalance } from '@/utils/agreementRules';
import { frequencyLabel } from '@/utils/dashboard';
import { formatDate, formatMoneyPrecise } from '@/utils/money';
import { getRelativeTime } from '@/utils/notifications';

type Filter = 'All' | 'Pending' | 'Confirmed' | 'Rejected' | 'Today' | 'This Week';

const filterMeta: { value: Filter; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'All', icon: 'albums-outline', color: colors.primary },
  { value: 'Pending', icon: 'hourglass-outline', color: '#B45309' },
  { value: 'Confirmed', icon: 'checkmark-circle-outline', color: colors.secondary },
  { value: 'Rejected', icon: 'close-circle-outline', color: colors.danger },
  { value: 'Today', icon: 'today-outline', color: colors.info },
  { value: 'This Week', icon: 'calendar-outline', color: colors.info },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysUntil = (value: string) => Math.round((startOfDay(new Date(value)) - startOfDay(new Date())) / 86_400_000);
const bucketLabel = (value: string) => {
  const days = daysUntil(value);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return new Date(value).toLocaleDateString('en-US', { weekday: 'long' });
  return 'Later';
};

export default function PaymentsScreen() {
  const { agreements, currentUser, payments, syncing, syncData } = useTruvoStore();
  const currency = currentUser.currency || 'USD';
  const money = (value: number) => formatMoneyPrecise(value, currency);
  const [selected, setSelected] = useState<Filter>('All');

  const isBorrower = (agreement: Agreement) =>
    agreement.borrowerId === currentUser.id || agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase();

  const agreementById = useMemo(() => new Map(agreements.map((a) => [a.id, a])), [agreements]);
  const nameFor = (agreement?: Agreement) => {
    if (!agreement) return 'Agreement';
    return agreement.lenderId === currentUser.id ? agreement.borrowerName || agreement.borrowerEmail || 'Borrower' : 'Lender';
  };

  const myPayments = useMemo(
    () => payments.filter((p) => p.payerId === currentUser.id || p.receiverId === currentUser.id),
    [currentUser.id, payments],
  );

  const payableAgreements = useMemo(
    () => agreements.filter((a) => a.status === 'active' && isBorrower(a)),
    [agreements, currentUser.email, currentUser.id],
  );

  // ---- summary metrics ----
  const metrics = useMemo(() => {
    const now = new Date();
    const pendingForMe = myPayments.filter((p) => p.status === 'pending_confirmation' && p.receiverId === currentUser.id);
    const confirmedThisMonth = myPayments.filter(
      (p) => p.status === 'confirmed' && p.confirmedAt && new Date(p.confirmedAt).getMonth() === now.getMonth() && new Date(p.confirmedAt).getFullYear() === now.getFullYear(),
    );
    const totalPaid = myPayments.filter((p) => p.status === 'confirmed' && p.payerId === currentUser.id).reduce((s, p) => s + p.amount, 0);
    const scheduledCount = payableAgreements.length;
    const confirmedThisMonthAmount = confirmedThisMonth.reduce((s, p) => s + p.amount, 0);
    // average confirmation time (days) across confirmed payments
    const confirmed = myPayments.filter((p) => p.status === 'confirmed' && p.confirmedAt);
    const avgConfirm = confirmed.length
      ? confirmed.reduce((s, p) => s + Math.max(0, (new Date(p.confirmedAt as string).getTime() - new Date(p.createdAt).getTime()) / 86_400_000), 0) / confirmed.length
      : 0;
    return {
      pendingCount: pendingForMe.length,
      scheduledCount,
      confirmedThisMonthCount: confirmedThisMonth.length,
      confirmedThisMonthAmount,
      totalPaid,
      avgConfirm,
    };
  }, [currentUser.id, myPayments, payableAgreements.length]);

  // ---- upcoming (next scheduled installments from active agreements) ----
  const upcoming = useMemo<UpcomingPaymentData[]>(() => {
    const list: (UpcomingPaymentData & { date: string })[] = [];
    agreements
      .filter((a) => a.status === 'active' && (a.lenderId === currentUser.id || isBorrower(a)))
      .forEach((agreement) => {
        const direction: 'Receive' | 'Pay' = agreement.lenderId === currentUser.id ? 'Receive' : 'Pay';
        const schedule = agreement.paymentSchedule?.length
          ? agreement.paymentSchedule
          : agreement.nextPaymentDate
            ? [{ payment_number: 1, due_date: agreement.nextPaymentDate, amount: agreement.numberOfPayments > 0 ? agreement.totalRepaymentAmount / agreement.numberOfPayments : getRemainingBalance(agreement, payments), status: 'scheduled' as const }]
            : [];
        schedule
          .filter((p) => p.status !== 'confirmed' && daysUntil(p.due_date) >= 0)
          .slice(0, 2)
          .forEach((p) => {
            list.push({
              id: `${agreement.id}-${p.payment_number}-${p.due_date}`,
              date: p.due_date,
              person: nameFor(agreement),
              agreementName: nameFor(agreement),
              amount: money(p.amount),
              direction,
              frequency: frequencyLabel(agreement.paymentFrequency),
              bucket: bucketLabel(p.due_date),
              onPress: () => router.push(`/agreement/${agreement.id}`),
            });
          });
      });
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  }, [agreements, currentUser.id, payments]);

  // ---- recent activity (registered payments, most recent first) ----
  const activity = useMemo<TimelineItem[]>(() => {
    return [...myPayments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((p) => {
        const health = getPaymentHealth(p);
        const title = p.status === 'confirmed' ? 'Payment confirmed' : p.status === 'rejected' ? 'Payment rejected' : 'Payment registered';
        return {
          id: p.id,
          icon: health.icon,
          color: health.color,
          tint: health.tint,
          title,
          time: getRelativeTime(p.confirmedAt || p.createdAt),
          agreementName: nameFor(agreementById.get(p.agreementId)),
          amount: money(p.amount),
          onPress: () => router.push(`/payment-confirmation/${p.id}`),
        };
      });
  }, [agreementById, myPayments]);

  // ---- Today's Actions ----
  const todaysActions = useMemo<PaymentCardData[]>(() => {
    const items: PaymentCardData[] = [];
    myPayments
      .filter((p) => p.status === 'pending_confirmation' && p.receiverId === currentUser.id)
      .forEach((p, i) => {
        items.push({
          id: `confirm-${p.id}`,
          person: nameFor(agreementById.get(p.agreementId)),
          agreementName: 'Waiting for your confirmation',
          amount: money(p.amount),
          direction: 'Receive',
          dateLabel: formatDate(p.paymentDate),
          health: getPaymentHealth(p),
          actionLabel: 'Confirm Payment',
          actionIcon: 'checkmark-circle-outline',
          onAction: () => router.push(`/payment-confirmation/${p.id}`),
          index: i,
        });
      });
    return items;
  }, [agreementById, currentUser.id, myPayments]);

  // ---- filtered payment history ----
  const filteredPayments = useMemo<PaymentCardData[]>(() => {
    const matches = (p: Payment) => {
      switch (selected) {
        case 'Pending':
          return p.status === 'pending_confirmation';
        case 'Confirmed':
          return p.status === 'confirmed';
        case 'Rejected':
          return p.status === 'rejected';
        case 'Today':
          return daysUntil(p.paymentDate) === 0;
        case 'This Week': {
          const d = daysUntil(p.paymentDate);
          return d >= 0 && d <= 7;
        }
        default:
          return true;
      }
    };
    return [...myPayments]
      .filter(matches)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p, i) => {
        const direction: 'Receive' | 'Pay' = p.receiverId === currentUser.id ? 'Receive' : 'Pay';
        const canConfirm = p.status === 'pending_confirmation' && p.receiverId === currentUser.id;
        return {
          id: p.id,
          person: nameFor(agreementById.get(p.agreementId)),
          agreementName: p.method.replace(/_/g, ' '),
          amount: money(p.amount),
          direction,
          dateLabel: formatDate(p.paymentDate),
          health: getPaymentHealth(p),
          actionLabel: canConfirm ? 'Confirm Payment' : 'View Details',
          actionIcon: canConfirm ? 'checkmark-circle-outline' : 'arrow-forward-outline',
          onAction: () => router.push(`/payment-confirmation/${p.id}`),
          index: i,
        };
      });
  }, [agreementById, currentUser.id, myPayments, selected]);

  const counts = useMemo(() => {
    const record = {} as Record<Filter, number>;
    filterMeta.forEach(({ value }) => {
      if (value === 'All') record[value] = myPayments.length;
      else if (value === 'Pending') record[value] = myPayments.filter((p) => p.status === 'pending_confirmation').length;
      else if (value === 'Confirmed') record[value] = myPayments.filter((p) => p.status === 'confirmed').length;
      else if (value === 'Rejected') record[value] = myPayments.filter((p) => p.status === 'rejected').length;
      else if (value === 'Today') record[value] = myPayments.filter((p) => daysUntil(p.paymentDate) === 0).length;
      else record[value] = myPayments.filter((p) => daysUntil(p.paymentDate) >= 0 && daysUntil(p.paymentDate) <= 7).length;
    });
    return record;
  }, [myPayments]);

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [
      { id: 'confirmed-month', icon: 'checkmark-done-outline', label: 'Confirmed this month', value: String(metrics.confirmedThisMonthCount) },
      { id: 'confirmed-amount', icon: 'cash-outline', label: 'Total confirmed this month', value: money(metrics.confirmedThisMonthAmount) },
    ];
    if (metrics.avgConfirm > 0) list.push({ id: 'avg', icon: 'time-outline', label: 'Average confirmation time', value: `${metrics.avgConfirm.toFixed(1)} days` });
    if (upcoming[0]) list.push({ id: 'next', icon: 'calendar-outline', label: 'Next payment', value: upcoming[0].bucket });
    return list;
  }, [metrics, upcoming]);

  // ---- dynamic header summary ----
  const headerSummary = useMemo(() => {
    if (metrics.pendingCount > 0) return `You have ${metrics.pendingCount} payment${metrics.pendingCount === 1 ? '' : 's'} waiting for confirmation.`;
    if (upcoming[0]) return `Your next payment is ${upcoming[0].bucket.toLowerCase()}.`;
    return 'Everything is up to date.';
  }, [metrics.pendingCount, upcoming]);

  const hasAnything = myPayments.length > 0 || payableAgreements.length > 0;

  return (
    <ScreenContainer refreshing={syncing} onRefresh={syncData}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.pulse, { backgroundColor: metrics.pendingCount > 0 ? colors.warning : colors.secondary }]} />
          <Text style={styles.summaryText}>{headerSummary}</Text>
        </View>
      </View>

      {!hasAnything ? (
        <EmptyStateCard
          icon="document-text-outline"
          title="No active agreements"
          message="Create your first agreement to begin tracking repayments."
          actionLabel="Create Agreement"
          onAction={() => router.push('/create')}
        />
      ) : (
        <>
          {/* Summary cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryCards}>
            <PaymentSummaryCard icon="hourglass-outline" label="Pending Confirmation" value={metrics.pendingCount} format={String} accent="#B45309" tint="#FEF3C7" />
            <PaymentSummaryCard icon="calendar-outline" label="Scheduled" value={metrics.scheduledCount} format={String} accent={colors.info} tint="#DBEAFE" />
            <PaymentSummaryCard icon="checkmark-done-outline" label="Completed This Month" value={metrics.confirmedThisMonthCount} format={String} accent={colors.secondary} tint="#D1FAE5" />
            <PaymentSummaryCard icon="cash-outline" label="Total Paid" value={metrics.totalPaid} format={money} accent={colors.primary} tint="#E2E8F0" />
          </ScrollView>

          {/* Today's Actions */}
          {todaysActions.length ? (
            <Section title="Today's Actions">
              {todaysActions.map((item) => (
                <PaymentCard key={item.id} data={item} />
              ))}
            </Section>
          ) : null}

          {/* Filters + history */}
          <View style={styles.filterRow}>
            {filterMeta.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.value}
                count={counts[filter.value]}
                icon={filter.icon}
                color={filter.color}
                selected={selected === filter.value}
                onPress={() => setSelected(filter.value)}
              />
            ))}
          </View>

          <Section title="Payment History">
            {filteredPayments.length ? (
              filteredPayments.map((item) => <PaymentCard key={item.id} data={item} />)
            ) : (
              <EmptyStateCard
                icon="hourglass-outline"
                title="Nothing waiting for confirmation"
                message="When someone registers a payment you'll be able to confirm it here."
                actionLabel="View Active Agreements"
                onAction={() => router.push('/(tabs)/agreements')}
              />
            )}
          </Section>

          {/* Upcoming */}
          {upcoming.length ? (
            <Section title="Upcoming Payments">
              {upcoming.map((item) => (
                <UpcomingPaymentCard key={item.id} data={item} />
              ))}
            </Section>
          ) : null}

          {/* Recent activity */}
          {activity.length ? (
            <Section title="Recent Payment Activity">
              <PaymentTimeline items={activity} />
            </Section>
          ) : null}

          {/* Insights */}
          <Section title="Insights">
            <InsightsCard insights={insights} />
          </Section>
        </>
      )}
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  summaryCards: {
    gap: spacing.md,
    paddingVertical: 2,
    paddingRight: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
});
