import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { NotificationItem } from '@/components/NotificationItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';

export default function NotificationsScreen() {
  const { notifications, markNotificationRead } = useTruvoStore();
  return (
    <ScreenContainer>
      <Text style={styles.title}>Notifications</Text>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" message="Agreement and payment updates will appear here." />
      ) : (
        notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onPress={() => markNotificationRead(notification.id)} />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
});
