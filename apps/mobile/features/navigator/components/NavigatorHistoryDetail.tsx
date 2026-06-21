import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';

import type { NavigatorSnapshot } from '../result-store';

// Read-only view of one stored Navigator run. Renders the engine's already
// clinically-reviewed area copy (description_for_user) plus the relevance LABEL
// (never a raw confidence number — SR-1). Educational framing throughout (SR-2/SR-3):
// these are areas to read about and discuss, not a diagnosis. LOCAL-ONLY (SR-4).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export interface NavigatorHistoryDetailProps {
  readonly snapshot: NavigatorSnapshot;
}

export function NavigatorHistoryDetail({ snapshot }: NavigatorHistoryDetailProps) {
  const { results } = snapshot.results;

  return (
    <ScrollView contentContainerClassName="px-5 pb-10 pt-2 gap-4" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text variant="h1" className="text-text-primary dark:text-text-primary-dark">
            {formatDate(snapshot.date)}
          </Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            Areas this exploration surfaced based on what was described — to read about and bring
            to a professional, not a diagnosis.
          </Text>
        </View>

        {results.length === 0 ? (
          <View className="rounded-xl bg-surface p-6 shadow-base dark:bg-surface-dark">
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              No specific areas were surfaced for this exploration.
            </Text>
          </View>
        ) : (
          results.map((r) => (
            <View key={r.condition_id} className="gap-2 rounded-xl bg-surface p-5 shadow-base dark:bg-surface-dark">
              <View className="flex-row items-center justify-between gap-2">
                <Text variant="bodyLarge" className="flex-1 text-text-primary dark:text-text-primary-dark">
                  {r.name}
                </Text>
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                  {r.relevance_label}
                </Text>
              </View>
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {r.description_for_user}
              </Text>
              {r.matched_symptoms.length > 0 ? (
                <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                  Related to what was described: {r.matched_symptoms.map((m) => m.name).join(', ')}
                </Text>
              ) : null}
            </View>
          ))
        )}

        {snapshot.results.disclaimer ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {snapshot.results.disclaimer}
          </Text>
        ) : null}
    </ScrollView>
  );
}
