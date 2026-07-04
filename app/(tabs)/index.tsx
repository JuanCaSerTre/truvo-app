import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AgreementCard } from '@/components/AgreementCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SummaryCard } from '@/components/SummaryCard';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { getRemainingBalance } from '@/utils/agreementRules';
import { formatMoney } from '@/utils/money';

export default function HomeDashboard() {
  const { agreements, currentUser, payments, notifications } = useTruvoStore();
  const userNotifications = notifications.filter((notification) => notification.userId === currentUser.id);
  const active = agreements.filter(
    (agreement) =>
      agreement.status === 'active' &&
      (agreement.lenderId === currentUser.id ||
        agreement.borrowerId === currentUser.id ||
        agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
        agreement.borrowerPhone === currentUser.phone),
  );
  const toReceive = active
    .filter((agreement) => agreement.lenderId === currentUser.id)
    .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
  const toPay = active
    .filter(
      (agreement) =>
        agreement.borrowerId === currentUser.id ||
        agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
        agreement.borrowerPhone === currentUser.phone,
    )
    .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
  const pendingConfirmations = payments.filter((payment) => payment.status === 'pending_confirmation' && payment.receiverId === currentUser.id).length;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {currentUser.name.split(' ')[0]}</Text>
          <Text style={styles.title}>Your trust ledger</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          {userNotifications.some((item) => !item.read) ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard label="To receive" value={formatMoney(toReceive)} accent />
        <SummaryCard label="To pay" value={formatMoney(toPay)} />
        <SummaryCard label="Active agreements" value={String(active.length)} />
        <SummaryCard label="Pending confirmations" value={String(pendingConfirmations)} />
      </View>

      <View style={styles.quickActions}>
        <PrimaryButton label="New agreement" onPress={() => router.push('/create')} />
        <PrimaryButton label="Register payment" variant="outline" onPress={() => router.push('/(tabs)/payments')} />
        <PrimaryButton label="Invite contact" variant="secondary" onPress={() => router.push('/invite-contact')} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Needs attention</Text>
        <Text style={styles.sectionMeta}>{pendingConfirmations} pending</Text>
      </View>
      {active.slice(0, 2).map((agreement) => (
        <AgreementCard
          key={agreement.id}
          agreement={agreement}
          currentUser={currentUser}
          payments={payments}
          onPress={() => router.push(`/agreement/${agreement.id}`)}
        />
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActions: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
});
