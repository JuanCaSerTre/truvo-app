import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  title: string;
  subtitle: string;
}

/** Emotional onboarding header: bold headline + reassuring subtitle. */
export function OnboardingHeader({ title, subtitle }: Props) {
  return (
    <>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
});
