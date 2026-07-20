import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  appVersion: string;
  environment?: string;
  loggingOut?: boolean;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

/** Bottom-of-screen zone: version/env, logout, and a visually separated delete action. */
export function DangerZone({ appVersion, environment, loggingOut, onLogout, onDeleteAccount }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        disabled={loggingOut}
        onPress={onLogout}
        style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.primary} />
        <Text style={styles.logoutText}>{loggingOut ? 'Logging out…' : 'Log Out'}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete account"
        onPress={onDeleteAccount}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteText}>Delete Account</Text>
      </Pressable>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>TRUVO v{appVersion}</Text>
        {environment ? (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{environment}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  logout: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  delete: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deleteText: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
