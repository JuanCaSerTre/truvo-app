import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { AnimationService } from '@/services/feedback/AnimationService';
import { colors } from '@/constants/theme';

interface Props {
  size?: number;
  color?: string;
}

/** Circle that scales in with a subtle overshoot, then pops the checkmark. */
export function AnimatedCheckmark({ size = 64, color = colors.secondary }: Props) {
  const circle = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => {
    if (AnimationService.reduced) {
      circle.value = 1;
      check.value = 1;
      return;
    }
    circle.value = withSpring(1, AnimationService.spring.bouncy());
    check.value = withSequence(withTiming(0, { duration: 120 }), withSpring(1, AnimationService.spring.bouncy()));
  }, [check, circle]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circle.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: check.value }] }));

  return (
    <Animated.View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, circleStyle]}>
      <Animated.View style={checkStyle}>
        <Ionicons name="checkmark" size={size * 0.55} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Static fallback ring for lists (no animation) — handy where many render at once. */
export function CheckmarkBadge({ size = 28, color = colors.secondary }: Props) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
    </View>
  );
}
