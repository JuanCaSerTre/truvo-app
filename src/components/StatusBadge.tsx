import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  status: string;
}

const statusColor = (status: string) => {
  if (status.includes('active') || status.includes('confirmed') || status.includes('completed')) return colors.secondary;
  if (status.includes('pending')) return colors.warning;
  if (status.includes('reject') || status.includes('cancel')) return colors.danger;
  return colors.info;
};

export function StatusBadge({ status }: Props) {
  const color = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.text, { color }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
