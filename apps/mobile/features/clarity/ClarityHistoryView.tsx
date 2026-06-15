import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { TIER_COPY, describeChange } from './bands';
import type { ClaritySnapshot } from './result-store';

// S-history — past Clarity snapshots, newest first. Read-only, text-only, and (like
// the results screen) free of any raw 0–100 number: each snapshot shows its tier band
// label, and the newest carries a QUALITATIVE change vs the one before it. Crisis stays
// reachable via the chrome's Help-now pill (this view is composed inside ClarityChrome).

const TITLE = 'Your snapshots';
const EMPTY = "No snapshots yet. When you finish a Clarity reflection, it'll show up here.";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `YYYY-MM-DD` → `15 Jun 2026`, parsed from parts (no Date/TZ ambiguity). */
function formatDate(date: string): string {
  const [y, m, d] = date.split('-');
  const month = MONTHS[Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

export interface ClarityHistoryViewProps {
  /** Newest first. */
  readonly snapshots: readonly ClaritySnapshot[];
  readonly onStartNew: () => void;
}

export function ClarityHistoryView({ snapshots, onStartNew }: ClarityHistoryViewProps) {
  return (
    <ScrollView contentContainerClassName="gap-5 px-4 pb-12 pt-2" showsVerticalScrollIndicator={false}>
      <Text variant="headingLg" accessibilityRole="header">
        {TITLE}
      </Text>

      {snapshots.length === 0 ? (
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {EMPTY}
        </Text>
      ) : (
        snapshots.map((s, i) => {
          const prev = snapshots[i + 1];
          const change = i === 0 && prev ? describeChange(s.composite, prev.composite) : null;
          return (
            <View
              key={s.id}
              className="gap-1 rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
            >
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {formatDate(s.date)}
              </Text>
              <Text variant="heading">{TIER_COPY[s.tier].label}</Text>
              {change ? (
                <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                  {change}
                </Text>
              ) : null}
            </View>
          );
        })
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Take a new reflection"
        onPress={onStartNew}
        hitSlop={6}
        className="min-h-[44px] justify-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
          Take a new reflection
        </Text>
      </Pressable>
    </ScrollView>
  );
}
