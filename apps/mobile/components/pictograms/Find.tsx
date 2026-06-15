import Svg, { Circle, Path } from 'react-native-svg';

import { tabBarTokens } from '@/lib/a1-tokens';

import { PICTOGRAM_VIEWBOX, type PictogramProps, useTealDot } from './shared';

// Find: a soft cross outline (the verbatim path from the order), border-stroked
// in ink, with the teal center dot r2.
export function FindPictogram({ color, size = tabBarTokens.iconSize, testID }: PictogramProps) {
  const teal = useTealDot();
  return (
    <Svg width={size} height={size} viewBox={PICTOGRAM_VIEWBOX} testID={testID}>
      <Path
        d="M13 5h8v8h8v8h-8v8h-8v-8H5v-8h8z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={17} cy={17} r={2} fill={teal} />
    </Svg>
  );
}
