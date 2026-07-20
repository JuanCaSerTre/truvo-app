import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export type DraftStatus = 'draft' | 'ready';

/** Draft / Ready to Send pill for the Live Agreement, pulses on change. */
export function AgreementStatusBadge({ status }: { status: DraftStatus }) {
  const ready = status === 'ready';
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulse.setValue(0.9);
    Animated.spring(pulse, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
  }, [status, pulse]);

  return (
    <Animated.View style={[styles.badge, ready ? styles.ready : styles.draft, { transform: [{ scale: pulse }] }]}>
      {ready ? <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" /> : null}
      <Text style={[styles.text, ready ? styles.readyText : styles.draftText]}>{ready ? 'Ready to Send' : 'Draft'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  draft: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  ready: {
    backgroundColor: colors.secondary,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftText: {
    color: '#CBD5E1',
  },
  readyText: {
    color: '#FFFFFF',
  },
});
