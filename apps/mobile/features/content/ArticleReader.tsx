import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Text } from '@/components/ui/Text';
import { CT4_CONTENT } from '@/features/content/copy';
import { getCt1Article } from '@/features/content/fixtures/ct1-articles';
import { ReviewedByCredit } from '@/features/content/ReviewedByCredit';
import { colors } from '@/lib/colors';

// S22 Article reader — NATIVE chrome. This is a pushed route (outside the tabs), so
// it renders the GlobalHeader itself (carrying the Help-now pill) plus a native
// back row. Article CONTENT is a CT1 fixture rendered as plain paragraphs (PEAF
// block renderers are out of B2 scope). The Dr. Dobson credit is verbatim via
// ReviewedByCredit. A read article shows the pressed "You read this on {day}" mark.
export function ArticleReader({ slug }: { slug: string }) {
  const t = CT4_CONTENT;
  const article = getCt1Article(slug);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="article-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-3 px-5 pb-12" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <Text
            variant="caption"
            className="rounded-full bg-surface-active px-2 py-0.5 text-text-secondary dark:bg-surface-active-dark dark:text-text-secondary-dark"
          >
            {article.tag}
          </Text>
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {article.meta}
          </Text>
        </View>

        <Text variant="headingLg">{article.title}</Text>
        <ReviewedByCredit />

        {article.read && article.readWeekday ? (
          <View
            className="self-start rounded-lg bg-surface-active px-3 py-1.5 dark:bg-surface-active-dark"
            testID="article-read-badge"
          >
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              {t.readOn(article.readWeekday)}
            </Text>
          </View>
        ) : null}

        {article.body.map((para) => (
          <Text key={para} variant="body">
            {para}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
