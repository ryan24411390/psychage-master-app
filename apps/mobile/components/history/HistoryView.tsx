import type { CheckInEntry } from '@psychage/shared/check-in';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { ContinuumWeek } from '@/features/history/continuum';
import { Terrain } from '@/components/terrain/Terrain';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { DURATION, easingFn } from '@/lib/motion';

// S7 History continuum (presentational). Heading "Your record" (verbatim, reused from
// the home record-well label) + an optional reflection-ready ROW (Flow 12, not a banner)
// + the continuum: one C0.3 Terrain per Mon–Sun week, newest at top (reused read-only).
// NO aggregates — the terrain is the only voice (Flow 11). Dot → S8 via a className-only
// overlay: an absolute 7-cell flex-row mirrors the terrain's (i+0.5)/7 column centers, so
// each ENTRY column carries a ≥44px Pressable with the verbatim VoiceOver label. Mascot
// absent; the crisis pill rides the GlobalHeader the route renders above this view.
// Reduced motion: the page-load settle is skipped (terrain itself never animates).

export interface HistoryViewProps {
  readonly weeks: readonly ContinuumWeek[];
  readonly reflectionAvailable: boolean;
  readonly reduced: boolean;
  readonly onBack: () => void;
  readonly onReflection: () => void;
  readonly onSelectEntry: (entry: CheckInEntry) => void;
}

export function HistoryView({
  weeks,
  reflectionAvailable,
  reduced,
  onBack,
  onReflection,
  onSelectEntry,
}: HistoryViewProps) {
  const { colorScheme } = useColorScheme();
  const ink = colorScheme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const { width } = useWindowDimensions();
  const terrainWidth = Math.max(0, width - 32);

  const Settle = reduced ? View : Animated.View;
  const settleProps = reduced
    ? {}
    : { entering: FadeInDown.duration(DURATION.calm).easing(easingFn('out')) };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center gap-1 px-4 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          className="min-h-[44px] w-11 justify-center active:scale-[0.96]"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ArrowLeft size={24} color={ink} strokeWidth={2} />
        </Pressable>
        <Text variant="h3" accessibilityRole="header">
          Your record
        </Text>
      </View>

      <Settle {...settleProps} className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-2">
          {reflectionAvailable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="This week’s reflection is ready."
              onPress={onReflection}
              hitSlop={8}
              className="min-h-[52px] justify-center p-5 rounded-xl border border-border-accent/40 bg-surface-accent/20 shadow-sm active:scale-[0.98] dark:border-border-accent-dark/40 dark:bg-surface-accent-dark/10"
            >
              <Text variant="h6" className="text-primary dark:text-primary-dark font-sans-medium">
                This week’s reflection is ready.
              </Text>
            </Pressable>
          ) : null}

          {weeks.map((week) => (
            <Card key={week.weekStartIso} variant="elevated" className="relative py-4 px-0">
              <Terrain days={week.days.map((d) => d.day)} width={terrainWidth} />
              {/* className-only column overlay: 7 flex-1 cells align to the terrain's
                  centered columns; each entry day gets a centered ≥44px hit-target. */}
              <View className="absolute inset-0 flex-row">
                {week.days.map((d, i) => (
                  <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional day slot (slot N = day N), never reordered
                    key={`${week.weekStartIso}-${i}`}
                    className="flex-1 items-center"
                  >
                    {d.entry ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={d.a11yLabel}
                        onPress={() => {
                          if (d.entry) onSelectEntry(d.entry);
                        }}
                        className="h-full w-11"
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </ScrollView>
      </Settle>
    </View>
  );
}
