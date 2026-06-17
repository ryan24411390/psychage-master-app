import type { Moment, MomentValence } from '@psychage/shared/engagement';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ALL_LABELS, CONTEXT_DOMAINS } from '@/features/moments/constants';

// One moment in the accumulation history — a calm record row, not a score. Shows the
// valence as a mood-tinted dot (color reinforced by the level number, never color
// alone), the time, any chosen words, and the note. NativeWind classes only.

const DOT_FILL: Record<MomentValence, string> = {
  1: 'bg-mood-1',
  2: 'bg-mood-2',
  3: 'bg-mood-3',
  4: 'bg-mood-4',
  5: 'bg-mood-5',
};

// key → display label, resolved from the curated vocab (falls back to the raw key).
const LABEL_BY_KEY = new Map([...ALL_LABELS, ...CONTEXT_DOMAINS].map((l) => [l.key, l.label]));
function display(key: string): string {
  return LABEL_BY_KEY.get(key) ?? key;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function MomentRow({ moment }: { moment: Moment }) {
  const words = [...moment.labels, ...moment.context].map(display);
  return (
    <View className="flex-row items-start gap-3 py-3">
      <View className="mt-0.5 items-center">
        <View className={`h-3.5 w-3.5 rounded-full ${DOT_FILL[moment.valence]}`} />
      </View>
      <View className="flex-1">
        <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
          {timeLabel(moment.timestamp)}
        </Text>
        {words.length > 0 && (
          <Text variant="bodyMedium" className="mt-0.5">
            {words.join(' · ')}
          </Text>
        )}
        {moment.note !== undefined && moment.note.length > 0 && (
          <Text variant="body" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
            “{moment.note}”
          </Text>
        )}
      </View>
    </View>
  );
}
