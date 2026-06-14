import type { CheckInState } from '@psychage/shared/check-in';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { StateRows } from '@/components/check-in/StateRows';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Minimal S4 check-in entry point (sub-slice E). NOT the full S4 sheet — the note
// field + full anatomy are a separate later order. State-only: the five-state
// selector (C0.4) + save → onSave(state) → close, enough to drive the home-side
// Imprint/status/terrain/bridge. Renders as a bottom-sheet OVERLAY so it sits UNDER
// the global header (the Help-now pill stays reachable). Appears with the settle
// verb; reduced motion = in place. Store-agnostic (the container owns saveToday).

type CheckInSheetProps = {
  onSave: (state: CheckInState) => void;
  onClose: () => void;
};

export function CheckInSheet({ onSave, onClose }: CheckInSheetProps) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<CheckInState | null>(null);

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="flex-1"
        onPress={onClose}
      />
      <Animated.View
        entering={
          reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))
        }
        className="rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark"
      >
        <View className="mb-3 flex-row items-start justify-between">
          <Text variant="heading">How are you right now?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={onClose}
          >
            <X size={22} color={colors.charcoal[600]} />
          </Pressable>
        </View>

        <StateRows value={selected} onChange={setSelected} />

        <Button
          variant="primary"
          className="mt-4"
          disabled={selected === null}
          onPress={() => {
            if (selected !== null) onSave(selected);
          }}
        >
          Save today’s entry
        </Button>
        <Text
          variant="caption"
          className="mt-2 text-center text-text-tertiary dark:text-text-tertiary-dark"
        >
          Stays on your phone.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
