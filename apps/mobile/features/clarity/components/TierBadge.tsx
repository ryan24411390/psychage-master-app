import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { getTierHexColor } from '../scoring';
import type { ScoreTier } from '../types';

// TierBadge — colored status pill for a score tier. Ported from the web TierBadge.
// Mobile Tailwind has no emerald/amber/orange palette, so the tint + label color are
// applied from the tier hex via style props (web parity by value, not by class).

const TIER_DISPLAY: Record<ScoreTier, string> = {
  thriving: 'Thriving',
  balanced: 'Balanced',
  struggling: 'Concerning',
  distressed: 'Distressed',
  crisis: 'Crisis',
};

const SIZE: Record<'sm' | 'md' | 'lg', { px: number; py: number; font: number }> = {
  sm: { px: 8, py: 2, font: 12 },
  md: { px: 12, py: 4, font: 14 },
  lg: { px: 16, py: 6, font: 16 },
};

export interface TierBadgeProps {
  readonly tier: ScoreTier;
  readonly label?: string;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, label, size = 'md' }: TierBadgeProps) {
  const hex = getTierHexColor(tier);
  const display = label ?? TIER_DISPLAY[tier];
  const s = SIZE[size];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: `${hex}22`,
        borderRadius: 999,
        paddingHorizontal: s.px,
        paddingVertical: s.py,
      }}
    >
      <Text style={{ color: hex, fontWeight: '600', fontSize: s.font }}>{display}</Text>
    </View>
  );
}
