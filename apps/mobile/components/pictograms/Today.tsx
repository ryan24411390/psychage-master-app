import Svg, { Circle, Line } from 'react-native-svg';

import { tabBarTokens } from '@/lib/a1-tokens';

import { PICTOGRAM_VIEWBOX, type PictogramProps, useTealDot } from './shared';

// Today: concentric today-mark promoted to chrome — outer ink ring r6.5, four
// short radial ticks at the cardinals, and the teal center dot (inner r2.6).
export function TodayPictogram({ color, size = tabBarTokens.iconSize, testID }: PictogramProps) {
  const teal = useTealDot();
  return (
    <Svg width={size} height={size} viewBox={PICTOGRAM_VIEWBOX} testID={testID}>
      <Circle cx={17} cy={17} r={6.5} stroke={color} strokeWidth={1.6} fill="none" />
      <Line x1={17} y1={8} x2={17} y2={10.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={17} y1={23.5} x2={17} y2={26} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={8} y1={17} x2={10.5} y2={17} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={23.5} y1={17} x2={26} y2={17} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={17} cy={17} r={2.6} fill={teal} />
    </Svg>
  );
}
