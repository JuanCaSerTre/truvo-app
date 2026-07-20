import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AgreementCard } from '@/components/AgreementCard';
import { FilterChip } from '@/components/agreements/FilterChip';
import { FinancialSummaryCard } from '@/components/agreements/FinancialSummaryCard';
import { RecentActivityCard, ActivityItem } from '@/components/agreements/RecentActivityCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { Agreement } from '@/types/models';
import { getAgreementHealth } from '@/utils/agreementHealth';
import { getRemainingBalance } from '@/utils/agreementRules';
import { formatMoneyPrecise } from '@/utils/money';
import { getRelativeTime } from '@/utils/notifications';

type Filter = 'All' | 'Receiving' | 'Paying' | 'Active' | 'Pending' | 'Completed';

const filterMeta: { value: Filter; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'All', icon: 'albums-outline', color: colors.primary },
  { value: 'Receiving', icon: 'arrow-down-circle-outline', color: colors.secondary },
  { value: 'Paying', icon: 'arrow-up-circle-outline', color: '#F59E0B' },
  { value: 'Active', icon: 'flash-outline', color: colors.info },
  { value: 'Pending', icon: 'time-outline', color: '#B45309' },
  { value: 'Completed', icon: 'checkmark-circle-outline', color: colors.secondary },
];

export default function AgreementsScreen() {
  const [selected, setSelected] = useState<Filter>('All');
  const { agreements, currentUser, payments, timelineEvents, syncing, syncData } = useTruvoStore();
  const currency = currentUser.currency || 'USD';
  const money = (value: number) => formatMoneyPrecise(value, currency);

  useEffect(() => {
    void syncData();
  }, [syncData]);

  const isBorrower = (agreement: Agreement) =>
    agreement.borrowerId === currentUser.id || agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase();
  const isLender = (agreement: Agreement) => agreement.lenderId === currentUser.id;

  const userAgreements = useMemo(
    () => agreements.filter((agreement) => isLender(agreement) || isBorrower(agreement)),
    [agreements, currentUser.email, currentUser.id],
  );

  const matchesFilter = (agreement: Agreement, filter: Filter) => {
    switch (filter) {
      case 'Receiving':
        return isLender(agreement) && (agreement.status === 'pending' || agreement.status === 'active');
      case 'Paying':
        return isBorrower(agreement) && (agreement.status === 'pending' || agreement.status === 'active');
      case 'Active':
        return agreement.status === 'active';
      case 'Pending':
        return agreement.status === 'pending';
      case 'Completed':
        return agreement.status === 'completed';
      default:
        return true;
    }
  };

  const counts = useMemo(() => {
    const record = {} as Record<Filter, number>;
    filterMeta.forEach(({ value }) => {
      record[value] = userAgreements.filter((agreement) => matchesFilter(agreement, value)).length;
    });
    return record;
  }, [userAgreements]);

  const metrics = useMemo(() => {
    const receive = userAgreements
      .filter(isLender)
      .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
    const pay = userAgreements
      .filter(isBorrower)
      .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
    const activeCount = userAgreements.filter((agreement) => agreement.status === 'active').length;
    const attentionCount = userAgreements.filter((agreement) => {
      const health = getAgreementHealth(agreement, payments).state;
      return health === 'overdue' || health === 'awaiting' || health === 'due_soon';
    }).length;
    return { receive, pay, net: receive - pay, activeCount, attentionCount };
  }, [currentUser.email, currentUser.id, payments, userAgreements]);

  const filtered = useMemo(
    () => userAgreements.filter((agreement) => matchesFilter(agreement, selected)),
    [selected, userAgreements],
  );

  const activity = useMemo<ActivityItem[]>(() => {
    const byId = new Map(userAgreements.map((agreement) => [agreement.id, agreement]));
    return timelineEvents
      .filter((event) => byId.has(event.agreementId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map((event) => {
        const agreement = byId.get(event.agreementId);
        const name = agreement
          ? agreement.lenderId === currentUser.id
            ? agreement.borrowerName || agreement.borrowerEmail || 'Borrower'
            : 'Lender'
          : 'Agreement';
        const isDanger = event.type.includes('rejected') || event.type.includes('cancelled');
        const isPayment = event.type.includes('payment');
        const color = isDanger ? colors.danger : isPayment ? colors.secondary : colors.info;
        const tint = isDanger ? '#FEE2E2' : isPayment ? '#D1FAE5' : '#DBEAFE';
        const icon: keyof typeof Ionicons.glyphMap =
          event.type === 'payment_confirmed'
            ? 'checkmark-circle'
            : event.type === 'payment_rejected'
              ? 'close-circle'
              : event.type === 'agreement_completed'
                ? 'ribbon'
                : event.type === 'agreement_accepted'
                  ? 'shield-checkmark'
                  : 'document-text';
        return {
          id: event.id,
          icon,
          color,
          tint,
          title: event.title,
          time: getRelativeTime(event.createdAt),
          agreementName: name,
          onPress: () => router.push(`/agreement/${event.agreementId}`),
        };
      });
  }, [currentUser.id, timelineEvents, userAgreements]);

  return (
    <ScreenContainer refreshing={syncing} onRefresh={syncData}>
      <View>
        <Text style={styles.title}>Agreements</Text>
        <Text style={styles.copy}>Your control center for every financial relationship.</Text>
      </View>

      {userAgreements.length === 0 ? (
        <EmptyState onAction={() => router.push('/create')} />
      ) : (
        <>
          <FinancialSummaryCard
            receive={metrics.receive}
            pay={metrics.pay}
            net={metrics.net}
            activeCount={metrics.activeCount}
            attentionCount={metrics.attentionCount}
            format={money}
          />

          {activity.length ? (
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <RecentActivityCard items={activity} />
            </View>
          ) : null}

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

          {filtered.length === 0 ? (
            <FilteredEmptyState filter={selected} onAction={() => router.push('/create')} />
          ) : (
            <View style={styles.list}>
              {filtered.map((agreement, index) => (
                <AgreementCard
                  key={agreement.id}
                  agreement={agreement}
                  currentUser={currentUser}
                  payments={payments}
                  currency={currency}
                  index={index}
                  onPress={() => router.push(`/agreement/${agreement.id}`)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyDoc}>
          <View style={styles.emptyLine} />
          <View style={styles.emptyLineShort} />
          <View style={styles.emptyAmount} />
        </View>
        <View style={styles.emptyBadge}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No agreements yet.</Text>
      <Text style={styles.emptyMessage}>Create your first agreement and start tracking repayments with complete transparency.</Text>
      <PrimaryButton label="Create Agreement" onPress={onAction} />
    </View>
  );
}

function FilteredEmptyState({ filter, onAction }: { filter: Filter; onAction: () => void }) {
  const icon: keyof typeof Ionicons.glyphMap =
    filter === 'Receiving' ? 'arrow-down-circle-outline' : filter === 'Paying' ? 'wallet-outline' : filter === 'Completed' ? 'checkmark-circle-outline' : 'time-outline';
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={38} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyMessage}>No agreements match the “{filter}” filter. Try another filter or create a new agreement.</Text>
      <PrimaryButton label="Create Agreement" onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  copy: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  activitySection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIllustration: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDoc: {
    width: 92,
    height: 112,
    borderRadius: 22,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptyLine: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  emptyLineShort: {
    width: '70%',
    height: 9,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  emptyAmount: {
    width: 48,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  emptyBadge: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.background,
  },
  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyMessage: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
