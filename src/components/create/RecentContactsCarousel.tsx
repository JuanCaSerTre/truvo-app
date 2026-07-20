import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Contact } from '@/types/models';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  contacts: Contact[];
  selectedEmail?: string;
  onSelect: (contact: Contact) => void;
}

/** Horizontal carousel of recent contacts for quick borrower selection. */
export function RecentContactsCarousel({ contacts, selectedEmail, onSelect }: Props) {
  if (!contacts.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Recent contacts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {contacts.map((contact) => {
          const display = contact.contactName || contact.contactEmail;
          const active = selectedEmail?.toLowerCase() === contact.contactEmail.toLowerCase();
          return (
            <Pressable
              key={contact.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Select ${display}`}
              onPress={() => onSelect(contact)}
              style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.pressed]}
            >
              <View style={[styles.avatar, active && styles.avatarActive]}>
                <Text style={[styles.avatarText, active && styles.avatarTextActive]}>{initials(display)}</Text>
              </View>
              <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                {contact.contactName || contact.contactEmail.split('@')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: 2,
  },
  card: {
    width: 88,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.secondary,
    backgroundColor: '#ECFDF5',
  },
  pressed: {
    opacity: 0.75,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: colors.secondary,
  },
  avatarText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: '900',
  },
  avatarTextActive: {
    color: '#FFFFFF',
  },
  name: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  nameActive: {
    color: colors.primary,
  },
});
