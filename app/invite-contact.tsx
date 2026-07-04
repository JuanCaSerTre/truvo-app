import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';

export default function InviteContactScreen() {
  const { createContact } = useTruvoStore();
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      Alert.alert('Enter a valid email');
      return;
    }
    try {
      setLoading(true);
      await createContact({
        contactEmail: normalizedEmail,
        contactName: contactName.trim() || undefined,
      });
      Alert.alert('Contact saved', 'This contact will appear as a suggestion when you create a new agreement.');
      router.back();
    } catch (error) {
      Alert.alert('Could not save contact', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View>
        <Text style={styles.title}>Invite contact</Text>
        <Text style={styles.copy}>Save a trusted contact by email. TRUVO will suggest them when you create agreements.</Text>
      </View>
      <View style={styles.card}>
        <FormInput label="Contact email" value={contactEmail} onChangeText={setContactEmail} placeholder="friend@example.com" keyboardType="email-address" autoCapitalize="none" />
        <FormInput label="Contact name optional" value={contactName} onChangeText={setContactName} placeholder="Name" />
      </View>
      <PrimaryButton label="Save contact" onPress={save} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  copy: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
});
