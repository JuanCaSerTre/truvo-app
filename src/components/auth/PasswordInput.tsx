import React, { forwardRef, useState } from 'react';
import { TextInput } from 'react-native';
import { PrimaryInput } from './PrimaryInput';

type Validity = 'neutral' | 'valid' | 'invalid';

interface Props {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  validity?: Validity;
  textContentType?: 'password' | 'newPassword';
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

/** Password field with a built-in show/hide toggle, composed from PrimaryInput. */
export const PasswordInput = forwardRef<TextInput, Props>(function PasswordInput(
  { label = 'Password', value, onChangeText, validity = 'neutral', textContentType = 'password', returnKeyType, onSubmitEditing, blurOnSubmit },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <PrimaryInput
      ref={ref}
      label={label}
      icon="lock-closed-outline"
      value={value}
      onChangeText={onChangeText}
      validity={validity}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={textContentType}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={blurOnSubmit}
      trailingIcon={visible ? 'eye-off-outline' : 'eye-outline'}
      onTrailingPress={() => setVisible((prev) => !prev)}
    />
  );
});
