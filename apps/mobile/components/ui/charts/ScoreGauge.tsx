import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// ScoreGauge — a premium 0–100 radial gauge for single composite scores (Clarity composite,
// Sleep score). Upgraded with glow, pulse animations, and interactive entrance.

export interface ScoreGaugeProps {
  /** 0–100. `null` renders the empty state ("—", "No score yet"). */
  readonly value: number | null;
  /** Square px footprint. Default 160 for premium size. */
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

const STROKE = 14;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreGauge({
  value,
  size = 160,
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
  const r = (size - STROKE) / 2 - 8; // Extra padding for glow
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [score, setScore] = useState(0);

  useEffect(() => {
    progress.value = 0;
    pulse.value = 1;
    
    if (reduced) {
      progress.value = 1;
      setScore(clamped);
      return;
    }
    
    // Entrance animation
    progress.value = withTiming(1, { duration: DURATION.calm, easing: easingFn('out') });
    
    // Continuous subtle breathing pulse
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: easingFn('standard') }),
        withTiming(1, { duration: 1500, easing: easingFn('standard') })
      ),
      -1, // infinite
      true
    );

    // Number counting animation
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
  }, [clamped, reduced, progress, pulse]);

  const animatedCircleProps = useAnimatedProps(() => {
    const dashOffset = circumference * (1 - (clamped / 100) * progress.value);
    return {
      strokeDashoffset: dashOffset,
    };
  });

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  const track = trackColor ?? tc.inkTertiary;
  const fill = fillColor ?? tc.primary;

  const valueFontSize = Math.round(size * 0.28);
  const labelFontSize = Math.round(size * 0.08);

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
      entering={reduced ? undefined : FadeInDown.duration(DURATION.calm).easing(easingFn('standard'))}
      style={reduced ? undefined : animatedScaleStyle}
      className="items-center justify-center"
    >
      <View
        style={{
          shadowColor: fill,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: hasValue ? 0.2 : 0,
          shadowRadius: 12,
          elevation: hasValue ? 8 : 0,
        }}
      >
        <Svg width={size} height={size}>
          {/* unfilled track */}
          <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={STROKE} fill="none" opacity={0.3} />
          
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
            y={cy + valueFontSize * 0.36}
            fontSize={valueFontSize}
            fontWeight="700"
            fill={tc.ink}
            textAnchor="middle"
          >
            {hasValue ? String(score) : '—'}
          </SvgText>
          
          {label ? (
            <SvgText
              x={cx}
              y={cy + valueFontSize * 0.36 + Math.round(size * 0.16)}
              fontSize={labelFontSize}
              fill={tc.inkSecondary}
              textAnchor="middle"
            >
              {label.toUpperCase()}
            </SvgText>
          ) : null}
        </Svg>
      </View>
    </Animated.View>
  );
}
