import { ScrollView, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

import { CT4_RELATIONSHIP } from '../copy';

// Landing screen (S-relationship-1). Leads with the with-partner vs
// without-partner choice (the first decision branches the flow), then surfaces
// past reflections, what to expect, and the on-device + non-diagnostic
// disclaimer.

export interface LandingViewProps {
  readonly onStart: (skipPartner: boolean) => void;
  readonly onViewHistory: () => void;
  readonly historyCount: number;
}

export function LandingView({ onStart, onViewHistory, historyCount }: LandingViewProps) {
  const t = CT4_RELATIONSHIP.landing;
  const reduced = useReducedMotion();
  const enter = reduced ? undefined : FadeInUp.duration(DURATION.base).easing(easingFn('standard'));

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="gap-6 pb-12 pt-2"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={enter} className="gap-2 pt-2">
        <Text variant="h1" className="text-[28px] leading-9" accessibilityRole="header">
          {t.heading}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark leading-6">
          {t.intro}
        </Text>
      </Animated.View>

      {/* Choose path — the first decision, leads the screen and branches the flow */}
      <View className="gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 dark:border-primary-dark/30">
        <Text variant="label" accessibilityRole="header">
          {t.chooseHeading}
        </Text>
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {t.chooseSub}
        </Text>
        <View className="gap-2.5 pt-1">
          <Button variant="primary" onPress={() => onStart(false)} className="w-full">
            {`${t.withPartner.title}  ·  ${t.withPartner.sub}`}
          </Button>
          <Button variant="secondary" onPress={() => onStart(true)} className="w-full">
            {`${t.withoutPartner.title}  ·  ${t.withoutPartner.sub}`}
          </Button>
        </View>
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark leading-5">
          {t.timeNote}
        </Text>
      </View>

      {historyCount > 0 ? (
        <Button variant="ghost" onPress={onViewHistory} className="self-center">
          {`${t.viewHistory} (${historyCount})`}
        </Button>
      ) : null}

      {/* What to expect */}
      <View className="gap-3">
        {t.info.map((card) => (
          <Card key={card.title}>
            <Text variant="bodyLarge" className="mb-1">
              {card.title}
            </Text>
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark leading-5">
              {card.body}
            </Text>
          </Card>
        ))}
      </View>

      {/* Disclaimer */}
      <Card>
        <Text variant="caption" className="mb-2 font-sans-medium">
          {t.disclaimerHeading}
        </Text>
        <View className="gap-1.5">
          {t.disclaimer.map((line) => (
            <View key={line} className="flex-row gap-2">
              <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                •
              </Text>
              <Text variant="caption" className="flex-1 text-text-tertiary dark:text-text-tertiary-dark leading-5">
                {line}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
