import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { MILESTONES_COPY } from '@/features/milestones/copy';
import { useHaptics } from '@/lib/haptic-context';
import { SPRING_PRESETS, useReducedMotion } from '@/lib/motion';

// A single warm celebration when a cumulative milestone is reached. Reward-direction
// only: a teal medallion pops in + the 'celebrate' haptic fires once. NO mascot (parked),
// NO hot/urgent framing, NO loss language. Reduced-motion: the pop is dropped and it
// simply appears (non-essential motion → disabled, per the design contract). Auto-
// dismisses; tap anywhere to dismiss sooner. Fires once — the caller only mounts it on a
// newly-reached milestone, and the reached set is persisted so it never re-fires.

const AUTO_DISMISS_MS = 2400;

type CelebrationOverlayProps = {
  /** The reached threshold being celebrated (e.g. 10, 30, 100, 250). */
  threshold: number;
  onDismiss: () => void;
};

export function CelebrationOverlay({ threshold, onDismiss }: CelebrationOverlayProps) {
  const reduced = useReducedMotion();
  const { fireHaptic } = useHaptics();
  const scale = useSharedValue(reduced ? 1 : 0.7);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    fireHaptic('celebrate');
    if (!reduced) scale.value = withSpring(1, SPRING_PRESETS.bouncy);
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [fireHaptic, onDismiss, reduced, scale]);

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(200)}
      className="absolute inset-0 z-50"
    >
      {/* @design-purpose: dim scrim focuses the one-off celebration; tap anywhere dismisses */}
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={MILESTONES_COPY.celebrateDismiss}
        className="flex-1 items-center justify-center bg-black/40 px-8"
      >
        <Animated.View
          style={cardStyle}
          accessibilityRole="alert"
          accessibilityLabel={MILESTONES_COPY.celebrateA11y(threshold)}
          className="items-center gap-3 rounded-3xl bg-surface px-10 py-10 dark:bg-surface-dark"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary dark:bg-primary-dark">
            <Text variant="heading" className="text-white">
              {threshold}
            </Text>
          </View>
          <Text
            variant="caption"
            className="uppercase tracking-widest text-text-tertiary dark:text-text-tertiary-dark"
          >
            {MILESTONES_COPY.celebrateEyebrow}
          </Text>
          <Text variant="heading">{MILESTONES_COPY.celebrateTitle(threshold)}</Text>
          <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
            {MILESTONES_COPY.celebrateBody}
          </Text>
          <Text variant="bodySm" className="mt-2 text-text-tertiary dark:text-text-tertiary-dark">
            {MILESTONES_COPY.celebrateDismiss}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
