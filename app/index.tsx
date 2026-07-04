import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { TruvoWordmark } from '@/components/TruvoWordmark';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(auth)/welcome'), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.screen}>
      <TruvoWordmark light />
      <Text style={styles.slogan}>Clear agreements. Real trust.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  slogan: {
    color: '#CBD5E1',
    fontSize: typography.body,
    fontWeight: '600',
  },
});
