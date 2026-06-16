import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrisisPill } from '@/components/CrisisPill';
import { HeaderAvatar } from '@/components/HeaderAvatar';
import { Text } from '@/components/ui/Text';

// C0.1 global header — persistent top chrome on every screen: wordmark (Fraunces)
// left; Help-now pill (crisis outline) + avatar right. Static chrome — no
// offline/error state. Rendered as the navigation `header` so it sits above the
// screen content; any later sheet renders UNDER it (lower z) so the Help-now pill
// stays reachable above the veil. The pill (now @/components/CrisisPill, shared
// with pushed routes that don't inherit this header) is the one sanctioned use of
// the crisis color — an outline, never a red fill.

export function GlobalHeader() {
  return (
    <SafeAreaView edges={['top']} className="bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between border-b border-border/20 px-5 py-3 dark:border-border-dark/20">
        {/* Two-tone wordmark: Psy in teal, chage in ink (ink follows the theme).
            Nested Text keeps the spans inline; SR reads it as one word. */}
        <Text variant="h3" accessibilityRole="header" accessibilityLabel="Psychage">
          <Text variant="h3" className="text-primary dark:text-primary-dark">
            Psy
          </Text>
          <Text variant="h3" className="text-text-primary dark:text-text-primary-dark">
            chage
          </Text>
        </Text>
        <View className="flex-row items-center gap-2">
          <CrisisPill />
          <HeaderAvatar />
        </View>
      </View>
    </SafeAreaView>
  );
}
