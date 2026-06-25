import { describe, expect, it } from 'vitest';

import {
  buildFontFaceCss,
  PDF_FONT_FAMILY,
  PDF_FONTS_MARKER,
  type PdfFontData,
} from '@/features/therapist/pdf/pdf-fonts';

// buildFontFaceCss is the PURE half of brand-font embedding: it turns the three base64
// weights (read natively from the bundled .ttf assets) into an @font-face block the
// native printer injects at PDF_FONTS_MARKER. The native read itself is not unit-tested
// (it needs expo-asset/expo-file-system); this proves the CSS it produces.

const DATA: PdfFontData = { fraunces600: 'AAAA', plex400: 'BBBB', plex700: 'CCCC' };

describe('buildFontFaceCss', () => {
  it('emits exactly three @font-face rules (the embedded weights)', () => {
    const css = buildFontFaceCss(DATA);
    expect((css.match(/@font-face/g) ?? []).length).toBe(3);
  });

  it('embeds each weight as a base64 truetype data URI', () => {
    const css = buildFontFaceCss(DATA);
    expect(css).toContain('src:url(data:font/ttf;base64,AAAA) format("truetype")');
    expect(css).toContain('src:url(data:font/ttf;base64,BBBB) format("truetype")');
    expect(css).toContain('src:url(data:font/ttf;base64,CCCC) format("truetype")');
  });

  it('maps weights to the two brand families (400/700 body, 600 display)', () => {
    const css = buildFontFaceCss(DATA);
    expect(css).toContain(`font-family:"${PDF_FONT_FAMILY.body}";font-style:normal;font-weight:400`);
    expect(css).toContain(`font-family:"${PDF_FONT_FAMILY.body}";font-style:normal;font-weight:700`);
    expect(css).toContain(`font-family:"${PDF_FONT_FAMILY.display}";font-style:normal;font-weight:600`);
  });

  it('marker is a valid CSS comment (safe whether or not it gets replaced)', () => {
    expect(PDF_FONTS_MARKER.startsWith('/*')).toBe(true);
    expect(PDF_FONTS_MARKER.endsWith('*/')).toBe(true);
  });
});
