// A1 token resolver — geometry + color-reference resolution for the six Wave-A1
// component groups (tabBar, terrain, reflectionRow, monthRail, noteTick,
// skeletonTerrain) in tokens/mobile.tokens.json.
//
// Why this exists: `tailwind.config.js` flattens only the BASE color leaves into
// className utilities (bg-surface-active, border-charcoal-500, text-mood-1…).
// The A1 groups are not className-able — their leaves are either raw geometry
// (radii, fractions, fillByState) consumed as numbers by react-native-svg
// primitives, or path-string references ("color.charcoal.500") that must be
// dereferenced to a real color string. SVG <Circle>/<Line>/<Path> fill/stroke
// props take strings, not Tailwind classes, so this module is the seam.
//
// Single source = the same JSON tailwind.config.js + lib/colors.ts read, so no
// second source can drift (rules/conventions.md #1). This file is PURE DATA —
// no React import — so it loads in Vitest `.test.ts` logic tests unchanged.
//
// Themed-vs-static: a themed base leaf ({light,dark}) resolves to both registers;
// a non-themed leaf (charcoal.950, mood.*) resolves to the same value in both,
// so consumers always receive a {light,dark} pair. Pick per OS scheme at the
// component boundary with colorForScheme(themed, useColorScheme()).

import tokens from '../../../tokens/mobile.tokens.json';

export type ThemedColor = { readonly light: string; readonly dark: string };
export type ColorScheme = 'light' | 'dark' | null | undefined;

function walk(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object' && key in node) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, tokens);
}

/**
 * Dereference a token path ("color.charcoal.500", "color.text.primary") to a
 * {light,dark} color pair. Non-themed leaves return the same value for both.
 * Throws on an unknown path or a non-color leaf — a missing/renamed token must
 * surface loudly, never silently render a wrong or transparent color.
 */
export function resolveColorRef(ref: string): ThemedColor {
  const node = walk(ref);
  if (typeof node === 'string') {
    return { light: node, dark: node };
  }
  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (typeof obj.light === 'string' && typeof obj.dark === 'string') {
      return { light: obj.light, dark: obj.dark };
    }
  }
  throw new Error(`a1-tokens: '${ref}' is not a resolvable color token`);
}

/** Select the register for the current OS color scheme; defaults to light. */
export function colorForScheme(themed: ThemedColor, scheme: ColorScheme): string {
  return scheme === 'dark' ? themed.dark : themed.light;
}

const tb = tokens.tabBar;

/**
 * tabBar group (C0.2). Geometry consumed as numbers; colors pre-resolved to
 * {light,dark} pairs. activePill.radius is styled via the `rounded-lg` className
 * (radius.lg → tailwind), so only the inset-shadow geometry is surfaced here.
 */
export const tabBarTokens = {
  barHeight: tb.barHeight,
  minTarget: tb.minTarget,
  iconSize: tb.icon.size,
  label: { size: tb.label.size, lineHeight: tb.label.lineHeight },
  insetShadow: tb.activePill.insetShadow,
  color: {
    labelActive: resolveColorRef(tb.color.labelActive),
    labelInactive: resolveColorRef(tb.color.labelInactive),
    iconTealDot: resolveColorRef(tb.color.iconTealDot),
    activePillPressBg: resolveColorRef(tb.color.activePillPressBg),
    insetShadowColor: resolveColorRef(tb.color.insetShadowColor),
  },
} as const;

const tr = tokens.terrain;

/**
 * terrain group (C0.3). Geometry as numbers (fractions are resolution-independent
 * row-height multipliers); colors pre-resolved. fillByState (0..4 → 12/32/52/74/95)
 * is the proportional fill level shared by the terrain dots AND the C0.4 state-row
 * fill glyphs — StateRows mirrors these percentages in className literals and a unit
 * test pins them here so a token change fails loudly rather than drifting silently.
 */
export const terrainTokens = {
  dot: { radius: tr.dot.radius, ringWidth: tr.dot.ring.width },
  noEntryDot: { radius: tr.noEntryDot.radius, atFraction: tr.noEntryDot.atFraction },
  todayDot: {
    radius: tr.todayDot.radius,
    atFraction: tr.todayDot.atFraction,
    strokeWidth: tr.todayDot.stroke.width,
    dash: tr.todayDot.stroke.dash,
  },
  connectingLineWidth: tr.connectingLine.width,
  fillByState: tr.fillByState,
  geometry: {
    baselineFraction: tr.geometry.baselineFraction,
    midlineFraction: tr.geometry.midlineFraction,
  },
  label: { size: tr.label.size, lineHeight: tr.label.lineHeight },
  color: {
    dotRing: resolveColorRef(tr.color.dotRing),
    connectingLine: resolveColorRef(tr.color.connectingLine),
    label: resolveColorRef(tr.color.label),
    todayDotStroke: resolveColorRef(tr.color.todayDotStroke),
    moodTint: {
      0: resolveColorRef(tr.color.moodTint['0']),
      1: resolveColorRef(tr.color.moodTint['1']),
      2: resolveColorRef(tr.color.moodTint['2']),
      3: resolveColorRef(tr.color.moodTint['3']),
      4: resolveColorRef(tr.color.moodTint['4']),
    },
  },
} as const;
