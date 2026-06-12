import { describe, it, expect } from 'vitest';

// Runner-independent half of the Slice-1 weight-mapping regression net. The
// jest-side Text.test.tsx pins variant → font-family *class*; this pins
// class → family-string by reading the actual tailwind config (which sources
// the strings from tokens/mobile.tokens.json type.family). Revert either a
// tailwind line or a token value and this goes red — no Metro/NativeWind
// runtime needed, so it always runs.
//
// tailwind.config.js is CommonJS; its internal `require('../../tokens/...')` is
// relative to the config file, so importing it here resolves the tokens fine.
import tailwindConfig from '../tailwind.config.js';

const fontFamily = (tailwindConfig as { theme: { extend: { fontFamily: Record<string, string[]> } } })
  .theme.extend.fontFamily;

describe('tailwind fontFamily ← tokens type.family', () => {
  it('font-sans → IBM Plex Sans 400', () => {
    expect(fontFamily.sans).toEqual(['IBMPlexSans_400Regular']);
  });

  it('font-sans-medium → IBM Plex Sans 500', () => {
    expect(fontFamily['sans-medium']).toEqual(['IBMPlexSans_500Medium']);
  });

  it('font-sans-bold → IBM Plex Sans 700', () => {
    expect(fontFamily['sans-bold']).toEqual(['IBMPlexSans_700Bold']);
  });

  it('font-display → Fraunces 600 (display stays single-weight)', () => {
    expect(fontFamily.display).toEqual(['Fraunces_600SemiBold']);
  });
});
