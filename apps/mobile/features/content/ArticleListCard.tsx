import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { ArticleListItem } from '@/lib/articles';

// One row in the category article list. Thumbnail (hero, when present) + title +
// summary + a meta line. Tapping opens the native reader (S22). No invented art:
// a missing hero renders a neutral token-tinted placeholder, never a stand-in image.
export function ArticleListCard({ article }: { article: ArticleListItem }) {
  const meta = [article.categoryName, article.readTime ? `${article.readTime} min read` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      testID={`article-card-${article.slug}`}
      onPress={() => router.push(`/article/${article.slug}`)}
      className="flex-row gap-3 rounded-xl border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {article.heroImageUrl ? (
        <Image
          source={{ uri: article.heroImageUrl }}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          style={{ width: 56, height: 56, borderRadius: 10 }}
        />
      ) : (
        <View
          className="rounded-lg bg-surface-active dark:bg-surface-active-dark"
          style={{ width: 56, height: 56 }}
        />
      )}
      <View className="flex-1 gap-1">
        <Text variant="bodyMedium" numberOfLines={2}>
          {article.title}
        </Text>
        {article.seoDescription ? (
          <Text
            variant="bodySm"
            numberOfLines={2}
            className="text-text-secondary dark:text-text-secondary-dark"
          >
            {article.seoDescription}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
