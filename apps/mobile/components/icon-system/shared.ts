// Shared contract for the Psychage custom-icon system (Slice 3a foundation).
//
// Derived from the app's existing custom-SVG drawables — the tab pictograms
// (components/pictograms/*), the check-in FillGlyph (components/check-in/StateRows),
// the Terrain dots, and the BodyScanGlyph. Every custom icon is a react-native-svg
// vector on a FIXED square viewBox, takes a `size` (dp) and a body-ink `color`,
// resolves theme colors through @/lib/a1-tokens, and renders the SAME glyph in
// light and dark (the scheme only swaps colors, never the shape). No emoji — ever.
//
// This file gives the common primitive so every concept icon stays consistent.
// It does NOT decide visual style per concept; each concept ships its own vector.
// See docs/icon-system-contract.md for the full rules.

import { useColorScheme } from 'nativewind';

import { colorForScheme, resolveColorRef, type ColorScheme } from '@/lib/a1-tokens';

/** Canonical icon viewBox. One square coordinate space for every concept icon. */
export const ICON_VIEWBOX = '0 0 32 32';

/** Default rendered size in dp when a caller omits `size`. */
export const DEFAULT_ICON_SIZE = 28;

/**
 * Standard props every custom concept icon accepts.
 *
 * `color` is the body ink. When omitted the icon resolves its own neutral ink
 * (text.primary for the current scheme) so it can render standalone in a draft
 * gallery; production callers should pass the surrounding text's color.
 */
export type IconProps = {
  /** Body-ink color. Omit to use the scheme's neutral ink. */
  color?: string;
  /** Rendered square size in dp. */
  size?: number;
  testID?: string;
};

/** The named ink tones a concept icon may resolve to, mapped to token refs. */
const TONE_REF = {
  ink: 'color.text.primary',
  inkSecondary: 'color.text.secondary',
  primary: 'color.primary.default',
} as const;

export type IconTone = keyof typeof TONE_REF;

/** Resolve a named tone to a concrete color for the supplied scheme. */
export function inkForScheme(tone: IconTone, scheme: ColorScheme): string {
  return colorForScheme(resolveColorRef(TONE_REF[tone]), scheme);
}

/** Hook form: the scheme-aware neutral body ink (text.primary). */
export function useIconInk(tone: IconTone = 'ink'): string {
  const { colorScheme } = useColorScheme();
  return inkForScheme(tone, colorScheme);
}
