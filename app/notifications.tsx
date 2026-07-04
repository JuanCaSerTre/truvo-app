import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { NotificationItem } from '@/components/NotificationItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';

export default function NotificationsScreen() {
  const { currentUser, notifications, markNotificationRead } = useTruvoStore();
  const userNotifications = notifications.filter((notification) => notification.userId === currentUser.id);
  const openNotification = (notification: (typeof userNotifications)[number]) => {
    markNotificationRead(notification.id);
    if (notification.relatedPaymentId) {
      router.push(`/payment-confirmation/${notification.relatedPaymentId}`);
      return;
    }
    if (notification.relatedAgreementId) {
      router.push(`/agreement/${notification.relatedAgreementId}`);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Notifications</Text>
      {userNotifications.length === 0 ? (
        <EmptyState title="No notifications" message="Agreement and payment updates will appear here." />
      ) : (
        userNotifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onPress={() => openNotification(notification)} />
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
