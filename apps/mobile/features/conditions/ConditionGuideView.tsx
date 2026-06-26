import { router } from 'expo-router';
import { ChevronLeft, LifeBuoy } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppLoader } from '@/components/ui/AppLoader';
import { ScreenEntrance } from '@/components/ui/ScreenEntrance';
import { Text } from '@/components/ui/Text';
import { ArticleListCard } from '@/features/content/ArticleListCard';
import { CONDITIONS_COPY } from '@/features/conditions/copy';
import { useConditionArticles, useConditionGuide } from '@/lib/conditions/hooks';
import type { ConditionDetailRef } from '@/lib/conditions/types';
import { colors } from '@/lib/colors';
import { useThemeColors } from '@/lib/use-theme-colors';

// Condition guide — a `conditions_reference` ICD-11 condition (reached from the
// Conditions accordion). Pushed route → GlobalHeader (Help-now, SR-2) + back row.
// Shows the reviewed name + ICD-11 code/family, an optional crisis banner (when the
// row's crisis_flag is set), the four reviewed definition sections (each rendered
// only when present — body text VERBATIM from the verified DB, never authored
// here), and the articles linked to this condition. Not a diagnostic flow (SR-3).

type Section = { label: string; body: string | null };

export function ConditionGuideView({ slug }: { slug: string }) {
  const t = CONDITIONS_COPY;
  const tc = useThemeColors();
  const { data: condition, isLoading } = useConditionGuide(slug);
  const { data: related } = useConditionArticles(condition?.id);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center px-2">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="condition-guide-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
          haptic="tab"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </AnimatedPressable>
      </View>

      {condition == null ? (
        isLoading ? (
          <View className="px-5 pt-10">
            <AppLoader label="Loading guide" />
          </View>
        ) : (
          <View className="px-5 pt-4" testID="condition-guide-not-found">
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {t.notFound}
            </Text>
          </View>
        )
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-5 pb-12" showsVerticalScrollIndicator={false}>
          <ScreenEntrance>
            <Text variant="h1">{condition.name}</Text>
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {[condition.icd11Code, condition.family].filter(Boolean).join('  ·  ')}
            </Text>

            {condition.crisisFlag ? (
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={t.guideCrisis}
                onPress={() => router.push('/crisis')}
                testID="condition-guide-crisis"
                className="mt-2 flex-row items-center gap-2.5 rounded-xl border border-border-accent bg-surface-accent px-4 py-3 dark:border-border-accent-dark dark:bg-surface-accent-dark"
                haptic="tab"
              >
                <LifeBuoy size={18} color={tc.primary} strokeWidth={2} />
                <Text variant="caption" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
                  {t.guideCrisis}
                </Text>
              </AnimatedPressable>
            ) : null}

            {sections(condition, t).map((s) =>
              s.body ? (
                <View key={s.label} className="gap-1 pt-1">
                  <Text variant="bodyLarge">{s.label}</Text>
                  <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
                    {s.body}
                  </Text>
                </View>
              ) : null,
            )}

            {related && related.length > 0 ? (
              <View className="gap-3 pt-2" testID="condition-guide-related">
                <Text variant="bodyLarge">{t.guideRelated}</Text>
                {related.map((article) => (
                  <ArticleListCard key={article.slug} article={article} />
                ))}
              </View>
            ) : null}

            <Text variant="caption" className="px-1 pt-2">
              {t.disclaimer}
            </Text>
          </ScreenEntrance>
        </ScrollView>
      )}
    </View>
  );
}

function sections(c: ConditionDetailRef, t: typeof CONDITIONS_COPY): Section[] {
  return [
    { label: t.guideInShort, body: c.shortDefinition },
    { label: t.guideFeelsLike, body: c.whatItFeelsLike },
    { label: t.guideDiffers, body: c.howItDiffers },
    { label: t.guideEveryday, body: c.whenMoreThanEveryday },
  ];
}
