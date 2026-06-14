import { User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/lib/colors';

// C0.1 avatar — a 44px clay (color.border.default) circle. ANONYMOUS state shows
// a NEUTRAL GLYPH, never an assumed initial (no display name exists yet). The
// Fraunces-initial branch lands with the auth slice once a name is available.
// Layout spacing (the gap to the Help-now pill) is owned by GlobalHeader, so this
// carries no margin of its own.
export function HeaderAvatar() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      // TODO(slice-?-auth): open identity sheet per DESIGN.mobile.md §2.3
      // (account, premium, prefs, language, accessibility, data export, sign-out).
      // Avatar destination is gated on rules/auth.md.
      onPress={() => {}}
      hitSlop={4}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-border dark:bg-border-dark">
        <User size={20} color={colors.charcoal[600]} strokeWidth={1.75} />
      </View>
    </Pressable>
  );
}
