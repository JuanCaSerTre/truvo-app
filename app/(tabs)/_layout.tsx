import React, { useState } from 'react';
import { Tabs, router } from 'expo-router';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { ActionHubBottomSheet } from '@/components/navigation/ActionHubBottomSheet';
import { ActionHubItem } from '@/components/navigation/actionHubConfig';
import { haptics } from '@/utils/haptics';

export default function TabLayout() {
  const [hubVisible, setHubVisible] = useState(false);

  const openHub = () => {
    haptics.medium();
    setHubVisible(true);
  };

  const handleSelect = (item: ActionHubItem) => {
    if (item.comingSoon || !item.route) return;
    setHubVisible(false);
    // Let the sheet begin closing before navigating for a smoother transition.
    setTimeout(() => router.push(item.route as never), 180);
  };

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNavigation {...props} createActive={hubVisible} onCreatePress={openHub} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="agreements" options={{ title: 'Agreements' }} />
        {/* Create stays a real route (so router.push('/create') works) but is never shown as a tab. */}
        <Tabs.Screen name="create" options={{ title: 'Create', href: null }} />
        <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      <ActionHubBottomSheet visible={hubVisible} onClose={() => setHubVisible(false)} onSelect={handleSelect} />
    </>
  );
}
