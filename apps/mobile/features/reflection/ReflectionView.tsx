import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Terrain } from '@/components/terrain/Terrain';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { DURATION, easingFn } from '@/lib/motion';

import type { WeekReflection } from './week';

// S9 — one quiet surface (Flow 12). The week's seven-day terrain (reusing C0.3 Terrain
// read-only), then ONE descriptive line in Fraunces ITALIC (the record's voice), then
// that week's notes with their day. One secondary action → History (S7). NO mascot
// (two voices would compete). Reduced motion: the page-load settle is skipped.
//
// "See the full record" + "Earlier weeks" are Flow Book labels.

export interface ReflectionViewProps {
  readonly week: WeekReflection;
  readonly reduced: boolean;
  readonly onBack: () => void;
  readonly onEarlier: () => void;
  readonly onFullRecord: () => void;
}

export function ReflectionView({
  week,
  reduced,
  onBack,
  onEarlier,
  onFullRecord,
}: ReflectionViewProps) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const { width } = useWindowDimensions();

  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeInDown.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] w-11 justify-center"
        >
          <ArrowLeft size={24} color={ink} strokeWidth={2} />
        </Pressable>
      </View>

      <Settle {...settleProps} className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-2">
          <Terrain days={week.days} width={Math.max(0, width - 32)} />

          <View className="border-l-4 border-primary px-4 py-3 rounded-r-xl bg-surface-accent/20 dark:bg-surface-accent-dark/10">
            <Text className="font-display text-[20px] italic text-text-primary dark:text-text-primary-dark">
              {week.line}
            </Text>
          </View>

          {week.notes.length > 0 ? (
            <View className="gap-3 p-5 rounded-xl border border-border/50 bg-surface shadow-sm dark:border-border-dark/50 dark:bg-surface-dark">
              {week.notes.map((n) => (
                <Text
                  key={`${n.day}:${n.note}`}
                  variant="body"
                  className="text-text-secondary dark:text-text-secondary-dark"
                >
                  {`${n.day} — ‘${n.note}’`}
                </Text>
              ))}
            </View>
          ) : null}

          <View className="gap-1 border-t border-border pt-4 dark:border-border-dark">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See the full record"
              onPress={onFullRecord}
              hitSlop={6}
              className="min-h-[44px] justify-center"
            >
              <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
                See the full record
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Earlier weeks"
              onPress={onEarlier}
              hitSlop={6}
              className="min-h-[44px] justify-center"
            >
              <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
                Earlier weeks
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Settle>
    </SafeAreaView>
  );
}
