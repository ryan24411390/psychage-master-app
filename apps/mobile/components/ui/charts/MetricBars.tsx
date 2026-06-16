import { useEffect } from 'react';
import Animated, { FadeIn, useAnimatedProps, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// MetricBars — categorical vertical bars (sleep duration by night, mood distribution).
// Built on react-native-svg, no chart library. Bars scale to `maxValue` (or the
// largest value present). Each bar may carry its own color (raw hex) so a consuming
// lane can map its own palette — e.g. mood scale — without this primitive importing
// one; the default is brand teal via useThemeColors (scheme-resolved). Pure
// presentational, non-interactive.

export interface MetricBar {
  readonly label: string;
  readonly value: number;
  /** Optional per-bar color (raw hex). Defaults to brand teal. */
  readonly color?: string;
}

export interface MetricBarsProps {
  readonly bars: readonly MetricBar[];
  readonly width?: number;
  readonly height?: number;
  /** Force the y-axis ceiling. Defaults to the largest bar value. */
  readonly maxValue?: number;
  readonly testID?: string;
  /** Override the auto-generated data summary read to screen readers. */
  readonly accessibilityLabel?: string;
}

const LABEL_BAND = 20; // px reserved at the bottom for x-axis labels
const GAP = 8;
const RADIUS = 4;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedBar({
  x,
  finalH,
  plotH,
  bandW,
  color,
  progress,
  delay,
}: {
  x: number;
  finalH: number;
  plotH: number;
  bandW: number;
  color: string;
  progress: SharedValue<number>;
  delay: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const scale = Math.max(0, Math.min(1, (progress.value - delay) / (1 - delay || 1)));
    const h = finalH * scale;
    const y = plotH - h;
    return {
      height: h,
      y: y,
    };
  });

  return (
    <AnimatedRect
      x={x}
      width={bandW}
      rx={RADIUS}
      fill={color}
      animatedProps={animatedProps}
    />
  );
}

export function MetricBars({
  bars,
  width = 280,
  height = 160,
  maxValue,
  testID,
  accessibilityLabel,
}: MetricBarsProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();

  const isEmpty = bars.length === 0;
  const plotH = height - LABEL_BAND;
  const n = bars.length;
  const bandW = n > 0 ? (width - GAP * (n - 1)) / n : 0;
  const max = maxValue ?? Math.max(1, ...bars.map((b) => (Number.isFinite(b.value) ? b.value : 0)));

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
    (isEmpty
      ? 'No data yet'
      : `Bar chart: ${bars.map((b) => `${b.label} ${Math.round(b.value)}`).join(', ')}`);

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
          <SvgText
            x={width / 2}
            y={height / 2}
            fontSize={12}
            fill={tc.inkTertiary}
            textAnchor="middle"
          >
            No data yet
          </SvgText>
        ) : (
          bars.map((b, i) => {
            const v = Number.isFinite(b.value) ? Math.max(0, b.value) : 0;
            const h = max > 0 ? (v / max) * plotH : 0;
            const x = i * (bandW + GAP);
            const delay = n > 1 ? (i / (n - 1)) * 0.4 : 0;
            return (
              <G key={`bar-${b.label}`}>
                <AnimatedBar
                  x={x}
                  finalH={h}
                  plotH={plotH}
                  bandW={bandW}
                  color={b.color ?? tc.primary}
                  progress={progress}
                  delay={delay}
                />
                <SvgText
                  x={x + bandW / 2}
                  y={height - 6}
                  fontSize={10}
                  fill={tc.inkSecondary}
                  textAnchor="middle"
                >
                  {b.label}
                </SvgText>
              </G>
            );
          })
        )}
      </Svg>
    </Animated.View>
  );
}
