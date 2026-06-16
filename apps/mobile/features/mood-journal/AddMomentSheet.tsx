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
import { ValenceScale } from '@/features/mood-journal/components/ValenceScale';
import { CT4_MOOD_JOURNAL } from '@/features/mood-journal/copy';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';
import { colors } from '@/lib/colors';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Add-a-moment bottom sheet — an OVERLAY under the global header (the Help-now pill
// stays reachable above the veil, SR-2). A short 2-STEP wizard:
//   Step 1 — pleasantness (valence 1–10), OPTIONAL and skippable via Next.
//   Step 2 — emotions + triggers multi-select + an optional note (≤ NOTE_MAX_LENGTH).
// Save lives on step 2 and is disabled until ≥1 tag is selected (the store's
// contract). Valence is the ONE mood number the journal keeps; it rides the moment
// and, like every field here, stays LOCAL-ONLY (SR-4) — it never syncs.
//
// A thrown write (a full local store, the one realistic failure) surfaces the verbatim
// line and PRESERVES the step-2 selection, the valence, and the note.

type AddMomentSheetProps = {
  onSave: (input: MomentInput) => void;
  onClose: () => void;
};

type Step = 0 | 1;

export function AddMomentSheet({ onSave, onClose }: AddMomentSheetProps) {
  const reduced = useReducedMotion();
  const { colorScheme } = useColorScheme();
  const [step, setStep] = useState<Step>(0);
  const [valence, setValence] = useState<number | null>(null);
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
      onSave({
        emotions,
        triggers,
        ...(valence !== null ? { valence } : {}),
        ...(trimmed.length > 0 ? { note: trimmed } : {}),
      });
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
          <Text variant="h3" className="flex-1 pr-3">
            {step === 0 ? t.valenceHeading : t.heading}
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

        {/* Step indicator — two dots, current step in teal. */}
        <View
          className="mb-4 flex-row gap-2"
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step + 1} of 2`}
        >
          {[0, 1].map((s) => (
            <View
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s === step
                  ? 'bg-primary dark:bg-primary-dark'
                  : 'bg-border dark:bg-border-dark'
              }`}
            />
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="max-h-[440px]">
          {step === 0 ? (
            <View testID="mood-journal-valence-step">
              <Text variant="bodySmall" className="mb-3 text-text-secondary dark:text-text-secondary-dark">
                {t.valenceHint}
              </Text>
              <ValenceScale
                value={valence}
                onChange={setValence}
                lowLabel={t.valenceLow}
                highLabel={t.valenceHigh}
              />
            </View>
          ) : (
            <View testID="mood-journal-tags-step">
              <Text variant="h6" className="mb-2">
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

              <Text variant="h6" className="mb-2">
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
            </View>
          )}
        </ScrollView>

        {saveFailed && step === 1 && (
          <Text
            variant="bodySmall"
            className="mt-2 text-text-primary dark:text-text-primary-dark"
            accessibilityLiveRegion="polite"
          >
            {t.saveFailed}
          </Text>
        )}

        {step === 0 ? (
          <Button
            variant="primary"
            className="mt-4"
            onPress={() => setStep(1)}
            testID="mood-journal-next"
          >
            {t.next}
          </Button>
        ) : (
          <View className="mt-4 flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => setStep(0)}
              testID="mood-journal-back"
            >
              {t.back}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={!canSave}
              onPress={handleSave}
              testID="mood-journal-save"
            >
              {t.save}
            </Button>
          </View>
        )}
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
