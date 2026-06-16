import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// Composite 0–100 score as a ring with the number centered (web parity — the
// numeric verdict is kept by product decision). Single brand-teal accent.

export interface ScoreRingProps {
  readonly score: number;
  readonly size?: number;
  readonly caption?: string;
}

export function ScoreRing({ score, size = 168, caption }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.charcoal[200]} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.primary.default.light}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          // start at 12 o'clock
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text variant="h2" className="text-[40px] leading-[44px] text-primary dark:text-primary-dark">
          {clamped}
        </Text>
        {caption ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
