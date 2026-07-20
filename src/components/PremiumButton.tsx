import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  style?: ViewStyle;
}

/** Large, full-width, rounded CTA with soft shadow and a slight press-scale animation. */
export function PremiumButton({ label, onPress, icon = 'mail-outline', loading, style }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading }}
      disabled={loading}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      style={[styles.button, animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
