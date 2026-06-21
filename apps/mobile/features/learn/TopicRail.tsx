import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { ArticleCard } from '@/features/learn/ArticleCard';
import type { LearnCategory } from '@/features/learn/categories';
import { SectionHeader } from '@/features/learn/SectionHeader';
import { listArticlesByCategorySlugs } from '@/lib/articles';
import type { ArticleListItem } from '@/lib/articles';

// A topic's article rail: SectionHeader + a horizontal FlashList of ArticleCards.
// Shares CategoryArticlesView's query key (['articles','category',id]) so the
// pushed "See all" list opens against a warm cache. Hidden entirely when the
// category has no published articles — no empty rail, no fabricated rows.

// category has no published articles — no empty rail, no fabricated rows.

type TopicRailProps = { category: LearnCategory };

export function TopicRail({ category }: TopicRailProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(290, width * 0.85);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', 'category', category.id],
    queryFn: () => listArticlesByCategorySlugs(category.slugs),
    enabled: category.slugs.length > 0,
  });

  const articles = data ?? [];

  // Resolved-and-empty → render nothing (header included). Only real content shows.
  if (!isLoading && articles.length === 0) return null;

  return (
    <View>
      <View className="px-4">
        <SectionHeader
          title={category.label}
          count={articles.length ? `${articles.length} guides` : undefined}
          onSeeAll={() => router.push(`/learn/${category.id}`)}
        />
      </View>

      {isLoading ? (
        <View className="flex-row gap-3.5 px-4">
          {[0, 1].map((i) => (
            <View key={i} style={{ width: cardWidth }}>
              <View className="aspect-[16/10] rounded-xl bg-surface-active dark:bg-surface-active-dark" />
              <View className="mt-3 h-3 w-2/3 rounded-full bg-surface-active dark:bg-surface-active-dark" />
              <View className="mt-2 h-3 w-full rounded-full bg-surface-active dark:bg-surface-active-dark" />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          horizontal
          data={articles}
          keyExtractor={(item: ArticleListItem) => item.slug}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4"
          ItemSeparatorComponent={() => <View className="w-3.5" />}
          renderItem={({ item }: { item: ArticleListItem }) => (
            <View style={{ width: cardWidth }}>
              <ArticleCard article={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}
