import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatDate } from '@/utils/money';

interface Props {
  notification: Notification;
  onPress: () => void;
}

export function NotificationItem({ notification, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={[styles.icon, !notification.read && styles.iconUnread]}>
        <Ionicons name="notifications-outline" size={20} color={notification.read ? colors.textMuted : colors.secondary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.date}>{formatDate(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.76,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  iconUnread: {
    backgroundColor: '#D1FAE5',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
