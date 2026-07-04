import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Notification } from '@/types/models';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { getRelativeTime, isImportantNotification, notificationMeta } from '@/utils/notifications';

export type NotificationAction = {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  onPress: () => void;
};

interface Props {
  notification: Notification;
  actions?: NotificationAction[];
  onPress: () => void;
  onMarkRead: () => void;
  onRemove: () => void;
}

export function NotificationItem({ notification, actions = [], onPress, onMarkRead, onRemove }: Props) {
  const meta = notificationMeta[notification.type];
  const swipeableRef = useRef<Swipeable>(null);
  const unreadPulse = useRef(new Animated.Value(notification.read ? 0 : 1)).current;
  const important = isImportantNotification(notification);

  useEffect(() => {
    if (notification.read) {
      unreadPulse.setValue(0);
      return;
    }

    const animation = Animated.sequence([
      Animated.timing(unreadPulse, {
        toValue: 0.35,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(unreadPulse, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
    ]);
    Animated.loop(animation, { iterations: 2 }).start();
  }, [notification.read, unreadPulse]);

  const close = () => swipeableRef.current?.close();

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    close();
    if (direction === 'left') {
      onMarkRead();
      return;
    }
    onRemove();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => <SwipeAction label="Read" icon="checkmark-done-outline" color={colors.secondary} />}
      renderRightActions={() => (
        <SwipeAction label={important ? 'Archive' : 'Delete'} icon={important ? 'archive-outline' : 'trash-outline'} color={colors.danger} alignRight />
      )}
      onSwipeableOpen={handleSwipeOpen}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.item,
          !notification.read && styles.itemUnread,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.icon, { backgroundColor: meta.tint }]}>
          <Ionicons name={meta.icon} size={21} color={meta.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={2}>{notification.title}</Text>
            <Text style={styles.time}>{getRelativeTime(notification.createdAt)}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: meta.tint }]}>
              <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {!notification.read ? (
              <Animated.View style={[styles.unreadDot, { opacity: unreadPulse, transform: [{ scale: unreadPulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }] }]} />
            ) : null}
          </View>
          {actions.length ? (
            <View style={styles.actions}>
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    action.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles[action.variant || 'primary'],
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.actionText, action.variant === 'outline' && styles.actionTextOutline]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Swipeable>
  );
}

function SwipeAction({
  label,
  icon,
  color,
  alignRight = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  alignRight?: boolean;
}) {
  return (
    <View style={[styles.swipeAction, { backgroundColor: color }, alignRight && styles.swipeActionRight]}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
      <Text style={styles.swipeActionText}>{label}</Text>
    </View>
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  itemUnread: {
    backgroundColor: '#F0FDF9',
    borderColor: '#A7F3D0',
  },
  pressed: {
    opacity: 0.76,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '900',
    lineHeight: 21,
  },
  time: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: 2,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '600',
  },
  metaRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryPill: {
    minHeight: 24,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  actionButton: {
    minHeight: 36,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '900',
  },
  actionTextOutline: {
    color: colors.primary,
  },
  swipeAction: {
    width: 104,
    marginVertical: 2,
    borderRadius: radii.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  swipeActionRight: {
    marginLeft: spacing.sm,
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
