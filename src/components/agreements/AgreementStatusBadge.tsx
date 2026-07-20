import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Agreement } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';

const statusTheme = (status: Agreement['status']) => {
  if (status === 'active') return { background: '#DBEAFE', text: colors.info };
  if (status === 'completed') return { background: '#D1FAE5', text: '#059669' };
  if (status === 'rejected') return { background: '#FEE2E2', text: colors.danger };
  if (status === 'cancelled') return { background: '#F1F5F9', text: colors.textMuted };
  return { background: '#FEF3C7', text: '#B45309' }; // pending
};

/** Lifecycle status pill (Active / Pending / Completed / Cancelled), pulses on change. */
export function AgreementStatusBadge({ status }: { status: Agreement['status'] }) {
  const theme = statusTheme(status);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulse.setValue(0.94);
    Animated.spring(pulse, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, [status, pulse]);

  return (
    <Animated.View style={[styles.badge, { backgroundColor: theme.background, transform: [{ scale: pulse }] }]}>
      <Text style={[styles.text, { color: theme.text }]}>{status.replace(/_/g, ' ')}</Text>
    </Animated.View>
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
    fontWeight: '900',
    textTransform: 'capitalize',
  },
});
