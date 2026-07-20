import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  steps: string[];
  current: number;
}

/** Premium horizontal stepper: completed = green check, current = highlighted, future = visible. */
export function AgreementStepper({ steps, current }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Create Agreement</Text>
        <Text style={styles.counter}>
          Step {current + 1} of {steps.length}
        </Text>
      </View>
      <View style={styles.row}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <React.Fragment key={step}>
              <View style={styles.node}>
                <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                  {done ? (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.dotNum, active && styles.dotNumActive]}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[styles.label, (done || active) && styles.labelActive]} numberOfLines={1}>
                  {step}
                </Text>
              </View>
              {index < steps.length - 1 ? <Connector filled={index < current} /> : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

function Connector({ filled }: { filled: boolean }) {
  const progress = useDerivedValue(() => withTiming(filled ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) }));
  const style = useAnimatedStyle(() => ({ opacity: 0.25 + progress.value * 0.75, backgroundColor: filled ? colors.secondary : colors.border }));
  return (
    <View style={styles.connectorTrack}>
      <Animated.View style={[styles.connectorFill, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  counter: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  node: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 68,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dotDone: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotNum: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '900',
  },
  dotNumActive: {
    color: '#FFFFFF',
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  labelActive: {
    color: colors.text,
  },
  connectorTrack: {
    flex: 1,
    height: 2,
    marginTop: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  connectorFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
  },
});
