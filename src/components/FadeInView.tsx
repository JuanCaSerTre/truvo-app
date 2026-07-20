import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  /** Vertical offset in px to slide up from. 0 = pure fade. */
  translateY?: number;
  style?: ViewStyle;
}

/** Reusable entrance animation: fades in and optionally slides up. Premium, smooth easing. */
export function FadeInView({ children, delay = 0, duration = 520, translateY = 0, style }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * translateY }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
