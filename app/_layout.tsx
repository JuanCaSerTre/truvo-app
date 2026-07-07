import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TruvoProvider, useTruvoStore } from '@/hooks/useTruvoStore';
import { colors } from '@/constants/theme';
import { authService } from '@/services/authService';
import { onboardingService } from '@/services/onboardingService';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TruvoProvider>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </AuthGate>
      </TruvoProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const { clearUserSessionData, setUserFromAuth } = useTruvoStore();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!mounted) return;
        if (!user) {
          clearUserSessionData();
          setAuthenticated(false);
          setCompletedOnboarding(false);
          return;
        }
        setUserFromAuth(user);
        setAuthenticated(true);
        const hasCompletedOnboarding = await onboardingService.hasCompleted(user.id);
        if (!mounted) return;
        setCompletedOnboarding(hasCompletedOnboarding);
      } catch (error) {
        console.warn('Unable to restore guarded session', error);
        if (!mounted) return;
        clearUserSessionData();
        setAuthenticated(false);
        setCompletedOnboarding(false);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };
    void restore();
    return () => {
      mounted = false;
    };
  }, [clearUserSessionData, setUserFromAuth]);

  useEffect(() => {
    if (checkingSession) return;
    const firstSegment = segments[0];
    const secondSegment = segments[1];
    const inAuthGroup = firstSegment === '(auth)';
    const isSplash = firstSegment === undefined;

    if (!authenticated && !inAuthGroup && !isSplash) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (authenticated && inAuthGroup && secondSegment !== 'onboarding') {
      router.replace(completedOnboarding ? '/(tabs)' : '/(auth)/onboarding');
      return;
    }

    if (authenticated && inAuthGroup && secondSegment === 'onboarding' && completedOnboarding) {
      router.replace('/(tabs)');
    }
  }, [authenticated, checkingSession, completedOnboarding, segments]);

  if (checkingSession) return null;
  return children;
}
