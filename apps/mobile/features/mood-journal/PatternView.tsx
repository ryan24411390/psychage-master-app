import {
  type DayGroup,
  emotionFrequency,
  type MomentEntry,
  type TagCount,
  timeline,
  triggerFrequency,
} from '@psychage/shared/mood-journal';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { CT4_MOOD_JOURNAL } from '@/features/mood-journal/copy';

// The longitudinal read: what's been coming up. Pure-presentational — it takes the
// already-windowed moment set and renders frequency rows + a per-day timeline.
//
// SAFETY GATE: trigger↔check-in co-occurrence (triggerMoodCoOccurrence) is
// deliberately NOT rendered here. It surfaces a relationship between triggers and
// mood states — per CLAUDE.md §7 that copy must clear Dr. Dobson's clinical review
// before it ships. The pure logic + tests already exist
// (packages/shared/mood-journal/patterns.ts); wiring the section (with its
// non-diagnostic framing) and passing the check-in store in is a gated follow-up.
// Frequency + timeline carry no mood claim, so they ship now.

type PatternViewProps = {
  moments: readonly MomentEntry[];
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// 'YYYY-MM-DD' → "Tue, Jun 16". Built from the local date parts (no UTC shift).
function formatDay(date: string): string {
  const year = Number(date.slice(0, 4));
  const monthIndex = Number(date.slice(5, 7)) - 1;
  const day = Number(date.slice(8, 10));
  const weekday = WEEKDAYS[new Date(year, monthIndex, day).getDay()];
  return `${weekday}, ${MONTHS[monthIndex]} ${day}`;
}

export function PatternView({ moments }: PatternViewProps) {
  const emotions = emotionFrequency(moments);
  const triggers = triggerFrequency(moments);
  const days = timeline(moments);
  const t = CT4_MOOD_JOURNAL.patterns;

  return (
    <View className="gap-4">
      <FrequencySection heading={t.emotionsHeading} rows={emotions} testID="mood-journal-emotions" />
      <FrequencySection heading={t.triggersHeading} rows={triggers} testID="mood-journal-triggers" />
      <TimelineSection heading={t.timelineHeading} days={days} />
    </View>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <Text
      variant="caption"
      className="mb-2 uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark font-sans-medium"
    >
      {children}
    </Text>
  );
}

function FrequencySection({
  heading,
  rows,
  testID,
}: {
  heading: string;
  rows: readonly TagCount<string>[];
  testID: string;
}) {
  if (rows.length === 0) return null;
  return (
    <View testID={testID}>
      <SectionHeading>{heading}</SectionHeading>
      <View className="rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
        {rows.map((row, index) => (
          <View
            key={row.tag}
            className={`flex-row items-center justify-between px-4 py-3 ${
              index > 0 ? 'border-t border-border dark:border-border-dark' : ''
            }`}
          >
            <Text variant="body">{row.tag}</Text>
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              {`${row.count}×`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TimelineSection({ heading, days }: { heading: string; days: readonly DayGroup[] }) {
  if (days.length === 0) return null;
  return (
    <View testID="mood-journal-timeline">
      <SectionHeading>{heading}</SectionHeading>
      <View className="gap-3">
        {days.map((day) => (
          <View
            key={day.date}
            className="rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
          >
            <Text variant="bodyMedium">{formatDay(day.date)}</Text>
            <View className="mt-2 gap-2">
              {day.moments.map((moment) => (
                <View key={moment.id}>
                  <View className="flex-row flex-wrap gap-1.5">
                    {[...moment.emotions, ...moment.triggers].map((tag) => (
                      <View
                        key={tag}
                        className="rounded-full border border-border px-2.5 py-1 dark:border-border-dark"
                      >
                        <Text variant="caption">{tag}</Text>
                      </View>
                    ))}
                  </View>
                  {moment.note ? (
                    <Text
                      variant="bodySm"
                      className="mt-1 text-text-secondary dark:text-text-secondary-dark"
                    >
                      {`“${moment.note}”`}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
