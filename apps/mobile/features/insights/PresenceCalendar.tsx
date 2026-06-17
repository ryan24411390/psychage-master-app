import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, withTiming, withRepeat, withSequence, useAnimatedStyle, withDelay } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

import type { PresenceDay } from './daily-recap';

// PresenceCalendar — upgraded to a premium contribution-style grid with entrance animations.
// PRESENCE ONLY: a day is either recorded or not. Does NOT tint by mood/state.

export interface PresenceCalendarProps {
  readonly days: readonly PresenceDay[];
  readonly testID?: string;
}

function DayItem({ day, i, reduced }: { day: PresenceDay; i: number; reduced: boolean }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withDelay(i * 30, withTiming(1, { duration: DURATION.base, easing: easingFn('out') }));
    scale.value = withDelay(i * 30, withTiming(1, { duration: DURATION.base, easing: easingFn('out') }));
    
    if (day.isToday && !day.present) {
       pulse.value = withRepeat(
         withSequence(
           withTiming(1.1, { duration: 1000, easing: easingFn('standard') }),
           withTiming(1, { duration: 1000, easing: easingFn('standard') })
         ),
         -1,
         true
       );
    }
  }, [reduced, day.isToday, day.present, i, opacity, scale, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { scale: pulse.value }
    ],
  }));

  return (
    <View className="items-center gap-1.5" style={{ width: '13%' }}>
      <Animated.View
        accessibilityRole="image"
        accessibilityLabel={`${day.label}, ${day.present ? 'checked in' : 'no check-in'}`}
        style={animatedStyle}
        className={[
          'h-7 w-7 rounded-[10px]',
          day.present
            ? 'bg-primary dark:bg-primary-dark shadow-sm shadow-primary/30'
            : 'bg-surface-hover dark:bg-surface-hover-dark',
          day.isToday && !day.present ? 'border-2 border-primary/50 dark:border-primary-dark/50' : '',
          day.isToday && day.present ? 'border-2 border-white dark:border-ink' : '',
        ].join(' ')}
      />
      <Text variant="caption" className={`text-[10px] uppercase font-semibold ${day.isToday ? 'text-primary dark:text-primary-dark' : 'text-text-tertiary dark:text-text-tertiary-dark'}`}>
        {day.label}
      </Text>
    </View>
  );
}

export function PresenceCalendar({ days, testID }: PresenceCalendarProps) {
  const reduced = useReducedMotion();

  return (
    <View testID={testID} className="flex-row flex-wrap justify-between gap-y-3 pt-2 w-full">
      {days.map((day, i) => <DayItem key={day.date} day={day} i={i} reduced={reduced} />)}
    </View>
  );
}
