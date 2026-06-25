// Brand-font embedding for the print artifacts. PURE (no native import) so it stays
// Vitest-testable. The shared shell (build-html.ts) emits PDF_FONTS_MARKER inside its
// <style>; the NATIVE printer (expo-printer.ts) reads the bundled .ttf assets at
// generate-time, base64-encodes them, and replaces the marker with the @font-face
// block below. This keeps ~1MB of font bytes OUT of the JS bundle — they are loaded
// only when an export actually runs, and the document degrades gracefully to system
// fonts if encoding fails (the marker is simply removed).
//
// DD-001 typography lock: display/headings = Fraunces (600), body/UI = IBM Plex Sans
// (400/700). Both SIL OFL — embedding the binary in a distributed PDF is permitted.

/** The font-family names the print CSS references (must match the @font-face below). */
export const PDF_FONT_FAMILY = {
  display: 'Fraunces',
  body: 'IBM Plex Sans',
} as const;

/**
 * CSS-comment placeholder the shell emits inside its <style>. The native printer swaps
 * it for the real @font-face rules; if it can't, it removes the marker (system fonts).
 * A CSS comment so the document is valid CSS whether or not it gets replaced.
 */
export const PDF_FONTS_MARKER = '/*__PDF_FONTS__*/';

/** Base64 (no data: prefix) of each embedded weight. */
export interface PdfFontData {
  readonly fraunces600: string;
  readonly plex400: string;
  readonly plex700: string;
}

function fontFace(family: string, weight: number, base64: string): string {
  return (
    `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};` +
    `src:url(data:font/ttf;base64,${base64}) format("truetype");}`
  );
}

/**
 * Build the @font-face block for the three embedded weights. Pure string fn — the
 * caller supplies the base64 read from the bundled assets. Medium weights in the
 * design map onto 400/700, so only three faces are embedded (keeps the size down).
 */
export function buildFontFaceCss(data: PdfFontData): string {
  return [
    fontFace(PDF_FONT_FAMILY.body, 400, data.plex400),
    fontFace(PDF_FONT_FAMILY.body, 700, data.plex700),
    fontFace(PDF_FONT_FAMILY.display, 600, data.fraunces600),
  ].join('');
}
