import { router } from 'expo-router';
import { Search, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { CT4_LEARN } from '@/features/learn/copy';
import { useHaptics } from '@/lib/haptic-context';
import { useThemeColors } from '@/lib/use-theme-colors';

// The search-first hero: a Fraunces prompt, a tap-to-search field (routes to the
// dedicated search screen — a real input lives there, not here), and the
// "find your path" trigger that opens the picker sheet.

export function LearnHero({ onFindPath }: { onFindPath: () => void }) {
  const t = CT4_LEARN;
  const tc = useThemeColors();
  const { fireHaptic } = useHaptics();

  return (
    <View className="gap-3 px-4 pt-3">
      <Text variant="headingLg" className="text-[26px] leading-[30px]" accessibilityRole="header">
        {t.heroTitle}
      </Text>

      <AnimatedPressable
        accessibilityRole="search"
        accessibilityLabel={t.searchPlaceholder}
        testID="learn-search-trigger"
        onPress={() => {
          fireHaptic('tab');
          router.push('/learn/search');
        }}
        className="min-h-[48px] flex-row items-center gap-2.5 rounded-full border border-border-hairline bg-surface px-4 dark:border-border-dark dark:bg-surface-dark"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Search size={18} color={tc.inkTertiary} strokeWidth={2} />
        <Text variant="body" className="text-text-tertiary dark:text-text-tertiary-dark">
          {t.searchPlaceholder}
        </Text>
      </AnimatedPressable>

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t.findPath}
        testID="learn-find-path"
        onPress={() => {
          fireHaptic('tab');
          onFindPath();
        }}
        hitSlop={6}
        className="min-h-[44px] flex-row items-center gap-2 self-start"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Sparkles size={16} color={tc.primary} strokeWidth={2} />
        <Text variant="bodyMedium" className="text-teal-700 dark:text-primary-dark">
          {t.findPath}
        </Text>
      </AnimatedPressable>
    </View>
  );
}
