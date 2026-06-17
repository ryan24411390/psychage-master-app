import { FlashList } from '@shopify/flash-list';
import type { Moment } from '@psychage/shared/engagement';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { MomentRow } from '@/components/moments/MomentRow';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MOMENTS_COPY } from '@/features/moments/copy';
import { useThemeColors } from '@/lib/use-theme-colors';

// S7-equivalent for Moments: an ACCUMULATION-only record. It only ever grows — a
// count of moments captured + the moments themselves, newest first, grouped by day.
// Deliberately NOT a grid: no empty cells to foreground a gap, no streak number, no
// "you missed" state (engagement floor). A quiet day simply isn't in the list; it is
// never rendered as a miss. Presentational — the container owns the store + sync.

type HistoryItem =
  | { readonly kind: 'header'; readonly key: string; readonly label: string }
  | { readonly kind: 'moment'; readonly key: string; readonly moment: Moment };

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

/** Flatten newest-first moments into day-header + moment rows for the list. */
function buildItems(moments: readonly Moment[], now: Date): HistoryItem[] {
  const newestFirst = [...moments].sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));
  const items: HistoryItem[] = [];
  let currentDay: string | null = null;
  for (const m of newestFirst) {
    const k = dayKey(m.timestamp);
    if (k !== currentDay) {
      currentDay = k;
      items.push({ kind: 'header', key: `h-${k}`, label: dayLabel(m.timestamp, now) });
    }
    items.push({ kind: 'moment', key: m.id, moment: m });
  }
  return items;
}

type MomentsHistoryViewProps = {
  moments: readonly Moment[];
  onBack: () => void;
  now?: Date;
};

export function MomentsHistoryView({ moments, onBack, now = new Date() }: MomentsHistoryViewProps) {
  const ink = useThemeColors().ink;
  const items = buildItems(moments, now);

  return (
    <View className="flex-1 px-4">
      <View className="flex-row items-center gap-2 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] w-11 justify-center active:scale-[0.96]"
        >
          <ArrowLeft size={24} color={ink} strokeWidth={2} />
        </Pressable>
        <Text variant="heading">{MOMENTS_COPY.historyTitle}</Text>
      </View>

      {moments.length === 0 ? (
        <Card variant="ghost" className="mt-4">
          <Text variant="bodyMedium">{MOMENTS_COPY.historyBeginning}</Text>
          <Text variant="body" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
            {MOMENTS_COPY.historyEmpty}
          </Text>
        </Card>
      ) : (
        <>
        <Text
          variant="bodySm"
          className="pb-2 pt-1 text-text-secondary dark:text-text-secondary-dark"
        >
          {MOMENTS_COPY.historyCount(moments.length)}
        </Text>
        <FlashList
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text
                variant="caption"
                className="pb-1 pt-4 text-text-tertiary dark:text-text-tertiary-dark"
              >
                {item.label}
              </Text>
            ) : (
              <MomentRow moment={item.moment} />
            )
          }
        />
        </>
      )}
    </View>
  );
}
