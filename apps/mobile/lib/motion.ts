import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing } from 'react-native-reanimated';

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
