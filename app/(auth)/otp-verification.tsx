import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { colors, typography } from '@/constants/theme';
import { userSafeMessage } from '@/utils/errors';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

export default function OtpVerificationScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const normalizedEmail = normalizeEmail(email);
  const { setUserFromAuth } = useTruvoStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    const normalizedCode = code.trim();
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Verification failed', 'Use the email address that requested the code.');
      return;
    }
    if (normalizedCode.length < 6) {
      Alert.alert('Enter the email verification code');
      return;
    }
    try {
      setLoading(true);
      const user = await authService.verifyOtp(normalizedEmail, normalizedCode);
      setUserFromAuth(user);
      router.replace('/(auth)/onboarding');
    } catch {
      Alert.alert('Verification failed', userSafeMessage('Unable to verify the email code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Verify code</Text>
      <Text style={styles.copy}>Enter the email code sent to {normalizedEmail}.</Text>
      <FormInput label="Verification code" value={code} onChangeText={setCode} placeholder="12345678" keyboardType="number-pad" maxLength={12} />
      <PrimaryButton label="Verify" onPress={verify} loading={loading} />
    </ScreenContainer>
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
  },
});
