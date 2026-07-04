import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TruvoWordmark } from '@/components/TruvoWordmark';
import { colors, spacing, typography } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <ScreenContainer scroll={false}>
      <View style={styles.hero}>
        <TruvoWordmark />
        <Text style={styles.title}>Clear agreements. Real trust.</Text>
        <Text style={styles.copy}>
          Record personal loan agreements, track confirmed payments, and keep both sides aligned.
        </Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.note}>
          TRUVO does not lend money or process transfers. It helps individuals record, track, and confirm their own agreements.
        </Text>
        <PrimaryButton label="Continue with phone" onPress={() => router.push('/(auth)/phone-login')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
  },
  copy: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 25,
  },
  panel: {
    gap: spacing.lg,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 21,
  },
});
