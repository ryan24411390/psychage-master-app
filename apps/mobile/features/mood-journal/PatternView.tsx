import {
  type DayGroup,
  type MomentEntry,
  timeline,
  VALENCE_MAX,
} from '@psychage/shared/mood-journal';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { InsightsView } from '@/features/mood-journal/InsightsView';
import { CT4_MOOD_JOURNAL } from '@/features/mood-journal/copy';
import { useThemeColors } from '@/lib/use-theme-colors';

// The longitudinal read: insights (charts) + a per-day timeline (history). Pure-
// presentational — it takes the already-windowed moment set and an onDelete callback.
//
// SAFETY GATE: trigger↔check-in co-occurrence (triggerMoodCoOccurrence) is deliberately
// NOT rendered. It surfaces a relationship between triggers and mood states — per
// CLAUDE.md §7 that copy must clear Dr. Dobson's clinical review before it ships. The
// pure logic + tests already exist (packages/shared/mood-journal/patterns.ts); wiring
// the section (with non-diagnostic framing) is a gated follow-up. Frequency, the valence
// trend, and the timeline carry no mood claim, so they ship now.

type PatternViewProps = {
  moments: readonly MomentEntry[];
  onDelete: (id: string) => void;
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

export function PatternView({ moments, onDelete }: PatternViewProps) {
  const days = timeline(moments);
  const t = CT4_MOOD_JOURNAL.patterns;

  return (
    <View className="gap-4">
      <InsightsView moments={moments} />
      <TimelineSection heading={t.timelineHeading} days={days} onDelete={onDelete} />
    </View>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <Text
      variant="caption"
      className="mb-2 font-sans-medium uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
    >
      {children}
    </Text>
  );
}

function TimelineSection({
  heading,
  days,
  onDelete,
}: {
  heading: string;
  days: readonly DayGroup[];
  onDelete: (id: string) => void;
}) {
  if (days.length === 0) return null;
  return (
    <View testID="mood-journal-timeline">
      <SectionHeading>{heading}</SectionHeading>
      <View className="gap-3">
        {days.map((day) => (
          <Card key={day.date}>
            <Text variant="bodyMedium">{formatDay(day.date)}</Text>
            <View className="mt-2 gap-3">
              {day.moments.map((moment) => (
                <MomentRow key={moment.id} moment={moment} onDelete={onDelete} />
              ))}
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

// One timeline moment: its tags (real RN Text chips), an optional valence read, an
// optional note, and an inline two-tap delete (a destructive action on user data gets
// a confirm step, not a single tap). Delete state is local so one row's confirm never
// affects another.
function MomentRow({ moment, onDelete }: { moment: MomentEntry; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const tc = useThemeColors();
  const t = CT4_MOOD_JOURNAL.patterns;
  const tags = [...moment.emotions, ...moment.triggers];

  return (
    <View testID={`mood-journal-moment-${moment.id}`}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <View className="flex-row flex-wrap gap-1.5">
            {tags.map((tag) => (
              <View
                key={tag}
                className="rounded-full border border-border px-2.5 py-1 dark:border-border-dark"
              >
                <Text variant="caption">{tag}</Text>
              </View>
            ))}
          </View>
          {moment.valence !== undefined ? (
            <Text variant="caption" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
              {`${t.valenceLabel} ${moment.valence}/${VALENCE_MAX}`}
            </Text>
          ) : null}
          {moment.note ? (
            <Text variant="bodySm" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
              {`“${moment.note}”`}
            </Text>
          ) : null}
        </View>

        {!confirming ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t.delete}
            hitSlop={8}
            onPress={() => setConfirming(true)}
            testID={`mood-journal-delete-${moment.id}`}
          >
            <Trash2 size={18} color={tc.inkTertiary} />
          </AnimatedPressable>
        ) : null}
      </View>

      {confirming ? (
        <View className="mt-2 flex-row items-center justify-end gap-2">
          <Text variant="bodySm" className="mr-auto text-text-secondary dark:text-text-secondary-dark">
            {t.deleteConfirm}
          </Text>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setConfirming(false)}
            testID={`mood-journal-delete-cancel-${moment.id}`}
          >
            {t.deleteCancel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onPress={() => onDelete(moment.id)}
            testID={`mood-journal-delete-confirm-${moment.id}`}
          >
            {t.deleteYes}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
