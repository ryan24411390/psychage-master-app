import { router } from 'expo-router';
import { User } from 'lucide-react-native';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useThemeColors } from '@/lib/use-theme-colors';

// C0.1 avatar — a 44px clay (color.border.default) circle. ANONYMOUS state shows
// a NEUTRAL GLYPH, never an assumed initial (no display name exists yet). The
// Fraunces-initial branch lands with the auth slice once a name is available.
// Layout spacing (the gap to the Help-now pill) is owned by GlobalHeader, so this
// carries no margin of its own.
export function HeaderAvatar() {
  // Neutral glyph → secondary ink so it stays visible on the clay circle in both
  // registers (charcoal-600 would vanish against the dark border fill on black).
  const tc = useThemeColors();
  return (
    // Visual press feedback + a light 'tab' selection haptic (nav control; gated by
    // HapticProvider.enabled / reduce-haptics). Scale is reduce-motion-gated inside
    // AnimatedPressable.
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      // Wave B2 (S42): the avatar opens Settings (Flow 18) — the calm list that
      // holds prefs, accessibility, privacy/data, supporter, and the sign-out
      // entry. The account/identity portion stays gated on rules/auth.md (B1).
      onPress={() => router.push('/settings')}
      hitSlop={4}
      haptic="tab"
      scaleTo={0.94}
      activeOpacity={0.85}
      springPreset="subtle"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-border dark:bg-border-dark">
        <User size={20} color={tc.inkSecondary} strokeWidth={1.75} />
      </View>
    </AnimatedPressable>
  );
}
