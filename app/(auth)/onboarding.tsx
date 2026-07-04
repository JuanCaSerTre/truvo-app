import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';

const legal =
  'TRUVO does not provide loans or financial services. TRUVO only provides tools to record and track agreements between individuals. Users are responsible for their own agreements.';

export default function OnboardingScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>How TRUVO works</Text>
      {[
        ['Create clear terms', 'Set principal, repayment total, schedule, and notes before anyone accepts.'],
        ['Confirm together', 'Agreements activate only after borrower acceptance. Payments apply only after confirmation.'],
        ['Keep a record', 'Every major action creates a timeline event. Records are statused, not permanently deleted.'],
      ].map(([title, body]) => (
        <View key={title} style={styles.item}>
          <Ionicons name="checkmark-circle" size={26} color={colors.secondary} />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemBody}>{body}</Text>
          </View>
        </View>
      ))}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>{legal}</Text>
      </View>
      <PrimaryButton label="Enter TRUVO" onPress={() => router.replace('/(tabs)')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemText: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '800',
  },
  itemBody: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 21,
  },
  disclaimer: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: '#ECFDF5',
  },
  disclaimerText: {
    color: colors.primary,
    fontSize: typography.small,
    lineHeight: 21,
    fontWeight: '600',
  },
});
