import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { TruvoWordmark } from '@/components/TruvoWordmark';
import { authService } from '@/services/authService';
import { useTruvoStore } from '@/hooks/useTruvoStore';

export default function SplashScreen() {
  const { setUserFromAuth } = useTruvoStore();

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      const user = await authService.getCurrentUser();
      if (!mounted) return;
      if (user) {
        setUserFromAuth(user);
        router.replace('/(tabs)');
        return;
      }
      router.replace('/(auth)/welcome');
    };
    const timer = setTimeout(() => {
      void restoreSession();
    }, 900);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [setUserFromAuth]);

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
