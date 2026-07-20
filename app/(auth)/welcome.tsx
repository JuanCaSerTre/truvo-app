import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AgreementIllustration } from '@/components/AgreementIllustration';
import { FadeInView } from '@/components/FadeInView';
import { FeatureCard } from '@/components/FeatureCard';
import { PremiumButton } from '@/components/PremiumButton';
import { TruvoWordmark } from '@/components/TruvoWordmark';
import { colors, radii, spacing, typography } from '@/constants/theme';

const FEATURES = [
  {
    icon: 'document-text-outline' as const,
    title: 'Agreement Tracking',
    description: 'Create and manage agreements in minutes.',
  },
  {
    icon: 'checkmark-done-outline' as const,
    title: 'Payment Confirmation',
    description: 'Every payment is confirmed by both people.',
  },
  {
    icon: 'time-outline' as const,
    title: 'Transparent Timeline',
    description: 'Always know what happened and when.',
  },
];

const TRUST_INDICATORS = [
  { icon: 'lock-closed' as const, label: 'Your agreements stay private' },
  { icon: 'swap-horizontal' as const, label: 'No money transfers' },
  { icon: 'shield-checkmark' as const, label: 'Secure agreement tracking' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SECTION 1 — Header */}
        <FadeInView delay={0} style={styles.header}>
          <TruvoWordmark size="sm" />
        </FadeInView>

        {/* SECTION 2 — Hero illustration */}
        <FadeInView delay={120} translateY={16} style={styles.hero}>
          <AgreementIllustration />
        </FadeInView>

        {/* SECTION 3 — Value proposition */}
        <FadeInView delay={220} translateY={20} style={styles.valueProp}>
          <Text style={styles.title}>Clear agreements.{'\n'}Real trust.</Text>
          <Text style={styles.subtitle}>
            Track personal loan agreements, confirm every payment together, and keep both sides protected with complete transparency.
          </Text>
        </FadeInView>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <FadeInView key={feature.title} delay={320 + index * 90} translateY={24}>
              <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
            </FadeInView>
          ))}
        </View>

        {/* Trust indicators */}
        <FadeInView delay={620} translateY={16} style={styles.trustCard}>
          {TRUST_INDICATORS.map((item) => (
            <View key={item.label} style={styles.trustRow}>
              <Ionicons name={item.icon} size={16} color={colors.secondary} />
              <Text style={styles.trustText}>{item.label}</Text>
            </View>
          ))}
        </FadeInView>

        {/* SECTION 4 — Primary action */}
        <FadeInView delay={720} translateY={16} style={styles.actions}>
          <PremiumButton label="Continue with Email" onPress={() => router.push('/(auth)/email-login?mode=sign_up')} />
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/(auth)/email-login?mode=sign_in')}>
              <Text style={styles.loginLink}>Log In</Text>
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  hero: {
    alignItems: 'center',
  },
  valueProp: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 26,
  },
  features: {
    gap: spacing.md,
  },
  trustCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trustText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPrompt: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  loginLink: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
