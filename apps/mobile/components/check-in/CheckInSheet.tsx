import type { CheckInState } from '@psychage/shared/check-in';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { StateRows } from '@/components/check-in/StateRows';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CHECK_IN_COPY } from '@/features/check-in/copy';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S4 the full check-in / edit sheet (one sheet, two modes). A bottom-sheet OVERLAY
// under the global header (the Help-now pill stays reachable above the veil). The
// five-state selector (C0.4) + an optional note (≤24, the store's NOTE_MAX_LENGTH) +
// save. Store-agnostic: the container owns the write, so home wires saveToday
// (check-in) and history wires editEntry (edit) — and only home fires the Imprint.
//   • check-in mode: title "How are you right now?" + subline "There's no wrong answer."
//   • edit mode:     title "Edit this entry." (no subline), state/note pre-filled.
// Save runs the parent's onSave; a thrown write (the one realistic failure — a full
// local store) surfaces the verbatim line and PRESERVES the selection + note. On
// success the parent unmounts the sheet. Mascot: never on the sheet. Settle verb on
// entry; reduced motion = in place.

// Mirrors NOTE_MAX_LENGTH in @psychage/shared/check-in (the store rejects longer).
const NOTE_MAX = 24;

type CheckInSheetMode = 'check-in' | 'edit';

type CheckInSheetProps = {
  onSave: (state: CheckInState, note?: string) => void;
  onClose: () => void;
  mode?: CheckInSheetMode;
  initialState?: CheckInState;
  initialNote?: string;
};

export function CheckInSheet({
  onSave,
  onClose,
  mode = 'check-in',
  initialState,
  initialNote,
}: CheckInSheetProps) {
  const reduced = useReducedMotion();
  const { colorScheme } = useColorScheme();
  const [selected, setSelected] = useState<CheckInState | null>(initialState ?? null);
  const [note, setNote] = useState(initialNote ?? '');
  const [saveFailed, setSaveFailed] = useState(false);

  const isEdit = mode === 'edit';
  const placeholderColor = colorForScheme(resolveColorRef('color.text.tertiary'), colorScheme);

  const handleSavePress = () => {
    if (selected === null) return;
    const trimmed = note.trim();
    try {
      onSave(selected, trimmed.length > 0 ? trimmed : undefined);
      // Success → the parent closes (unmounts) this sheet.
    } catch {
      // A failed local write (storage full): keep the sheet open, selection + note
      // intact, and show the verbatim line. No close, no Imprint (the parent's write
      // threw before its side effects ran).
      setSaveFailed(true);
    }
  };

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
      exiting={reduced ? undefined : FadeOut.duration(DURATION.swift)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40 dark:bg-black/60"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="flex-1"
        onPress={onClose}
      />
      <Animated.View
        entering={
          reduced ? undefined : SlideInDown.duration(DURATION.base).easing(easingFn('standard'))
        }
        exiting={
          reduced ? undefined : SlideOutDown.duration(DURATION.base).easing(easingFn('standard'))
        }
        className="rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark"
      >
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text variant="heading">{isEdit ? CHECK_IN_COPY.editTitle : CHECK_IN_COPY.title}</Text>
            {!isEdit && (
              <Text
                variant="body"
                className="mt-1 text-text-secondary dark:text-text-secondary-dark"
              >
                {CHECK_IN_COPY.subline}
              </Text>
            )}
          </View>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={CHECK_IN_COPY.close}
            hitSlop={8}
            onPress={onClose}
          >
            <X size={22} color={colorForScheme(resolveColorRef('color.text.secondary'), colorScheme)} />
          </AnimatedPressable>
        </View>

        <StateRows
          value={selected}
          onChange={(state) => {
            setSelected(state);
            setSaveFailed(false);
          }}
        />

        <TextInput
          accessibilityLabel={CHECK_IN_COPY.notePlaceholder}
          placeholder={CHECK_IN_COPY.notePlaceholder}
          placeholderTextColor={placeholderColor}
          value={note}
          onChangeText={(text) => {
            setNote(text);
            setSaveFailed(false);
          }}
          maxLength={NOTE_MAX}
          className="mt-3 min-h-[44px] rounded-lg border border-border px-3 py-2 font-sans text-base text-text-primary dark:border-border-dark dark:text-text-primary-dark"
        />

        {saveFailed && (
          <Text
            variant="bodySm"
            className="mt-2 text-text-primary dark:text-text-primary-dark"
            accessibilityLiveRegion="polite"
          >
            {CHECK_IN_COPY.saveFailed}
          </Text>
        )}

        <Button
          variant="primary"
          className="mt-4"
          disabled={selected === null}
          onPress={handleSavePress}
        >
          {isEdit ? CHECK_IN_COPY.editSave : CHECK_IN_COPY.save}
        </Button>
        <Text
          variant="caption"
          className="mt-2 text-center text-text-tertiary dark:text-text-tertiary-dark"
        >
          {CHECK_IN_COPY.whisper}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
