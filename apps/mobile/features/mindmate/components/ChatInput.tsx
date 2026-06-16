import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useHaptics } from '@/lib/haptic-context';
import { colors } from '@/lib/colors';

import { MINDMATE_COPY } from '../copy';

// Message composer. Multiline grows to a cap; the send affordance is a 44pt round
// target (iOS HIG floor) disabled until there's trimmed text. Disabled while a
// reply streams so turns can't interleave.
export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const { fireHaptic } = useHaptics();
  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    // DESIGN.mobile.md §3.3 — primary CTA fires haptic.affirm.
    fireHaptic('affirm');
    onSend(value.trim());
    setValue('');
  };

  return (
    <View className="flex-row items-end gap-3 border-t border-border-hairline px-4 py-3 dark:border-border-dark/30">
      <TextInput
        className="max-h-32 min-h-[44px] flex-1 rounded-2xl bg-surface border border-border/40 px-4 py-2.5 font-sans text-base text-text-primary dark:bg-surface-dark dark:border-border-dark/40 dark:text-text-primary-dark"
        placeholder={MINDMATE_COPY.inputPlaceholder}
        placeholderTextColor={colors.text.tertiary.light}
        value={value}
        onChangeText={setValue}
        multiline
        editable={!disabled}
        accessibilityLabel={MINDMATE_COPY.inputPlaceholder}
        testID="mindmate-input"
      />
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={MINDMATE_COPY.sendLabel}
        accessibilityState={{ disabled: !canSend }}
        onPress={submit}
        disabled={!canSend}
        className="h-11 w-11 items-center justify-center rounded-full bg-primary dark:bg-primary-dark"
        style={({ pressed }) => ({ opacity: !canSend ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed && canSend ? 0.96 : 1 }] })}
        testID="mindmate-send"
      >
        <Send size={20} color={colors.charcoal[50]} strokeWidth={2} />
      </AnimatedPressable>
    </View>
  );
}
