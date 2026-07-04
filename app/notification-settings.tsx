import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { NotificationSettings } from '@/types/models';

type SettingRow = {
  keyName: keyof NotificationSettings;
  title: string;
  description: string;
  future?: boolean;
};

const settings: SettingRow[] = [
  {
    keyName: 'agreementRequests',
    title: 'Agreement Requests',
    description: 'New requests, acceptances, rejections, cancellations, and completions.',
  },
  {
    keyName: 'paymentConfirmations',
    title: 'Payment Confirmations',
    description: 'Registered, confirmed, and rejected payment activity.',
  },
  {
    keyName: 'paymentReminders',
    title: 'Payment Reminders',
    description: 'Upcoming scheduled payment reminders.',
  },
  {
    keyName: 'overduePayments',
    title: 'Overdue Payments',
    description: 'Missed payment and overdue balance alerts.',
  },
  {
    keyName: 'marketingMessages',
    title: 'Marketing Messages',
    description: 'Offers and educational TRUVO updates.',
  },
  {
    keyName: 'productUpdates',
    title: 'Product Updates',
    description: 'New feature announcements and system changes.',
  },
  {
    keyName: 'pushNotifications',
    title: 'Push Notifications',
    description: 'Device alerts for important agreement and payment activity.',
  },
  {
    keyName: 'emailNotifications',
    title: 'Email Notifications',
    description: 'Future email delivery for important activity.',
    future: true,
  },
];

export default function NotificationSettingsScreen() {
  const { notificationSettings, updateNotificationSetting } = useTruvoStore();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Choose which activity belongs in your TRUVO feed and device alerts.</Text>
        </View>
      </View>

      <View style={styles.card}>
        {settings.map((setting, index) => (
          <View key={setting.keyName} style={[styles.row, index < settings.length - 1 && styles.rowBorder]}>
            <View style={styles.rowCopy}>
              <View style={styles.rowTitleLine}>
                <Text style={styles.rowTitle}>{setting.title}</Text>
                {setting.future ? <Text style={styles.futurePill}>Future</Text> : null}
              </View>
              <Text style={styles.rowDescription}>{setting.description}</Text>
            </View>
            <Switch
              disabled={setting.future}
              value={notificationSettings[setting.keyName]}
              onValueChange={(value) => updateNotificationSetting(setting.keyName, value)}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={notificationSettings[setting.keyName] ? colors.secondary : '#FFFFFF'}
              ios_backgroundColor="#CBD5E1"
            />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '700',
  },
  card: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    minHeight: 88,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
  },
  futurePill: {
    overflow: 'hidden',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});
