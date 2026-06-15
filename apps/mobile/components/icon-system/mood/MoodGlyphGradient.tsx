// Mood 5-point scale — DRAFT direction A: "abstract level".
//
// DRAFT for clinical review (Slice 3a). NOT wired into any live surface.
// Dr. Lena Dobson selects direction A (this) vs B (MoodGlyphFace) before any
// production use. Mood is an emotional concept → VERIFY gate.
//
// Visual: a single circle whose internal fill RISES with mood, tinted by the
// same per-state mood color the terrain uses (terrainTokens.color.moodTint) at
// the same proportional levels (terrainTokens.fillByState 12/32/52/74/95%).
// No face, no emoji — an abstract "how full" reading that reuses the app's
// existing mood-tint + fill vocabulary so it can never drift from the terrain.

import { useColorScheme } from 'nativewind';
import Svg, { Circle, ClipPath, Defs, Rect } from 'react-native-svg';

import { colorForScheme, terrainTokens } from '@/lib/a1-tokens';

import { DEFAULT_ICON_SIZE, ICON_VIEWBOX, type IconProps, useIconInk } from '../shared';
import type { MoodScale } from './types';

type MoodGlyphProps = IconProps & { state: MoodScale };

const CX = 16;
const CY = 16;
const R = 12;
const TOP = CY - R; // 4
const DIAMETER = R * 2; // 24

export function MoodGlyphGradient({ state, color, size = DEFAULT_ICON_SIZE, testID }: MoodGlyphProps) {
  const { colorScheme } = useColorScheme();
  const ink = useIconInk();
  const tint = colorForScheme(terrainTokens.color.moodTint[state], colorScheme);

  // Fill level as a fraction of the circle height, from the bottom up.
  const fraction = terrainTokens.fillByState[state] / 100;
  const fillHeight = DIAMETER * fraction;
  const fillY = TOP + (DIAMETER - fillHeight);

  const clipId = `mood-grad-clip-${state}`;

  return (
    <Svg width={size} height={size} viewBox={ICON_VIEWBOX} testID={testID}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={CX} cy={CY} r={R} />
        </ClipPath>
      </Defs>
      <Rect x={TOP} y={fillY} width={DIAMETER} height={fillHeight} fill={tint} clipPath={`url(#${clipId})`} />
      <Circle cx={CX} cy={CY} r={R} stroke={color ?? ink} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}
