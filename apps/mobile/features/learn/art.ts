// Learn thumbnail art — deterministic, abstract token-gradient panels.
//
// The web product decorates article cards with figure/blob illustrations; on
// mobile that is anti-slop (faux-human silhouettes) AND violates the no-invented-
// art rule (ArticleListCard.tsx). Instead, when an article has no real
// hero_image_url, we render a calm two-stop gradient derived ONLY from the
// general-use token scales (teal + charcoal — the mood palette is scoped
// mood-feature-only). Bases are deepened toward near-black so white overlay text
// clears AA, and the set is mostly-neutral so teal stays an accent, not a flood
// (brand voice §7). The panel is chosen by a stable hash of a key (the article
// slug or category id) so a given item always wears the same panel — no
// per-render randomness (also satisfies the "no Math.random in render" rule).

import { colors } from '@/lib/colors';

export type Gradient = { readonly top: string; readonly bottom: string };

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

/** Linear blend between two hex colors. factor 0 → a, 1 → b. */
function mix(a: string, b: string, factor: number): string {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return rgbToHex(
    c1.r + factor * (c2.r - c1.r),
    c1.g + factor * (c2.g - c1.g),
    c1.b + factor * (c2.b - c1.b),
  );
}

// Deepen a base hue toward near-black (charcoal.950) for a rich, calm panel that
// carries white text at AA. Top is lighter than bottom (subtle vertical fall).
const SHADOW = colors.charcoal[950];
function deepen(base: string, top = 0.42, bottom = 0.7): Gradient {
  return { top: mix(base, SHADOW, top), bottom: mix(base, SHADOW, bottom) };
}

// Six panels from the general-use scales. Mostly neutral charcoal stones; two
// carry the brand teal so it reads as an accent across a rail, never a flood.
const PALETTE: readonly Gradient[] = [
  deepen(colors.teal[600]), // brand teal
  deepen(colors.charcoal[600]), // slate
  deepen(colors.charcoal[700]), // deep slate
  deepen(colors.teal[700]), // muted teal
  deepen(colors.charcoal[500]), // warm-grey stone
  deepen(colors.charcoal[800]), // near-ink
];

/** Stable 32-bit string hash (djb2). Same input → same panel, every render. */
function hashKey(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 33) ^ key.charCodeAt(i);
  }
  return h >>> 0;
}

/** Deterministic gradient for any string key (article slug, category id, …). */
export function gradientForKey(key: string): Gradient {
  return PALETTE[hashKey(key) % PALETTE.length] as Gradient;
}
