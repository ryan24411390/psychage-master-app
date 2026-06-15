import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// DomainRadar — a multi-axis radar for Clarity's five dimensions (and similar
// multi-domain scores). Built on react-native-svg, no chart library — the shape
// mirrors features/relationship-health/RadarChart (concentric rings, one axis per
// point, a single filled polygon), written fresh here as a shared primitive. Unlike
// that feature copy, colors resolve by scheme via useThemeColors so the radar reads
// on the true-black dark canvas. Fewer than 3 axes can't form a polygon, so that is
// the empty state (a ring + "Not enough data"). Pure presentational.

export interface RadarDatum {
  readonly label: string;
  readonly value: number; // 0–100
}

export interface DomainRadarProps {
  readonly points: readonly RadarDatum[];
  readonly size?: number;
  /** Override the polygon fill/stroke color (raw hex). Defaults to brand teal. */
  readonly fillColor?: string;
  readonly testID?: string;
  /** Override the auto-generated data summary read to screen readers. */
  readonly accessibilityLabel?: string;
}

const RINGS = [25, 50, 75, 100];

function polar(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

export function DomainRadar({
  points,
  size = 260,
  fillColor,
  testID,
  accessibilityLabel,
}: DomainRadarProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();

  const n = points.length;
  const enough = n >= 3; // a polygon needs ≥3 axes
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44; // leave room for labels
  const grid = tc.inkTertiary;
  const fill = fillColor ?? tc.primary;

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
      const clamped = Math.max(0, Math.min(100, pt.value));
      const p = polar(cx, cy, radius * (clamped / 100), angleAt(i));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const a11y =
    accessibilityLabel ??
    (enough
      ? `Radar chart: ${points.map((p) => `${p.label} ${Math.round(p.value)}`).join(', ')}`
      : 'Not enough data');

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11y}
      testID={testID}
      entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('standard'))}
    >
      <Svg width={size} height={size}>
        <G>
          {enough ? (
            <>
              {/* grid rings */}
              {RINGS.map((pct) => (
                <Polygon
                  key={`ring-${pct}`}
                  points={gridRing(pct)}
                  fill="none"
                  stroke={grid}
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
                    stroke={grid}
                    strokeWidth={1}
                  />
                );
              })}
              {/* data polygon */}
              <Polygon
                points={dataPoly}
                fill={fill}
                fillOpacity={0.18}
                stroke={fill}
                strokeWidth={2}
              />
              {/* vertices */}
              {points.map((pt, i) => {
                const clamped = Math.max(0, Math.min(100, pt.value));
                const p = polar(cx, cy, radius * (clamped / 100), angleAt(i));
                return <Circle key={`dot-${pt.label}`} cx={p.x} cy={p.y} r={3} fill={fill} />;
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
                    fill={tc.inkSecondary}
                    textAnchor={anchor as 'start' | 'middle' | 'end'}
                  >
                    {pt.label}
                  </SvgText>
                );
              })}
            </>
          ) : (
            <>
              <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={grid} strokeWidth={1} />
              <SvgText
                x={cx}
                y={cy}
                fontSize={12}
                fill={tc.inkTertiary}
                textAnchor="middle"
              >
                Not enough data
              </SvgText>
            </>
          )}
        </G>
      </Svg>
    </Animated.View>
  );
}
