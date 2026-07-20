import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  progress: number; // 0..1
  confirmedCount: number;
  totalPayments: number;
  color: string;
}

/** Animated progress bar with percentage + payment counter. */
export function AgreementProgress({ progress, confirmedCount, totalPayments, color }: Props) {
  const anim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 420, useNativeDriver: false }).start();
  }, [anim, progress]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${percent}% completed, ${confirmedCount} of ${totalPayments} payments confirmed`}>
      <View style={styles.labelRow}>
        <Text style={styles.percent}>{percent}% Completed</Text>
        <Text style={styles.counter}>
          {confirmedCount} of {totalPayments} payments confirmed
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  percent: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
  counter: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  track: {
    height: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.09)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
