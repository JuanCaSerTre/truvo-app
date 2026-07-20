import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initials } from '@/utils/dashboard';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  person: string;
  direction: 'Receive' | 'Pay';
  accent: string;
  tint: string;
}

/** Top row of the card: direction chip, initials avatar, and person name. */
export function AgreementHeader({ person, direction, accent, tint }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: tint }]}>
        <Text style={[styles.avatarText, { color: accent }]}>{initials(person)}</Text>
      </View>
      <View style={styles.copy}>
        <View style={[styles.directionChip, { backgroundColor: tint }]}>
          <Ionicons name={direction === 'Receive' ? 'arrow-down' : 'arrow-up'} size={11} color={accent} />
          <Text style={[styles.directionText, { color: accent }]}>{direction === 'Receive' ? 'You Receive' : 'You Pay'}</Text>
        </View>
        <Text style={styles.person} numberOfLines={1}>
          {person}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  directionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  person: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '900',
  },
});
