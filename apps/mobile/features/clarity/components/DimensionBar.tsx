import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { DIMENSION_META, getDimensionTier } from '../dimensions';
import type { DomainKey } from '../types';
import { TierBadge } from './TierBadge';

// DimensionBar — one labeled progress bar for a dimension (0–20). Faithful RN port of
// the web DimensionBar: the fill animates 0→pct% over 0.8s easeOut, staggered by `delay`
// (web passed i*0.1s). Reanimated drives scaleX from a left origin rather than animating
// a percentage width (cheaper, identical visual). Reduced motion → final width.

const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

export interface DimensionBarProps {
  readonly dimensionKey: DomainKey;
  readonly score: number;
  /** Stagger offset in ms (web used i*100). */
  readonly delayMs?: number;
  readonly showTier?: boolean;
  readonly onPress?: () => void;
}

export function DimensionBar({
  dimensionKey,
  score,
  delayMs = 0,
  showTier = false,
  onPress,
}: DimensionBarProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const meta = DIMENSION_META[dimensionKey];
  const Icon = meta.icon;
  const pct = Math.min((score / 20) * 100, 100);
  const tier = getDimensionTier(score);

  const sx = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    sx.value = reduced ? 1 : withDelay(delayMs, withTiming(1, { duration: 800, easing: EASE_OUT }));
  }, [reduced, delayMs, sx]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: sx.value }] }));

  const body = (
    <>
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon size={16} color={meta.hexColor} />
          <Text variant="bodyLarge" className="text-[13px]">
            {meta.name}
          </Text>
          {showTier ? <TierBadge tier={tier} size="sm" /> : null}
        </View>
        <Text variant="label" className="text-[13px]">
          {Math.round(score)}/20
        </Text>
      </View>
      <View
        style={{ height: 12, borderRadius: 999, backgroundColor: tc.inkTertiary, overflow: 'hidden' }}
      >
        <Animated.View
          style={[
            {
              width: `${pct}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: meta.hexColor,
              transformOrigin: 'left',
            },
            fillStyle,
          ]}
        />
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${meta.name}, ${Math.round(score)} out of 20`}
        onPress={onPress}
        hitSlop={6}
        className="min-h-[44px] justify-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {body}
      </Pressable>
    );
  }

  return <View>{body}</View>;
}
