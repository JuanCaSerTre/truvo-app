import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface NavItemConfig {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface Props {
  config: NavItemConfig;
  active: boolean;
  onPress: () => void;
}

/** A single tab: animated expanding pill + icon scale + fade-in label when active. */
export function NavigationItem({ config, active, onPress }: Props) {
  const progress = useDerivedValue(() => withTiming(active ? 1 : 0, { duration: 220 }));
  const iconScale = useDerivedValue(() => withSpring(active ? 1 : 0.92, { damping: 12, stiffness: 180 }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    width: progress.value === 0 ? 0 : undefined,
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={config.label}
      onPress={onPress}
      style={styles.item}
      hitSlop={8}
    >
      <Animated.View style={[styles.pill, pillStyle]} />
      <View style={styles.content}>
        <Animated.View style={iconStyle}>
          <Ionicons name={active ? config.activeIcon : config.icon} size={23} color={active ? colors.secondary : colors.textMuted} />
        </Animated.View>
        {active ? (
          <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
            {config.label}
          </Animated.Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    backgroundColor: '#ECFDF5',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  label: {
    color: colors.secondary,
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
