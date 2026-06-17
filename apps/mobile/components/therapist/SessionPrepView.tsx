import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { RangeRadio, type RangeOption } from '@/components/therapist/RangeRadio';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { THERAPIST_COPY, windowForDays } from '@/features/therapist';
import { type LocalCalendarDate, toLocalCalendarDate } from '@psychage/shared/engagement';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Session-prep entry surface. The person picks a window (presets or a chosen start
// date), sees an HONEST count for it, then generates + shares the document THEMSELVES
// via the system share sheet — Psychage never transmits it (SR-4). No provider gate:
// this is the person's own record, reachable straight from Settings.
//
// className-bearing JSX lives here under components/ (Tailwind's content scan); the
// route (app/session-prep.tsx) owns the store reads and the print/share wiring.

export type SessionPrepWindow = { from: LocalCalendarDate; to: LocalCalendarDate };

type SessionPrepViewProps = {
  /** Honest day + moment counts for the live window (route reads the local store). */
  countForWindow: (window: SessionPrepWindow) => { dayCount: number; momentCount: number };
  /** Generate + share the document for the chosen name + window (route owns egress). */
  onGenerate: (fullName: string, window: SessionPrepWindow) => void;
};

const c = THERAPIST_COPY.sessionPrep;

const WINDOW_OPTIONS: readonly RangeOption[] = [
  { key: '14', label: c.window14, days: 14 },
  { key: '30', label: c.window30, days: 30 },
  { key: '90', label: c.window90, days: 90 },
  // `days` is unused for the since-a-date option — the picked date drives the window.
  { key: 'since', label: c.windowSince, days: 0 },
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatPickedDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// The window for the current selection, or null when "since a date" has no date yet.
function resolveWindow(key: string, sinceDate: Date | null, now: Date): SessionPrepWindow | null {
  if (key === 'since') {
    if (!sinceDate) return null;
    return { from: toLocalCalendarDate(sinceDate), to: toLocalCalendarDate(now) };
  }
  return windowForDays(now, Number(key));
}

export function SessionPrepView({ countForWindow, onGenerate }: SessionPrepViewProps) {
  const reduced = useReducedMotion();
  const [name, setName] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('14');
  const [sinceDate, setSinceDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const window = useMemo(
    () => resolveWindow(selectedKey, sinceDate, new Date()),
    [selectedKey, sinceDate],
  );

  const countLine = useMemo(() => {
    if (!window) return null;
    const { dayCount, momentCount } = countForWindow(window);
    return c.countLine(dayCount, momentCount);
  }, [window, countForWindow]);

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && date) setSinceDate(date);
  };

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 gap-6 pt-6"
      >
        {/* The screen title is owned by the settings stack header; the view opens
            with the intro that explains what the document is and who sends it. */}
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {c.screenIntro}
        </Text>

        <AuthTextField
          label={c.nameLabel}
          fieldAccessibilityHint={c.nameHint}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <View className="gap-3">
          <Text variant="bodyMedium">{c.windowLabel}</Text>
          <RangeRadio options={WINDOW_OPTIONS} value={selectedKey} onChange={setSelectedKey} />

          {selectedKey === 'since' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.sincePickLabel}
              onPress={() => setShowPicker(true)}
              testID="session-prep-since-date"
              className="min-h-[44px] flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-border-dark"
            >
              <Text variant="bodyMedium" className="text-text-secondary dark:text-text-secondary-dark">
                {c.sincePickLabel}
              </Text>
              <Text variant="bodyMedium">{sinceDate ? formatPickedDate(sinceDate) : '—'}</Text>
            </Pressable>
          ) : null}

          {showPicker ? (
            <DateTimePicker
              value={sinceDate ?? new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={onPickerChange}
              testID="session-prep-date-picker"
            />
          ) : null}
        </View>

        {countLine ? (
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {countLine}
          </Text>
        ) : null}

        <View className="mt-auto">
          <Button
            variant="primary"
            disabled={window === null}
            onPress={() => {
              if (window) onGenerate(name.trim(), window);
            }}
            testID="session-prep-generate"
          >
            {c.generate}
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
