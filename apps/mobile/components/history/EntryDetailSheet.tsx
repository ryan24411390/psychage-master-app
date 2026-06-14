import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { formatEntryDate } from '@/features/history/continuum';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { STATE_LABELS } from '@/lib/check-in-labels';
import { colors } from '@/lib/colors';
import { DURATION, useReducedMotion } from '@/lib/motion';

// S8 entry-detail sheet (over S7). Read-only: the date (Fraunces), the state fill-glyph +
// plain label (C0.4's display form, inlined so StateRows stays untouched), the note in
// quotes if present, and ONE action — "Edit" → S4 in edit mode (Flow 11 step 3–4). There
// is NO delete (a day that happened, happened) and no "edited" badge. Mascot absent.
// Reduced motion: the sheet appears without a slide (fade only; no FadeInUp).

// Mirrors C0.4's fill heights / mood tints (the a1-tokens unit test pins fillByState so a
// token change fails loudly in StateRows; this read-only display follows the same literals).
const FILL_HEIGHT: Record<CheckInState, string> = {
  0: 'h-[12%]',
  1: 'h-[32%]',
  2: 'h-[52%]',
  3: 'h-[74%]',
  4: 'h-[95%]',
};
const TINT_BG: Record<CheckInState, string> = {
  0: 'bg-mood-1',
  1: 'bg-mood-2',
  2: 'bg-mood-3',
  3: 'bg-mood-4',
  4: 'bg-mood-5',
};

function ReadonlyFillGlyph({ state }: { state: CheckInState }) {
  return (
    <View className="h-7 w-7 justify-end overflow-hidden rounded-md border border-border dark:border-border-dark">
      <View className={`w-full ${FILL_HEIGHT[state]} ${TINT_BG[state]}`} />
    </View>
  );
}

export interface EntryDetailSheetProps {
  readonly entry: CheckInEntry;
  readonly onEdit: () => void;
  readonly onClose: () => void;
}

export function EntryDetailSheet({ entry, onEdit, onClose }: EntryDetailSheetProps) {
  const reduced = useReducedMotion();

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="flex-1"
        onPress={onClose}
      />
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base)}
        className="rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark"
      >
        <View className="mb-4 flex-row items-start justify-between">
          <Text
            accessibilityRole="header"
            className="flex-1 pr-3 font-display text-xl text-text-primary dark:text-text-primary-dark"
          >
            {formatEntryDate(entry.date)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={onClose}
          >
            <X size={22} color={colors.charcoal[600]} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <ReadonlyFillGlyph state={entry.state} />
          <Text variant="bodyMedium">{STATE_LABELS[entry.state]}</Text>
        </View>

        {entry.note ? (
          <Text variant="body" className="mt-3 text-text-secondary dark:text-text-secondary-dark">
            ‘{entry.note}’
          </Text>
        ) : null}

        <Button variant="secondary" className="mt-5" onPress={onEdit}>
          Edit
        </Button>
      </Animated.View>
    </Animated.View>
  );
}
