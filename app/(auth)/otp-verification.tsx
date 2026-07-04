import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { colors, typography } from '@/constants/theme';

export default function OtpVerificationScreen() {
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const { setUserFromAuth } = useTruvoStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (code.trim().length < 4) {
      Alert.alert('Enter the SMS code');
      return;
    }
    setLoading(true);
    const user = await authService.verifyOtp(phone, code);
    setUserFromAuth(user);
    setLoading(false);
    router.replace('/(auth)/onboarding');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Verify code</Text>
      <Text style={styles.copy}>Enter the SMS code sent to {phone}. Any 4 digits work in this placeholder flow.</Text>
      <FormInput label="OTP code" value={code} onChangeText={setCode} placeholder="1234" keyboardType="number-pad" maxLength={6} />
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
