import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TruvoProvider, useTruvoStore } from '@/hooks/useTruvoStore';
import { colors } from '@/constants/theme';
import { authService } from '@/services/authService';
import { onboardingService } from '@/services/onboardingService';
import { logApiWarning } from '@/utils/apiErrors';

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
  const { currentUser, clearUserSessionData, setUserFromAuth } = useTruvoStore();
  const [checkingSession, setCheckingSession] = useState(true);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  // Authentication is derived from the store's current user rather than a local flag,
  // so signing in (setUserFromAuth) and signing out (clearUserSessionData) from anywhere
  // — the login screens, the deep-link handler, or session restore — keep the gate in sync.
  const authenticated = Boolean(currentUser.id);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!mounted) return;
        if (!user) {
          clearUserSessionData();
          return;
        }
        setUserFromAuth(user);
      } catch (error) {
        logApiWarning('Unable to restore guarded session', error);
        if (!mounted) return;
        clearUserSessionData();
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };
    void restore();
    return () => {
      mounted = false;
    };
  }, [clearUserSessionData, setUserFromAuth]);

  // Keep the onboarding flag in sync with whoever is currently signed in.
  useEffect(() => {
    let active = true;
    if (!currentUser.id) {
      setCompletedOnboarding(false);
      return;
    }
    void onboardingService.hasCompleted(currentUser.id).then((done) => {
      if (active) setCompletedOnboarding(done);
    });
    return () => {
      active = false;
    };
  }, [currentUser.id]);

  // Handle the email confirmation deep link. When the user taps the link in the
  // signup email, the app is opened with the auth tokens in the URL; exchange them
  // for a session so the user lands authenticated instead of on a dead page.
  useEffect(() => {
    let active = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes('auth-callback')) return;
      try {
        const user = await authService.completeSessionFromUrl(url);
        if (!active || !user) return;
        setUserFromAuth(user);
      } catch (error) {
        logApiWarning('Unable to complete email confirmation deep link', error);
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [setUserFromAuth]);

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
