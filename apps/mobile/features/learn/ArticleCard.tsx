import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';
import type { ArticleListItem } from '@/lib/articles';

// The content card used inside a topic rail. Art panel on top (real hero or
// token gradient), then a Fraunces title, a two-line summary, and a meta line.
// Tap → native reader (haptic.tap on navigation, DESIGN.mobile.md §3.3).

type ArticleCardProps = {
  article: ArticleListItem;
  /** Width class for the rail (e.g. "w-[300px]"). */
  className?: string;
};

export function ArticleCard({ article, className }: ArticleCardProps) {
  const { fireHaptic } = useHaptics();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      accessibilityHint={article.categoryName}
      testID={`learn-article-card-${article.slug}`}
      onPress={() => {
        fireHaptic('tab');
        router.push(`/article/${article.slug}`);
      }}
      className={['active:opacity-90', className].filter(Boolean).join(' ')}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <ArtPanel artKey={article.slug} imageUrl={article.heroImageUrl} className="aspect-[16/10] rounded-xl" />
      <View className="gap-1.5 px-0.5 pt-3">
        <Text
          variant="caption"
          className="font-sans-bold uppercase tracking-[0.08em] text-teal-700 dark:text-primary-dark"
        >
          {article.categoryName}
        </Text>
        <Text variant="heading" numberOfLines={2} className="text-[17px] leading-[21px]">
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
        {article.readTime ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {`${article.readTime} min read`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
