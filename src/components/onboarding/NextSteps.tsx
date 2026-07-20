import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

/** Horizontal three-step "what happens next" strip with connecting chevrons. */
export function NextSteps({ steps }: { steps: Step[] }) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <View style={styles.step}>
            <View style={styles.iconWrap}>
              <Ionicons name={step.icon} size={20} color={colors.primary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>
            </View>
            <Text style={styles.label}>{step.label}</Text>
          </View>
          {index < steps.length - 1 ? (
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  chevron: {
    marginTop: 16,
  },
});
