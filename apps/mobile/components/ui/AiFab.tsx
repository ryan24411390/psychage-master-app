import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useHaptics } from '@/lib/haptic-context';

// Floating AI launcher — a teal circle with a white sparkle and a soft teal glow
// halo, pinned bottom-right of the screen content, just above the bottom tab bar.
// Opens the MindMate AI companion. Per-screen (no app-wide FAB exists). The glow is
// built from stacked translucent teal discs (NativeWind only — no blur dep); the
// drop shadow adds lift. The tab navigator lays the scene ABOVE the tab bar (which
// owns its own safe-area inset), so this offset is measured from the content's
// bottom edge (the tab bar's top) — no safe-area inset to add here.

type AiFabProps = {
  /** Defaults to opening MindMate. */
  onPress?: () => void;
  /** Gap in px between the FAB and the bottom of the screen content (tab bar top). */
  bottomOffset?: number;
};

const TAB_BAR_GAP = 20;

export function AiFab({ onPress, bottomOffset = TAB_BAR_GAP }: AiFabProps) {
  const { fireHaptic } = useHaptics();
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-5"
      style={{ bottom: bottomOffset }}
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
