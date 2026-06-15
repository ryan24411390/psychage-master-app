import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { BookmarkSaveSlot } from '@/features/bookmarks/BookmarkSaveSlot';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';
import type { ArticleListItem } from '@/lib/articles';
import { ARTICLE_AUTHOR_NAME } from '@/lib/articles';

// Editor's pick — the one featured article (real, newest published; stub ranking
// until a popularity signal exists). Art panel + Fraunces headline + summary +
// a primary CTA (haptic.affirm via Button) and an inline save. The save lives in
// the text block, not over the art, so its themed icon keeps AA contrast.

export function FeaturedCard({ article }: { article: ArticleListItem }) {
  const { fireHaptic } = useHaptics();
  const open = () => {
    fireHaptic('tab');
    router.push(`/article/${article.slug}`);
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={article.title}
        onPress={open}
        testID={`learn-featured-${article.slug}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <ArtPanel
          artKey={article.slug}
          imageUrl={article.heroImageUrl}
          className="aspect-[16/10] rounded-2xl"
          scrim
        >
          <View className="absolute left-4 top-3.5">
            <Text variant="caption" className="text-white/75">
              Psychage
            </Text>
          </View>
        </ArtPanel>
      </Pressable>

      <View className="gap-2 px-0.5 pt-3.5">
        <Text
          variant="caption"
          className="font-sans-bold uppercase tracking-[0.08em] text-teal-700 dark:text-primary-dark"
        >
          {article.categoryName}
        </Text>
        <Pressable accessibilityRole="link" accessibilityLabel={article.title} onPress={open}>
          <Text variant="headingLg">{article.title}</Text>
        </Pressable>
        {article.seoDescription ? (
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {article.seoDescription}
          </Text>
        ) : null}
        <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
          {[article.readTime ? `${article.readTime} min read` : null, ARTICLE_AUTHOR_NAME]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View className="mt-1 flex-row items-center justify-between">
          <Button size="sm" onPress={open} accessibilityLabel="Read the guide">
            Read the guide
          </Button>
          <BookmarkSaveSlot resourceType="article" resourceId={article.slug} testID="learn-featured-save" />
        </View>
      </View>
    </View>
  );
}
