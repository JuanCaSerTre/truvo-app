import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Modern segmented control with a smoothly animated active thumb. */
export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = Math.max(0, segments.findIndex((s) => s.value === value));
  const segmentWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / segments.length : 0;

  const offset = useDerivedValue(() =>
    withTiming(activeIndex * segmentWidth, { duration: 240, easing: Easing.out(Easing.cubic) }),
  );

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: offset.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segmentWidth > 0 ? <Animated.View style={[styles.thumb, thumbStyle]} /> : null}
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.segment}
            onPress={() => onChange(segment.value)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PADDING = 4;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  thumb: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    bottom: PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
