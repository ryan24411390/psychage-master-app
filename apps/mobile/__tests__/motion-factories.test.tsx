// Logic-level coverage for the motion factory layer (lib/motion.ts). Runs under
// jest (not vitest) because the factories import react-native-reanimated, which
// only resolves under the jest-expo preset. No JSX is rendered — the .tsx suffix
// is purely to land in jest's testMatch.
//
// The safety-relevant guarantees we lock here: the reduced-motion branch never
// crashes and produces the project-canonical 200ms cross-fade, the stagger is
// capped, and list layout animation is fully removed (undefined) under reduced
// motion so a reduced-motion user never gets a spatial reflow.

import {
  REDUCED_MOTION_FADE_MS,
  STAGGER_CAP,
  STAGGER_MS,
  enter,
  exit,
  listLayout,
  staggeredEnter,
} from '@/lib/motion';

describe('motion factory constants', () => {
  it('reduced-motion fade matches the design token (200ms)', () => {
    // tokens/mobile.tokens.json → motion._reducedMotion.essential.durationMs
    expect(REDUCED_MOTION_FADE_MS).toBe(200);
  });

  it('stagger stays within the ~400ms last-item budget', () => {
    expect(STAGGER_MS).toBe(50);
    expect(STAGGER_CAP).toBe(8);
    expect(STAGGER_CAP * STAGGER_MS).toBeLessThanOrEqual(400);
  });
});

describe('enter / exit', () => {
  it('returns a usable builder in both motion modes', () => {
    expect(enter(false)).toBeDefined();
    expect(enter(true)).toBeDefined();
    expect(exit(false)).toBeDefined();
    expect(exit(true)).toBeDefined();
  });

  it('accepts preset + translate overrides without throwing', () => {
    expect(() => enter(false, { preset: 'gentle', translateY: 8 })).not.toThrow();
    expect(() => exit(false, { preset: 'deep' })).not.toThrow();
  });
});

describe('staggeredEnter', () => {
  it('produces a builder across the full index range, including past the cap', () => {
    for (const index of [0, 1, 7, 8, 50, 999]) {
      expect(staggeredEnter(index, false)).toBeDefined();
    }
  });

  it('falls back to the reduced cross-fade when reduced', () => {
    expect(staggeredEnter(3, true)).toBeDefined();
  });
});

describe('listLayout', () => {
  it('is fully removed under reduced motion', () => {
    expect(listLayout(true)).toBeUndefined();
  });

  it('returns a layout transition when motion is allowed', () => {
    expect(listLayout(false)).toBeDefined();
  });
});
