import { useFocusEffect } from 'expo-router';
import { Square, Volume2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { CONDITIONS_REF_COPY } from './copy';

// Read-aloud ("Listen") for a condition's definition, via expo-speech. Rendered ONLY
// when a definition exists (callers gate on hasDefinition). Play/stop toggle; speech is
// stopped on unmount AND on screen blur (useFocusEffect) so audio never trails the
// screen. No autoplay — the user always initiates.

type Props = {
  /** The plain text to read aloud (name + present definition sections). */
  readonly text: string;
};

export function ListenControl({ text }: Props) {
  const t = CONDITIONS_REF_COPY;
  const tc = useThemeColors();
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  // Stop if the component unmounts mid-utterance.
  useEffect(() => stop, [stop]);

  // Stop when the screen loses focus (navigating away/back).
  useFocusEffect(useCallback(() => () => stop(), [stop]));

  const toggle = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking, stop, text]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: speaking }}
      accessibilityLabel={speaking ? t.stopA11y : t.listenA11y}
      onPress={toggle}
      testID="condition-ref-listen"
      haptic="tab"
      className="min-h-[44px] flex-row items-center gap-2 self-start rounded-full border border-border px-4 dark:border-border-dark"
    >
      {speaking ? (
        <Square size={16} color={tc.primary} strokeWidth={2} fill={tc.primary} />
      ) : (
        <Volume2 size={18} color={tc.primary} strokeWidth={2} />
      )}
      <Text variant="label" className="text-primary dark:text-primary-dark">
        {speaking ? t.stop : t.listen}
      </Text>
    </AnimatedPressable>
  );
}
