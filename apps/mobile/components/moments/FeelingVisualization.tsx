import type { MomentValence } from '@psychage/shared/engagement';
import { Canvas, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, PanResponder, View } from 'react-native';
import {
  Easing,
  interpolate,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { MOMENTS_COPY } from '@/features/moments/copy';
import { VALENCE_HEX } from '@/lib/colors';
import { useHaptics } from '@/lib/haptic-context';
import { DURATION, useReducedMotion } from '@/lib/motion';

// @design-purpose Named design-doctrine exception #2 — the animated, valence-mapped
// feeling shape (Apple "State of Mind"-style). The ONE sanctioned multi-hue colour
// ramp + continuous gradient in the app, SCOPED to this single Moments capture
// surface (parallel to the breathing/Mascot motion exception). It maps the feeling
// being logged; it does NOT recolour anything else. See DESIGN.mobile.md §3.4.
//
// The shape IS the input: scrub it left→right to set the feeling. It morphs in form
// (smaller/heavier → larger/rounder) and colour (navy → warm-neutral → brand teal)
// across the valence range. Motion runs on the Reanimated UI-thread clock (no
// setTimeout); reduced-motion freezes the breathe but keeps the colour mapping.
//
// Rendered behind the FeelingInput seam: same `value` / `onChange` contract.
// The Moment record stays discrete (MomentValence 1..5) — the continuous scrub
// snaps to the nearest integer on emit; the store is untouched.

const CANVAS_W = 240;
const CANVAS_H = 196;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

// Reanimated input range for the 5 valence anchors.
const ANCHORS = [1, 2, 3, 4, 5];

// A soft, near-round blob centred at the origin (radius ~70). Static geometry —
// all life comes from the animated Group transform, so no per-frame path rebuild.
const BLOB_PATH =
  'M0,-70 C44,-70 70,-42 70,0 C70,42 44,70 0,70 C-44,70 -70,42 -70,0 C-70,-42 -44,-70 0,-70 Z';

// Inner-sheen tints: each valence anchor mixed ~36% toward white, for the radial
// highlight that gives the single shape depth (not a second hue).
const VALENCE_HEX_LIGHT = VALENCE_HEX.map((hex) => lighten(hex, 0.36));

// Affect-intensity band words shown under the shape. Person-first, non-clinical,
// non-diagnostic. PROVISIONAL — pending Dr. Dobson review (first user).
const BANDS = ['Very unpleasant', 'Unpleasant', 'Neutral', 'Pleasant', 'Very pleasant'] as const;
const SCRUB_HINT = 'Drag the shape to set how it feels.';

function lighten(hex: string, amount: number): string {
  const ch = (i: number) => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const hex2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex2(mix(ch(0)))}${hex2(mix(ch(1)))}${hex2(mix(ch(2)))}`;
}

type FeelingVisualizationProps = {
  value: MomentValence | null;
  onChange: (valence: MomentValence) => void;
};

export function FeelingVisualization({ value, onChange }: FeelingVisualizationProps) {
  const reduced = useReducedMotion();
  const { fireHaptic } = useHaptics();
  const [trackWidth, setTrackWidth] = useState(0);

  // Continuous scrub position (1..5) drives the UI-thread morph; `breath` is the
  // idle breathing phase (0..1, looped). Both live on the UI thread.
  const t = useSharedValue<number>(value ?? 3);
  const breath = useSharedValue<number>(0);

  // Refs so the once-created PanResponder reads live values without stale closures.
  const widthRef = useRef(trackWidth);
  widthRef.current = trackWidth;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const fireHapticRef = useRef(fireHaptic);
  fireHapticRef.current = fireHaptic;
  const lastSnap = useRef<MomentValence | null>(value);

  // Idle breathe: Reanimated clock, looped. Reduced-motion holds it still.
  useEffect(() => {
    if (reduced) {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(withTiming(1, { duration: DURATION.breath, easing: Easing.linear }), -1, false);
  }, [reduced, breath]);

  // Keep the shape in sync if the parent resets/sets the value.
  useEffect(() => {
    if (value != null) {
      t.value = reducedRef.current ? value : withTiming(value, { duration: DURATION.base });
      lastSnap.current = value;
    }
  }, [value, t]);

  const blob = useMemo(() => Skia.Path.MakeFromSVGString(BLOB_PATH) ?? Skia.Path.Make(), []);

  // Form morph: grow + slight vertical fullness + a low→high sit, times the breathe.
  const transform = useDerivedValue(() => {
    const v = t.value;
    const grow = interpolate(v, ANCHORS, [0.66, 0.74, 0.82, 0.91, 1]);
    const squish = interpolate(v, ANCHORS, [0.85, 0.9, 0.95, 0.98, 1]);
    const sink = interpolate(v, ANCHORS, [12, 6, 0, -3, -6]);
    const b = reduced ? 1 : 1 + 0.03 * Math.sin(breath.value * Math.PI * 2);
    return [{ translateX: CX }, { translateY: CY + sink }, { scale: grow * b }, { scaleY: squish }];
  });

  // Colour morph: warm-light sheen centre → base valence hue. Both interpolated
  // from the same valence position, so it stays a single hue (no rainbow at rest).
  const gradientColors = useDerivedValue(() => [
    interpolateColor(t.value, ANCHORS, VALENCE_HEX_LIGHT),
    interpolateColor(t.value, ANCHORS, VALENCE_HEX),
  ]);

  // Map an x within the track to a continuous valence, snap on band crossing.
  // No per-delta haptic: drag deltas are a no-haptic zone (lib/haptics.ts) — the
  // tick fires once on release / on discrete a11y steps instead.
  const scrubTo = (localX: number) => {
    const width = widthRef.current;
    if (width <= 0) return;
    const pos = Math.min(1, Math.max(0, localX / width));
    const v = 1 + pos * 4;
    t.value = v;
    const snap = Math.round(v) as MomentValence;
    if (snap !== lastSnap.current) {
      lastSnap.current = snap;
      onChangeRef.current(snap);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => scrubTo(e.nativeEvent.locationX),
      onPanResponderMove: (e) => scrubTo(e.nativeEvent.locationX),
      onPanResponderRelease: () => fireHapticRef.current('tab'),
    }),
  ).current;

  // VoiceOver / discrete stepping. From an unset value the displayed neutral (3)
  // is the base; a step moves one band and commits.
  const adjust = (delta: number) => {
    const base = lastSnap.current ?? 3;
    const next = Math.min(5, Math.max(1, base + delta)) as MomentValence;
    lastSnap.current = next;
    onChange(next);
    fireHaptic('tab');
  };

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View className="items-center gap-3">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {MOMENTS_COPY.valencePrompt}
      </Text>

      <View
        {...pan.panHandlers}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={MOMENTS_COPY.valencePrompt}
        accessibilityValue={{ min: 1, max: 5, now: value ?? 3 }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') adjust(1);
          if (e.nativeEvent.actionName === 'decrement') adjust(-1);
        }}
        className="w-full items-center"
      >
        {/* Skia host views need an explicit pixel size (NativeWind className is not
            wired onto the Canvas) — the same raw-sizing exception charts use. */}
        <Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
          <Group transform={transform}>
            <Path path={blob}>
              <RadialGradient c={vec(-24, -28)} r={108} colors={gradientColors} />
            </Path>
          </Group>
        </Canvas>
      </View>

      <Text variant="bodyLarge" accessibilityLiveRegion="polite">
        {value == null ? SCRUB_HINT : BANDS[value - 1]}
      </Text>
    </View>
  );
}
