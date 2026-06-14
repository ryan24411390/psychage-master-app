import { useColorScheme } from 'nativewind';
import Svg, { Line, Rect } from 'react-native-svg';

import { colors } from '@/lib/colors';

// The body-scan glyph family: a capsule (rounded rect) with a single band that descends
// as attention moves down the body. `progress` (0..1) positions the band. Not a meter —
// it's the body figure, and the count lives in the prompt's label line.

export interface BodyScanGlyphProps {
  readonly progress: number;
}

const TOP = 8;
const BOTTOM = 112;

export function BodyScanGlyph({ progress }: BodyScanGlyphProps) {
  const { colorScheme } = useColorScheme();
  const stroke = colorScheme === 'dark' ? colors.charcoal[400] : colors.charcoal[500];
  const band = colorScheme === 'dark' ? colors.primary.default.dark : colors.primary.default.light;
  const clamped = Math.min(1, Math.max(0, progress));
  const y = TOP + (BOTTOM - TOP) * clamped;

  return (
    <Svg width={48} height={120} viewBox="0 0 48 120">
      <Rect x={8} y={8} width={32} height={104} rx={16} stroke={stroke} strokeWidth={1.5} fill="none" />
      <Line x1={10} y1={y} x2={38} y2={y} stroke={band} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
