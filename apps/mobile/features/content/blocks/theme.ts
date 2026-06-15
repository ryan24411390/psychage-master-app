// Callout tone palette. Tailwind's default colour palette is replaced by the
// token config (only teal/charcoal/semantic exist as utilities), so callout
// tints — which reproduce the web's callout variants — are resolved to muted hex
// here and applied as dynamic style objects (the Rule #9 dynamic exception).
// Kept low-saturation so teal stays the brand accent (CLAUDE.md §7 "teal sparingly").

import type { CalloutTone } from '@/features/content/html/classify';

export type TonePalette = { bg: string; border: string; icon: string };

type ToneSet = { light: TonePalette; dark: TonePalette };

export const CALLOUT_PALETTE: Record<CalloutTone, ToneSet> = {
  teal: {
    light: { bg: '#E6F4F1', border: '#1A9B8C', icon: '#0F766E' },
    dark: { bg: '#0E2E2A', border: '#2DA99A', icon: '#5EC7B8' },
  },
  amber: {
    light: { bg: '#FBF3E4', border: '#D9A441', icon: '#9A6B12' },
    dark: { bg: '#2E2613', border: '#C99A45', icon: '#E0B563' },
  },
  rose: {
    light: { bg: '#FBECEC', border: '#C76B6B', icon: '#9A3535' },
    dark: { bg: '#2E1717', border: '#C07A7A', icon: '#E09A9A' },
  },
  violet: {
    light: { bg: '#F0ECF8', border: '#8A78C0', icon: '#5B4A93' },
    dark: { bg: '#211B30', border: '#9A8AC9', icon: '#BCAEE3' },
  },
  sky: {
    light: { bg: '#E8F1F8', border: '#5B92C0', icon: '#356494' },
    dark: { bg: '#142430', border: '#6FA3CC', icon: '#9CC4E3' },
  },
  neutral: {
    light: { bg: '#F4F4F3', border: '#C3C2BF', icon: '#6B6A66' },
    dark: { bg: '#1E1E1D', border: '#4A4946', icon: '#A3A29E' },
  },
};

/** viewBox aspect ratio (w/h) from an inline <svg>, or null if absent. */
export function svgAspect(xml: string): number | null {
  const vb = xml.match(/viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
  if (vb) {
    const w = Number(vb[1]);
    const h = Number(vb[2]);
    if (w > 0 && h > 0) return w / h;
  }
  const wAttr = xml.match(/<svg[^>]*\bwidth=["']([\d.]+)/);
  const hAttr = xml.match(/<svg[^>]*\bheight=["']([\d.]+)/);
  if (wAttr && hAttr) {
    const w = Number(wAttr[1]);
    const h = Number(hAttr[1]);
    if (w > 0 && h > 0) return w / h;
  }
  return null;
}

/** Small explicit pixel size (≤64) declared on an <svg>, for inline icons. */
export function svgFixedSize(xml: string): { width: number; height: number } | null {
  const wAttr = xml.match(/<svg[^>]*\bwidth=["']([\d.]+)/);
  const hAttr = xml.match(/<svg[^>]*\bheight=["']([\d.]+)/);
  if (!wAttr || !hAttr) return null;
  const width = Number(wAttr[1]);
  const height = Number(hAttr[1]);
  if (width > 0 && width <= 64 && height > 0 && height <= 64) return { width, height };
  return null;
}
