import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { PrimaryInput } from '@/components/auth/PrimaryInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { InvitationPreview } from './InvitationPreview';
import { isValidEmail, normalizeEmail } from '@/utils/validation';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  senderName: string;
  loading: boolean;
  onInvite: (email: string, name: string) => void;
}

/** Premium invitation entry point that expands into a form + live preview. */
export function InvitationCard({ senderName, loading, onInvite }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const normalized = normalizeEmail(email);
  const emailValid = isValidEmail(normalized);

  if (!expanded) {
    return (
      <View style={styles.card}>
        <View style={styles.illustration}>
          <View style={styles.illustrationRing}>
            <Ionicons name="person-add" size={30} color={colors.secondary} />
          </View>
        </View>
        <Text style={styles.title}>Invite Someone</Text>
        <Text style={styles.description}>Invite someone by email so you can securely create agreements together.</Text>
        <PrimaryButton label="Invite by Email" onPress={() => setExpanded(true)} style={styles.cta} />
      </View>
    );
  }

  return (
    <Reanimated.View entering={FadeInDown.duration(260)} style={styles.card}>
      <View style={styles.formHeader}>
        <Text style={styles.title}>Invite Someone</Text>
        <Text style={styles.description}>They'll get a secure signup link to create agreements with you.</Text>
      </View>

      <View style={styles.form}>
        <PrimaryInput
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          validity={email.length === 0 ? 'neutral' : emailValid ? 'valid' : 'invalid'}
        />
        <PrimaryInput label="Name (optional)" icon="person-outline" value={name} onChangeText={setName} autoCapitalize="words" />
      </View>

      {email.length > 0 || name.length > 0 ? <InvitationPreview name={name} email={email} senderName={senderName} /> : null}

      <View style={styles.actions}>
        <PrimaryButton label="Cancel" variant="outline" onPress={() => setExpanded(false)} style={styles.actionButton} />
        <PrimaryButton label="Send Invitation" onPress={() => onInvite(normalized, name)} loading={loading} disabled={!emailValid} style={styles.actionButton} />
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  illustrationRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 21,
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.sm,
  },
  formHeader: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
