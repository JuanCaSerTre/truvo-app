import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Elevated floating primary action button (the center Create). Spring press + glow. */
export function FloatingCreateButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.glow} pointerEvents="none" />
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Open action menu"
        accessibilityState={{ expanded: active }}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 12, stiffness: 220 });
          rotate.value = withTiming(active ? 0 : 45, { duration: 160 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        }}
        style={[styles.button, animatedStyle]}
      >
        <Ionicons name={active ? 'close' : 'add'} size={30} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

const SIZE = 62;

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  glow: {
    position: 'absolute',
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: (SIZE + 16) / 2,
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});
