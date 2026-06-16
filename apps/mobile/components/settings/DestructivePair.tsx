import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';

// The geometric-sibling delete pair (S47/S48). Two buttons of IDENTICAL 54px
// geometry:
//   - destructive  = RUST OUTLINE, NEVER filled. Interim semantic.error until a
//                    `rust` color token lands (TOKEN-GAP(rust)). The only filled
//                    rust in the app is the crisis emergency button — never here.
//   - keep sibling = the SAME 54px button in borderStrong (charcoal.500) + ink.
//                    Never a ghost, never smaller — the sibling rule makes "keep"
//                    exactly as easy to choose as "delete" (no confirm-shaming).
//
// Built standalone (not the A1 Button, which is 44/36px and fires haptic.affirm).
// The destructive press fires haptic.alert (a warning), never affirm.

type DestructivePairProps = {
  destructLabel: string;
  keepLabel: string;
  onDestruct: () => void;
  onKeep: () => void;
};

const BASE = 'min-h-[54px] items-center justify-center rounded-lg border-2 px-5 py-3';

export function DestructivePair({
  destructLabel,
  keepLabel,
  onDestruct,
  onKeep,
}: DestructivePairProps) {
  const { fireHaptic } = useHaptics();

  const handleDestruct = () => {
    fireHaptic('alert');
    onDestruct();
  };

  return (
    <View className="gap-3">
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={destructLabel}
        onPress={handleDestruct}
        testID="destructive-action"
        className={`${BASE} border-error`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text variant="bodyMedium" className="text-error dark:text-error-dark">
          {destructLabel}
        </Text>
      </AnimatedPressable>

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={keepLabel}
        onPress={onKeep}
        testID="destructive-keep"
        className={`${BASE} border-charcoal-500`}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text variant="bodyMedium">{keepLabel}</Text>
      </AnimatedPressable>
    </View>
  );
}
