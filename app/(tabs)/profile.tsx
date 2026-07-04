import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';

const legal =
  'TRUVO does not provide loans or financial services. TRUVO only provides tools to record and track agreements between individuals. Users are responsible for their own agreements.';

export default function ProfileScreen() {
  const { currentUser } = useTruvoStore();
  return (
    <ScreenContainer>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{currentUser.name.slice(0, 1)}</Text>
      </View>
      <View>
        <Text style={styles.title}>{currentUser.name}</Text>
        <Text style={styles.phone}>{currentUser.email || currentUser.phone}</Text>
      </View>
      <StatusBadge status={currentUser.subscription_status} />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Legal disclaimer</Text>
        <Text style={styles.legal}>{legal}</Text>
      </View>
      <PrimaryButton label="Manage premium" onPress={() => router.push('/premium')} />
      <PrimaryButton label="Notifications" variant="outline" onPress={() => router.push('/notifications')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  phone: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: '#ECFDF5',
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  legal: {
    color: colors.primary,
    fontSize: typography.small,
    lineHeight: 21,
    fontWeight: '600',
  },
});
