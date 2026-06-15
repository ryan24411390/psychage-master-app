// Mood 5-point scale glyph — "minimal face" (was direction B).
//
// Chosen direction (Slice 3a): Dr. Lena Dobson reviewed A (MoodGlyphGradient) vs
// B (this) and selected B with no changes — clearing the VERIFY gate for the
// mood-level concept. Direction A was removed; this glyph is now wired into the
// live check-in surfaces (StateRows + the EntryDetailSheet read-only mirror).
//
// Visual: a single ink-only circle with two dot eyes and ONE mouth whose
// curvature maps to state — a downward arc at "Very low" through flat at "Okay"
// to an upward arc at "Very good". This is a DRAWN geometric face, not an emoji
// glyph (the app's no-emoji rule is about emoji codepoints, which this never
// uses). Single ink color, no mood tint — the shape alone carries the reading,
// so it stays legible in monochrome and at small sizes.

import Svg, { Circle, Path } from 'react-native-svg';

import { DEFAULT_ICON_SIZE, ICON_VIEWBOX, type IconProps, useIconInk } from '../shared';
import type { MoodScale } from './types';

type MoodGlyphProps = IconProps & { state: MoodScale };

const CX = 16;
const CY = 16;
const R = 12;
const MOUTH_Y = 20; // mouth endpoints
const MOUTH_X1 = 11;
const MOUTH_X2 = 21;

// Mouth control-point Y per state. Above the endpoints (smaller y) = frown;
// below (larger y) = smile. Symmetric around "Okay" (state 2 = flat).
const MOUTH_CONTROL_Y: Record<MoodScale, number> = {
  0: 15, // ∩ frown
  1: 17.5,
  2: 20, // — flat
  3: 22.5,
  4: 25, // U smile
};

export function MoodGlyphFace({ state, color, size = DEFAULT_ICON_SIZE, testID }: MoodGlyphProps) {
  const ink = useIconInk();
  const stroke = color ?? ink;
  const controlY = MOUTH_CONTROL_Y[state];
  const mouth = `M ${MOUTH_X1} ${MOUTH_Y} Q ${CX} ${controlY} ${MOUTH_X2} ${MOUTH_Y}`;

  return (
    <Svg width={size} height={size} viewBox={ICON_VIEWBOX} testID={testID}>
      <Circle cx={CX} cy={CY} r={R} stroke={stroke} strokeWidth={1.6} fill="none" />
      <Circle cx={12} cy={14} r={1.3} fill={stroke} />
      <Circle cx={20} cy={14} r={1.3} fill={stroke} />
      <Path d={mouth} stroke={stroke} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
