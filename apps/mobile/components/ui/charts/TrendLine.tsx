import { useEffect } from 'react';
import Animated, { FadeIn, useAnimatedProps, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// TrendLine — a time-series line for mood/sleep trends. Built on react-native-svg,
// no chart library. Points are positioned by their index across the full series so a
// `null` y leaves a horizontal gap (partial data) rather than collapsing the axis;
// the line is segmented across those gaps (mirrors components/terrain's no-entry
// handling). Empty (no points, or all null) renders a dashed baseline + "No data
// yet". Colors resolve by scheme via useThemeColors. Pure presentational.

export interface TrendPoint {
  /** X identity — index/label/timestamp. Not plotted directly; spacing is by order. */
  readonly x: number | string;
  /** Y value. `null` marks a gap (missing reading). */
  readonly y: number | null;
}

export interface TrendLineProps {
  readonly data: readonly TrendPoint[];
  readonly width?: number;
  readonly height?: number;
  /** Override the line/dot color (raw hex). Defaults to brand teal. */
  readonly lineColor?: string;
  readonly testID?: string;
  /** Override the auto-generated data summary read to screen readers. */
  readonly accessibilityLabel?: string;
}

const PAD = 8;
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type PlotPoint = { readonly i: number; readonly x: number; readonly y: number };

const segmentLength = (seg: PlotPoint[]) => {
  let len = 0;
  for (let i = 1; i < seg.length; i++) {
    const p1 = seg[i - 1];
    const p2 = seg[i];
    if (p1 && p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
  }
  return len || 1;
};

function AnimatedSegment({
  points,
  len,
  progress,
  stroke,
}: {
  points: string;
  len: number;
  progress: SharedValue<number>;
  stroke: string;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - progress.value),
  }));
  return (
    <AnimatedPolyline
      points={points}
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={len}
      animatedProps={animatedProps}
    />
  );
}

function AnimatedDot({
  cx,
  cy,
  progress,
  stroke,
  delay,
}: {
  cx: number;
  cy: number;
  progress: SharedValue<number>;
  stroke: string;
  delay: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const scale = Math.max(0, Math.min(1, (progress.value - delay) / (1 - delay || 1)));
    return {
      r: 3 * scale,
    };
  });
  return <AnimatedCircle cx={cx} cy={cy} fill={stroke} animatedProps={animatedProps} />;
}

export function TrendLine({
  data,
  width = 280,
  height = 120,
  lineColor,
  testID,
  accessibilityLabel,
}: TrendLineProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const stroke = lineColor ?? tc.primary;

  const present = data.filter(
    (d): d is { x: number | string; y: number } => d.y != null && Number.isFinite(d.y),
  );
  const isEmpty = present.length === 0;

  const n = data.length;
  const innerW = width - PAD * 2;
  const innerH = height - PAD * 2;
  const ys = present.map((d) => d.y);
  const minY = isEmpty ? 0 : Math.min(...ys);
  const maxY = isEmpty ? 1 : Math.max(...ys);
  const span = maxY - minY || 1;

  const px = (i: number) => PAD + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const py = (v: number) => PAD + innerH - ((v - minY) / span) * innerH;

  // Group consecutive present points into runs; a gap (null) breaks the run.
  const segments: PlotPoint[][] = [];
  let run: PlotPoint[] = [];
  data.forEach((d, i) => {
    if (d.y != null && Number.isFinite(d.y)) {
      run.push({ i, x: px(i), y: py(d.y) });
    } else if (run.length > 0) {
      segments.push(run);
      run = [];
    }
  });
  if (run.length > 0) segments.push(run);
  const dots = segments.flat();

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: DURATION.calm, easing: easingFn('out') });
  }, [reduced, progress]);

  const a11y =
    accessibilityLabel ??
    (isEmpty ? 'No trend data yet' : `Trend line with ${present.length} of ${n} points`);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11y}
      testID={testID}
      entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('standard'))}
    >
      <Svg width={width} height={height}>
        {isEmpty ? (
          <>
            <Line
              x1={PAD}
              y1={height / 2}
              x2={width - PAD}
              y2={height / 2}
              stroke={tc.inkTertiary}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={width / 2}
              y={height / 2 - 8}
              fontSize={12}
              fill={tc.inkTertiary}
              textAnchor="middle"
            >
              No data yet
            </SvgText>
          </>
        ) : (
          <>
            {segments.map((seg) => {
              const first = seg[0];
              if (!first || seg.length < 2) return null;
              const pointsStr = seg.map((p) => `${p.x},${p.y}`).join(' ');
              const len = segmentLength(seg);
              return (
                <AnimatedSegment
                  key={`seg-${first.i}`}
                  points={pointsStr}
                  len={len}
                  progress={progress}
                  stroke={stroke}
                />
              );
            })}
            {dots.map((p) => {
              const delay = n > 1 ? (p.i / (n - 1)) * 0.7 : 0;
              return (
                <AnimatedDot
                  key={`dot-${p.i}`}
                  cx={p.x}
                  cy={p.y}
                  progress={progress}
                  stroke={stroke}
                  delay={delay}
                />
              );
            })}
          </>
        )}
      </Svg>
    </Animated.View>
  );
}
