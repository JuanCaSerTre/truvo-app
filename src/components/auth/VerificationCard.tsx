import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  email: string;
  resending?: boolean;
  onOpenEmail: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

/** Dedicated "verify your email" information card with the three recovery actions. */
export function VerificationCard({ email, resending, onOpenEmail, onResend, onChangeEmail }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Ionicons name="mail-unread-outline" size={30} color={colors.secondary} />
      </View>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.description}>
        We've sent a verification email to{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <View style={styles.actions}>
        <PrimaryButton label="Open Email App" onPress={onOpenEmail} />
        <PrimaryButton label="Resend Email" variant="outline" onPress={onResend} loading={resending} />
        <PrimaryButton label="Change Email Address" variant="outline" onPress={onChangeEmail} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: radii.pill,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  email: {
    color: colors.text,
    fontWeight: '800',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
