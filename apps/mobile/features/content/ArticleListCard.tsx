import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import type { ArticleListItem } from '@/lib/articles';

// One article card in a category/search list — a single unified card where the
// image and its information belong together: a 16:9 hero (blur-filled, uncropped
// via ArtPanel; token gradient as fallback) with an integrated rectangular info
// container of the SAME width carrying the title, a rectangular sub-topic tag,
// and the read time. No pills. Tapping opens the native reader (S22). memo'd —
// FlashList re-renders rows on scroll.
export const ArticleListCard = memo(function ArticleListCard({ article }: { article: ArticleListItem }) {
  const subTopic = article.tags[0] ?? article.categoryName;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      testID={`article-card-${article.slug}`}
      onPress={() => router.push(`/article/${article.slug}`)}
      className="overflow-hidden rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <ArtPanel artKey={article.slug} imageUrl={article.heroImageUrl} className="aspect-[16/9] w-full" />
      <View className="gap-2 border-t border-border px-4 py-3 dark:border-border-dark">
        <Text variant="heading" numberOfLines={2} className="text-[17px] leading-[22px]">
          {article.title}
        </Text>
        <View className="flex-row items-center gap-2">
          {subTopic ? (
            <View className="rounded-md bg-surface-active px-2 py-0.5 dark:bg-surface-active-dark">
              <Text
                variant="caption"
                numberOfLines={1}
                className="font-sans-medium text-text-secondary dark:text-text-secondary-dark"
              >
                {subTopic}
              </Text>
            </View>
          ) : null}
          {article.readTime ? (
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {`${article.readTime} min read`}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
