import { useEffect, useState } from 'react';
import Animated, { FadeIn, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// ScoreGauge — a 0–100 radial gauge for single composite scores (Clarity composite,
// Sleep score). Built on react-native-svg (the repo chart convention — see
// features/relationship-health/RadarChart), no chart library. The value arc is a
// stroked Circle driven by strokeDasharray/strokeDashoffset (no arc-path math),
// rotated so it fills clockwise from 12 o'clock. Colors resolve by scheme via
// useThemeColors so the gauge flips on the true-black dark canvas; callers may
// override track/fill with raw hex. Pure presentational, non-interactive.

export interface ScoreGaugeProps {
  /** 0–100. `null` renders the empty state ("—", "No score yet"). */
  readonly value: number | null;
  /** Square px footprint. Default 140. */
  readonly size?: number;
  /** Optional caption under the value. */
  readonly label?: string;
  /** Override the unfilled track color (raw hex). Defaults to a faint ink. */
  readonly trackColor?: string;
  /** Override the value-arc color (raw hex). Defaults to brand teal. */
  readonly fillColor?: string;
  readonly testID?: string;
  /** Override the auto-generated data summary read to screen readers. */
  readonly accessibilityLabel?: string;
}

const STROKE = 12;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreGauge({
  value,
  size = 140,
  label,
  trackColor,
  fillColor,
  testID,
  accessibilityLabel,
}: ScoreGaugeProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();

  const hasValue = value != null && Number.isFinite(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value)) : 0;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    progress.value = 0;
    if (reduced) {
      progress.value = 1;
      setScore(clamped);
      return;
    }
    progress.value = withTiming(1, { duration: DURATION.calm, easing: easingFn('out') });

    const start = 0;
    const end = clamped;
    const duration = DURATION.calm;
    const startTime = Date.now();
    let timer: number;

    const update = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      if (elapsed >= duration) {
        setScore(end);
      } else {
        const progressVal = elapsed / duration;
        const easeProgress = progressVal * (2 - progressVal); // Ease out quad
        setScore(Math.round(start + (end - start) * easeProgress));
        timer = requestAnimationFrame(update);
      }
    };
    timer = requestAnimationFrame(update);
    return () => cancelAnimationFrame(timer);
  }, [clamped, reduced, progress]);

  const animatedCircleProps = useAnimatedProps(() => {
    const dashOffset = circumference * (1 - (clamped / 100) * progress.value);
    return {
      strokeDashoffset: dashOffset,
    };
  });

  const track = trackColor ?? tc.inkTertiary;
  const fill = fillColor ?? tc.primary;

  const valueFontSize = Math.round(size * 0.26);
  const labelFontSize = Math.round(size * 0.09);

  const a11y =
    accessibilityLabel ??
    (hasValue
       ? `Score ${Math.round(clamped)} out of 100${label ? `, ${label}` : ''}`
       : 'No score yet');

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11y}
      testID={testID}
      entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('standard'))}
    >
      <Svg width={size} height={size}>
        {/* unfilled track */}
        <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={STROKE} fill="none" />
        {/* value arc — rotated -90° so the sweep starts at 12 o'clock */}
        {hasValue ? (
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            stroke={fill}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedCircleProps}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : null}
        {/* center value */}
        <SvgText
          x={cx}
          y={cy + valueFontSize * 0.35}
          fontSize={valueFontSize}
          fontWeight="600"
          fill={tc.ink}
          textAnchor="middle"
        >
          {hasValue ? String(score) : '—'}
        </SvgText>
        {label ? (
          <SvgText
            x={cx}
            y={cy + valueFontSize * 0.35 + Math.round(size * 0.14)}
            fontSize={labelFontSize}
            fill={tc.inkSecondary}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ) : null}
      </Svg>
    </Animated.View>
  );
}
