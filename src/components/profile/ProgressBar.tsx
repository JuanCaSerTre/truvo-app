import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii } from '@/constants/theme';

interface Props {
  percent: number; // 0..100
  color?: string;
  track?: string;
  height?: number;
}

/** Thin animated progress bar reused across the profile health rows. */
export function ProgressBar({ percent, color = colors.secondary, track = colors.surfaceMuted, height = 8 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(percent, 100)), duration: 520, useNativeDriver: false }).start();
  }, [anim, percent]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.track, { height, backgroundColor: track }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
