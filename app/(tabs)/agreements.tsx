import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AgreementCard } from '@/components/AgreementCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { getRemainingBalance } from '@/utils/agreementRules';
import { formatMoney } from '@/utils/money';

type Filter = 'All' | 'Receiving' | 'Paying' | 'Pending' | 'Completed' | 'Active';

const filters: { value: Filter; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'All', icon: 'albums-outline', color: colors.textMuted },
  { value: 'Receiving', icon: 'arrow-down-circle-outline', color: colors.secondary },
  { value: 'Paying', icon: 'arrow-up-circle-outline', color: '#F59E0B' },
  { value: 'Pending', icon: 'time-outline', color: colors.info },
  { value: 'Completed', icon: 'checkmark-circle-outline', color: colors.secondary },
  { value: 'Active', icon: 'flash-outline', color: colors.info },
];

export default function AgreementsScreen() {
  const [selected, setSelected] = useState<Filter>('All');
  const { agreements, currentUser, payments, syncing } = useTruvoStore();

  const metrics = useMemo(() => {
    const receive = agreements
      .filter((agreement) => agreement.lenderId === currentUser.id)
      .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
    const pay = agreements
      .filter((agreement) => agreement.borrowerId === currentUser.id || agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase())
      .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
    return { receive, pay, net: receive - pay };
  }, [agreements, currentUser.email, currentUser.id, payments]);

  const filtered = useMemo(() => {
    return agreements.filter((agreement) => {
      if (selected === 'Receiving') return agreement.lenderId === currentUser.id;
      if (selected === 'Paying') return agreement.borrowerId === currentUser.id || agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase();
      if (selected === 'Pending') return agreement.status === 'pending';
      if (selected === 'Completed') return agreement.status === 'completed';
      if (selected === 'Active') return agreement.status === 'active';
      return true;
    });
  }, [agreements, currentUser.email, currentUser.id, selected]);

  const empty = getEmptyState(selected);

  return (
    <ScreenContainer>
      <View>
        <Text style={styles.title}>Agreements</Text>
        <Text style={styles.copy}>Know what is coming in, going out, and waiting for action.</Text>
        {syncing ? <Text style={styles.syncing}>Syncing Supabase data...</Text> : null}
      </View>

      <View style={styles.summaryGrid}>
        <SummaryTile label="You will receive" value={formatMoney(metrics.receive)} icon="arrow-down-circle-outline" tone="receive" />
        <SummaryTile label="You owe" value={formatMoney(metrics.pay)} icon="arrow-up-circle-outline" tone="pay" />
        <SummaryTile label="Net position" value={`${metrics.net >= 0 ? '+' : ''}${formatMoney(metrics.net)}`} icon="analytics-outline" tone="net" wide />
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => (
          <FilterChip
            key={filter.value}
            label={filter.value}
            icon={filter.icon}
            color={filter.color}
            selected={selected === filter.value}
            onPress={() => setSelected(filter.value)}
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <ContextualEmptyState
          icon={empty.icon}
          iconColor={empty.iconColor}
          title={empty.title}
          message={empty.message}
          actionLabel={empty.actionLabel}
          onAction={() => router.push('/create')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((agreement) => (
            <AgreementCard
              key={agreement.id}
              agreement={agreement}
              currentUser={currentUser}
              payments={payments}
              onPress={() => router.push(`/agreement/${agreement.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function getEmptyState(filter: Filter): {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  message: string;
  actionLabel: string;
} {
  if (filter === 'Receiving') {
    return {
      icon: 'arrow-down-circle-outline',
      iconColor: colors.secondary,
      title: 'No money owed to you yet.',
      message: 'Create an agreement when someone needs to repay you.',
      actionLabel: 'Create Agreement',
    };
  }
  if (filter === 'Paying') {
    return {
      icon: 'wallet-outline',
      iconColor: '#F59E0B',
      title: "You don't owe anyone yet.",
      message: 'Agreements where you are the borrower will appear here.',
      actionLabel: 'Create Agreement',
    };
  }
  return {
    icon: filter === 'Pending' ? 'time-outline' : filter === 'Completed' ? 'checkmark-circle-outline' : 'document-text-outline',
    iconColor: filter === 'Pending' ? colors.info : colors.textMuted,
    title: 'No agreements found',
    message: 'Try another filter or create a new agreement request.',
    actionLabel: 'Create Agreement',
  };
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
  wide,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'receive' | 'pay' | 'net';
  wide?: boolean;
}) {
  const toneStyle = tone === 'receive' ? styles.receiveSummary : tone === 'pay' ? styles.paySummary : styles.netSummary;
  const iconColor = tone === 'receive' ? colors.secondary : tone === 'pay' ? '#F59E0B' : '#FFFFFF';
  return (
    <View style={[styles.summaryTile, toneStyle, wide && styles.summaryTileWide]}>
      <View style={styles.summaryTop}>
        <Text style={[styles.summaryLabel, tone === 'net' && styles.netSummaryText]}>{label}</Text>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.summaryValue, tone === 'net' && styles.netSummaryText]}>{value}</Text>
    </View>
  );
}

function FilterChip({
  label,
  icon,
  color,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.filterChip, selected && { backgroundColor: `${color}18`, borderColor: color }]}
    >
      <Ionicons name={icon} size={16} color={selected ? color : colors.textMuted} />
      <Text style={[styles.filterText, selected && { color }]}>{label}</Text>
    </Pressable>
  );
}

function ContextualEmptyState({
  icon,
  iconColor,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={42} color={iconColor} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <PrimaryButton label={actionLabel} onPress={onAction} />
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
  syncing: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryTile: {
    width: '47%',
    minHeight: 118,
    padding: spacing.lg,
    borderRadius: 22,
    gap: spacing.md,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  summaryTileWide: {
    width: '100%',
  },
  receiveSummary: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  paySummary: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  netSummary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    flex: 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  netSummaryText: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '900',
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
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
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
