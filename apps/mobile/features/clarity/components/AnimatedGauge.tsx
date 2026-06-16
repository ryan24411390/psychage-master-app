import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { getTierHexColor } from '../scoring';
import type { ScoreTier } from '../types';
import { CountUpText } from './CountUpText';
import { TierBadge } from './TierBadge';

// AnimatedGauge — the composite Clarity Score gauge, a faithful RN port of the web
// ScoreGauge: a 270° (ARC_SWEEP 0.75) arc rotated 135°, the fill arc sweeping in over
// 1.2s easeOut while the center number counts up in lockstep. Geometry constants are
// the web's exactly (SIZE 200, STROKE 14). Colors by tier via getTierHexColor; track
// via useThemeColors so it reads on the true-black canvas. Reduced motion → final state.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_SWEEP = 0.75; // 270° arc
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1); // framer 'easeOut'

const TIER_SENTENCES: Record<ScoreTier, string> = {
  thriving: 'Strong wellness across most dimensions',
  balanced: 'Solid foundation with room to grow',
  struggling: 'Some areas need attention',
  distressed: 'Significant challenges detected',
  crisis: 'Immediate support recommended',
};

export interface AnimatedGaugeProps {
  readonly score: number;
  readonly tier: ScoreTier;
  readonly label: string;
}

export function AnimatedGauge({ score, tier, label }: AnimatedGaugeProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const hex = getTierHexColor(tier);

  const clamped = Math.max(0, Math.min(100, score));
  const arcLength = CIRCUMFERENCE * ARC_SWEEP;
  const emptyArc = CIRCUMFERENCE * (1 - ARC_SWEEP);
  const filledTarget = arcLength * (clamped / 100);

  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    progress.value = reduced ? 1 : withTiming(1, { duration: 1200, easing: EASE_OUT });
  }, [reduced, progress]);

  const animatedProps = useAnimatedProps(() => {
    const fl = filledTarget * progress.value;
    return { strokeDasharray: `${fl} ${CIRCUMFERENCE - fl}` };
  });

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <View
      className="items-center"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Clarity Score: ${Math.round(clamped)} out of 100, ${label}`}
    >
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background arc (270°), rotated 135° so the gap sits at the bottom. */}
          <Circle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={tc.inkTertiary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${emptyArc}`}
            transform={`rotate(135 ${cx} ${cy})`}
          />
          {/* Filled arc — animates dasharray from 0 → filledTarget in lockstep with the count-up. */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={hex}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
            animatedProps={animatedProps}
          />
        </Svg>

        {/* Center number overlay */}
        <View className="absolute inset-0 items-center justify-center">
          <CountUpText
            value={Math.round(clamped)}
            style={{ fontSize: 56, fontWeight: '700', color: tc.ink, padding: 0, textAlign: 'center' }}
          />
          <Text style={{ fontSize: 13, color: tc.inkSecondary, marginTop: -4 }}>out of 100</Text>
        </View>
      </View>

      <View className="-mt-2 items-center">
        <TierBadge tier={tier} label={label} size="lg" />
        <Text
          variant="caption"
          className="mt-2 text-center text-text-secondary dark:text-text-secondary-dark"
          style={{ maxWidth: 180 }}
        >
          {TIER_SENTENCES[tier]}
        </Text>
      </View>
    </View>
  );
}
