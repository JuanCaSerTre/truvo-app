import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  label: string;
  value?: string | null;
  placeholder: string;
  emphasize?: boolean;
}

/**
 * A single line of the Live Agreement. When the resolved value changes it fades/slides
 * the new value in rather than snapping, so the document feels like it's evolving.
 * Falls back to a friendly muted placeholder when no value is present.
 */
export function AgreementField({ label, value, placeholder, emphasize }: Props) {
  const resolved = value && value.length > 0 ? value : placeholder;
  const isPlaceholder = !(value && value.length > 0);
  const anim = useRef(new Animated.Value(1)).current;
  const previous = useRef(resolved);

  useEffect(() => {
    if (previous.current === resolved) return;
    previous.current = resolved;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [anim, resolved]);

  const animatedStyle = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Animated.Text
        style={[styles.value, emphasize && styles.emphasize, isPlaceholder && styles.placeholder, animatedStyle]}
        numberOfLines={1}
        accessibilityLabel={`${label}: ${resolved}`}
      >
        {resolved}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 30,
  },
  label: {
    color: '#94A3B8',
    fontSize: typography.small,
    fontWeight: '700',
  },
  value: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  emphasize: {
    fontSize: typography.h3,
    fontWeight: '900',
  },
  placeholder: {
    color: '#64748B',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
