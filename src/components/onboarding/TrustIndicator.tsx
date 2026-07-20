import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

/** Compact single-line trust reassurance row. */
export function TrustIndicator({ icon, label }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.secondary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
  },
});
