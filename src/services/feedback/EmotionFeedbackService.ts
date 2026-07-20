import { HapticService } from './HapticService';

export type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastRequest {
  tone: FeedbackTone;
  title: string;
  message?: string;
}

type ToastListener = (toast: ToastRequest) => void;

/**
 * The single entry point for emotional feedback: pairs a haptic with a visual toast.
 * Components/services call these methods; the FeedbackProvider subscribes and renders
 * the overlay. This guarantees haptics are never fired "naked" without a visual.
 */
let listener: ToastListener | null = null;

const emit = (toast: ToastRequest) => listener?.(toast);

export const EmotionFeedbackService = {
  /** Wired by FeedbackProvider on mount. */
  _register(fn: ToastListener | null) {
    listener = fn;
  },

  success(title: string, message?: string) {
    HapticService.success();
    emit({ tone: 'success', title, message });
  },
  error(title: string, message?: string) {
    HapticService.error();
    emit({ tone: 'error', title, message });
  },
  warning(title: string, message?: string) {
    HapticService.warning();
    emit({ tone: 'warning', title, message });
  },
  info(title: string, message?: string) {
    HapticService.selection();
    emit({ tone: 'info', title, message });
  },

  // Haptic-only helpers for lightweight interactions (button/tab/selection).
  selection: HapticService.selection,
  light: HapticService.light,
  medium: HapticService.medium,
};
