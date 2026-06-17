import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { NavigatorResultItem } from '@psychage/shared/navigator';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { ConfidenceBar } from './ConfidenceBar';
import { RelevanceDots } from './RelevanceDots';

// Per-condition result card — mobile port of web components/navigator/ResultCard.
// Anatomy 1:1: name + relevance dots, animated confidence bar + %, description, and an
// expandable "Based on:" matched-symptom chip list (first 3 + "Show all N"). Strong
// matches read teal; exploratory (low/minimal) read amber.

export interface ResultCardProps {
  readonly result: NavigatorResultItem;
}

const PREVIEW_COUNT = 3;

export function ResultCard({ result }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tc = useThemeColors();
  const exploratory =
    result.relevance_level === 'minimal' || result.relevance_level === 'low';

  const matched = result.matched_symptoms;
  const shown = expanded ? matched : matched.slice(0, PREVIEW_COUNT);
  const hiddenCount = matched.length - PREVIEW_COUNT;

  const chipClass = exploratory
    ? 'border-warning/30 bg-warning/10'
    : 'border-teal-500/20 bg-teal-100 dark:bg-teal-900';
  const chipTextClass = exploratory
    ? 'text-warning dark:text-warning-dark'
    : 'text-teal-700 dark:text-teal-100';

  return (
    <Card variant="elevated" className="gap-3 p-5">
      {/* Name + relevance dots */}
      <View className="gap-2">
        <Text variant="h2">{result.name}</Text>
        <View className="self-start rounded-full border border-border bg-surface-accent px-3 py-1.5 dark:border-border-dark dark:bg-surface-accent-dark">
          <RelevanceDots level={result.relevance_level} />
        </View>
      </View>

      {/* Confidence bar + % */}
      <ConfidenceBar score={result.relevance_score} exploratory={exploratory} />

      {/* Description */}
      <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
        {result.description_for_user}
      </Text>

      {/* Matched symptoms */}
      {matched.length > 0 ? (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text
              variant="caption"
              className="uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark"
            >
              Based on:
            </Text>
            {matched.length > PREVIEW_COUNT ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={
                  expanded ? 'Show fewer matched symptoms' : `Show all ${matched.length} matched symptoms`
                }
                onPress={() => setExpanded((e) => !e)}
                hitSlop={6}
                className="min-h-[36px] flex-row items-center gap-1.5"
              >
                <Text variant="caption" className="text-primary dark:text-primary-dark">
                  {expanded ? 'Show less' : `Show all ${matched.length}`}
                </Text>
                <ChevronDown
                  size={14}
                  color={tc.primary}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2">
            {shown.map((sym) => (
              <View key={sym.name} className={`rounded-md border px-3 py-1.5 ${chipClass}`}>
                <Text variant="caption" className={chipTextClass}>
                  {sym.name.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
            {!expanded && hiddenCount > 0 ? (
              <View className="rounded-md border border-border bg-surface-accent px-3 py-1.5 dark:border-border-dark dark:bg-surface-accent-dark">
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                  +{hiddenCount} more
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}
