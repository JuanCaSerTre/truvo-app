import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { authService } from '@/services/authService';
import { getRemainingBalance } from '@/utils/agreementRules';
import { formatMoney } from '@/utils/money';

const legal =
  'TRUVO does not provide loans or financial services. TRUVO only provides tools to record and track agreements between individuals. Users are responsible for their own agreements.';

type SettingRow = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
};

type SettingSection = {
  title: string;
  rows: SettingRow[];
};

export default function ProfileScreen() {
  const { currentUser, agreements, payments, clearUserSessionData } = useTruvoStore();
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayContact = currentUser.phone || currentUser.email || 'No phone number added';
  const isPremium = currentUser.subscription_status !== 'free';
  const subscriptionLabel =
    currentUser.subscription_status === 'premium_yearly'
      ? 'Premium yearly'
      : currentUser.subscription_status === 'premium_monthly'
        ? 'Premium monthly'
        : 'Free plan';
  const activeAgreements = agreements.filter((agreement) => agreement.status === 'active');
  const currentUserAgreements = activeAgreements.filter(
    (agreement) =>
      agreement.lenderId === currentUser.id ||
      agreement.borrowerId === currentUser.id ||
      agreement.borrowerPhone === currentUser.phone ||
      agreement.borrowerEmail === currentUser.email,
  );
  const moneyToReceive = activeAgreements
    .filter((agreement) => agreement.lenderId === currentUser.id)
    .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
  const moneyToPay = activeAgreements
    .filter(
      (agreement) =>
        agreement.borrowerId === currentUser.id ||
        agreement.borrowerPhone === currentUser.phone ||
        agreement.borrowerEmail === currentUser.email,
    )
    .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
  const pendingConfirmations = payments.filter((payment) => {
    if (payment.status !== 'pending_confirmation') return false;
    const agreement = agreements.find((item) => item.id === payment.agreementId);
    return payment.payerId === currentUser.id || payment.receiverId === currentUser.id || agreement?.lenderId === currentUser.id;
  }).length;

  const settingSections: SettingSection[] = [
    {
      title: 'Account',
      rows: [
        {
          icon: 'person-circle-outline',
          title: 'Personal details',
          description: 'Name, phone number, and profile information',
          onPress: () => Alert.alert('Personal details', 'Profile editing will be added in a future step.'),
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          description: 'Agreement updates and payment confirmations',
          onPress: () => router.push('/notifications'),
        },
      ],
    },
    {
      title: 'Subscription',
      rows: [
        {
          icon: 'diamond-outline',
          title: 'Premium plan',
          description: isPremium ? 'Manage your active TRUVO Premium benefits' : 'Upgrade for higher limits and premium tools',
          onPress: () => router.push('/premium'),
        },
      ],
    },
    {
      title: 'Legal',
      rows: [
        {
          icon: 'document-text-outline',
          title: 'Legal disclaimer',
          description: 'Review how TRUVO supports personal agreements',
          onPress: () => Alert.alert('Legal disclaimer', legal),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          icon: 'help-circle-outline',
          title: 'Help and support',
          description: 'Get help with agreements, payments, and your account',
          onPress: () => Alert.alert('Support', 'Support options will be added in a future step.'),
        },
      ],
    },
  ];

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.signOut();
      clearUserSessionData();
      setConfirmLogoutVisible(false);
      router.replace('/(auth)/welcome');
    } catch (error) {
      Alert.alert('Log out failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          {currentUser.avatarUrl ? (
            <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{currentUser.name}</Text>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={15} color={colors.textMuted} />
              <Text style={styles.phone}>{displayContact}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <View style={styles.premiumBadge}>
            <Ionicons name={isPremium ? 'sparkles' : 'shield-checkmark-outline'} size={14} color={isPremium ? colors.secondary : colors.textMuted} />
            <Text style={[styles.premiumBadgeText, isPremium && styles.premiumBadgeTextActive]}>
              {isPremium ? 'Premium' : 'Protected'}
            </Text>
          </View>
          <StatusBadge status={currentUser.subscription_status} />
        </View>
        <Text style={styles.subscriptionText}>{subscriptionLabel}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Account summary</Text>
            <Text style={styles.summaryTitle}>Your TRUVO activity</Text>
          </View>
          <View style={styles.summaryIcon}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.secondary} />
          </View>
        </View>
        <View style={styles.metricGrid}>
          <MetricTile label="Active agreements" value={String(currentUserAgreements.length)} />
          <MetricTile label="To receive" value={formatMoney(moneyToReceive)} highlight />
          <MetricTile label="To pay" value={formatMoney(moneyToPay)} />
          <MetricTile label="Pending confirmations" value={String(pendingConfirmations)} />
        </View>
      </View>

      {settingSections.map((section) => (
        <SettingsSection key={section.title} section={section} />
      ))}

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={loggingOut}
          onPress={() => setConfirmLogoutVisible(true)}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={confirmLogoutVisible}
        onRequestClose={() => setConfirmLogoutVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={loggingOut}
                onPress={() => setConfirmLogoutVisible(false)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={loggingOut}
                onPress={handleConfirmLogout}
                style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              >
                <Text style={styles.confirmText}>{loggingOut ? 'Logging out...' : 'Log Out'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function MetricTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.metricTile, highlight && styles.metricTileHighlight]}>
      <Text style={[styles.metricValue, highlight && styles.metricValueHighlight]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SettingsSection({ section }: { section: SettingSection }) {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.settingsCard}>
        {section.rows.map((row, index) => (
          <Pressable
            key={row.title}
            accessibilityRole="button"
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.settingRow,
              index < section.rows.length - 1 && styles.settingRowBorder,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.settingIcon}>
              <Ionicons name={row.icon} size={21} color={colors.primary} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>{row.title}</Text>
              <Text style={styles.settingDescription}>{row.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phone: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '600',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  premiumBadge: {
    minHeight: 30,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F1F5F9',
  },
  premiumBadgeText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  premiumBadgeTextActive: {
    color: colors.secondary,
  },
  subscriptionText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    gap: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionEyebrow: {
    color: '#A7F3D0',
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: typography.h3,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricTile: {
    width: '48%',
    minHeight: 82,
    borderRadius: radii.md,
    padding: spacing.md,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  metricTileHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(16, 185, 129, 0.34)',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: typography.h3,
    fontWeight: '900',
  },
  metricValueHighlight: {
    color: '#A7F3D0',
  },
  metricLabel: {
    color: '#CBD5E1',
    fontSize: typography.caption,
    lineHeight: 16,
    fontWeight: '700',
  },
  settingsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  settingsCard: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    minHeight: 76,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  settingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  settingTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '600',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.xl,
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  modalMessage: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
});
