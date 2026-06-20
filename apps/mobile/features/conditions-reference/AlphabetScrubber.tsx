import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';
import { DURATION, useReducedMotion } from '@/lib/motion';

// Right-edge A–Z index (iOS Contacts idiom). Renders the full alphabet + '#'; letters
// with no rows are dimmed but still resolve to the nearest present letter at/after them
// (true Contacts behaviour) so every touch lands somewhere. A pan over the strip jumps
// the list via the parent's onSelectLetter. A floating bubble shows the active letter
// while dragging — animation gated by reduce-motion (DESIGN.mobile.md §3.1 two-tier).
//
// Uses the RN responder system (no gesture-handler dep) — the strip is a single touch
// target; locationY → letter index. Haptic fires only when the resolved letter changes.

const ALPHABET: readonly string[] = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'];

type Props = {
  /** Letters that actually have rows (from buildIndex.letters). */
  readonly present: readonly string[];
  /** Jump the list to a present letter's section header. */
  readonly onSelectLetter: (letter: string) => void;
};

export function AlphabetScrubber({ present, onSelectLetter }: Props) {
  const reduced = useReducedMotion();
  const { fireHaptic } = useHaptics();
  const presentSet = useMemo(() => new Set(present), [present]);

  const [active, setActive] = useState<string | null>(null);
  const heightRef = useRef(0);
  const lastResolved = useRef<string | null>(null);

  const bubbleOpacity = useSharedValue(0);
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: bubbleOpacity.value }));

  // Nearest present letter at/after `touched`, else the closest before it.
  const resolve = useCallback(
    (touched: string): string | null => {
      if (presentSet.has(touched)) return touched;
      const idx = ALPHABET.indexOf(touched);
      for (let i = idx; i < ALPHABET.length; i += 1) {
        const l = ALPHABET[i];
        if (l && presentSet.has(l)) return l;
      }
      for (let i = idx; i >= 0; i -= 1) {
        const l = ALPHABET[i];
        if (l && presentSet.has(l)) return l;
      }
      return null;
    },
    [presentSet],
  );

  const show = useCallback(() => {
    bubbleOpacity.value = reduced ? 1 : withTiming(1, { duration: DURATION.quick });
  }, [bubbleOpacity, reduced]);

  const hide = useCallback(() => {
    setActive(null);
    lastResolved.current = null;
    bubbleOpacity.value = reduced ? 0 : withTiming(0, { duration: DURATION.base });
  }, [bubbleOpacity, reduced]);

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      const h = heightRef.current;
      if (h <= 0) return;
      const y = e.nativeEvent.locationY;
      const i = Math.min(ALPHABET.length - 1, Math.max(0, Math.floor((y / h) * ALPHABET.length)));
      const touched = ALPHABET[i];
      if (!touched) return;
      setActive(touched);
      const target = resolve(touched);
      if (target && target !== lastResolved.current) {
        lastResolved.current = target;
        fireHaptic('tab');
        onSelectLetter(target);
      }
    },
    [fireHaptic, onSelectLetter, resolve],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    heightRef.current = e.nativeEvent.layout.height;
  }, []);

  // Screen-reader path: an adjustable that steps through PRESENT letters.
  const stepActive = useCallback(
    (dir: 1 | -1) => {
      if (present.length === 0) return;
      const cur = lastResolved.current ?? present[0] ?? null;
      const idx = cur ? present.indexOf(cur) : 0;
      const next = present[Math.min(present.length - 1, Math.max(0, idx + dir))];
      if (next) {
        lastResolved.current = next;
        setActive(next);
        fireHaptic('tab');
        onSelectLetter(next);
      }
    },
    [fireHaptic, onSelectLetter, present],
  );

  if (present.length === 0) return null;

  return (
    <View className="absolute bottom-0 right-0 top-0 justify-center" pointerEvents="box-none">
      {active ? (
        <Animated.View
          style={bubbleStyle}
          className="absolute right-9 h-12 w-12 items-center justify-center rounded-full bg-text-primary/90 dark:bg-text-primary-dark/90"
          pointerEvents="none"
        >
          <Text variant="h3" className="text-background dark:text-background-dark">
            {active}
          </Text>
        </Animated.View>
      ) : null}

      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Alphabet index"
        accessibilityValue={active ? { text: active } : undefined}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') stepActive(1);
          else if (e.nativeEvent.actionName === 'decrement') stepActive(-1);
        }}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          show();
          handleTouch(e);
        }}
        onResponderMove={handleTouch}
        onResponderRelease={hide}
        onResponderTerminate={hide}
        hitSlop={{ left: 8, right: 4 }}
        className="w-7 items-center justify-center py-2 pr-1"
      >
        {ALPHABET.map((letter) => (
          <Text
            key={letter}
            variant="caption"
            className={`text-[10px] leading-[13px] ${
              presentSet.has(letter)
                ? 'font-sans-bold text-teal-700 dark:text-primary-dark'
                : 'text-text-tertiary/40 dark:text-text-tertiary-dark/40'
            }`}
          >
            {letter}
          </Text>
        ))}
      </View>
    </View>
  );
}
