import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useAnimatedProps, useSharedValue, withTiming, withRepeat, withSequence, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// DomainRadar — a premium multi-axis radar for Clarity's five dimensions.
// Upgraded with pulsing nodes, smooth entry, and interactive tooltips on nodes.

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
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function polar(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

function RadarDot({
  cx,
  cy,
  radius,
  angle,
  value,
  progress,
  pulse,
  fill,
  isActive,
}: {
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  value: number;
  progress: SharedValue<number>;
  pulse: SharedValue<number>;
  fill: string;
  isActive: boolean;
}) {
  const animatedProps = useAnimatedProps(() => {
    const clamped = Math.max(0, Math.min(100, value)) * progress.value;
    const p = polar(cx, cy, radius * (clamped / 100), angle);
    const rScale = isActive ? 1.5 : pulse.value;
    return {
      cx: p.x,
      cy: p.y,
      r: 4 * rScale,
      strokeWidth: isActive ? 2 : 1,
    };
  }, [isActive]);

  return <AnimatedCircle fill={fill} stroke="#ffffff" animatedProps={animatedProps} />;
}

export function DomainRadar({
  points,
  size = 280,
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
  const radius = size / 2 - 50; // leave room for labels
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

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.value = 0;
    pulse.value = 1;
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: DURATION.calm, easing: easingFn('out') });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1500, easing: easingFn('standard') }),
        withTiming(1, { duration: 1500, easing: easingFn('standard') })
      ),
      -1,
      true
    );
  }, [reduced, progress, pulse]);

  const animatedPolygonProps = useAnimatedProps(() => {
    const pointsStr = points
      .map((pt, i) => {
        const clamped = Math.max(0, Math.min(100, pt.value)) * progress.value;
        const p = polar(cx, cy, radius * (clamped / 100), angleAt(i));
        return `${p.x},${p.y}`;
      })
      .join(' ');
    return {
      points: pointsStr,
    };
  });

  const a11y =
    accessibilityLabel ??
    (enough
      ? `Radar chart: ${points.map((p) => `${p.label} ${Math.round(p.value)}`).join(', ')}`
      : 'Not enough data');

  // Interactive tooltip state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tooltipOpacity = useSharedValue(0);

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

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
                    strokeDasharray={pct < 100 ? "3,3" : ""}
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
                      strokeDasharray="3,3"
                    />
                  );
                })}
                {/* data polygon */}
                <AnimatedPolygon
                  fill={fill}
                  fillOpacity={0.25}
                  stroke={fill}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  animatedProps={animatedPolygonProps}
                />
                
                {/* labels and interactive hit areas */}
                {points.map((pt, i) => {
                  const lp = polar(cx, cy, radius + 24, angleAt(i));
                  const anchor = Math.abs(lp.x - cx) < 1 ? 'middle' : lp.x > cx ? 'start' : 'end';
                  
                  // Hit area for touch
                  const hitArea = polar(cx, cy, radius, angleAt(i));
                  
                  return (
                    <G key={`interactive-${pt.label}`}
                       onPressIn={() => {
                         setActiveIndex(i);
                         tooltipOpacity.value = withSpring(1);
                       }}
                       onPressOut={() => {
                         setActiveIndex(null);
                         tooltipOpacity.value = withTiming(0);
                       }}>
                      {/* invisible enlarged circle for touch target */}
                      <Circle cx={hitArea.x} cy={hitArea.y} r={30} fill="transparent" />
                      
                      <SvgText
                        x={lp.x}
                        y={lp.y + 4}
                        fontSize={12}
                        fontWeight={activeIndex === i ? "bold" : "normal"}
                        fill={activeIndex === i ? tc.ink : tc.inkSecondary}
                        textAnchor={anchor as 'start' | 'middle' | 'end'}
                      >
                        {pt.label}
                      </SvgText>
                    </G>
                  );
                })}

                {/* vertices on top */}
                {points.map((pt, i) => (
                  <RadarDot
                    key={`dot-${pt.label}`}
                    cx={cx}
                    cy={cy}
                    radius={radius}
                    angle={angleAt(i)}
                    value={pt.value}
                    progress={progress}
                    pulse={pulse}
                    fill={fill}
                    isActive={activeIndex === i}
                  />
                ))}
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
      
      {/* Floating tooltip */}
      {enough && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 8,
              alignSelf: 'center',
            },
            tooltipStyle,
          ]}
        >
          <View className="rounded-full bg-ink px-3 py-1 shadow-sm dark:bg-ink-dark">
            <Text variant="caption" className="text-center font-bold text-surface dark:text-surface-dark">
              {activePoint ? `${activePoint.label}: ${Math.round(activePoint.value)}` : ''}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
