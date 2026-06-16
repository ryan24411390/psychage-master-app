import { type ReactNode, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DURATION, REDUCED_MOTION_FADE_MS, SPRING_PRESETS, useReducedMotion } from '@/lib/motion';

// Reusable bottom sheet: dim backdrop (fade) + weighted slide-up panel with
// velocity-aware drag-to-dismiss. Generalises the ConfirmSheet/CheckInSheet
// overlay grammar so every non-destructive sheet animates identically.
//
// Reduced motion: no drag physics, no slide — the panel is in place instantly and
// the backdrop does the project-canonical 200ms cross-fade; backdrop tap dismisses
// immediately. (Convention: never put a swipe-dismiss on a *destructive* confirm —
// those stay native modals so a stray flick can't trigger an irreversible action.)
//
// Spring configs come only from SPRING_PRESETS — no inline damping/stiffness here.
// The three constants below are interaction thresholds (px / px·s⁻¹), not motion
// tokens, so they live local to the gesture.

/** Drag distance (px) past which release dismisses. */
const DRAG_DISMISS_DISTANCE = 120;
/** Downward flick velocity (px/s) that dismisses regardless of distance. */
const DRAG_DISMISS_VELOCITY = 800;
/** Off-screen rest target the panel springs from on enter / to on dismiss. */
const SHEET_OFFSET = 600;

type AnimatedSheetProps = {
  /** Fired when the sheet is dismissed (backdrop tap or drag-past-threshold). Parent unmounts. */
  onDismiss: () => void;
  children: ReactNode;
  /** Override the panel container classes. Defaults to the standard surface card. */
  panelClassName?: string;
};

export function AnimatedSheet({ onDismiss, children, panelClassName }: AnimatedSheetProps) {
  const reduced = useReducedMotion();
  const translateY = useSharedValue(reduced ? 0 : SHEET_OFFSET);

  useEffect(() => {
    if (!reduced) {
      translateY.value = withSpring(0, SPRING_PRESETS.deep);
    }
  }, [reduced, translateY]);

  // Backdrop tap (JS thread). Reduced motion → unmount immediately; otherwise
  // slide the panel out and dismiss on settle.
  const slideOutAndDismiss = () => {
    if (reduced) {
      onDismiss();
      return;
    }
    translateY.value = withSpring(SHEET_OFFSET, SPRING_PRESETS.deep, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  };

  const pan = Gesture.Pan()
    .enabled(!reduced)
    .onUpdate((e) => {
      // Downward only — the sheet never lifts above its rest position.
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DRAG_DISMISS_DISTANCE || e.velocityY > DRAG_DISMISS_VELOCITY) {
        translateY.value = withSpring(SHEET_OFFSET, SPRING_PRESETS.deep, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
      } else {
        translateY.value = withSpring(0, SPRING_PRESETS.deep);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(reduced ? REDUCED_MOTION_FADE_MS : DURATION.base)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40 dark:bg-black/60"
    >
      <Pressable
        // Tap-to-dismiss backdrop. Hidden from a11y — the sheet's own Cancel/close
        // control is the accessible dismiss path (avoids a duplicate element).
        testID="animated-sheet-backdrop"
        accessibilityElementsHidden
        importantForAccessibility="no"
        className="flex-1"
        onPress={slideOutAndDismiss}
      />
      <GestureDetector gesture={pan}>
        <Animated.View
          style={panelStyle}
          className={panelClassName ?? 'gap-4 rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark'}
        >
          {/* Grab-handle affordance — signals the panel is draggable. */}
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-charcoal-900/15 dark:bg-white/20" />
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
