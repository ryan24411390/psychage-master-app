import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';
import type { ArticleListItem } from '@/lib/articles';

// "Most read this month" — a numbered list. STUB RANKING: rows are real
// published articles ordered by recency (no view-count signal exists yet); the
// big Fraunces ordinal is presentational, not a real popularity rank. Rows are
// never fabricated. A short list (≤5), so a plain map — no FlashList needed.

export function MostReadList({ articles }: { articles: readonly ArticleListItem[] }) {
  const { fireHaptic } = useHaptics();
  if (articles.length === 0) return null;

  return (
    <View>
      {articles.map((article, i) => (
        <Pressable
          key={article.slug}
          accessibilityRole="button"
          accessibilityLabel={`${i + 1}. ${article.title}`}
          accessibilityHint={article.categoryName}
          testID={`learn-mostread-${article.slug}`}
          onPress={() => {
            fireHaptic('tab');
            router.push(`/article/${article.slug}`);
          }}
          className="flex-row items-center gap-4 border-b border-border py-3.5 dark:border-border-dark"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text variant="heading" className="w-9 text-text-tertiary dark:text-text-tertiary-dark">
            {String(i + 1).padStart(2, '0')}
          </Text>
          <View className="flex-1 gap-1">
            <Text variant="bodyMedium" numberOfLines={1} ellipsizeMode="tail">
              {article.title}
            </Text>
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {[article.categoryName, article.readTime ? `${article.readTime} min` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
