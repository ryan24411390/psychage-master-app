// Navigator animation layer — Reanimated v4 mappings of web V2's Framer Motion
// variants (psychage-v2 src/lib/animations.ts). Every helper is reduced-motion aware:
// when reduced, step/stagger transitions collapse to a plain fade (or nothing).
//
// Web → mobile mapping:
//   navigatorSlide (±60px, scale .98, 0.35s in / 0.25s out) → FadeInRight/FadeInLeft
//   staggerItem    (y:12, 60ms stagger, decelerate)         → FadeInDown.delay(i*60)
//   confidence bar (width 0→target, 0.6s easeOut, 0.2s delay) → ConfidenceBar shared value
//   processing ring (strokeDashoffset, 0.5s easeOut)        → ProcessingRing shared value

import { FadeIn, FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';

import { DURATION } from '@/lib/motion';

// Per-step stagger gap (ms) — web staggerContainer staggerChildren: 0.06.
export const STAGGER_MS = 60;

/** Entering animation for a flow step. `direction` > 0 = forward (slide from right),
 *  < 0 = back (slide from left). Reduced motion → plain fade. Returns `undefined` when
 *  reduced AND the caller wants no entrance (we still fade by default for polish). */
export function stepEnter(direction: number, reduced: boolean) {
  if (reduced) return FadeIn.duration(DURATION.swift);
  const base = direction >= 0 ? FadeInRight : FadeInLeft;
  return base.duration(DURATION.base);
}

/** Staggered list-item entrance (results cards, recommendation rows). */
export function staggerItemEnter(index: number, reduced: boolean) {
  if (reduced) return FadeIn.duration(DURATION.swift);
  return FadeInDown.delay(index * STAGGER_MS).duration(DURATION.base);
}

// Re-export the bare fade for callers that only need a reduced-safe entrance.
export { FadeIn };
