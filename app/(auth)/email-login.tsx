import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Checkbox } from '@/components/auth/Checkbox';
import { LoadingOverlay } from '@/components/auth/LoadingOverlay';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PrimaryInput } from '@/components/auth/PrimaryInput';
import { SegmentedControl } from '@/components/auth/SegmentedControl';
import { SuccessCard } from '@/components/auth/SuccessCard';
import { TrustSection } from '@/components/auth/TrustCard';
import { ValidationChecklist } from '@/components/auth/ValidationChecklist';
import { VerificationCard } from '@/components/auth/VerificationCard';
import { FadeInView } from '@/components/FadeInView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { onboardingService } from '@/services/onboardingService';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { colors, spacing, typography } from '@/constants/theme';
import { userSafeMessage } from '@/utils/errors';
import { openMailApp } from '@/utils/openMailApp';
import { isStrongPassword, isValidEmail, normalizeEmail } from '@/utils/validation';

type AuthMode = 'sign_in' | 'sign_up';
type Stage = 'form' | 'verify' | 'success';

const SEGMENTS = [
  { value: 'sign_in' as const, label: 'Sign In' },
  { value: 'sign_up' as const, label: 'Create Account' },
];

export default function EmailLoginScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { setUserFromAuth } = useTruvoStore();
  const [mode, setMode] = useState<AuthMode>(modeParam === 'sign_up' ? 'sign_up' : 'sign_in');
  const [stage, setStage] = useState<Stage>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isSignUp = mode === 'sign_up';
  const normalizedEmail = normalizeEmail(email);
  const emailValid = isValidEmail(normalizedEmail);
  const nameValid = name.trim().length >= 2;
  const passwordStrong = isStrongPassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const formValid = useMemo(() => {
    if (!emailValid) return false;
    if (isSignUp) return nameValid && passwordStrong && passwordsMatch;
    return password.length >= 8;
  }, [emailValid, isSignUp, nameValid, passwordStrong, passwordsMatch, password]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setStage('form');
  };

  const submit = async () => {
    if (!formValid || loading) return;
    try {
      setLoading(true);
      if (isSignUp) {
        const result = await authService.signUpWithPassword(normalizedEmail, password, name);
        if (result.needsEmailConfirmation) {
          setStage('verify');
          return;
        }
        if (result.user) {
          setUserFromAuth(result.user);
          setStage('success');
        }
        return;
      }

      const user = await authService.signInWithPassword(normalizedEmail, password);
      setUserFromAuth(user);
      const completedOnboarding = await onboardingService.hasCompleted(user.id);
      router.replace(completedOnboarding ? '/(tabs)' : '/(auth)/onboarding');
    } catch {
      Alert.alert(
        isSignUp ? 'Could not create account' : 'Could not sign in',
        userSafeMessage('Check your details and try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!emailValid) return;
    try {
      setResending(true);
      await authService.resendSignupConfirmation(normalizedEmail);
      Alert.alert('Confirmation email sent', 'Check your inbox and spam folder.');
    } catch {
      Alert.alert('Could not resend email', userSafeMessage('Please try again later.'));
    } finally {
      setResending(false);
    }
  };

  const forgotPassword = () => {
    if (!emailValid) {
      Alert.alert('Enter your email first', 'Type the email tied to your account, then tap Forgot Password again.');
      emailRef.current?.focus();
      return;
    }
    Alert.alert('Reset your password', `Send a password reset link to ${normalizedEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send link',
        onPress: async () => {
          try {
            await authService.sendPasswordReset(normalizedEmail);
            Alert.alert('Check your inbox', 'We sent a link to reset your password.');
          } catch {
            Alert.alert('Could not send reset email', userSafeMessage('Please try again later.'));
          }
        },
      },
    ]);
  };

  const header = isSignUp
    ? { title: 'Create your account', subtitle: 'Create your account to start tracking agreements with confidence.' }
    : { title: 'Welcome back', subtitle: 'Securely access your agreements and payment history.' };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title={header.title} subtitle={header.subtitle} />

          {stage === 'success' ? (
            <SuccessCard
              title="Account created"
              description="Check your email to verify your account, then sign in to get started."
              primaryLabel="Open Email App"
              onPrimary={openMailApp}
              secondaryLabel="Continue Later"
              onSecondary={() => switchMode('sign_in')}
            />
          ) : stage === 'verify' ? (
            <FadeInView delay={80} translateY={16} style={styles.section}>
              <VerificationCard
                email={normalizedEmail}
                resending={resending}
                onOpenEmail={openMailApp}
                onResend={resendConfirmation}
                onChangeEmail={() => setStage('form')}
              />
            </FadeInView>
          ) : (
            <>
              <FadeInView delay={100} translateY={12} style={styles.section}>
                <SegmentedControl segments={SEGMENTS} value={mode} onChange={switchMode} />
              </FadeInView>

              <FadeInView delay={160} translateY={16} style={styles.form}>
                {isSignUp ? (
                  <PrimaryInput
                    label="Full name"
                    icon="person-outline"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    validity={name.length === 0 ? 'neutral' : nameValid ? 'valid' : 'invalid'}
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                ) : null}

                <PrimaryInput
                  ref={emailRef}
                  label="Email"
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  validity={email.length === 0 ? 'neutral' : emailValid ? 'valid' : 'invalid'}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />

                <PasswordInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  textContentType={isSignUp ? 'newPassword' : 'password'}
                  returnKeyType={isSignUp ? 'next' : 'go'}
                  validity={password.length === 0 ? 'neutral' : isSignUp ? (passwordStrong ? 'valid' : 'invalid') : 'neutral'}
                  onSubmitEditing={() => (isSignUp ? confirmRef.current?.focus() : submit())}
                  blurOnSubmit={!isSignUp}
                />

                {isSignUp && password.length > 0 ? <ValidationChecklist password={password} /> : null}

                {isSignUp ? (
                  <PasswordInput
                    ref={confirmRef}
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    textContentType="newPassword"
                    returnKeyType="go"
                    validity={confirmPassword.length === 0 ? 'neutral' : passwordsMatch ? 'valid' : 'invalid'}
                    onSubmitEditing={submit}
                  />
                ) : null}

                {!isSignUp ? (
                  <View style={styles.forgotRow}>
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={forgotPassword}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </Pressable>
                  </View>
                ) : null}

                <Checkbox
                  checked={keepSignedIn}
                  onToggle={() => setKeepSignedIn((prev) => !prev)}
                  label="Keep me signed in"
                  hint="You'll stay signed in on this device."
                />

                <PrimaryButton
                  label={isSignUp ? 'Create Account' : 'Sign In'}
                  onPress={submit}
                  loading={loading}
                  disabled={!formValid}
                  style={styles.cta}
                />
              </FadeInView>

              <FadeInView delay={260} translateY={16} style={styles.trust}>
                <TrustSection />
              </FadeInView>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading && mode === 'sign_in'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    width: '100%',
  },
  form: {
    gap: spacing.lg,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  cta: {
    marginTop: spacing.xs,
    minHeight: 58,
    borderRadius: 999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  trust: {
    marginTop: 'auto',
  },
});
