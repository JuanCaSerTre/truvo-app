import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  title: string;
  text: string;
}

/** Visually secondary information card with a shield icon, for the legal disclaimer. */
export function InformationCard({ title, text }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name="shield-outline" size={20} color={colors.textMuted} style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  icon: {
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '800',
  },
  text: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
