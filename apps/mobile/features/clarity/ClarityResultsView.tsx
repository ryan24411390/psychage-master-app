import { ScrollView, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';

import { DOMAIN_BAND_WORD, TIER_COPY, groupDomains, recommendations } from './bands';
import type { ClarityResult } from './types';

// S-results — the Clarity snapshot, rendered as TEXT BANDS only. Per the approved
// mobile-native presentation: NO raw 0–100 number, NO progress bar/meter (a score
// shown as a verdict is exactly the rail the native Navigator also avoids). The
// composite and each domain are closed-vocabulary band labels; the threshold "flags"
// are reframed person-first "what stood out" notes (SR-3). Crisis stays reachable via
// the chrome's Help-now pill (this view is composed inside ClarityChrome).
//
// All copy is PROVISIONAL pending Dr. Dobson clinical review (workspace rules §7).

const TITLE = 'Your snapshot';
const SUBTITLE = 'A reflection of how the last couple of weeks have felt — not a score of you.';
const NO_STEADY =
  'Every area has room to grow right now — that’s common, and it’s a workable place to start.';
const CAVEAT = 'This is a reflection to help you notice patterns, not a test or a label.';

export interface ClarityResultsViewProps {
  readonly result: ClarityResult;
  /** Qualitative change vs the previous snapshot, or null on a first run. */
  readonly changeNote?: string | null;
  readonly onRecommend: (route: string) => void;
  readonly onViewHistory: () => void;
  readonly onRetake: () => void;
}

function OnwardLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="min-h-[44px] justify-center"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function ClarityResultsView({
  result,
  changeNote,
  onRecommend,
  onViewHistory,
  onRetake,
}: ClarityResultsViewProps) {
  const tier = TIER_COPY[result.tier];
  const { steady, attention } = groupDomains(result.domains);
  const recs = recommendations(result.domains);

  return (
    <ScrollView contentContainerClassName="gap-6 px-4 pb-12 pt-2" showsVerticalScrollIndicator={false}>
      <View className="gap-1">
        <Text variant="headingLg" accessibilityRole="header">
          {TITLE}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {SUBTITLE}
        </Text>
      </View>

      {/* Overall band — label + one-liner, no number */}
      <View className="gap-1">
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          Overall
        </Text>
        <Text variant="heading">{tier.label}</Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {tier.line}
        </Text>
        {changeNote ? (
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {changeNote}
          </Text>
        ) : null}
      </View>

      {/* Steady / strong domains */}
      {steady.length > 0 ? (
        <View className="gap-2">
          <Text variant="bodyBold">Steady</Text>
          {steady.map((d) => (
            <Text key={d.key} variant="body">
              {d.label} — {DOMAIN_BAND_WORD[d.band]}
            </Text>
          ))}
        </View>
      ) : (
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {NO_STEADY}
        </Text>
      )}

      {/* Worth gentle attention */}
      {attention.length > 0 ? (
        <View className="gap-2">
          <Text variant="bodyBold">Worth gentle attention</Text>
          {attention.map((d) => (
            <Text key={d.key} variant="body">
              {d.label} — {DOMAIN_BAND_WORD[d.band]}
            </Text>
          ))}
        </View>
      ) : null}

      {/* What stood out — reframed, person-first notes */}
      {result.notes.length > 0 ? (
        <View className="gap-2">
          <Text variant="bodyBold">What stood out</Text>
          {result.notes.map((n) => (
            <Text key={n.id} variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {n.text}
            </Text>
          ))}
        </View>
      ) : null}

      {/* What might help */}
      <View className="gap-2 border-t border-border pt-4 dark:border-border-dark">
        <Text variant="bodyBold">What might help</Text>
        {recs.map((r) => (
          <View key={`${r.route}-${r.actionLabel}`} className="gap-1">
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {r.text}
            </Text>
            <OnwardLink label={r.actionLabel} onPress={() => onRecommend(r.route)} />
          </View>
        ))}
      </View>

      <View className="gap-1 border-t border-border pt-4 dark:border-border-dark">
        <OnwardLink label="See your past snapshots" onPress={onViewHistory} />
        <OnwardLink label="Take it again" onPress={onRetake} />
      </View>

      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {CAVEAT}
      </Text>
    </ScrollView>
  );
}
