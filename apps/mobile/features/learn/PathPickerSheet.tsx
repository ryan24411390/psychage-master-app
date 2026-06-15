import { ChevronRight } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { CT4_LEARN, LEARN_PATHS } from '@/features/learn/copy';
import { useHaptics } from '@/lib/haptic-context';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

// "Find your path" — a bottom-sheet over the Learn feed. Six feeling-led options
// (educational framing, no diagnostic language) each routing to a curated
// category. Native Modal carries the slide; Reduce Motion swaps it to a fade
// (DESIGN.mobile.md §3.1 — vestibular trigger removed, hierarchy preserved).
// "Nothing is saved" is stated in the hint — the picker writes no state.

type PathPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (route: string) => void;
};

export function PathPickerSheet({ visible, onClose, onPick }: PathPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const { fireHaptic } = useHaptics();
  const t = CT4_LEARN;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={onClose}
        className="flex-1 justify-end bg-black/40"
      >
        {/* Stop propagation: taps inside the sheet must not dismiss. */}
        <Pressable
          onPress={() => {}}
          className="gap-3 rounded-t-3xl bg-surface px-5 pt-3 dark:bg-surface-dark"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-border dark:bg-border-dark" />
          <Text variant="heading" accessibilityRole="header">
            {t.pickerTitle}
          </Text>
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.pickerHint}
          </Text>

          <View className="mt-1 gap-2">
            {LEARN_PATHS.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                testID={`learn-path-${p.id}`}
                onPress={() => {
                  fireHaptic('tab');
                  onPick(p.route);
                }}
                className="min-h-[52px] flex-row items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 dark:border-border-dark"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text variant="bodyMedium" className="flex-1">
                  {p.label}
                </Text>
                <ChevronRight size={18} color={tc.inkTertiary} strokeWidth={2} />
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.pickerSkip}
            onPress={onClose}
            className="min-h-[44px] items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark underline">
              {t.pickerSkip}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
