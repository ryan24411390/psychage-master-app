import type { Moment } from '@psychage/shared/engagement';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { MomentRow } from '@/components/moments/MomentRow';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { INSIGHTS_COPY } from './copy';

// Real dated history of recorded moments for the Insights screen (P46). Reuses the canonical
// MomentRow (mood-tinted dot + resolved words + note) and day grouping so the visual matches
// the full /history record. Compact by design: it shows the most recent `limit` moments in
// the selected range and links out to the full history for the rest — so it never needs a
// FlashList inside the screen's ScrollView. ACCUMULATION-only: a quiet day is simply absent,
// never rendered as a miss (engagement floor).

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`;
}

export interface MomentsHistoryProps {
  /** Range-filtered moments, any order. */
  readonly moments: readonly Moment[];
  /** Most-recent N to show inline (the rest live behind "See full history"). */
  readonly limit?: number;
  readonly now?: Date;
  readonly onOpenFullHistory?: () => void;
  readonly testID?: string;
}

export function MomentsHistory({
  moments,
  limit = 8,
  now = new Date(),
  onOpenFullHistory,
  testID,
}: MomentsHistoryProps) {
  const tc = useThemeColors();
  const newestFirst = [...moments].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
  );
  const shown = newestFirst.slice(0, limit);
  const hasMore = newestFirst.length > shown.length;

  return (
    <View testID={testID} className="gap-2">
      <View className="gap-1">
        <Text variant="h2" className="font-display text-[22px] tracking-tight text-text-primary dark:text-text-primary-dark">
          {INSIGHTS_COPY.history.heading}
        </Text>
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {INSIGHTS_COPY.partsExplainer}
        </Text>
      </View>

      <View className="overflow-hidden rounded-[24px] bg-surface px-4 py-2 shadow-base dark:bg-surface-dark">
        {shown.map((m, i) => {
          const showHeader = i === 0 || dayKey(m.timestamp) !== dayKey(shown[i - 1]?.timestamp ?? '');
          return (
            <View key={m.id} testID={testID ? `${testID}-row-${i}` : undefined}>
              {showHeader ? (
                <Text variant="caption" className="pb-1 pt-3 text-text-tertiary dark:text-text-tertiary-dark">
                  {dayLabel(m.timestamp, now)}
                </Text>
              ) : null}
              <MomentRow moment={m} />
            </View>
          );
        })}
      </View>

      {hasMore && onOpenFullHistory ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See your full moment history"
          onPress={onOpenFullHistory}
          hitSlop={8}
          className="flex-row items-center justify-center gap-1.5 rounded-full bg-surface-active px-4 py-3 active:opacity-70 dark:bg-surface-active-dark"
        >
          <Text variant="bodyLarge" className="font-sans-medium text-text-primary dark:text-text-primary-dark">
            See full history
          </Text>
          <ChevronRight size={16} color={tc.inkSecondary} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}
