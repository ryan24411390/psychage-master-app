import { Pressable, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

import type { BridgeCard, HomeCard, ReminderCard } from './home-card';

// C0.5 home card slot — ONE slot, ONE card max, beneath the record well. Priority
// bridge > reminder: the reminder waits for the bridge's dismissal (selectHomeCard
// in ./home-card returns the bridge while it is present, the reminder only once the
// bridge is gone). Cards appear with the SETTLE verb (fade + rise, porting v5
// @keyframes settle); reduced motion = appear in place. The reminder-sighting
// trigger is UNWIRED in A1 — this builds the display logic, not the increment.

function BridgeCardBody({ card }: { card: BridgeCard }) {
  const isNight = card.register === 'night';
  const chipName = isNight ? 'Night breathing' : 'Breathing';
  const chipMin = isNight ? '· 2 min' : '· 1 min';
  return (
    <View className="gap-3">
      <Text
        variant="body"
        className="font-display italic text-text-primary dark:text-text-primary-dark"
      >
        Would something steadying help right now?
      </Text>
      <View className="flex-row flex-wrap items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${chipName} ${chipMin}`}
          onPress={() => {}}
          className="min-h-[44px] flex-row items-center gap-1 rounded-full border border-border/50 bg-surface px-3 shadow-sm dark:border-border-dark/50 dark:bg-surface-dark"
        >
          <Text variant="bodyMedium">{chipName}</Text>
          <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
            {chipMin}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not now"
          onPress={() => {}}
          className="min-h-[44px] justify-center px-2"
        >
          <Text variant="bodyMedium" className="text-text-secondary dark:text-text-secondary-dark">
            Not now
          </Text>
        </Pressable>
      </View>
      {card.veryLow && (
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          If it feels like too much, Help now at the top of this page is always there — people you can
          reach, right away.
        </Text>
      )}
    </View>
  );
}

function ReminderCardBody({ card }: { card: ReminderCard }) {
  return (
    <View className="gap-3">
      <Text
        variant="body"
        className="font-display italic text-text-primary dark:text-text-primary-dark"
      >
        {card.question}
      </Text>
      <View className="flex-row flex-wrap items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="9:00 PM"
          // Opens the system time picker — wired when the reminder trigger lands (post-A1).
          onPress={() => {}}
          className="min-h-[44px] justify-center rounded-full border border-border/50 bg-surface px-3 shadow-sm dark:border-border-dark/50 dark:bg-surface-dark"
        >
          <Text variant="bodyMedium">9:00 PM</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yes, remind me"
          onPress={() => {}}
          className="min-h-[44px] justify-center px-2"
        >
          <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
            Yes, remind me
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="No thanks"
          onPress={() => {}}
          className="min-h-[44px] justify-center px-2"
        >
          <Text variant="bodyMedium" className="text-text-secondary dark:text-text-secondary-dark">
            No thanks
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function HomeCardSlot({ card }: { card: HomeCard | null }) {
  const reduced = useReducedMotion();
  if (!card) return null;
  return (
    <Animated.View
      entering={reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))}
      className="mt-3 rounded-xl border border-border/50 bg-surface px-4 py-4 shadow-sm dark:border-border-dark/50 dark:bg-surface-dark"
    >
      {card.kind === 'bridge' ? (
        <BridgeCardBody card={card} />
      ) : (
        <ReminderCardBody card={card} />
      )}
    </Animated.View>
  );
}
