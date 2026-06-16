import type { CheckInEntry } from '@psychage/shared/check-in';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { formatEntryDate } from '@/features/history/continuum';
import { MoodGlyphFace } from '@/components/icon-system/mood';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { STATE_LABELS } from '@/lib/check-in-labels';
import { useThemeColors } from '@/lib/use-theme-colors';
import { DURATION, useReducedMotion } from '@/lib/motion';

// S8 entry-detail sheet (over S7). Read-only: the date (Fraunces), the mood-scale glyph
// (MoodGlyphFace — C0.4's display form, the same glyph StateRows uses) + plain label, the
// note in quotes if present, and ONE action — "Edit" → S4 in edit mode (Flow 11 step 3–4).
// There is NO delete (a day that happened, happened) and no "edited" badge. Mascot absent.
// Reduced motion: the sheet appears without a slide (fade only; no FadeInUp).

export interface EntryDetailSheetProps {
  readonly entry: CheckInEntry;
  readonly onEdit: () => void;
  readonly onClose: () => void;
}

export function EntryDetailSheet({ entry, onEdit, onClose }: EntryDetailSheetProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40 dark:bg-black/60"
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
            <X size={22} color={tc.inkSecondary} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <MoodGlyphFace state={entry.state} />
          <Text variant="h6">{STATE_LABELS[entry.state]}</Text>
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
