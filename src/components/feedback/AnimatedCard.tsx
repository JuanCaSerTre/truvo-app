import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, FadeInDown } from 'react-native-reanimated';
import { AnimationService } from '@/services/feedback/AnimationService';

export interface AnimatedCardHandle {
  /** Subtle horizontal shake — use for error/validation feedback. */
  shake: () => void;
}

interface Props extends ViewProps {
  /** Stagger index for the entrance fade-in. */
  index?: number;
  entering?: boolean;
}

/** Card wrapper with a fade-in entrance and an imperative error shake. */
export const AnimatedCard = forwardRef<AnimatedCardHandle, Props>(function AnimatedCard(
  { index = 0, entering = true, style, children, ...rest },
  ref,
) {
  const shakeX = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    shake: () => {
      if (AnimationService.reduced) return;
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <Animated.View
      entering={entering && !AnimationService.reduced ? FadeInDown.delay(Math.min(index, 6) * 60).duration(320) : undefined}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({});
