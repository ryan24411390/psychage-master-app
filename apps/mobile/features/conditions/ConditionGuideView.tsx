import { router } from 'expo-router';
import { ChevronLeft, ExternalLink, LifeBuoy } from 'lucide-react-native';
import { Linking, ScrollView, View } from 'react-native';

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
// Conditions accordion). Mirrors the web condition detail page in content + order:
// header badges (ICD-11 code + family) → crisis banner (when flagged) → the four
// reviewed definition sections (each shows an in-review note when null, not hidden)
// → the "In depth" titled layer → Sources (outbound links) → provenance → related
// articles (top 6 + "See all"). All text is VERBATIM from the verified DB row —
// never authored here. Pushed route: GlobalHeader (Help-now, SR-2) + back row. Not
// a diagnostic flow (SR-3). (Web-only taxonomy_group / related_category pills are
// omitted — those columns don't exist in this DB.)

const RELATED_PREVIEW = 6;

type Section = { label: string; value: string | null };

export function ConditionGuideView({ slug }: { slug: string }) {
  const t = CONDITIONS_COPY;
  const tc = useThemeColors();
  const { data: condition, isLoading } = useConditionGuide(slug);
  const { data: related } = useConditionArticles(condition?.id);
  const relatedCount = related?.length ?? 0;

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
        <ScrollView contentContainerClassName="gap-5 px-5 pb-12" showsVerticalScrollIndicator={false}>
          <ScreenEntrance>
            {/* Header — ICD-11 code pill + family label */}
            <View className="flex-row flex-wrap items-center gap-2">
              {condition.icd11Code ? (
                <View className="rounded-md bg-teal-50 px-2.5 py-1 dark:bg-teal-900">
                  <Text variant="caption" className="font-sans-bold text-teal-700 dark:text-teal-100">
                    {condition.icd11Code}
                  </Text>
                </View>
              ) : null}
              {condition.family ? (
                <Text
                  variant="caption"
                  className="font-sans-medium uppercase tracking-[1px] text-teal-700 dark:text-primary-dark"
                >
                  {condition.family}
                </Text>
              ) : null}
            </View>
            <Text variant="h1" className="pt-2">
              {condition.name}
            </Text>

            {condition.crisisFlag ? (
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={t.guideCrisis}
                onPress={() => router.push('/crisis')}
                testID="condition-guide-crisis"
                className="mt-3 flex-row items-center gap-2.5 rounded-xl border border-border-accent bg-surface-accent px-4 py-3 dark:border-border-accent-dark dark:bg-surface-accent-dark"
                haptic="tab"
              >
                <LifeBuoy size={18} color={tc.primary} strokeWidth={2} />
                <Text variant="caption" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
                  {t.guideCrisis}
                </Text>
              </AnimatedPressable>
            ) : null}

            {/* Definition — four core fields, in-review note when null (web parity). */}
            {sections(condition, t).map((s) => (
              <View key={s.label} className="gap-2 pt-2">
                <Text variant="h3" className="text-[18px] leading-[22px]">
                  {s.label}
                </Text>
                {s.value?.trim() ? (
                  <Text variant="bodyLarge" className="leading-[26px] text-text-secondary dark:text-text-secondary-dark">
                    {s.value}
                  </Text>
                ) : (
                  <Text variant="body" className="italic text-text-tertiary dark:text-text-tertiary-dark">
                    {t.guideInReview}
                  </Text>
                )}
              </View>
            ))}

            {/* In depth — titled deeper sections */}
            {condition.deepSections.length > 0 ? (
              <View className="mt-2 gap-5 border-t border-border pt-6 dark:border-border-dark">
                <View className="gap-1">
                  <Text
                    variant="caption"
                    className="font-sans-bold uppercase tracking-[2px] text-teal-700 dark:text-primary-dark"
                  >
                    {t.guideDepthOverline}
                  </Text>
                  <Text variant="h2">{`${t.guideDepthHeading} ${condition.name}`}</Text>
                </View>
                {condition.deepSections.map((sec) => (
                  <View key={sec.heading} className="gap-2">
                    <Text variant="h3" className="text-[18px] leading-[22px]">
                      {sec.heading}
                    </Text>
                    {paragraphs(sec.body).map((para, i) => (
                      <Text
                        // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are positional, stable per render
                        key={i}
                        variant="bodyLarge"
                        className="leading-[26px] text-text-secondary dark:text-text-secondary-dark"
                      >
                        {para}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Sources — outbound references */}
            {condition.sources.length > 0 ? (
              <View className="mt-2 gap-3 border-t border-border pt-6 dark:border-border-dark">
                <Text variant="h3" className="text-[18px] leading-[22px]">
                  {t.guideSources}
                </Text>
                {condition.sources.map((src) => (
                  <AnimatedPressable
                    key={src.url}
                    accessibilityRole="link"
                    accessibilityLabel={src.label}
                    onPress={() => void Linking.openURL(src.url)}
                    testID={`condition-source-${src.url}`}
                    className="min-h-[44px] flex-row items-start gap-1.5"
                    haptic="tab"
                  >
                    <Text variant="caption" className="flex-1 text-text-secondary underline dark:text-text-secondary-dark">
                      {src.label}
                    </Text>
                    <ExternalLink size={13} color={tc.inkTertiary} strokeWidth={2} />
                  </AnimatedPressable>
                ))}
              </View>
            ) : null}

            {/* Provenance */}
            {condition.provenance ? (
              <Text variant="caption" className="pt-2 text-text-tertiary dark:text-text-tertiary-dark">
                {`${t.guideClassification}: ${condition.provenance}`}
              </Text>
            ) : null}

            {/* Related articles — top 6 + "See all" (the clinical condition↔article join). */}
            {relatedCount > 0 ? (
              <View className="mt-2 gap-3 border-t border-border pt-6 dark:border-border-dark" testID="condition-guide-related">
                <Text variant="h3" className="text-[18px] leading-[22px]">
                  {t.guideRelated}
                </Text>
                {(related ?? []).slice(0, RELATED_PREVIEW).map((article) => (
                  <ArticleListCard key={article.slug} article={article} />
                ))}
                {relatedCount > RELATED_PREVIEW ? (
                  <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t.guideSeeAll} ${relatedCount}`}
                    onPress={() => router.push(`/conditions/${slug}/articles`)}
                    testID="condition-guide-see-all"
                    className="min-h-[44px] justify-center"
                    haptic="tab"
                  >
                    <Text variant="bodyLarge" className="text-teal-700 dark:text-primary-dark">
                      {`${t.guideSeeAll} ${relatedCount} articles`}
                    </Text>
                  </AnimatedPressable>
                ) : null}
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
    { label: t.guideInShort, value: c.shortDefinition },
    { label: t.guideFeelsLike, value: c.whatItFeelsLike },
    { label: t.guideDiffers, value: c.howItDiffers },
    { label: t.guideEveryday, value: c.whenMoreThanEveryday },
  ];
}

/** Blank-line-separated paragraphs (mirrors the web's toParagraphs). */
function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
