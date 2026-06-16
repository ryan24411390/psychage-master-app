import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { getTierHexColor } from '../scoring';
import type { ScoreTier } from '../types';

// ScorePositionBar — five tier zones with a position marker. Faithful RN port of the
// web ScorePositionBar (used in the per-dimension detail at maxScore=20). Zone colors
// come from getTierHexColor; the active zone is full-opacity, the rest dimmed.

const TIER_DISPLAY: Record<ScoreTier, string> = {
  thriving: 'thriving',
  balanced: 'balanced',
  struggling: 'concerning',
  distressed: 'distressed',
  crisis: 'crisis',
};

interface Zone {
  readonly tier: ScoreTier;
  readonly label: string;
}

const ZONES_100: readonly Zone[] = [
  { tier: 'crisis', label: '0–19' },
  { tier: 'distressed', label: '20–39' },
  { tier: 'struggling', label: '40–59' },
  { tier: 'balanced', label: '60–79' },
  { tier: 'thriving', label: '80–100' },
];

const ZONES_20: readonly Zone[] = [
  { tier: 'crisis', label: '0–3' },
  { tier: 'distressed', label: '4–7' },
  { tier: 'struggling', label: '8–11' },
  { tier: 'balanced', label: '12–15' },
  { tier: 'thriving', label: '16–20' },
];

export interface ScorePositionBarProps {
  readonly score: number;
  readonly maxScore?: number;
  readonly tier: ScoreTier;
}

export function ScorePositionBar({ score, maxScore = 100, tier }: ScorePositionBarProps) {
  const tc = useThemeColors();
  const zones = maxScore === 20 ? ZONES_20 : ZONES_100;
  const position = Math.min(Math.max((score / maxScore) * 100, 1), 99);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Score position: ${Math.round(score)} out of ${maxScore}, ${tier}`}
    >
      {/* Zone range labels */}
      <View className="mb-1 flex-row">
        {zones.map((zone) => (
          <View key={zone.tier} className="flex-1 items-center">
            <Text
              style={{
                fontSize: 11,
                fontWeight: zone.tier === tier ? '700' : '500',
                color: zone.tier === tier ? tc.ink : tc.inkTertiary,
              }}
            >
              {zone.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Bar with zones + position marker */}
      <View style={{ height: 12, borderRadius: 999, flexDirection: 'row', overflow: 'hidden' }}>
        {zones.map((zone, i) => (
          <View
            key={zone.tier}
            style={{
              flex: 1,
              backgroundColor: getTierHexColor(zone.tier),
              opacity: zone.tier === tier ? 1 : 0.4,
              borderTopLeftRadius: i === 0 ? 999 : 0,
              borderBottomLeftRadius: i === 0 ? 999 : 0,
              borderTopRightRadius: i === zones.length - 1 ? 999 : 0,
              borderBottomRightRadius: i === zones.length - 1 ? 999 : 0,
            }}
          />
        ))}
        <View
          style={{
            position: 'absolute',
            top: -4,
            left: `${position}%`,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 999,
            backgroundColor: tc.ink === '#FFFFFF' ? '#000000' : '#FFFFFF',
            borderWidth: 3,
            borderColor: tc.ink,
          }}
        />
      </View>

      {/* Tier labels */}
      <View className="mt-1 flex-row">
        {zones.map((zone) => (
          <View key={zone.tier} className="flex-1 items-center">
            <Text
              style={{
                fontSize: 11,
                textTransform: 'capitalize',
                fontWeight: zone.tier === tier ? '600' : '400',
                color: zone.tier === tier ? tc.inkSecondary : tc.inkTertiary,
              }}
            >
              {TIER_DISPLAY[zone.tier]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
