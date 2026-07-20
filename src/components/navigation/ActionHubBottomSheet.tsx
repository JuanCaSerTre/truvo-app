import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionCard } from './ActionCard';
import { ACTION_HUB_ITEMS, ActionHubItem } from './actionHubConfig';
import { haptics } from '@/utils/haptics';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: ActionHubItem) => void;
}

const TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

/**
 * The Action Hub — a native-feeling bottom sheet built on reanimated + gesture-handler
 * (no extra sheet dependency). Slides up over a blurred backdrop, swipe-down to dismiss.
 */
export function ActionHubBottomSheet({ visible, onClose, onSelect }: Props) {
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);
  const [mounted, setMounted] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdrop.value = withTiming(1, TIMING);
      translateY.value = withTiming(0, TIMING);
    } else if (mounted) {
      backdrop.value = withTiming(0, TIMING);
      translateY.value = withTiming(height, TIMING, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, height, backdrop, translateY, mounted]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, TIMING);
      }
    });

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close action menu"
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View style={[styles.sheetWrap, sheetStyle]}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <GestureDetector gesture={pan}>
            <View style={styles.handleZone}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <Text style={styles.title}>What would you like to do?</Text>

          <View style={styles.list}>
            {ACTION_HUB_ITEMS.map((item) => (
              <ActionCard
                key={item.key}
                item={item}
                onPress={() => {
                  haptics.light();
                  onSelect(item);
                }}
              />
            ))}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 16,
  },
  handleZone: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
});
