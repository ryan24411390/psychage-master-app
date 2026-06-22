import { FileDown, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { NAVIGATOR_COPY } from '../copy';
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
  /** P41 — share a summary-only PDF of this past run (route owns native print). */
  readonly onDownload?: () => void;
  /** P41 — forget this run (local-only delete). */
  readonly onDelete?: () => void;
}

export function NavigatorHistoryDetail({ snapshot, onDownload, onDelete }: NavigatorHistoryDetailProps) {
  const { results } = snapshot.results;
  const tc = useThemeColors();

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

        {onDownload || onDelete ? (
          <View className="gap-3 pt-2">
            {onDownload ? (
              <Button variant="secondary" onPress={onDownload}>
                <View className="flex-row items-center gap-2">
                  <FileDown size={16} color={tc.ink} strokeWidth={2} />
                  <Text variant="bodyLarge">{NAVIGATOR_COPY.downloadSummary}</Text>
                </View>
              </Button>
            ) : null}
            {onDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={NAVIGATOR_COPY.removeThisExploration}
                onPress={onDelete}
                hitSlop={6}
                className="min-h-[44px] flex-row items-center justify-center gap-1.5"
              >
                <Trash2 size={14} color={tc.inkTertiary} strokeWidth={2} />
                <Text variant="caption" className="text-text-secondary underline dark:text-text-secondary-dark">
                  {NAVIGATOR_COPY.removeThisExploration}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
    </ScrollView>
  );
}
