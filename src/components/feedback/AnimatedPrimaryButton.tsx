import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { HapticService } from '@/services/feedback/HapticService';
import { AnimationService } from '@/services/feedback/AnimationService';
import { colors, radii, spacing, typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Consistent premium button: on press it compresses, softens its shadow, dims subtly,
 * and fires a light haptic; release springs it back. Drop-in for PrimaryButton.
 */
export function AnimatedPrimaryButton({ label, onPress, variant = 'primary', icon, loading, disabled, style }: Props) {
  const pressed = useSharedValue(0);
  const isOutline = variant === 'outline';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.96]) }],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.92]),
    shadowOpacity: interpolate(pressed.value, [0, 1], [0.18, 0.06]),
    shadowRadius: interpolate(pressed.value, [0, 1], [16, 6]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: AnimationService.duration(90) });
        HapticService.light();
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, AnimationService.spring.press());
      }}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={19} color={isOutline ? colors.primary : '#FFFFFF'} /> : null}
          <Text style={[styles.label, isOutline && styles.outlineLabel]}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1, shadowOpacity: 0, elevation: 0 },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  label: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
  outlineLabel: {
    color: colors.primary,
  },
});
