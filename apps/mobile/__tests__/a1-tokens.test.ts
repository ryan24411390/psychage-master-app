import { describe, expect, it } from 'vitest';

import { colorForScheme, resolveColorRef, tabBarTokens, terrainTokens } from '@/lib/a1-tokens';

// Logic test (Vitest) — the A1 token resolver. These assertions double as a
// drift guard: resolveColorRef throws on a missing/renamed token, and
// tabBarTokens resolves its bindings at module load, so a token rename in
// mobile.tokens.json fails this suite loudly rather than rendering a wrong color.

describe('resolveColorRef', () => {
  it('resolves a themed base leaf to distinct light/dark registers', () => {
    // Dark register is the true-black palette (see color.background._divergence).
    expect(resolveColorRef('color.text.primary')).toEqual({ light: '#0a0a0a', dark: '#FFFFFF' });
    expect(resolveColorRef('color.text.secondary')).toEqual({ light: '#57534e', dark: '#B3B3B3' });
  });

  it('resolves a non-themed leaf to the same value in both registers', () => {
    expect(resolveColorRef('color.charcoal.500')).toEqual({ light: '#78716C', dark: '#78716C' });
    expect(resolveColorRef('color.charcoal.950')).toEqual({ light: '#0C0A09', dark: '#0C0A09' });
  });

  it('throws on an unknown path or a non-color (object) leaf', () => {
    expect(() => resolveColorRef('color.does.not.exist')).toThrow();
    expect(() => resolveColorRef('color.text')).toThrow();
  });
});

describe('colorForScheme', () => {
  it('selects the register, defaulting to light', () => {
    const themed = { light: 'L', dark: 'D' } as const;
    expect(colorForScheme(themed, 'dark')).toBe('D');
    expect(colorForScheme(themed, 'light')).toBe('L');
    expect(colorForScheme(themed, null)).toBe('L');
    expect(colorForScheme(themed, undefined)).toBe('L');
  });
});

describe('tabBarTokens', () => {
  it('resolves the A1 color bindings to the ratified base tokens', () => {
    // teal dot is themed (night swaps it); inset shadow is dark in both registers.
    expect(tabBarTokens.color.iconTealDot).toEqual({ light: '#1A9B8C', dark: '#20B8A6' });
    expect(tabBarTokens.color.insetShadowColor).toEqual({ light: '#0C0A09', dark: '#0C0A09' });
    expect(tabBarTokens.color.activePillPressBg).toEqual({ light: '#e7e5e4', dark: '#262626' });
    expect(tabBarTokens.color.labelActive).toEqual({ light: '#0a0a0a', dark: '#FFFFFF' });
    expect(tabBarTokens.color.labelInactive).toEqual({ light: '#57534e', dark: '#B3B3B3' });
  });

  it('carries the tab-bar geometry verbatim', () => {
    expect(tabBarTokens.barHeight).toBe(56);
    expect(tabBarTokens.minTarget).toBe(44);
    expect(tabBarTokens.iconSize).toBe(24);
    expect(tabBarTokens.insetShadow.opacity).toBe(0.12);
  });
});

describe('terrainTokens', () => {
  it('pins fillByState — the percentages StateRows mirrors in className literals', () => {
    expect(terrainTokens.fillByState).toEqual({ 0: 12, 1: 32, 2: 52, 3: 74, 4: 95 });
  });

  it('resolves the mood tints (mood.1..5) and the load-bearing ring (charcoal.500)', () => {
    expect(terrainTokens.color.moodTint[0]).toEqual({ light: '#8B7FA8', dark: '#8B7FA8' });
    expect(terrainTokens.color.moodTint[4]).toEqual({ light: '#15B8A6', dark: '#15B8A6' });
    expect(terrainTokens.color.dotRing).toEqual({ light: '#78716C', dark: '#78716C' });
  });

  it('carries the terrain geometry verbatim', () => {
    expect(terrainTokens.dot.radius).toBe(6.5);
    expect(terrainTokens.todayDot.dash).toEqual([3, 3]);
    expect(terrainTokens.geometry.baselineFraction).toBe(0.95);
    expect(terrainTokens.geometry.midlineFraction).toBe(0.5);
  });
});
