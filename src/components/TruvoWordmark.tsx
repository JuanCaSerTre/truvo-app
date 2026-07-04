import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  light?: boolean;
}

export function TruvoWordmark({ light }: Props) {
  const textColor = light ? '#FFFFFF' : colors.primary;
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: textColor }]}>TRU</Text>
      <View style={styles.vMark}>
        <View style={[styles.hand, styles.left]} />
        <View style={[styles.hand, styles.right]} />
      </View>
      <Text style={[styles.text, { color: textColor }]}>O</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 0,
  },
  vMark: {
    width: 30,
    height: 30,
    position: 'relative',
  },
  hand: {
    position: 'absolute',
    bottom: 2,
    width: 8,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  left: {
    left: 7,
    transform: [{ rotate: '-28deg' }],
  },
  right: {
    right: 7,
    transform: [{ rotate: '28deg' }],
  },
});
