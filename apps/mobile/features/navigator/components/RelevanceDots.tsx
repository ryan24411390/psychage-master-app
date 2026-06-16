import { View } from 'react-native';

import type { RelevanceLevel } from '@psychage/shared/navigator';

import { Text } from '@/components/ui/Text';

// Relevance shown as filled/empty dots + a text tier label — mobile port of web
// components/navigator/RelevanceDots. Four dots; filled count rises with relevance.
// Web used teal→stone; mobile uses the dedicated color.relevance.* token scale
// (authored for exactly this surface). Paired with ConfidenceBar in ResultCard, this
// is the full-parity bar + dots + % treatment (signed-off override of the text-only
// guard — see the result-card relevance decision).

export interface RelevanceDotsProps {
  readonly level: RelevanceLevel;
}

interface DotConfig {
  readonly filled: number;
  readonly fillClass: string;
  readonly textClass: string;
  readonly label: string;
}

const CONFIG: Record<RelevanceLevel, DotConfig> = {
  high: {
    filled: 3,
    fillClass: 'bg-relevance-high',
    textClass: 'text-relevance-high',
    label: 'Higher relevance',
  },
  moderate: {
    filled: 2,
    fillClass: 'bg-relevance-moderate',
    textClass: 'text-relevance-moderate',
    label: 'Moderate relevance',
  },
  low: {
    filled: 1,
    fillClass: 'bg-relevance-explore',
    textClass: 'text-relevance-explore',
    label: 'Worth exploring',
  },
  minimal: {
    filled: 1,
    fillClass: 'bg-relevance-explore',
    textClass: 'text-relevance-explore',
    label: 'Worth exploring',
  },
};

const DOT_KEYS = ['d0', 'd1', 'd2', 'd3'] as const;

export function RelevanceDots({ level }: RelevanceDotsProps) {
  const config = CONFIG[level] ?? CONFIG.minimal;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Relevance: ${config.label}`}
      className="flex-row items-center gap-2"
    >
      <View className="flex-row gap-1" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {DOT_KEYS.map((key, i) => (
          <View
            key={key}
            className={`h-2 w-2 rounded-full ${
              i < config.filled ? config.fillClass : 'bg-border dark:bg-border-dark'
            }`}
          />
        ))}
      </View>
      <Text variant="caption" className={`uppercase tracking-wide ${config.textClass}`}>
        {config.label}
      </Text>
    </View>
  );
}
