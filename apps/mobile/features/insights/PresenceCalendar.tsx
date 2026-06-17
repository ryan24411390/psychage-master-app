import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

import type { PresenceDay } from './daily-recap';

// PresenceCalendar — a plain "which days have a check-in" grid. PRESENCE ONLY: a day is
// either recorded or not. It deliberately does NOT tint by mood/state (that would be the
// mood-intensity heatmap the spec forbids and would re-surface logged mood). Present days
// get a filled teal dot (accent use only, never body text); absent days get a hollow
// outline; today gets a ring. Decorative geometry — the screen-reader summary lives on
// the parent section, and each dot also carries its own label.

export interface PresenceCalendarProps {
  readonly days: readonly PresenceDay[];
  readonly testID?: string;
}

export function PresenceCalendar({ days, testID }: PresenceCalendarProps) {
  return (
    <View testID={testID} className="flex-row flex-wrap justify-center gap-x-3 gap-y-3">
      {days.map((day) => (
        <View key={day.date} className="w-9 items-center gap-1">
          <View
            accessibilityRole="image"
            accessibilityLabel={`${day.label}, ${day.present ? 'checked in' : 'no check-in'}`}
            className={[
              'h-6 w-6 rounded-full',
              day.present
                ? 'bg-primary dark:bg-primary-dark'
                : 'border border-border bg-transparent dark:border-border-dark',
              day.isToday ? 'border-2 border-primary dark:border-primary-dark' : '',
            ].join(' ')}
          />
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {day.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
