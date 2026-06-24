import { SvgXml } from 'react-native-svg';

import { useThemeColors } from '@/lib/use-theme-colors';

// Psychage brand mark — the symbol only, lifted from the full lockup SVG
// (assets/logo/psychage-logo-01.svg). The lockup's "PSYCHAGE" wordmark is live
// `<text>` set in Satoshi-Black, which the app does not bundle (DD-001 locks type
// to IBM Plex Sans + Fraunces), so we drop it and let the existing Fraunces
// `<Text>` wordmark carry the name. Rendered via the same `SvgXml` runtime path as
// article SVGs (no svg-transformer in the build).
//
// Theming: the source's ink fills (#1D1D1D / #1E1E1E) are inlined as `currentColor`
// and driven by `color` per scheme so the mark stays legible on the true-black dark
// canvas; the one teal dot keeps the brand mark's own teal (#00A99D). The viewBox is
// tightened to the symbol's bounds so it doesn't float in the lockup's whitespace.

const MARK_XML = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="270 175 470 490">
  <path fill="${color}" d="M578.17,421.71c1.14,42.48-35.84,75.34-76.53,74.19c-38.68-1.1-72.19-34.94-72.08-74.85c0.11-40.5,33.72-74.19,74.1-73.99C546.85,347.27,579.16,382.3,578.17,421.71z"/>
  <path fill="${color}" d="M503.96,290.1c-28.04,0.01-49.42-21.61-49.4-49.97c0.02-27.05,22.09-49.33,48.9-49.35c27.4-0.02,50.34,22.6,50.41,49.7C553.93,268.26,531.97,290.09,503.96,290.1z"/>
  <path fill="${color}" d="M289.39,343.09c-0.03-26.65,21.27-48.26,47.53-48.23c26.49,0.03,48.2,22.08,48.13,48.92c-0.06,26.46-21.23,47.72-47.54,47.74C310.23,391.55,289.41,370.6,289.39,343.09z"/>
  <path fill="${color}" d="M669.03,544.15c-27.06-0.04-47.59-20.72-47.51-47.88c0.07-26.12,21.83-47.58,48-47.35c26.6,0.23,46.95,21.37,46.88,48.69C716.35,523.64,695.43,544.19,669.03,544.15z"/>
  <path fill="${color}" d="M505.71,548.89c26.06,0.02,46.44,21.09,46.42,48.01c-0.01,26-21.08,46.9-47.23,46.85c-25.85-0.04-46.77-21.29-46.75-47.45C458.17,569.64,479.01,548.87,505.71,548.89z"/>
  <path fill="${color}" d="M408.65,532.6c0.22,25.55-20.02,45.79-45.24,46.74c-24.07,0.91-48.01-17.38-48.51-47.38c-0.41-24.71,20.84-46.07,44.99-46.96C385.33,484.06,409.19,504.88,408.65,532.6z"/>
  <path fill="#00A99D" d="M681.76,264.43c23.11-0.05,41.64,18.35,41.72,41.44c0.08,23.47-18.72,42.26-42.11,42.08c-22.93-0.18-41.48-18.56-41.67-41.31C639.49,283.39,658.33,264.48,681.76,264.43z"/>
  <path fill="${color}" d="M594.06,377.18c-5.8-0.02-9.97-2.77-11.92-7.6c-1.89-4.68-0.98-10.17,3.23-13.42c9.44-7.28,19.01-14.42,28.9-21.06c5.88-3.95,13.17-1.76,16.79,4.02c3.61,5.76,2.26,12.28-3.5,16.56c-8.14,6.04-16.32,12.03-24.48,18.05C600.27,375.79,597.39,377.63,594.06,377.18z"/>
</svg>`;

export interface PsychageLogoMarkProps {
  /** Square render size in points (default 64). */
  readonly size?: number;
  readonly testID?: string;
}

export function PsychageLogoMark({ size = 64, testID }: PsychageLogoMarkProps) {
  const { ink } = useThemeColors();
  return (
    <SvgXml
      xml={MARK_XML(ink)}
      width={size}
      height={size}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="Psychage"
    />
  );
}
