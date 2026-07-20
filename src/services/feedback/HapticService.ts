import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback. Components must NOT call expo-haptics directly —
 * always go through this service (or EmotionFeedbackService).
 * Fires asynchronously, no-ops on web, and swallows unsupported-device errors.
 */
let enabled = true;

const run = (fn: () => Promise<void>) => {
  if (!enabled || Platform.OS === 'web') return;
  // Fire-and-forget so haptics never block the JS thread / navigation.
  fn().catch(() => {});
};

export const HapticService = {
  /** Toggle globally (e.g. to honor a device/user "reduce haptics" preference). */
  setEnabled(value: boolean) {
    enabled = value;
  },
  selection: () => run(() => Haptics.selectionAsync()),
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
