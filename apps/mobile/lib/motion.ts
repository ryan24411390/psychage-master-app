import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';

// Wave B2 (S45): the in-app reduced-motion override. ADDITIVE — OR-ed with the OS
// setting below so the signature is unchanged and every existing caller keeps
// working; the only difference is the toggle now also drives motion. The getter
// is pure (no React, no RN) and the subscribe is a plain listener set, so this
// adds no test-runner coupling.
import { getReducedMotionOverride, subscribeAppearance } from '@/lib/persistence/appearance';

type EasingFactory = ReturnType<typeof Easing.bezier>;

export const DURATION = {
  swift: 150,
  base: 300,
  calm: 600,
  breath: 4000,
} as const;

export const EASING = {
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  breath: 'cubic-bezier(0.45, 0, 0.55, 1)',
} as const;

export const SPRING_PRESETS = {
  swift: { damping: 15, stiffness: 200, mass: 0.5 },
  calm: { damping: 18, stiffness: 100, mass: 1 },
  bouncy: { damping: 12, stiffness: 150, mass: 0.8 },
  gentle: { damping: 20, stiffness: 80, mass: 1.2 },
  // Premium motion additions:
  magnetic: { damping: 16, stiffness: 220, mass: 0.4 }, // Sharp and snappy, Apple-like button feel
  playful: { damping: 12, stiffness: 180, mass: 0.6 },  // Arc browser-like bouncy entry
  deep: { damping: 25, stiffness: 120, mass: 1.5 },     // Heavy feeling for bottom sheets / deep cards
  subtle: { damping: 20, stiffness: 250, mass: 0.8 },   // Fast, very little overshoot for micro-interactions
} as const;

export type DurationKey = keyof typeof DURATION;
export type EasingKey = keyof typeof EASING;

// EASING.* tokens are cubic-bezier control-point strings (token shape per
// tokens/mobile.tokens.json motion.easing.*). Reanimated v4 consumes
// EasingFunction objects from Easing.bezier(x1,y1,x2,y2). easingFn() bridges
// the two — token strings stay the canonical source.
const BEZIER_RE =
  /^cubic-bezier\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/;

export function easingFn(key: EasingKey): EasingFactory {
  const value = EASING[key];
  const m = value.match(BEZIER_RE);
  if (!m) {
    throw new Error(`Invalid easing token (${key}): ${value}`);
  }
  const x1 = Number(m[1]);
  const y1 = Number(m[2]);
  const x2 = Number(m[3]);
  const y2 = Number(m[4]);
  return Easing.bezier(x1, y1, x2, y2);
}

export function useReducedMotion(): boolean {
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setOsReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOsReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  // In-app override (S45). Either source wins: OS Reduce Motion OR the in-app toggle.
  const appOverride = useSyncExternalStore(
    subscribeAppearance,
    getReducedMotionOverride,
    getReducedMotionOverride,
  );

  return osReduced || appOverride;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entrance / layout factories (the reusable motion vocabulary).
//
// These centralise the entering/exiting/layout animations every screen uses so
// the same element animates IDENTICALLY everywhere. They are PURE functions that
// take `reduced` explicitly (from useReducedMotion()) rather than calling the
// hook themselves — this keeps them testable, callable outside React, and — most
// importantly — honours BOTH reduce-motion sources (OS *and* the in-app S45
// toggle, which Reanimated's built-in ReduceMotion.System cannot see). We set
// `.reduceMotion(ReduceMotion.Never)` on every builder precisely because the
// branch below already does the gating; we never want Reanimated second-guessing.
//
// Reduced path = the project-canonical 200ms cross-fade
// (tokens/mobile.tokens.json motion._reducedMotion.essential), never a spatial
// translate. Spring presets stay the single source of truth (SPRING_PRESETS).

/** ms between sequential list-item entrances. */
export const STAGGER_MS = 50;
/** Cap on stagger index so the last visible item lands by ~400ms (8 × 50ms). */
export const STAGGER_CAP = 8;
/**
 * Reduced-motion essential cross-fade duration.
 * Source: tokens/mobile.tokens.json → motion._reducedMotion.essential.durationMs.
 */
export const REDUCED_MOTION_FADE_MS = 200;

type EnterOpts = {
  /** Spring preset for the spatial part. Default `calm` (= spec "smooth"). */
  preset?: keyof typeof SPRING_PRESETS;
  /** Small upward translate distance in px. Default 12 (spec: 8–12px). */
  translateY?: number;
  /** Extra delay before the entrance starts (used by staggeredEnter). */
  delayMs?: number;
};

type ExitOpts = {
  preset?: keyof typeof SPRING_PRESETS;
};

/**
 * Reduce-motion-aware screen/content entrance: fade + a small upward translate,
 * spring-driven. When `reduced`, collapses to a plain 200ms cross-fade.
 */
export function enter(reduced: boolean, opts: EnterOpts = {}) {
  if (reduced) {
    return FadeIn.duration(REDUCED_MOTION_FADE_MS).reduceMotion(ReduceMotion.Never);
  }
  const { preset = 'calm', translateY = 12, delayMs = 0 } = opts;
  const s = SPRING_PRESETS[preset];
  const anim = FadeInUp.springify()
    .damping(s.damping)
    .stiffness(s.stiffness)
    .mass(s.mass)
    .withInitialValues({ opacity: 0, transform: [{ translateY }] })
    .reduceMotion(ReduceMotion.Never);
  return delayMs > 0 ? anim.delay(delayMs) : anim;
}

/** Matching exit for `enter`: fade + small downward translate (reduced: 200ms fade). */
export function exit(reduced: boolean, opts: ExitOpts = {}) {
  if (reduced) {
    return FadeOut.duration(REDUCED_MOTION_FADE_MS).reduceMotion(ReduceMotion.Never);
  }
  const { preset = 'calm' } = opts;
  const s = SPRING_PRESETS[preset];
  return FadeOutDown.springify()
    .damping(s.damping)
    .stiffness(s.stiffness)
    .mass(s.mass)
    .reduceMotion(ReduceMotion.Never);
}

/**
 * Staggered list/grid entrance. Delay = min(index, STAGGER_CAP) × STAGGER_MS so
 * the last visible row is never delayed past ~400ms. Reduced: 200ms fade, no delay.
 */
export function staggeredEnter(index: number, reduced: boolean, opts: EnterOpts = {}) {
  if (reduced) {
    return FadeIn.duration(REDUCED_MOTION_FADE_MS).reduceMotion(ReduceMotion.Never);
  }
  const clamped = Math.min(Math.max(index, 0), STAGGER_CAP);
  return enter(false, { ...opts, delayMs: clamped * STAGGER_MS });
}

/**
 * Shared layout transition for lists that reorder / insert / delete. Returns
 * `undefined` under reduced motion so the list reflows instantly instead of
 * springing. Pass straight to a component's `layout` prop.
 */
export function listLayout(reduced: boolean) {
  if (reduced) {
    return undefined;
  }
  const s = SPRING_PRESETS.calm;
  return LinearTransition.springify()
    .damping(s.damping)
    .stiffness(s.stiffness)
    .mass(s.mass)
    .reduceMotion(ReduceMotion.Never);
}

/**
 * The single "signature" entrance: a deliberate scale-from-0.94 + fade on the
 * heavy `gentle` spring, for the hero element a detail screen shares with the
 * card it was opened from (article art, provider photo). Used rarely and on
 * purpose — distinct from the small standard entrances. True cross-screen
 * shared-element morphs are intentionally not used: Reanimated's
 * sharedTransitionTag is unsupported on the New Architecture, so this coordinated
 * entrance is the robust stand-in. Reduced motion → the plain 200ms cross-fade.
 */
export function heroEnter(reduced: boolean) {
  if (reduced) {
    return FadeIn.duration(REDUCED_MOTION_FADE_MS).reduceMotion(ReduceMotion.Never);
  }
  const s = SPRING_PRESETS.gentle;
  return ZoomIn.springify()
    .damping(s.damping)
    .stiffness(s.stiffness)
    .mass(s.mass)
    .withInitialValues({ opacity: 0, transform: [{ scale: 0.94 }] })
    .reduceMotion(ReduceMotion.Never);
}
