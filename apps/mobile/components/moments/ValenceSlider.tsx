import type { MomentValence } from '@psychage/shared/engagement';
import { View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { MOMENTS_COPY } from '@/features/moments/copy';
import { useReducedMotion } from '@/lib/motion';

// The 5-point valence control for a moment. A discrete slider: five stops, an
// ABSTRACT orb above that responds to the selection — it grows and takes the
// matching mood tint (color.mood.1..5). NOT the bone-clay mascot, and NOT a face:
// no mood-mirroring (engagement floor). The orb is a neutral shape, not a character.
//
// Accessibility: the track is an `adjustable` element (VoiceOver swipe up/down moves
// between stops); each stop is also directly tappable. Selection is shown by a ring +
// size, never color alone (color is reinforcement, not the sole signal).

const VALENCES: readonly MomentValence[] = [1, 2, 3, 4, 5];

// Mood tint per valence — className lookup (NativeWind classes only, Sacred Rule #9).
const ORB_FILL: Record<MomentValence, string> = {
  1: 'bg-mood-1',
  2: 'bg-mood-2',
  3: 'bg-mood-3',
  4: 'bg-mood-4',
  5: 'bg-mood-5',
};
const STOP_FILL: Record<MomentValence, string> = ORB_FILL;

// Orb grows with valence (lowest = smallest, highest = largest). Plain dp scale.
const ORB_SIZE: Record<MomentValence, number> = { 1: 56, 2: 68, 3: 80, 4: 92, 5: 104 };
const ORB_SIZE_EMPTY = 72;

type ValenceSliderProps = {
  value: MomentValence | null;
  onChange: (valence: MomentValence) => void;
};

export function ValenceSlider({ value, onChange }: ValenceSliderProps) {
  const reduced = useReducedMotion();

  const targetSize = value === null ? ORB_SIZE_EMPTY : ORB_SIZE[value];
  const orbStyle = useAnimatedStyle(() => ({
    width: reduced ? targetSize : withSpring(targetSize, { damping: 18, stiffness: 160, mass: 0.8 }),
    height: reduced ? targetSize : withSpring(targetSize, { damping: 18, stiffness: 160, mass: 0.8 }),
  }));

  const adjust = (delta: number) => {
    const current = value ?? 3;
    const next = Math.min(5, Math.max(1, current + delta)) as MomentValence;
    onChange(next);
  };

  return (
    <View className="items-center gap-5">
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
        {MOMENTS_COPY.valencePrompt}
      </Text>

      {/* Abstract responsive orb — morphs size + tint with the selection. */}
      <View className="h-28 items-center justify-center">
        <Animated.View
          style={orbStyle}
          className={`rounded-full ${value === null ? 'bg-surface-accent dark:bg-surface-accent-dark' : ORB_FILL[value]}`}
        />
      </View>

      {/* Five tappable stops + an adjustable track for VoiceOver. */}
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={MOMENTS_COPY.valencePrompt}
        accessibilityValue={value === null ? undefined : { min: 1, max: 5, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') adjust(1);
          if (e.nativeEvent.actionName === 'decrement') adjust(-1);
        }}
        className="w-full flex-row items-center justify-between"
      >
        {VALENCES.map((v) => {
          const isSelected = value === v;
          return (
            <AnimatedPressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={`Level ${v} of 5`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(v)}
              scaleTo={0.92}
              className="h-11 w-11 items-center justify-center"
            >
              <View
                className={`h-7 w-7 rounded-full ${STOP_FILL[v]} ${
                  isSelected
                    ? 'border-2 border-text-primary dark:border-text-primary-dark'
                    : 'opacity-40'
                }`}
              />
              {isSelected && (
                <Animated.View entering={reduced ? undefined : FadeIn.duration(150)}>
                  <Text
                    variant="caption"
                    className="mt-1 text-text-secondary dark:text-text-secondary-dark"
                  >
                    {v}
                  </Text>
                </Animated.View>
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
