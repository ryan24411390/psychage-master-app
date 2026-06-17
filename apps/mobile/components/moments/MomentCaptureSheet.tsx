import {
  INTENSITY_VALUES,
  type MomentDraft,
  type MomentIntensity,
  NOTE_MAX_LENGTH,
} from '@psychage/shared/engagement';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Mascot } from '@/components/home/Mascot';
import { ChipGroup } from '@/components/moments/ChipGroup';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { MASCOT_CONTEXTUAL } from '@/features/mascot/mascot.surfaces';
import { MOMENTS_COPY } from '@/features/moments/copy';
import { AFFECT_FAMILIES } from '@/features/moments/vocab';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';
import { DURATION, useReducedMotion } from '@/lib/motion';

// The Moments capture sheet — a bottom-sheet OVERLAY under the global header (the Help-now
// crisis pill stays reachable in the stack header above the veil — SR-2). It is an
// AFFECT-LABELING surface: the primary act is NAMING a feeling (pick a word), NOT rating a
// mood. There is no valence slider.
//
// Flow: pick a precise word (required — the naming) → optionally a second word (one) →
//   optionally how strong (low/med/high) → optionally one line → save. Minimal capture is
//   2 taps: one word, then save. The product OFFERS the vocabulary; it never picks or
//   guesses the word (SR-3 + the prefrontal "name it" mechanism).
//
// MASCOT (memo §6 — anchor, never mirror): the ambient, receded mascot lives on the surface
// BEHIND this sheet (home '/' route pose / onboarding's receded mascot), dimmed by the veil
// = "recedes during naming". This sheet shows the mascot only for the post-capture
// ACKNOWLEDGMENT — a single constant-warmth line about the ACT ("You noticed that."),
// valence-invariant: it never varies with the feeling that was named.
//
// Store-agnostic: the container owns the write (onSave). No acute-handoff rule is built —
// the draft never sets routedToSupport (pending clinical decision); the crisis pill is the
// safety floor.

const MAX_WORDS = 2; // one primary + one optional secondary (brevity is a safety feature)
const ACK_MS = 1400; // how long the post-capture acknowledgment lingers before the sheet closes

type MomentCaptureSheetProps = {
  onSave: (draft: MomentDraft) => void;
  onClose: () => void;
  /**
   * When true (default), the sheet shows the acknowledgment beat after save, then calls
   * onClose. When false the caller's onSave drives what happens next (onboarding navigates
   * to its own acknowledgment screen), so the sheet does not self-close or acknowledge.
   */
  acknowledge?: boolean;
};

export function MomentCaptureSheet({ onSave, onClose, acknowledge = true }: MomentCaptureSheetProps) {
  const reduced = useReducedMotion();
  const { colorScheme } = useColorScheme();
  const [words, setWords] = useState<string[]>([]); // [primary, secondary?]
  const [intensity, setIntensity] = useState<MomentIntensity | null>(null);
  const [note, setNote] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const placeholderColor = colorForScheme(resolveColorRef('color.text.tertiary'), colorScheme);
  const iconColor = colorForScheme(resolveColorRef('color.text.secondary'), colorScheme);

  const named = words.length > 0;

  // The post-capture acknowledgment lingers, then the sheet closes itself.
  useEffect(() => {
    if (!acknowledged) return;
    const t = setTimeout(onClose, ACK_MS);
    return () => clearTimeout(t);
  }, [acknowledged, onClose]);

  const toggleWord = (key: string) => {
    setSaveFailed(false);
    setWords((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length >= MAX_WORDS) return cur;
      return [...cur, key];
    });
  };

  const handleSave = () => {
    const primary = words[0];
    if (primary === undefined) return;
    const trimmed = note.trim();
    const draft: MomentDraft = {
      labelPrimary: primary,
      ...(words[1] !== undefined ? { labelSecondary: words[1] } : {}),
      ...(intensity !== null ? { intensity } : {}),
      ...(trimmed.length > 0 ? { note: trimmed } : {}),
      // routedToSupport intentionally omitted (defaults false): no acute-handoff rule is
      // built — that threshold is a pending clinical decision. The SR-2 crisis pill is the
      // safety floor.
    };
    try {
      onSave(draft);
      if (acknowledge) setAcknowledged(true);
    } catch {
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
        accessibilityLabel={MOMENTS_COPY.close}
        className="flex-1"
        onPress={acknowledged ? undefined : onClose}
      />
      <Animated.View
        entering={reduced ? undefined : SlideInDown.springify().damping(20).stiffness(200).mass(0.8)}
        exiting={reduced ? undefined : SlideOutDown.springify().damping(20).stiffness(200).mass(0.8)}
        className="max-h-[88%] rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark"
      >
        {acknowledged ? (
          // Post-capture acknowledgment of the ACT — a single constant-warmth beat. The
          // mascot is present (anchor); the line never varies with the named feeling.
          <Animated.View
            entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
            className="items-center gap-4 py-10"
          >
            <Mascot state={MASCOT_CONTEXTUAL.momentCapture} size={88} />
            <Text variant="heading" className="text-center">
              {MOMENTS_COPY.acknowledged}
            </Text>
          </Animated.View>
        ) : (
          <>
            <View className="mb-1 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text variant="heading">{MOMENTS_COPY.title}</Text>
                <Text variant="body" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
                  {MOMENTS_COPY.subline}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={MOMENTS_COPY.close}
                hitSlop={8}
                onPress={onClose}
              >
                <X size={22} color={iconColor} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-3" keyboardShouldPersistTaps="handled">
              {/* The naming — the primary act. Word families, browse + pick (up to two). */}
              {AFFECT_FAMILIES.map((family) => (
                <View key={family.title} className="mb-4 gap-2">
                  <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
                    {family.title}
                  </Text>
                  <ChipGroup
                    items={family.words}
                    selected={words}
                    max={MAX_WORDS}
                    onToggle={toggleWord}
                  />
                </View>
              ))}

              {named && words.length < MAX_WORDS && (
                <Text variant="bodySm" className="mb-4 text-text-tertiary dark:text-text-tertiary-dark">
                  {MOMENTS_COPY.secondaryPrompt} · {MOMENTS_COPY.secondaryHint.toLowerCase()}
                </Text>
              )}

              {named && (
                <View className="mt-2 gap-2">
                  <Text variant="bodyMedium">
                    {MOMENTS_COPY.intensityPrompt}{' '}
                    <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
                      {MOMENTS_COPY.intensityHint.toLowerCase()}
                    </Text>
                  </Text>
                  <ChipGroup
                    items={INTENSITY_VALUES.map((v) => ({ key: v, label: MOMENTS_COPY.intensityLabels[v] }))}
                    selected={intensity !== null ? [intensity] : []}
                    max={1}
                    onToggle={(k) => setIntensity((cur) => (cur === k ? null : (k as MomentIntensity)))}
                  />
                </View>
              )}

              {named && (
                <View className="mt-6 gap-2">
                  <Text variant="bodyMedium">
                    {MOMENTS_COPY.notePrompt}{' '}
                    <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
                      {MOMENTS_COPY.intensityHint.toLowerCase()}
                    </Text>
                  </Text>
                  <TextInput
                    accessibilityLabel={MOMENTS_COPY.notePrompt}
                    placeholder={MOMENTS_COPY.notePlaceholder}
                    placeholderTextColor={placeholderColor}
                    value={note}
                    onChangeText={(text) => {
                      setNote(text);
                      setSaveFailed(false);
                    }}
                    maxLength={NOTE_MAX_LENGTH}
                    className="min-h-[44px] rounded-lg border border-border px-3 py-2 font-sans text-base text-text-primary dark:border-border-dark dark:text-text-primary-dark"
                  />
                </View>
              )}

              {saveFailed && (
                <Text
                  variant="bodySm"
                  className="mt-3 text-text-primary dark:text-text-primary-dark"
                  accessibilityLiveRegion="polite"
                >
                  {MOMENTS_COPY.saveFailed}
                </Text>
              )}
            </ScrollView>

            <Button variant="primary" className="mt-4" disabled={!named} onPress={handleSave}>
              {MOMENTS_COPY.save}
            </Button>
            <Text variant="caption" className="mt-2 text-center text-text-tertiary dark:text-text-tertiary-dark">
              {MOMENTS_COPY.privacyNote}
            </Text>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}
