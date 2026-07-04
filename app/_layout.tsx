import 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TruvoProvider } from '@/hooks/useTruvoStore';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <TruvoProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </TruvoProvider>
  );
}
