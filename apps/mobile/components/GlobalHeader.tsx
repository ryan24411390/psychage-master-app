import { router } from 'expo-router';
import { LifeBuoy } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderAvatar } from '@/components/HeaderAvatar';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// C0.1 global header — persistent top chrome on every screen: wordmark (Fraunces)
// left; Help-now pill (crisis outline) + avatar right. Static chrome — no
// offline/error state. Rendered as the navigation `header` so it sits above the
// screen content; any later sheet renders UNDER it (lower z) so the Help-now pill
// stays reachable above the veil. The pill is the one sanctioned use of the
// crisis color (an outline, never a red fill — not "red urgency").

// NOTE: "Help now" is the only label the order names but does not quote verbatim;
// derived from the element's own name ("Help-now pill"). Flagged for CT4 sign-off.
function HelpNowPill() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Help now"
      // A2/PR-A: the crisis surface now exists — wire the destination (the in-file
      // note above invited this; the global `router` keeps render safe so no nav
      // context is needed at render, only on press). Crisis is reachable in ≤1 tap.
      onPress={() => router.push('/crisis')}
      hitSlop={4}
      className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border border-crisis px-3"
    >
      <LifeBuoy size={18} color={colors.crisis} strokeWidth={1.75} />
      <Text variant="bodyMedium" className="text-[13px] text-crisis">
        Help now
      </Text>
    </Pressable>
  );
}

export function GlobalHeader() {
  return (
    <SafeAreaView edges={['top']} className="bg-background dark:bg-background-dark">
      <View className="h-14 flex-row items-center justify-between px-4">
        <Text variant="heading" accessibilityRole="header">
          Psychage
        </Text>
        <View className="flex-row items-center gap-2">
          <HelpNowPill />
          <HeaderAvatar />
        </View>
      </View>
    </SafeAreaView>
  );
}
