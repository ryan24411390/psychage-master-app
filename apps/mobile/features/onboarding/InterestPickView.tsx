import { CONTENT_CATEGORIES } from '@psychage/shared/peaf';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { ScreenEntrance } from '@/components/ui/ScreenEntrance';
import { Text } from '@/components/ui/Text';

import { ONBOARDING_COPY } from './copy';

// Interests (P18) — first-run topic picker. Multi-select chips over the 30 reviewed
// content categories (@psychage/shared/peaf); the chosen slugs persist to
// personalization.interests and drive Learn + home recommendations. Choosing is
// optional (Skip) — anonymous-first, never walls (GlobalHeader keeps the Help-now pill
// reachable, SR-2). Mascot uses an explicit 'encouraging' pose (this route is not in
// the surface binding, so the prop carries it; /onboarding is not a forbidden route).

export interface InterestPickViewProps {
  /** Called with the chosen category slugs (empty array on Skip). */
  readonly onDone: (slugs: string[]) => void;
}

export function InterestPickView({ onDone }: InterestPickViewProps) {
  const t = ONBOARDING_COPY;
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <ScreenEntrance>
        <ScrollView
          contentContainerClassName="px-5 pb-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center pt-1 pb-3">
            <Mascot testID="onboarding-interests-mascot" state="encouraging" size={120} />
          </View>
          <Text variant="h1" className="text-center" accessibilityRole="header">
            {t.interestsTitle}
          </Text>
          <Text variant="body" className="mt-2 text-center text-text-secondary dark:text-text-secondary-dark">
            {t.interestsBody}
          </Text>

          <View className="mt-6 flex-row flex-wrap justify-center gap-2.5">
            {CONTENT_CATEGORIES.map((cat) => {
              const isOn = selected.has(cat.slug);
              return (
                <Pressable
                  key={cat.slug}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isOn }}
                  accessibilityLabel={cat.name}
                  onPress={() => toggle(cat.slug)}
                  testID={`interest-chip-${cat.slug}`}
                  className={`min-h-[44px] justify-center rounded-full border px-4 py-2 active:scale-[0.97] ${
                    isOn
                      ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                      : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                  }`}
                >
                  <Text
                    variant="label"
                    className={isOn ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScreenEntrance>

      <SafeAreaView edges={['bottom']} className="gap-3 px-5 pb-2 pt-2">
        <Button variant="primary" size="lg" className="w-full" onPress={() => onDone([...selected])}>
          {t.interestsContinue}
        </Button>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t.interestsSkip}
          onPress={() => onDone([])}
          hitSlop={8}
          className="min-h-[44px] items-center justify-center"
          haptic="tab"
        >
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.interestsSkip}
          </Text>
        </AnimatedPressable>
      </SafeAreaView>
    </View>
  );
}
