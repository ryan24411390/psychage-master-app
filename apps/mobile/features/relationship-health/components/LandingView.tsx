import { ScrollView, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

import { CT4_RELATIONSHIP } from '../copy';
import { DOMAIN_META, type RelationshipDomain } from '../types';

// Landing screen (S-relationship-1). Sets context, lets the user choose the
// with-partner vs without-partner path, surfaces past reflections, and carries
// the on-device + non-diagnostic disclaimer.

export interface LandingViewProps {
  readonly onStart: (skipPartner: boolean) => void;
  readonly onViewHistory: () => void;
  readonly historyCount: number;
}

const PREVIEW_ORDER: RelationshipDomain[] = ['partner', 'family', 'friends', 'community'];

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
        <Text variant="h2" className="text-[28px] leading-9" accessibilityRole="header">
          {t.heading}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark leading-6">
          {t.intro}
        </Text>
      </Animated.View>

      {/* Info cards */}
      <View className="gap-3">
        {t.info.map((card) => (
          <Card key={card.title}>
            <Text variant="h6" className="mb-1">
              {card.title}
            </Text>
            <Text variant="bodySmall" className="text-text-tertiary dark:text-text-tertiary-dark leading-5">
              {card.body}
            </Text>
          </Card>
        ))}
      </View>

      {/* Domain preview */}
      <View className="gap-3">
        <Text
          variant="caption"
          className="uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark font-sans-medium"
        >
          {t.domainsHeading}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PREVIEW_ORDER.map((d) => (
            <View
              key={d}
              className="rounded-lg border border-border bg-surface px-3 py-2 dark:border-border-dark dark:bg-surface-dark"
            >
              <Text variant="bodySmall" className="font-sans-medium">
                {DOMAIN_META[d].shortName}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Choose path */}
      <View className="gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 dark:border-primary-dark/30">
        <Text variant="h5" accessibilityRole="header">
          {t.chooseHeading}
        </Text>
        <Text variant="bodySmall" className="text-text-secondary dark:text-text-secondary-dark">
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
      </View>

      {historyCount > 0 ? (
        <Button variant="ghost" onPress={onViewHistory} className="self-center">
          {`${t.viewHistory} (${historyCount})`}
        </Button>
      ) : null}

      {/* Disclaimer */}
      <Card>
        <Text variant="bodySmall" className="mb-2 font-sans-medium">
          {t.disclaimerHeading}
        </Text>
        <View className="gap-1.5">
          {t.disclaimer.map((line) => (
            <View key={line} className="flex-row gap-2">
              <Text variant="bodySmall" className="text-text-tertiary dark:text-text-tertiary-dark">
                •
              </Text>
              <Text variant="bodySmall" className="flex-1 text-text-tertiary dark:text-text-tertiary-dark leading-5">
                {line}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
