import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import type { NavigatorSnapshot } from '../result-store';

// Past Symptom Navigator explorations — a local-only (SR-4) list of completed runs.
// Educational framing only (SR-2/SR-3): we show the AREAS a run surfaced and when,
// never a diagnosis and never a raw confidence number (SR-1 — relevance_label only).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** Top area names a run surfaced (educational summary line). */
function topAreas(snapshot: NavigatorSnapshot, n = 2): string {
  const names = snapshot.results.results.slice(0, n).map((r) => r.name);
  return names.length > 0 ? names.join(' · ') : 'No specific areas surfaced';
}

export interface NavigatorHistoryViewProps {
  readonly snapshots: readonly NavigatorSnapshot[];
  readonly onSelect: (id: string) => void;
  readonly onStartNew: () => void;
  readonly onBack: () => void;
}

export function NavigatorHistoryView({ snapshots, onSelect, onStartNew, onBack }: NavigatorHistoryViewProps) {
  const tc = useThemeColors();

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-2 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          testID="navigator-history-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={tc.inkSecondary} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            Back
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10 pt-2 gap-4" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text variant="headingLg" className="text-text-primary dark:text-text-primary-dark">
            Past explorations
          </Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            What the Navigator surfaced before — for your reflection, not a diagnosis. Stays on
            your device.
          </Text>
        </View>

        {snapshots.length === 0 ? (
          <View className="rounded-xl bg-surface p-6 shadow-base dark:bg-surface-dark">
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              No explorations saved yet. When one is completed, it'll appear here.
            </Text>
          </View>
        ) : (
          snapshots.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={`Exploration from ${formatDate(s.date)}`}
              onPress={() => onSelect(s.id)}
              className="flex-row items-center gap-3 rounded-xl bg-surface p-4 shadow-base dark:bg-surface-dark active:scale-[0.99]"
            >
              <View className="flex-1">
                <Text variant="bodyMedium" className="text-text-primary dark:text-text-primary-dark">
                  {formatDate(s.date)}
                </Text>
                <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                  {topAreas(s)}
                </Text>
              </View>
              <ChevronRight size={18} color={tc.inkSecondary} strokeWidth={2} />
            </Pressable>
          ))
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a new exploration"
          onPress={onStartNew}
          className="mt-1 min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 dark:bg-primary-dark active:scale-[0.99]"
        >
          <Text variant="bodyMedium" className="text-white">
            Start a new exploration
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
