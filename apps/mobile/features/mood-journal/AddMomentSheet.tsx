import {
  EMOTION_TAGS,
  type EmotionTag,
  type MomentInput,
  NOTE_MAX_LENGTH,
  TRIGGER_TAGS,
  type TriggerTag,
} from '@psychage/shared/mood-journal';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TagChip } from '@/features/mood-journal/components/TagChip';
import { CT4_MOOD_JOURNAL } from '@/features/mood-journal/copy';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';
import { colors } from '@/lib/colors';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Add-a-moment bottom sheet — an OVERLAY under the global header (the Help-now pill
// stays reachable above the veil, SR-2). Two multi-select chip groups (emotions,
// triggers) + an optional note (≤ NOTE_MAX_LENGTH) + save. Single screen — the web
// tool's 4-step wizard is collapsed, and its VALENCE step is dropped entirely: mood
// stays single-sourced in the check-in record, never re-captured here.
//
// Save is disabled until at least one tag is selected (the store's contract: a
// moment needs ≥1 emotion or trigger). A thrown write (a full local store, the one
// realistic failure) surfaces the verbatim line and PRESERVES the selection + note.

type AddMomentSheetProps = {
  onSave: (input: MomentInput) => void;
  onClose: () => void;
};

export function AddMomentSheet({ onSave, onClose }: AddMomentSheetProps) {
  const reduced = useReducedMotion();
  const { colorScheme } = useColorScheme();
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [triggers, setTriggers] = useState<TriggerTag[]>([]);
  const [note, setNote] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);

  const t = CT4_MOOD_JOURNAL.add;
  const placeholderColor = colorForScheme(resolveColorRef('color.text.tertiary'), colorScheme);
  const canSave = emotions.length + triggers.length > 0;

  const toggleEmotion = (tag: EmotionTag) => {
    setEmotions((prev) => (prev.includes(tag) ? prev.filter((v) => v !== tag) : [...prev, tag]));
    setSaveFailed(false);
  };
  const toggleTrigger = (tag: TriggerTag) => {
    setTriggers((prev) => (prev.includes(tag) ? prev.filter((v) => v !== tag) : [...prev, tag]));
    setSaveFailed(false);
  };

  const handleSave = () => {
    if (!canSave) return;
    const trimmed = note.trim();
    try {
      onSave({ emotions, triggers, note: trimmed.length > 0 ? trimmed : undefined });
      // Success → the parent unmounts this sheet.
    } catch {
      setSaveFailed(true);
    }
  };

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.close}
        className="flex-1"
        onPress={onClose}
      />
      <Animated.View
        entering={reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))}
        className="rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark"
      >
        <View className="mb-3 flex-row items-start justify-between">
          <Text variant="heading" className="flex-1 pr-3">
            {t.heading}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.close}
            hitSlop={8}
            onPress={onClose}
          >
            <X size={22} color={colors.charcoal[600]} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="max-h-[440px]">
          <Text variant="bodyMedium" className="mb-2">
            {t.emotionsLabel}
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {EMOTION_TAGS.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                selected={emotions.includes(tag)}
                onPress={() => toggleEmotion(tag)}
                testID={`emotion-chip-${tag}`}
              />
            ))}
          </View>

          <Text variant="bodyMedium" className="mb-2">
            {t.triggersLabel}
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {TRIGGER_TAGS.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                selected={triggers.includes(tag)}
                onPress={() => toggleTrigger(tag)}
                testID={`trigger-chip-${tag}`}
              />
            ))}
          </View>

          <TextInput
            accessibilityLabel={t.notePlaceholder}
            placeholder={t.notePlaceholder}
            placeholderTextColor={placeholderColor}
            value={note}
            onChangeText={(text) => {
              setNote(text);
              setSaveFailed(false);
            }}
            maxLength={NOTE_MAX_LENGTH}
            multiline
            className="min-h-[44px] rounded-lg border border-border px-3 py-2 font-sans text-base text-text-primary dark:border-border-dark dark:text-text-primary-dark"
          />
        </ScrollView>

        {saveFailed && (
          <Text
            variant="bodySm"
            className="mt-2 text-text-primary dark:text-text-primary-dark"
            accessibilityLiveRegion="polite"
          >
            {t.saveFailed}
          </Text>
        )}

        <Button
          variant="primary"
          className="mt-4"
          disabled={!canSave}
          onPress={handleSave}
          testID="mood-journal-save"
        >
          {t.save}
        </Button>
        <Text
          variant="caption"
          className="mt-2 text-center text-text-tertiary dark:text-text-tertiary-dark"
        >
          {t.privacy}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
