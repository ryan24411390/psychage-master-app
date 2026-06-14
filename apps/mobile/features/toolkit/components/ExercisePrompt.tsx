import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

// C-GROUND-TYPE — one prompt at exercisePrompt scale (Fraunces 28/600). The count lives
// in the label line ("SEE · 5") — NEVER a meter/bar. Tap ANYWHERE advances. Shared by
// grounding, body scan, and the breathing reduced-motion fallback.

export interface ExercisePromptProps {
  readonly label: string;
  readonly text: string;
  readonly glyph?: ReactNode;
  readonly onAdvance: () => void;
}

export function ExercisePrompt({ label, text, glyph, onAdvance }: ExercisePromptProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Next"
      onPress={onAdvance}
      className="flex-1 items-center justify-center gap-5 px-8"
    >
      {glyph ? <View className="mb-2">{glyph}</View> : null}
      <Text className="font-sans-medium text-sm uppercase tracking-widest text-text-secondary dark:text-text-secondary-dark">
        {label}
      </Text>
      <Text className="text-center font-display text-[28px] text-text-primary dark:text-text-primary-dark">
        {text}
      </Text>
    </Pressable>
  );
}
