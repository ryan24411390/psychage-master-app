import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useAnimatedProps, useSharedValue, withTiming, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// MetricBars — categorical vertical bars (sleep duration by night, mood distribution).
// Upgraded with press-and-hold interactive tooltips and progressive entry animations.

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

const LABEL_BAND = 24; // px reserved at the bottom for x-axis labels
const GAP = 12;
const RADIUS = 6;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedBar({
  x,
  finalH,
  plotH,
  bandW,
  color,
  progress,
  delay,
  isActive,
}: {
  x: number;
  finalH: number;
  plotH: number;
  bandW: number;
  color: string;
  progress: SharedValue<number>;
  delay: number;
  isActive: boolean;
}) {
  const animatedProps = useAnimatedProps(() => {
    const scale = Math.max(0, Math.min(1, (progress.value - delay) / (1 - delay || 1)));
    const h = finalH * scale;
    const y = plotH - h;
    return {
      height: h,
      y: y,
      fillOpacity: isActive ? 1 : 0.7,
    };
  }, [isActive]);

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
  width = 300,
  height = 180,
  maxValue,
  testID,
  accessibilityLabel,
}: MetricBarsProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();

  const isEmpty = bars.length === 0;
  const plotH = height - LABEL_BAND;
  const n = bars.length;
  const maxBandW = 48;
  const bandW = n > 0 ? Math.min((width - GAP * (n - 1)) / n, maxBandW) : 0;
  const totalPlotW = n * bandW + (n - 1) * GAP;
  const startX = (width - totalPlotW) / 2;
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

  // Interactive tooltip state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tooltipOpacity = useSharedValue(0);
  
  const activeBar = activeIndex !== null ? bars[activeIndex] : null;

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
  }));

  return (
    <View className="items-center justify-center">
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
              fontSize={14}
              fill={tc.inkTertiary}
              textAnchor="middle"
            >
              No data yet
            </SvgText>
          ) : (
            bars.map((b, i) => {
              const v = Number.isFinite(b.value) ? Math.max(0, b.value) : 0;
              const h = max > 0 ? (v / max) * plotH : 0;
              const x = startX + i * (bandW + GAP);
              const delay = n > 1 ? (i / (n - 1)) * 0.4 : 0;
              const isActive = activeIndex === null || activeIndex === i;

              return (
                <G
                  key={`bar-${b.label}`}
                  onPressIn={() => {
                    setActiveIndex(i);
                    tooltipOpacity.value = withSpring(1);
                  }}
                  onPressOut={() => {
                    setActiveIndex(null);
                    tooltipOpacity.value = withTiming(0);
                  }}
                >
                  <AnimatedBar
                    x={x}
                    finalH={h}
                    plotH={plotH}
                    bandW={bandW}
                    color={b.color ?? tc.primary}
                    progress={progress}
                    delay={delay}
                    isActive={isActive}
                  />
                  {/* Invisible rect to increase touch target */}
                  <Rect
                    x={x - GAP/2}
                    y={0}
                    width={bandW + GAP}
                    height={height}
                    fill="transparent"
                  />
                  <SvgText
                    x={x + bandW / 2}
                    y={height - 4}
                    fontSize={11}
                    fontWeight={activeIndex === i ? "bold" : "normal"}
                    fill={activeIndex === i ? tc.ink : tc.inkSecondary}
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
      
      {/* Absolute Tooltip rendering exact value */}
      {!isEmpty && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              alignSelf: 'center',
            },
            tooltipStyle,
          ]}
        >
          <View className="rounded-full bg-ink px-3 py-1 shadow-sm dark:bg-ink-dark">
            <Text variant="caption" className="text-center font-bold text-surface dark:text-surface-dark">
              {activeBar ? `${activeBar.label}: ${Math.round(activeBar.value)}` : ''}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
