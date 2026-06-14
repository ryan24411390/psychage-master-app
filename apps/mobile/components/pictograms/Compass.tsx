import Svg, { Circle, Line } from 'react-native-svg';

import { tabBarTokens } from '@/lib/a1-tokens';

import { PICTOGRAM_VIEWBOX, type PictogramProps, useTealDot } from './shared';

// Compass: outer ink ring r13, a needle stroke from center to NE, anchored by
// the teal center dot r2.
export function CompassPictogram({ color, size = tabBarTokens.iconSize, testID }: PictogramProps) {
  const teal = useTealDot();
  return (
    <Svg width={size} height={size} viewBox={PICTOGRAM_VIEWBOX} testID={testID}>
      <Circle cx={17} cy={17} r={13} stroke={color} strokeWidth={1.6} fill="none" />
      <Line x1={17} y1={17} x2={23.5} y2={10.5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={17} cy={17} r={2} fill={teal} />
    </Svg>
  );
}
