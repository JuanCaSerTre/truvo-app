import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { colors, spacing, typography } from '@/constants/theme';

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (phone.trim().length < 8) {
      Alert.alert('Enter a valid phone number');
      return;
    }
    setLoading(true);
    await authService.sendOtp(phone);
    setLoading(false);
    router.push({ pathname: '/(auth)/otp-verification', params: { phone } });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Log in with phone</Text>
      <Text style={styles.copy}>We will send a one-time SMS code. This is a placeholder flow ready for a real OTP provider.</Text>
      <FormInput label="Phone number" value={phone} onChangeText={setPhone} placeholder="+1 555 0123" keyboardType="phone-pad" />
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
