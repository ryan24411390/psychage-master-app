import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { colors } from '@/lib/colors';

// Lightweight radar (web parity) built on react-native-svg — no chart library is
// installed. Renders one axis per active domain (3 when partner is skipped, 4
// otherwise), concentric grid rings, and the score polygon in a single brand-teal
// accent. Pure presentational: it draws exactly the points it is given.

export interface RadarPoint {
  readonly label: string;
  readonly score: number; // 0–100
}

export interface RadarChartProps {
  readonly points: RadarPoint[];
  readonly size?: number;
}

const RINGS = [25, 50, 75, 100];

function polar(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

export function RadarChart({ points, size = 260 }: RadarChartProps) {
  const n = points.length;
  if (n < 3) return null; // a polygon needs ≥3 axes

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44; // leave room for labels
  // First axis points up; remaining axes spread clockwise.
  const angleAt = (i: number) => -90 + (360 / n) * i;

  const gridRing = (pct: number) =>
    points
      .map((_, i) => {
        const p = polar(cx, cy, radius * (pct / 100), angleAt(i));
        return `${p.x},${p.y}`;
      })
      .join(' ');

  const dataPoly = points
    .map((pt, i) => {
      const clamped = Math.max(0, Math.min(100, pt.score));
      const p = polar(cx, cy, radius * (clamped / 100), angleAt(i));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <View accessibilityRole="image" accessibilityLabel="Radar chart of your scores by area">
      <Svg width={size} height={size}>
        <G>
          {/* grid rings */}
          {RINGS.map((pct) => (
            <Polygon
              key={`ring-${pct}`}
              points={gridRing(pct)}
              fill="none"
              stroke={colors.charcoal[200]}
              strokeWidth={1}
            />
          ))}
          {/* axes */}
          {points.map((pt, i) => {
            const end = polar(cx, cy, radius, angleAt(i));
            return (
              <Line
                key={`axis-${pt.label}`}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke={colors.charcoal[200]}
                strokeWidth={1}
              />
            );
          })}
          {/* data polygon */}
          <Polygon
            points={dataPoly}
            fill={colors.primary.default.light}
            fillOpacity={0.18}
            stroke={colors.primary.default.light}
            strokeWidth={2}
          />
          {/* vertices */}
          {points.map((pt, i) => {
            const clamped = Math.max(0, Math.min(100, pt.score));
            const p = polar(cx, cy, radius * (clamped / 100), angleAt(i));
            return (
              <Circle key={`dot-${pt.label}`} cx={p.x} cy={p.y} r={3} fill={colors.primary.default.light} />
            );
          })}
          {/* labels */}
          {points.map((pt, i) => {
            const lp = polar(cx, cy, radius + 18, angleAt(i));
            const anchor = Math.abs(lp.x - cx) < 1 ? 'middle' : lp.x > cx ? 'start' : 'end';
            return (
              <SvgText
                key={`label-${pt.label}`}
                x={lp.x}
                y={lp.y + 4}
                fontSize={11}
                fill={colors.text.secondary.light}
                textAnchor={anchor as 'start' | 'middle' | 'end'}
              >
                {pt.label}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
