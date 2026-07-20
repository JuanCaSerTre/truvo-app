import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '@/components/FadeInView';
import { TruvoWordmark } from '@/components/TruvoWordmark';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  title: string;
  subtitle: string;
}

/** Premium auth header: small logo, headline, supporting copy. */
export function AuthHeader({ title, subtitle }: Props) {
  return (
    <FadeInView delay={0} style={styles.container}>
      <View style={styles.logo}>
        <TruvoWordmark size="sm" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  logo: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
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
  },
});
