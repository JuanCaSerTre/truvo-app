import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IdentityCard } from '@/components/profile/IdentityCard';
import { TrustCenterCard } from '@/components/profile/TrustCenterCard';
import { AccountSummaryCard, SummaryMetric } from '@/components/profile/AccountSummaryCard';
import { AccountHealthCard, HealthRow } from '@/components/profile/AccountHealthCard';
import { PremiumCard } from '@/components/profile/PremiumCard';
import { SettingsSection, SettingsRow } from '@/components/profile/SettingsSection';
import { DangerZone } from '@/components/profile/DangerZone';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { authService } from '@/services/authService';
import { ContactPreference, UserProfileInput, UserRolePreference } from '@/types/models';
import { getRemainingBalance } from '@/utils/agreementRules';
import { userSafeMessage } from '@/utils/errors';
import { formatMoney } from '@/utils/money';
import { profileCompletion, trustIndicators, trustScore } from '@/utils/profileTrust';

const legal =
  'TRUVO does not provide loans or financial services. TRUVO only provides tools to record and track agreements between individuals. Users are responsible for their own agreements.';
const APP_VERSION = '1.0.0';

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

  const currency = currentUser.currency || 'USD';
  const isPremium = currentUser.subscription_status !== 'free';
  const subscriptionLabel =
    currentUser.subscription_status === 'premium_yearly'
      ? 'Premium Yearly'
      : currentUser.subscription_status === 'premium_monthly'
        ? 'Premium Monthly'
        : 'Free Plan';

  const memberSince = useMemo(() => {
    const d = currentUser.createdAt ? new Date(currentUser.createdAt) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
  }, [currentUser.createdAt]);

  const completion = profileCompletion(currentUser);
  const indicators = trustIndicators(currentUser);
  const score = trustScore(currentUser);
  const hasPhone = Boolean(currentUser.phone && currentUser.phone.trim());

  const activeAgreements = agreements.filter((agreement) => agreement.status === 'active');
  const currentUserAgreements = activeAgreements.filter(
    (agreement) =>
      agreement.lenderId === currentUser.id ||
      agreement.borrowerId === currentUser.id ||
      agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase(),
  );
  const moneyToReceive = activeAgreements
    .filter((agreement) => agreement.lenderId === currentUser.id)
    .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
  const moneyToPay = activeAgreements
    .filter(
      (agreement) =>
        agreement.borrowerId === currentUser.id ||
        agreement.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase(),
    )
    .reduce((sum, agreement) => sum + getRemainingBalance(agreement, payments), 0);
  const pendingConfirmations = payments.filter((payment) => {
    if (payment.status !== 'pending_confirmation') return false;
    const agreement = agreements.find((item) => item.id === payment.agreementId);
    return payment.payerId === currentUser.id || payment.receiverId === currentUser.id || agreement?.lenderId === currentUser.id;
  }).length;

  const summaryMetrics: SummaryMetric[] = [
    { key: 'active', label: 'Active Agreements', value: currentUserAgreements.length, format: String, insight: currentUserAgreements.length ? 'In progress' : 'None yet' },
    { key: 'receive', label: 'Money to Receive', value: moneyToReceive, format: (v) => formatMoney(v, currency), highlight: true },
    { key: 'pay', label: 'Money to Pay', value: moneyToPay, format: (v) => formatMoney(v, currency) },
    { key: 'pending', label: 'Pending Confirmations', value: pendingConfirmations, format: String, insight: pendingConfirmations ? 'Needs attention' : 'All up to date' },
  ];

  const healthRows: HealthRow[] = [
    { key: 'profile', icon: 'person-circle-outline', label: 'Profile completion', status: `${completion}%`, percent: completion },
    { key: 'security', icon: 'lock-closed-outline', label: 'Security status', status: 'Secure', percent: 100 },
    { key: 'notifications', icon: 'notifications-outline', label: 'Notification settings', status: 'Enabled', percent: 100 },
    { key: 'backup', icon: 'save-outline', label: 'Backup status', status: hasPhone ? 'Ready' : 'Partial', percent: hasPhone ? 100 : 60 },
    { key: 'sync', icon: 'cloud-outline', label: 'Cloud sync', status: 'Coming soon', percent: 0, future: true },
  ];

  const openEdit = () => {
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
  };

  const settingSections: { title: string; rows: SettingsRow[] }[] = [
    {
      title: 'Account',
      rows: [
        { icon: 'person-circle-outline', title: 'Personal details', description: 'Name, phone, country, and preferences', onPress: openEdit },
        { icon: 'globe-outline', title: 'Language & region', description: 'Currency, timezone, and language', onPress: openEdit },
      ],
    },
    {
      title: 'Security',
      rows: [
        { icon: 'lock-closed-outline', title: 'Password & security', description: 'Manage how you sign in', onPress: () => Alert.alert('Security', 'Security settings will be added in a future step.') },
        { icon: 'phone-portrait-outline', title: 'Connected devices', description: 'Coming soon', trailing: 'Soon', onPress: () => Alert.alert('Connected devices', 'This feature is coming soon.') },
      ],
    },
    {
      title: 'Notifications',
      rows: [{ icon: 'notifications-outline', title: 'Notifications', description: 'Push alerts, reminders, and activity', onPress: () => router.push('/notification-settings' as never) }],
    },
    {
      title: 'Privacy & Data',
      rows: [
        { icon: 'shield-outline', title: 'Privacy', description: 'How your data is used', onPress: () => Alert.alert('Privacy', legal) },
        { icon: 'download-outline', title: 'Export data', description: 'Download your agreements and activity', onPress: () => Alert.alert('Export data', 'Data export will be added in a future step.') },
      ],
    },
    {
      title: 'Support & Legal',
      rows: [
        { icon: 'help-circle-outline', title: 'Help & support', description: 'Get help with your account', onPress: () => Alert.alert('Support', 'Support options will be added in a future step.') },
        { icon: 'document-text-outline', title: 'Legal disclaimer', description: 'How TRUVO supports personal agreements', onPress: () => Alert.alert('Legal disclaimer', legal) },
        { icon: 'information-circle-outline', title: 'About TRUVO', description: `Version ${APP_VERSION}`, onPress: () => Alert.alert('About TRUVO', `TRUVO v${APP_VERSION}`) },
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
    } catch {
      Alert.alert('Log out failed', userSafeMessage('Please try again.'));
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your TRUVO account and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => Alert.alert('Account deletion', 'Account deletion will be handled by support for now. Please contact us to proceed.') },
      ],
    );
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
    } catch {
      Alert.alert('Could not update profile', userSafeMessage('Please try again.'));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <ScreenContainer>
      <IdentityCard
        name={currentUser.name}
        email={currentUser.email}
        avatarUrl={currentUser.avatarUrl}
        country={currentUser.country}
        memberSince={memberSince}
        subscriptionLabel={subscriptionLabel}
        completion={completion}
        emailVerified={Boolean(currentUser.email)}
        phonePending={!hasPhone}
        onEdit={openEdit}
      />

      <Section title="Trust Center">
        <TrustCenterCard score={score} indicators={indicators} />
      </Section>

      <Section title="Account Summary">
        <AccountSummaryCard metrics={summaryMetrics} />
      </Section>

      <Section title="Account Health">
        <AccountHealthCard rows={healthRows} />
      </Section>

      <PremiumCard isPremium={isPremium} onUpgrade={() => router.push('/premium')} />

      {settingSections.map((section) => (
        <SettingsSection key={section.title} title={section.title} rows={section.rows} />
      ))}

      <DangerZone
        appVersion={APP_VERSION}
        environment={__DEV__ ? 'Development' : undefined}
        loggingOut={loggingOut}
        onLogout={() => setConfirmLogoutVisible(true)}
        onDeleteAccount={handleDeleteAccount}
      />

      <Modal animationType="fade" transparent visible={confirmLogoutVisible} onRequestClose={() => setConfirmLogoutVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" disabled={loggingOut} onPress={() => setConfirmLogoutVisible(false)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={loggingOut} onPress={handleConfirmLogout} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
                <Text style={styles.confirmText}>{loggingOut ? 'Logging out...' : 'Log Out'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={editProfileVisible} onRequestClose={() => setEditProfileVisible(false)}>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
            accessibilityState={{ selected: value === option.value }}
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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
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
