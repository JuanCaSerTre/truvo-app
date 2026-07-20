import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';

interface Props {
  value: number;
  format: (value: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/** Animated number that counts up to `value` and re-runs whenever the target changes. */
export function CountUpText({ value, format, duration = 700, style }: Props) {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    animated.setValue(0);
    const id = animated.addListener(({ value: t }) => {
      setDisplay(from + (value - from) * t);
    });
    Animated.timing(animated, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animated.removeListener(id);
  }, [animated, duration, value]);

  return <Animated.Text style={style}>{format(display)}</Animated.Text>;
}
