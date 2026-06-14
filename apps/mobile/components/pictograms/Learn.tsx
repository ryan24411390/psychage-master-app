import Svg, { Circle, Rect } from 'react-native-svg';

import { tabBarTokens } from '@/lib/a1-tokens';

import { PICTOGRAM_VIEWBOX, type PictogramProps, useTealDot } from './shared';

// Learn: two stacked pages. The back page ("clay-2") is the ink at reduced
// opacity for depth — there is no ratified clay-2 token, so two-layer depth is
// expressed as an opacity step, not a second color (tree-governed; see plan §4).
// The front page carries the teal dot.
export function LearnPictogram({ color, size = tabBarTokens.iconSize, testID }: PictogramProps) {
  const teal = useTealDot();
  return (
    <Svg width={size} height={size} viewBox={PICTOGRAM_VIEWBOX} testID={testID}>
      <Rect
        x={7.5}
        y={7}
        width={13}
        height={22}
        rx={3}
        stroke={color}
        strokeWidth={1.6}
        strokeOpacity={0.4}
        fill="none"
      />
      <Rect x={13.5} y={5} width={12} height={24} rx={3} stroke={color} strokeWidth={1.6} fill="none" />
      <Circle cx={19.5} cy={17} r={2.2} fill={teal} />
    </Svg>
  );
}
