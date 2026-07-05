import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { NotificationAction, NotificationItem } from '@/components/NotificationItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { Notification } from '@/types/models';
import {
  groupNotificationsByDate,
  isImportantNotification,
  NotificationFilter,
  notificationFilters,
  notificationMeta,
} from '@/utils/notifications';

export default function NotificationsScreen() {
  const {
    currentUser,
    notifications,
    markNotificationRead,
    archiveNotification,
    deleteNotification,
    confirmPayment,
    rejectPayment,
  } = useTruvoStore();
  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>('all');

  const userNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => notification.userId === currentUser.id && !notification.archivedAt)
        .filter((notification) => {
          if (selectedFilter === 'all') return true;
          if (selectedFilter === 'unread') return !notification.read;
          return notificationMeta[notification.type].category === selectedFilter;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [currentUser.id, notifications, selectedFilter],
  );
  const groupedNotifications = groupNotificationsByDate(userNotifications);
  const unreadCount = notifications.filter((notification) => notification.userId === currentUser.id && !notification.archivedAt && !notification.read).length;

  const openNotification = (notification: Notification) => {
    markNotificationRead(notification.id);
    if ((notification.type === 'upcoming_payment_reminder' || notification.type === 'overdue_payment_reminder') && notification.relatedAgreementId) {
      router.push(`/payment-schedule/${notification.relatedAgreementId}` as never);
      return;
    }
    if (notification.relatedPaymentId) {
      router.push(`/payment-confirmation/${notification.relatedPaymentId}`);
      return;
    }
    if (notification.relatedAgreementId) {
      router.push(`/agreement/${notification.relatedAgreementId}`);
    }
  };

  const removeNotification = (notification: Notification) => {
    if (isImportantNotification(notification)) {
      archiveNotification(notification.id);
      return;
    }
    deleteNotification(notification.id);
  };

  const getActions = (notification: Notification): NotificationAction[] => {
    if (notification.type === 'new_agreement_request' && notification.relatedAgreementId) {
      return [
        {
          label: 'Review',
          onPress: () => {
            markNotificationRead(notification.id);
            router.push(`/agreement-request/${notification.relatedAgreementId}`);
          },
        },
        {
          label: 'Later',
          variant: 'outline',
          onPress: () => markNotificationRead(notification.id),
        },
      ];
    }

    if (notification.type === 'payment_waiting_confirmation' && notification.relatedPaymentId) {
      return [
        {
          label: 'Confirm',
          variant: 'secondary',
          onPress: async () => {
            try {
              await confirmPayment(notification.relatedPaymentId || '');
              markNotificationRead(notification.id);
            } catch (error) {
              Alert.alert('Could not confirm payment', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
        {
          label: 'Reject',
          variant: 'outline',
          onPress: async () => {
            try {
              await rejectPayment(notification.relatedPaymentId || '');
              markNotificationRead(notification.id);
            } catch (error) {
              Alert.alert('Could not reject payment', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
      ];
    }

    if ((notification.type === 'upcoming_payment_reminder' || notification.type === 'overdue_payment_reminder') && notification.relatedAgreementId) {
      return [
        {
          label: 'View Agreement',
          onPress: () => {
            markNotificationRead(notification.id);
            router.push(`/payment-schedule/${notification.relatedAgreementId}` as never);
          },
        },
      ];
    }

    return [];
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Activity center</Text>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'} need attention.` : "You're all caught up."}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/notification-settings' as never)} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {notificationFilters.map((filter) => {
          const selected = selectedFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedFilter(filter.id)}
              style={({ pressed }) => [
                styles.filterChip,
                selected && styles.filterChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {groupedNotifications.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        groupedNotifications.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.data.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                actions={getActions(notification)}
                onPress={() => openNotification(notification)}
                onMarkRead={() => markNotificationRead(notification.id)}
                onRemove={() => removeNotification(notification)}
              />
            ))}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function NotificationEmptyState() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyPhone}>
          <View style={styles.emptyPhoneLine} />
          <View style={styles.emptyPhoneLineShort} />
          <View style={styles.emptyPhonePill} />
        </View>
        <View style={styles.emptyCheck}>
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>You're all caught up.</Text>
      <Text style={styles.emptyText}>We'll notify you whenever something important happens.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '700',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filters: {
    gap: 6,
    paddingRight: spacing.lg,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  group: {
    gap: spacing.md,
  },
  groupTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  emptyCard: {
    minHeight: 420,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  emptyIllustration: {
    width: 142,
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhone: {
    width: 94,
    height: 118,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptyPhoneLine: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#CBD5E1',
  },
  emptyPhoneLineShort: {
    width: '72%',
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#E2E8F0',
  },
  emptyPhonePill: {
    width: 44,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: '#D1FAE5',
  },
  emptyCheck: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});
