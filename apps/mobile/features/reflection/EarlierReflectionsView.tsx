import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ScreenEntrance } from '@/components/ui/ScreenEntrance';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import type { WeekReflection } from './week';

// S10 — a quiet "Earlier weeks" list, same template voice (each week's italic line +
// its date range), reachable from S9. NO mascot. The empty line is a FIXTURE → CT4.

const EMPTY = 'No earlier weeks yet.'; // FIXTURE chrome → CT4

export interface EarlierReflectionsViewProps {
  readonly weeks: readonly WeekReflection[];
  readonly onBack: () => void;
}

export function EarlierReflectionsView({ weeks, onBack }: EarlierReflectionsViewProps) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-4 pt-1">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] w-11 justify-center"
          haptic="tab"
        >
          <ArrowLeft size={24} color={ink} strokeWidth={2} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10 pt-2">
        <ScreenEntrance>
          <Text
            variant="caption"
            className="uppercase tracking-widest text-text-secondary dark:text-text-secondary-dark"
          >
            Earlier weeks
          </Text>

          {weeks.length === 0 ? (
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {EMPTY}
            </Text>
          ) : (
            weeks.map((w) => (
              <Card key={w.weekStartIso} variant="elevated" className="gap-3">
                <Text
                  variant="caption"
                  className="text-text-tertiary dark:text-text-tertiary-dark font-sans-medium"
                >
                  {w.rangeLabel}
                </Text>
                <View className="border-l-4 border-primary px-3 py-1 bg-surface-accent/20 dark:bg-surface-accent-dark/10 rounded-r-lg">
                  <Text className="font-display text-[16px] italic text-text-primary dark:text-text-primary-dark">
                    {w.line}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </ScreenEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}
