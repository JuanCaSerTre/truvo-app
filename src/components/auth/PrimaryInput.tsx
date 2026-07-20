import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/constants/theme';

const AnimatedView = Animated.View;

type Validity = 'neutral' | 'valid' | 'invalid';

interface Props extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  validity?: Validity;
  /** Renders a show/hide affordance; controlled by the parent for password fields. */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  onTrailingPress?: () => void;
}

/** Premium text field: leading icon, floating label, animated focus + validity accent. */
export const PrimaryInput = forwardRef<TextInput, Props>(function PrimaryInput(
  { label, icon, validity = 'neutral', trailingIcon, onTrailingPress, value, onFocus, onBlur, style, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value && String(value).length > 0);
  const floated = focused || hasValue;

  const borderProgress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: 160 }));

  const borderColor =
    validity === 'invalid' ? colors.danger : validity === 'valid' ? colors.secondary : undefined;

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor:
      borderColor ??
      interpolateColor(borderProgress.value, [0, 1], [colors.border, colors.primary]),
  }));

  const accentColor =
    validity === 'invalid' ? colors.danger : validity === 'valid' ? colors.secondary : focused ? colors.primary : colors.textMuted;

  return (
    <View style={styles.wrapper}>
      <AnimatedView style={[styles.field, animatedBorder]}>
        <Ionicons name={icon} size={20} color={accentColor} style={styles.leadingIcon} />
        <View style={styles.inputColumn}>
          <Text style={[styles.floatingLabel, floated ? styles.floatingLabelUp : styles.floatingLabelDown, focused && !borderColor && styles.floatingLabelFocused, validity === 'valid' && styles.floatingLabelValid, validity === 'invalid' && styles.floatingLabelInvalid]}>
            {label}
          </Text>
          <TextInput
            ref={ref}
            value={value}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, floated && styles.inputWithLabel, style]}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        </View>
        {trailingIcon ? (
          <Pressable accessibilityRole="button" hitSlop={10} onPress={onTrailingPress} style={styles.trailing}>
            <Ionicons name={trailingIcon} size={20} color={colors.textMuted} />
          </Pressable>
        ) : validity === 'valid' ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.secondary} style={styles.trailing} />
        ) : null}
      </AnimatedView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  field: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  leadingIcon: {
    marginRight: spacing.md,
  },
  inputColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    color: colors.textMuted,
    fontWeight: '600',
  },
  floatingLabelDown: {
    fontSize: typography.body,
  },
  floatingLabelUp: {
    top: 8,
    fontSize: typography.caption,
  },
  floatingLabelFocused: {
    color: colors.primary,
  },
  floatingLabelValid: {
    color: colors.secondary,
  },
  floatingLabelInvalid: {
    color: colors.danger,
  },
  input: {
    color: colors.text,
    fontSize: typography.body,
    paddingVertical: 0,
  },
  inputWithLabel: {
    marginTop: 18,
  },
  trailing: {
    marginLeft: spacing.md,
  },
});
