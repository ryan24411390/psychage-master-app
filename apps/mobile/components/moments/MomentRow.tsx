import type { Moment } from '@psychage/shared/engagement';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { MOMENTS_COPY } from '@/features/moments/copy';
import { type AffectBand, bandForLabel, wordLabel } from '@/features/moments/vocab';

// One moment in the accumulation history — a calm record row, not a score. Shows the named
// feeling's band as a soft tinted dot (the band is a property of the WORD, not a rating the
// person gave), the time, the word(s) they named, any intensity, and the note. NativeWind
// classes only.

const DOT_FILL: Record<AffectBand, string> = {
  1: 'bg-mood-1',
  2: 'bg-mood-2',
  3: 'bg-mood-3',
  4: 'bg-mood-4',
  5: 'bg-mood-5',
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function MomentRow({ moment }: { moment: Moment }) {
  const words = [moment.labelPrimary, moment.labelSecondary]
    .filter((w): w is string => w !== undefined)
    .map(wordLabel);
  const intensityLabel = moment.intensity ? MOMENTS_COPY.intensityLabels[moment.intensity] : undefined;
  return (
    <View className="flex-row items-start gap-3 py-3">
      <View className="mt-0.5 items-center">
        <View className={`h-3.5 w-3.5 rounded-full ${DOT_FILL[bandForLabel(moment.labelPrimary)]}`} />
      </View>
      <View className="flex-1">
        <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
          {timeLabel(moment.timestamp)}
        </Text>
        <Text variant="bodyMedium" className="mt-0.5">
          {words.join(' · ')}
          {intensityLabel !== undefined && (
            <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
              {`  ${intensityLabel.toLowerCase()}`}
            </Text>
          )}
        </Text>
        {moment.note !== undefined && moment.note.length > 0 && (
          <Text variant="body" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
            “{moment.note}”
          </Text>
        )}
      </View>
    </View>
  );
}
