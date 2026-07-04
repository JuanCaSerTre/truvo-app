import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { colors, spacing, typography } from '@/constants/theme';

export default function PhoneLoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes('@')) {
      Alert.alert('Enter a valid email');
      return;
    }
    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      await authService.sendOtp(normalizedEmail);
      router.push({ pathname: '/(auth)/otp-verification', params: { email: normalizedEmail } });
    } catch (error) {
      Alert.alert('Email login unavailable', error instanceof Error ? error.message : 'Unable to send the email code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Log in with email</Text>
      <Text style={styles.copy}>We will send a one-time code to your email while SMS login is being configured.</Text>
      <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
      <PrimaryButton label="Send code" onPress={submit} loading={loading} />
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
    marginBottom: spacing.md,
  },
});
