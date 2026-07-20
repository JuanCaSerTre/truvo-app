import { Easing } from 'react-native-reanimated';

/**
 * Shared animation tokens so motion feels consistent across TRUVO.
 * `reduceMotion` is toggled by the FeedbackProvider from the OS setting; when true,
 * durations collapse to ~0 so transitions are instant but state still changes.
 */
let reduceMotion = false;

export const AnimationService = {
  setReduceMotion(value: boolean) {
    reduceMotion = value;
  },
  get reduced() {
    return reduceMotion;
  },
  /** Duration helper — returns 0 when reduce-motion is on. */
  duration(ms: number) {
    return reduceMotion ? 0 : ms;
  },
  timing: {
    fast: () => ({ duration: reduceMotion ? 0 : 160, easing: Easing.out(Easing.cubic) }),
    base: () => ({ duration: reduceMotion ? 0 : 260, easing: Easing.out(Easing.cubic) }),
    slow: () => ({ duration: reduceMotion ? 0 : 420, easing: Easing.out(Easing.cubic) }),
  },
  spring: {
    press: () => ({ damping: 15, stiffness: 220, mass: 0.6 }),
    bouncy: () => ({ damping: 10, stiffness: 180, mass: 0.7 }),
  },
};
