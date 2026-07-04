import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { colors, radii } from '@/constants/theme';

interface Props {
  value: number;
}

export function ProgressBar({ value }: Props) {
  const width = `${Math.max(0, Math.min(value, 1)) * 100}%` as DimensionValue;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: radii.pill,
  },
});
