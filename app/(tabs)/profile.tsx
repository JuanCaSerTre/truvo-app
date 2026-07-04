import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { authService } from '@/services/authService';
import { ContactPreference, UserProfileInput, UserRolePreference } from '@/types/models';
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
  const { currentUser, agreements, payments, updateCurrentUserProfile, clearUserSessionData } = useTruvoStore();
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfileInput>({
    name: currentUser.name,
    phone: currentUser.phone,
    country: currentUser.country || '',
    currency: currentUser.currency || 'USD',
    timezone: currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    contactPreference: currentUser.contactPreference || 'email',
    userRole: currentUser.userRole || 'both',
  });

  const displayContact = currentUser.email || currentUser.phone || 'No email added';
  const profileDetails = [currentUser.country, currentUser.currency, currentUser.timezone].filter(Boolean).join(' · ');
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
          description: 'Name, email, optional phone, and profile preferences',
          onPress: () => {
            setProfileForm({
              name: currentUser.name,
              phone: currentUser.phone,
              country: currentUser.country || '',
              currency: currentUser.currency || 'USD',
              timezone: currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              contactPreference: currentUser.contactPreference || 'email',
              userRole: currentUser.userRole || 'both',
            });
            setEditProfileVisible(true);
          },
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          description: 'Push alerts, reminders, and activity preferences',
          onPress: () => router.push('/notification-settings' as never),
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

  const updateProfileField = <Key extends keyof UserProfileInput>(key: Key, value: UserProfileInput[Key]) => {
    setProfileForm((form) => ({ ...form, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (profileForm.name.trim().length < 2) {
      Alert.alert('Enter your full name');
      return;
    }
    if (profileForm.phone?.trim() && profileForm.phone.replace(/\D/g, '').length < 7) {
      Alert.alert('Check phone number', 'Use a valid phone number or leave it blank.');
      return;
    }
    if (profileForm.currency?.trim() && profileForm.currency.trim().length !== 3) {
      Alert.alert('Check currency', 'Use a 3-letter code like USD, COP, or AUD.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateCurrentUserProfile(profileForm);
      setEditProfileVisible(false);
    } catch (error) {
      Alert.alert('Could not update profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingProfile(false);
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
              <Ionicons name="mail-outline" size={15} color={colors.textMuted} />
              <Text style={styles.contactText}>{displayContact}</Text>
            </View>
            {profileDetails ? <Text style={styles.profileDetails}>{profileDetails}</Text> : null}
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

      <Modal
        animationType="slide"
        transparent
        visible={editProfileVisible}
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.profileModalCard}>
            <View style={styles.profileModalHeader}>
              <View style={styles.profileModalTitleWrap}>
                <Text style={styles.modalTitle}>Personal details</Text>
                <Text style={styles.modalMessage}>Email stays as the main account identifier.</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setEditProfileVisible(false)} style={styles.iconButton}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.profileForm} showsVerticalScrollIndicator={false}>
              <FormInput label="Full name" value={profileForm.name} onChangeText={(value) => updateProfileField('name', value)} autoCapitalize="words" />
              <FormInput label="Email" value={currentUser.email || ''} editable={false} autoCapitalize="none" keyboardType="email-address" />
              <FormInput label="Phone optional" value={profileForm.phone || ''} onChangeText={(value) => updateProfileField('phone', value)} keyboardType="phone-pad" placeholder="+1 555 0123" />
              <FormInput label="Country" value={profileForm.country || ''} onChangeText={(value) => updateProfileField('country', value)} placeholder="United States" />
              <FormInput label="Currency" value={profileForm.currency || ''} onChangeText={(value) => updateProfileField('currency', value.toUpperCase())} placeholder="USD" autoCapitalize="characters" maxLength={3} />
              <FormInput label="Timezone" value={profileForm.timezone || ''} onChangeText={(value) => updateProfileField('timezone', value)} placeholder="America/New_York" autoCapitalize="none" />

              <OptionGroup title="Preferred contact" options={contactOptions} value={profileForm.contactPreference || 'email'} onChange={(value) => updateProfileField('contactPreference', value)} />
              <OptionGroup title="TRUVO usage" options={roleOptions} value={profileForm.userRole || 'both'} onChange={(value) => updateProfileField('userRole', value)} />
            </ScrollView>
            <View style={styles.profileModalActions}>
              <PrimaryButton label="Cancel" variant="outline" onPress={() => setEditProfileVisible(false)} style={styles.footerButton} />
              <PrimaryButton label="Save profile" onPress={handleSaveProfile} loading={savingProfile} style={styles.footerButton} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const contactOptions: { value: ContactPreference; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const roleOptions: { value: UserRolePreference; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'lender', label: 'Lender' },
  { value: 'borrower', label: 'Borrower' },
];

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

function OptionGroup<Value extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            style={[styles.optionButton, value === option.value && styles.optionButtonActive]}
          >
            <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>{option.label}</Text>
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
  contactText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '600',
  },
  profileDetails: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
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
  profileModalCard: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  profileModalTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  profileForm: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  optionTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '900',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  profileModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
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
