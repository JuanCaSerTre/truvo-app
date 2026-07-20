import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackTone, ToastRequest } from '@/services/feedback/EmotionFeedbackService';
import { colors, radii, spacing, typography } from '@/constants/theme';

const toneMeta: Record<FeedbackTone, { icon: keyof typeof Ionicons.glyphMap; color: string; tint: string }> = {
  success: { icon: 'checkmark-circle', color: '#059669', tint: '#D1FAE5' },
  error: { icon: 'alert-circle', color: colors.danger, tint: '#FEE2E2' },
  warning: { icon: 'warning', color: '#B45309', tint: '#FEF3C7' },
  info: { icon: 'information-circle', color: colors.info, tint: '#DBEAFE' },
};

/** Top-anchored toast. Rendered by FeedbackProvider; enters/exits with spring fades. */
export function AnimatedToast({ toast }: { toast: ToastRequest }) {
  const meta = toneMeta[toast.tone];
  return (
    <SafeAreaView edges={['top']} style={styles.safe} pointerEvents="none">
      <Animated.View entering={FadeInUp.springify().damping(16)} exiting={FadeOutUp.duration(180)} style={styles.toast}>
        <View style={[styles.iconWrap, { backgroundColor: meta.tint }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 460,
    alignSelf: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '900',
  },
  message: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 17,
  },
});
