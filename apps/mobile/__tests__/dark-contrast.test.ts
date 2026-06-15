import { describe, expect, it } from 'vitest';

import tokens from '../../../tokens/mobile.tokens.json';

// Machine-checked WCAG AA over the true-black dark register. The dark leaves
// diverge from web intentionally (see color.background._divergence); this test is
// the guard that the divergence never drops a text/background pair below AA.
// Body floor 4.5:1, large/UI floor 3:1 (WCAG 2.1 §1.4.3 / §1.4.11).

const c = tokens.color;

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const canvas = c.background.dark; // #000000
const surface = c.surface.default.dark; // #121212

describe('dark register — WCAG AA body text (≥ 4.5:1)', () => {
  const bodyPairs: ReadonlyArray<readonly [string, string, string]> = [
    ['text.primary on canvas', c.text.primary.dark, canvas],
    ['text.secondary on canvas', c.text.secondary.dark, canvas],
    ['text.tertiary on canvas', c.text.tertiary.dark, canvas],
    ['text.primary on surface', c.text.primary.dark, surface],
    ['text.secondary on surface', c.text.secondary.dark, surface],
    ['text.tertiary on surface', c.text.tertiary.dark, surface],
    // teal is an accent but is used as label ink (ghost button, "History" link)
    ['primary teal on canvas', c.primary.default.dark, canvas],
    // crisis outline/text contexts brighten to redDark to clear the body floor
    ['crisis.redDark on canvas', c.crisis.redDark, canvas],
    ['crisis.redDark on surface', c.crisis.redDark, surface],
    // white label on the (non-themed) crisis fill — EmergencyButton
    ['white on crisis fill', '#FFFFFF', c.crisis.red],
    // primary button dark-mode label: near-black ink on the teal fill
    ['button ink on teal fill', c.charcoal['950'], c.primary.default.dark],
    ['error.dark on canvas', c.semantic.error.dark, canvas],
  ];

  for (const [name, fg, bg] of bodyPairs) {
    it(`${name} ≥ 4.5:1`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('dark register — canvas/text are true black + pure white', () => {
  it('canvas is true black', () => {
    expect(canvas.toUpperCase()).toBe('#000000');
  });
  it('primary ink is pure white', () => {
    expect(c.text.primary.dark.toUpperCase()).toBe('#FFFFFF');
  });
  it('max contrast on the canvas is 21:1', () => {
    expect(contrast(c.text.primary.dark, canvas)).toBeCloseTo(21, 0);
  });
});
