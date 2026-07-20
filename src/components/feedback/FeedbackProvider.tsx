import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { AnimatedToast } from './AnimatedToast';
import { EmotionFeedbackService, ToastRequest } from '@/services/feedback/EmotionFeedbackService';
import { AnimationService } from '@/services/feedback/AnimationService';

/**
 * Mounts once near the app root. Renders the toast overlay and syncs the OS
 * "reduce motion" setting into AnimationService so every animation honors it.
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastRequest & { id: number }) | null>(null);
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    EmotionFeedbackService._register((request) => {
      counter.current += 1;
      setToast({ ...request, id: counter.current });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 2800);
    });
    return () => {
      EmotionFeedbackService._register(null);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && AnimationService.setReduceMotion(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => AnimationService.setReduceMotion(value));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <>
      {children}
      {toast ? <AnimatedToast key={toast.id} toast={toast} /> : null}
    </>
  );
}
