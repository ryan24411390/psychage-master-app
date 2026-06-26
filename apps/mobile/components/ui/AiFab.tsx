import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHaptics } from '@/lib/haptic-context';

// Floating AI launcher — a teal circle with a white sparkle and a soft teal glow
// halo, pinned bottom-right and floating above the screen content and the tab bar.
// Opens the MindMate AI companion. Per-screen (no app-wide FAB exists). The glow is
// built from stacked translucent teal discs (NativeWind only — no blur dep); the
// drop shadow adds lift. Sits above the bottom tab bar via the safe-area inset.

type AiFabProps = {
  /** Defaults to opening MindMate. */
  onPress?: () => void;
  /** Pixels to lift the FAB above the bottom edge for the tab bar. */
  bottomOffset?: number;
};

const TAB_BAR_CLEARANCE = 68;

export function AiFab({ onPress, bottomOffset = TAB_BAR_CLEARANCE }: AiFabProps) {
  const insets = useSafeAreaInsets();
  const { fireHaptic } = useHaptics();
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-5"
      style={{ bottom: insets.bottom + bottomOffset }}
    >
      {/* Glow halo — stacked translucent teal discs behind the button. */}
      <View
        pointerEvents="none"
        className="absolute -left-3 -top-3 h-[84px] w-[84px] rounded-full bg-primary/15 dark:bg-primary-dark/20"
      />
      <View
        pointerEvents="none"
        className="absolute -left-1.5 -top-1.5 h-[72px] w-[72px] rounded-full bg-primary/25 dark:bg-primary-dark/25"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask the AI assistant"
        testID="browse-ai-fab"
        onPress={() => {
          fireHaptic('tab');
          if (onPress) onPress();
          else router.push('/tools/mindmate');
        }}
        className="h-[60px] w-[60px] items-center justify-center rounded-full bg-primary shadow-lg dark:bg-primary-dark"
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <Sparkles size={26} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
      </Pressable>
    </View>
  );
}
