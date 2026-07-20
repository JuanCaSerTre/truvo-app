import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  name: string;
  email: string;
  senderName: string;
}

const INCLUDES = ['Personal invitation', 'Secure signup link', 'Your name', 'Access to agreements'];

/** Live preview of the invitation the recipient will get, updating as the user types. */
export function InvitationPreview({ name, email, senderName }: Props) {
  const display = name.trim() || email.split('@')[0] || 'Your contact';
  return (
    <Reanimated.View entering={FadeIn.duration(240)} style={styles.card}>
      <Text style={styles.eyebrow}>INVITATION PREVIEW</Text>
      <View style={styles.recipientRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(display)}</Text>
        </View>
        <View style={styles.recipientCopy}>
          <Text style={styles.name} numberOfLines={1}>
            {display}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {email.trim() || 'their@email.com'}
          </Text>
        </View>
      </View>

      <Text style={styles.subhead}>They will receive</Text>
      <View style={styles.list}>
        {INCLUDES.map((item) => (
          <View key={item} style={styles.listRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
            <Text style={styles.listText}>{item === 'Your name' ? `Your name (${senderName})` : item}</Text>
          </View>
        ))}
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: spacing.md,
  },
  eyebrow: {
    color: '#047857',
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '900',
  },
  recipientCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  email: {
    color: '#047857',
    fontSize: typography.small,
    fontWeight: '700',
  },
  subhead: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  list: {
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
  },
});
