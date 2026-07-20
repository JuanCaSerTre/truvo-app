import { HapticService } from '@/services/feedback/HapticService';

/**
 * Back-compat shim. New code should import HapticService or EmotionFeedbackService
 * directly; this keeps existing call-sites (navigation, action hub) centralized.
 */
export const haptics = {
  selection: HapticService.selection,
  light: HapticService.light,
  medium: HapticService.medium,
  success: HapticService.success,
};
