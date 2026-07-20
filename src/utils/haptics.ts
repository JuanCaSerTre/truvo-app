import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Thin haptics wrapper — no-ops on web and swallows errors so callers stay clean. */
const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => {
    // haptics are best-effort; ignore unsupported-device errors
  });
};

export const haptics = {
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
