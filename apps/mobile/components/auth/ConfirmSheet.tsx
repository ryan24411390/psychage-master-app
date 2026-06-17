import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Plain confirm sheet (S37 sign-out uses it). Mirrors the CheckInSheet overlay
// grammar: dim backdrop, bottom sheet, settle on entry, in-place under reduced
// motion. The primary action is NOT destructive-styled — sign-out is reversible
// (you sign back in), so it uses the ordinary primary button, never a red/destructive
// treatment. Backdrop press = cancel.

type ConfirmSheetProps = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const reduced = useReducedMotion();

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.swift)}
      className="absolute inset-0 z-40 justify-end bg-charcoal-900/40 dark:bg-black/60"
    >
      <Pressable
        // Tap-to-dismiss backdrop. Hidden from accessibility — the explicit Cancel
        // button is the accessible dismiss path (avoids a duplicate "Cancel" element).
        accessibilityElementsHidden
        importantForAccessibility="no"
        className="flex-1"
        onPress={onCancel}
      />
      <Animated.View
        entering={reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'))}
        className="gap-4 rounded-t-xl bg-surface px-5 pb-6 pt-5 dark:bg-surface-dark"
      >
        <View className="gap-2">
          <Text variant="h2">{title}</Text>
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {body}
          </Text>
        </View>
        <View className="gap-2">
          <Button variant="primary" onPress={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onPress={onCancel}>
            {cancelLabel}
          </Button>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
