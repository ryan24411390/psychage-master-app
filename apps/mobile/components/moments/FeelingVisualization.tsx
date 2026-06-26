import type { MomentValence } from '@psychage/shared/engagement';
import { Canvas, Circle, Group, Path, RadialGradient, Shadow, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, PanResponder, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
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
// across the valence range. A mirrored slider underneath gives the same control a
// discoverable, conventional affordance — both write the SAME continuous position.
// Motion runs on the Reanimated UI-thread clock (no setTimeout); reduced-motion
// freezes the breathe but keeps the colour mapping and the slider.
//
// Depth comes from three painted layers on the one shape (no new hue): a soft
// contact shadow under it, a darker rim stop for roundness, and a white specular
// hotspot top-left for gloss. Rendered behind the FeelingInput seam: same `value` /
// `onChange` contract. The Moment record stays discrete (MomentValence 1..5) — the
// continuous scrub snaps to the nearest integer on emit; the store is untouched.

const CANVAS_W = 240;
const CANVAS_H = 196;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

// Slider knob diameter (px). Travel is railWidth - KNOB so the knob never overflows.
const KNOB = 28;

// Reanimated input range for the 5 valence anchors.
const ANCHORS = [1, 2, 3, 4, 5];

// A soft, near-round blob centred at the origin (radius ~70). Static geometry —
// all life comes from the animated Group transform, so no per-frame path rebuild.
const BLOB_PATH =
  'M0,-70 C44,-70 70,-42 70,0 C70,42 44,70 0,70 C-44,70 -70,42 -70,0 C-70,-42 -44,-70 0,-70 Z';

// Inner-sheen tints: each valence anchor mixed ~36% toward white, for the radial
// highlight that gives the single shape depth (not a second hue).
const VALENCE_HEX_LIGHT = VALENCE_HEX.map((hex) => lighten(hex, 0.36));
// Rim tints: each anchor pulled ~24% toward black for the rounded falloff at the edge.
const VALENCE_HEX_DARK = VALENCE_HEX.map((hex) => darken(hex, 0.24));

// Affect-intensity band words shown under the shape. Person-first, non-clinical,
// non-diagnostic. PROVISIONAL — pending Dr. Dobson review (first user).
const BANDS = ['Very unpleasant', 'Unpleasant', 'Neutral', 'Pleasant', 'Very pleasant'] as const;
const SCRUB_HINT = 'Drag the shape or slider to set how it feels.';

function channels(hex: string): [number, number, number] {
  const ch = (i: number) => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return [ch(0), ch(1), ch(2)];
}
function toHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function lighten(hex: string, amount: number): string {
  return toHex(channels(hex).map((c) => c + (255 - c) * amount) as [number, number, number]);
}
function darken(hex: string, amount: number): string {
  return toHex(channels(hex).map((c) => c * (1 - amount)) as [number, number, number]);
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
  // idle breathing phase (0..1, looped). Both live on the UI thread. `railWidth`
  // mirrors the slider track width onto the UI thread for the knob transform.
  const t = useSharedValue<number>(value ?? 3);
  const breath = useSharedValue<number>(0);
  const railWidth = useSharedValue<number>(0);

  // Refs so the once-created PanResponder reads live values without stale closures.
  const widthRef = useRef(trackWidth);
  widthRef.current = trackWidth;
  const railWidthRef = useRef(0);
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

  // Body gradient: warm-light sheen centre → base valence hue → darker rim. All three
  // interpolated from the same valence position, so it stays a single hue (the rim is
  // a shade of the base, not a second colour) — depth without a rainbow at rest.
  const bodyColors = useDerivedValue(() => [
    interpolateColor(t.value, ANCHORS, VALENCE_HEX_LIGHT),
    interpolateColor(t.value, ANCHORS, VALENCE_HEX),
    interpolateColor(t.value, ANCHORS, VALENCE_HEX_DARK),
  ]);

  // Specular gloss: a small white hotspot top-left, fading to transparent. Pure
  // highlight (white→clear), independent of hue, sits on top of the body.
  const specularColors = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'];

  // Knob position + colour, driven off the same `t`. translateX runs 0..(rail - KNOB)
  // so the knob tracks the valence across the full rail; fill colour matches the hue.
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [1, 5], [0, Math.max(0, railWidth.value - KNOB)]) }],
    backgroundColor: interpolateColor(t.value, ANCHORS, VALENCE_HEX),
  }));

  // Commit a continuous valence: update the UI-thread position and emit the snapped
  // integer when it crosses a band. No per-delta haptic: drag deltas are a no-haptic
  // zone (lib/haptics.ts) — the tick fires once on release / on discrete a11y steps.
  const commit = (v: number) => {
    t.value = v;
    const snap = Math.round(v) as MomentValence;
    if (snap !== lastSnap.current) {
      lastSnap.current = snap;
      onChangeRef.current(snap);
    }
  };
  const posToValence = (pos: number) => 1 + Math.min(1, Math.max(0, pos)) * 4;

  // Scrubbing the shape itself: map x across the canvas track.
  const scrubShape = (localX: number) => {
    const width = widthRef.current;
    if (width > 0) commit(posToValence(localX / width));
  };
  // Scrubbing the rail: centre the knob under the finger (offset by half a knob).
  const scrubRail = (localX: number) => {
    const travel = railWidthRef.current - KNOB;
    if (travel > 0) commit(posToValence((localX - KNOB / 2) / travel));
  };

  const shapePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => scrubShape(e.nativeEvent.locationX),
      onPanResponderMove: (e) => scrubShape(e.nativeEvent.locationX),
      onPanResponderRelease: () => fireHapticRef.current('tab'),
    }),
  ).current;

  const railPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => scrubRail(e.nativeEvent.locationX),
      onPanResponderMove: (e) => scrubRail(e.nativeEvent.locationX),
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
  const onRailLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    railWidthRef.current = w;
    railWidth.value = w;
  };

  return (
    <View className="items-center gap-3">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {MOMENTS_COPY.valencePrompt}
      </Text>

      <View
        {...shapePan.panHandlers}
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
              <Shadow dx={0} dy={9} blur={16} color="rgba(20,30,48,0.22)" />
              <RadialGradient c={vec(-24, -28)} r={108} colors={bodyColors} positions={[0, 0.6, 1]} />
            </Path>
            {/* Gloss hotspot — sits on the body, follows the same Group transform. */}
            <Circle cx={-24} cy={-30} r={28}>
              <RadialGradient c={vec(-24, -30)} r={28} colors={specularColors} />
            </Circle>
          </Group>
        </Canvas>
      </View>

      {/* Mirrored slider — same control, conventional affordance. Hidden from the
          a11y tree: the shape above is the single `adjustable` element VoiceOver uses,
          so this rail doesn't create a duplicate stepper. */}
      <View
        {...railPan.panHandlers}
        onLayout={onRailLayout}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="h-7 w-full max-w-[240px] justify-center"
      >
        <View className="h-1.5 w-full rounded-full bg-border dark:bg-border-dark" />
        <Animated.View
          style={knobStyle}
          className="absolute left-0 h-7 w-7 rounded-full border-[3px] border-white shadow"
        />
      </View>

      <Text variant="bodyLarge" accessibilityLiveRegion="polite">
        {value == null ? SCRUB_HINT : BANDS[value - 1]}
      </Text>
    </View>
  );
}
