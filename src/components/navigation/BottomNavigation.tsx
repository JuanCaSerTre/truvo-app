import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationItem, NavItemConfig } from './NavigationItem';
import { FloatingCreateButton } from './FloatingCreateButton';
import { haptics } from '@/utils/haptics';
import { colors, radii, spacing } from '@/constants/theme';

const NAV_CONFIG: Record<string, NavItemConfig> = {
  index: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  agreements: { icon: 'documents-outline', activeIcon: 'documents', label: 'Agreements' },
  payments: { icon: 'cash-outline', activeIcon: 'cash', label: 'Payments' },
  profile: { icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
};

// The four real destinations flanking the center action button, in display order.
const LEFT = ['index', 'agreements'];
const RIGHT = ['payments', 'profile'];

interface Props extends BottomTabBarProps {
  onCreatePress: () => void;
  createActive: boolean;
}

/** Floating, detached bottom navigation with a central floating action button. */
export function BottomNavigation({ state, navigation, onCreatePress, createActive }: Props) {
  const insets = useSafeAreaInsets();

  const routeByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));
  const activeName = state.routes[state.index]?.name;

  const navigateTo = (name: string) => {
    const route = routeByName[name];
    if (!route) return;
    haptics.light();
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeName !== name && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderItem = (name: string) => {
    const config = NAV_CONFIG[name];
    if (!config) return null;
    return <NavigationItem key={name} config={config} active={activeName === name} onPress={() => navigateTo(name)} />;
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <View style={styles.side}>{LEFT.map(renderItem)}</View>
        <View style={styles.centerSlot}>
          <FloatingCreateButton active={createActive} onPress={onCreatePress} />
        </View>
        <View style={styles.side}>{RIGHT.map(renderItem)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 66,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
