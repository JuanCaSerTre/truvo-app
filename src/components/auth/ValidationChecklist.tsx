import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { passwordRules, passwordScore } from '@/utils/validation';

interface Props {
  password: string;
}

const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [colors.danger, colors.warning, colors.info, colors.secondary];

/** Live password strength bar + requirements checklist. */
export function ValidationChecklist({ password }: Props) {
  const score = passwordScore(password);
  const active = Math.max(0, score - 1);
  const barColor = score === 0 ? colors.border : STRENGTH_COLORS[active];

  return (
    <View style={styles.container}>
      <View style={styles.strengthRow}>
        {passwordRules.map((_, index) => (
          <View
            key={index}
            style={[styles.strengthSegment, { backgroundColor: index < score ? barColor : colors.surfaceMuted }]}
          />
        ))}
      </View>
      {score > 0 ? <Text style={[styles.strengthLabel, { color: barColor }]}>{STRENGTH_LABELS[active]} password</Text> : null}

      <View style={styles.checklist}>
        {passwordRules.map((rule) => {
          const met = rule.test(password);
          return (
            <View key={rule.key} style={styles.checkItem}>
              <Ionicons
                name={met ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={met ? colors.secondary : colors.textMuted}
              />
              <Text style={[styles.checkText, met && styles.checkTextMet]}>{rule.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    height: 5,
    borderRadius: radii.pill,
  },
  strengthLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
  checklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '50%',
  },
  checkText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  checkTextMet: {
    color: colors.text,
  },
});
