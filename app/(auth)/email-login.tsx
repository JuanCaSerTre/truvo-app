import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { onboardingService } from '@/services/onboardingService';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { userSafeMessage } from '@/utils/errors';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

type AuthMode = 'sign_in' | 'sign_up';

export default function EmailLoginScreen() {
  const { setUserFromAuth } = useTruvoStore();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

	  const submit = async () => {
	    const normalizedEmail = normalizeEmail(email);
	    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Enter a valid email');
      return;
    }
    if (mode === 'sign_up' && name.trim().length < 2) {
      Alert.alert('Enter your full name');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Use at least 8 characters for your password');
      return;
    }
    if (mode === 'sign_up' && password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'sign_up') {
        const result = await authService.signUpWithPassword(normalizedEmail, password, name);
        if (result.needsEmailConfirmation) {
          Alert.alert('Confirmation requested', 'Check your inbox and spam folder, then come back and sign in.');
          return;
        }
        if (result.user) {
          setUserFromAuth(result.user);
          router.replace('/(auth)/onboarding');
        }
        return;
      }

      const user = await authService.signInWithPassword(normalizedEmail, password);
      setUserFromAuth(user);
      const completedOnboarding = await onboardingService.hasCompleted(user.id);
      router.replace(completedOnboarding ? '/(tabs)' : '/(auth)/onboarding');
    } catch {
      Alert.alert(mode === 'sign_up' ? 'Could not create account' : 'Could not sign in', userSafeMessage('Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

	  const resendConfirmation = async () => {
	    const normalizedEmail = normalizeEmail(email);
	    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Enter a valid email');
      return;
    }
    try {
      setResending(true);
      await authService.resendSignupConfirmation(normalizedEmail);
      Alert.alert('Confirmation email sent', 'Check your inbox and spam folder, then return here to sign in.');
    } catch {
      Alert.alert('Could not resend email', userSafeMessage('Please try again later.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <View>
        <Text style={styles.title}>{mode === 'sign_in' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.copy}>
          {mode === 'sign_in'
            ? 'Sign in with your email and password. TRUVO keeps your session on this device.'
            : 'Create your TRUVO account once, then use your password for future logins.'}
        </Text>
      </View>

      <View style={styles.segmented}>
        <ModeButton label="Sign in" active={mode === 'sign_in'} onPress={() => setMode('sign_in')} />
        <ModeButton label="Create account" active={mode === 'sign_up'} onPress={() => setMode('sign_up')} />
      </View>

      <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
      {mode === 'sign_up' ? (
        <FormInput label="Full name" value={name} onChangeText={setName} placeholder="Alex Morgan" autoCapitalize="words" />
      ) : null}
      <FormInput label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoCapitalize="none" />
      {mode === 'sign_up' ? (
        <FormInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry autoCapitalize="none" />
      ) : null}
      <PrimaryButton label={mode === 'sign_in' ? 'Sign in' : 'Create account'} onPress={submit} loading={loading} />
      {mode === 'sign_up' ? (
        <PrimaryButton label="Resend confirmation email" variant="outline" onPress={resendConfirmation} loading={resending} />
      ) : null}
    </ScreenContainer>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  copy: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  segmented: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '900',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
});
