import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Large celebratory success card shown after account creation. */
export function SuccessCard({ title, description, primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.card}>
      <Animated.View entering={ZoomIn.delay(120).duration(360)} style={styles.illustration}>
        <View style={styles.ring} />
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.actions}>
        <PrimaryButton label={primaryLabel} onPress={onPrimary} />
        {secondaryLabel && onSecondary ? (
          <PrimaryButton label={secondaryLabel} variant="outline" onPress={onSecondary} />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
  },
  illustration: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    backgroundColor: '#ECFDF5',
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
