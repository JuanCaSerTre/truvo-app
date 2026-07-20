import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BenefitCard } from '@/components/onboarding/BenefitCard';
import { HeroIllustration } from '@/components/onboarding/HeroIllustration';
import { InformationCard } from '@/components/onboarding/InformationCard';
import { NextSteps } from '@/components/onboarding/NextSteps';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { TrustIndicator } from '@/components/onboarding/TrustIndicator';
import { FadeInView } from '@/components/FadeInView';
import { PremiumButton } from '@/components/PremiumButton';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { onboardingService } from '@/services/onboardingService';
import { colors, spacing, typography } from '@/constants/theme';

const BENEFITS = [
  {
    icon: 'people-outline' as const,
    title: 'Never argue about repayments again.',
    subtitle: 'Every agreement stays documented from day one.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Every payment is confirmed.',
    subtitle: 'Both people always know what has been paid.',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Complete transparency.',
    subtitle: 'Every agreement has a secure timeline and payment history.',
  },
];

const TRUST = [
  { icon: 'lock-closed' as const, label: 'Private by design' },
  { icon: 'checkmark-circle' as const, label: 'Both people confirm every payment' },
  { icon: 'git-branch' as const, label: 'Nothing changes without agreement' },
];

const STEPS = [
  { icon: 'create-outline' as const, label: 'Create your first agreement' },
  { icon: 'person-add-outline' as const, label: 'Invite the other person' },
  { icon: 'trending-up-outline' as const, label: 'Track every payment together' },
];

export default function OnboardingScreen() {
  const { currentUser, agreements } = useTruvoStore();
  const [loading, setLoading] = useState(false);

  // First experience = the user has no agreements yet. Otherwise this is a returning
  // user re-seeing onboarding, so nudge them straight to the dashboard.
  const isFirstExperience = agreements.length === 0;

  const enterApp = async () => {
    setLoading(true);
    await onboardingService.markCompleted(currentUser.id);
    router.replace(isFirstExperience ? '/(tabs)/create' : '/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0} translateY={10}>
          <OnboardingHeader
            title="You're ready to start."
            subtitle="TRUVO helps both people stay aligned from the first agreement to the final payment."
          />
        </FadeInView>

        <FadeInView delay={120} translateY={16} style={styles.hero}>
          <HeroIllustration />
        </FadeInView>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit, index) => (
            <FadeInView key={benefit.title} delay={220 + index * 110} translateY={20}>
              <BenefitCard icon={benefit.icon} title={benefit.title} subtitle={benefit.subtitle} />
            </FadeInView>
          ))}
        </View>

        <FadeInView delay={560} translateY={16} style={styles.trustSection}>
          <Text style={styles.sectionTitle}>Built around trust</Text>
          <View style={styles.trustList}>
            {TRUST.map((item) => (
              <TrustIndicator key={item.label} icon={item.icon} label={item.label} />
            ))}
          </View>
        </FadeInView>

        <FadeInView delay={640} translateY={16}>
          <InformationCard
            title="Important"
            text="TRUVO does not lend money or process payments. It simply helps individuals document, organize and track personal agreements."
          />
        </FadeInView>

        <FadeInView delay={720} translateY={16} style={styles.nextSection}>
          <Text style={styles.sectionTitle}>What happens next?</Text>
          <NextSteps steps={STEPS} />
        </FadeInView>

        <FadeInView delay={820} translateY={16} style={styles.cta}>
          <PremiumButton
            label={isFirstExperience ? 'Create My First Agreement' : 'Go to Dashboard'}
            icon={isFirstExperience ? 'add-circle-outline' : 'grid-outline'}
            loading={loading}
            onPress={enterApp}
          />
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
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
  },
  benefits: {
    gap: spacing.md,
  },
  trustSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  trustList: {
    gap: spacing.sm,
  },
  nextSection: {
    gap: spacing.md,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
