import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';
import type { ArticleListItem } from '@/lib/articles';

// "Reads to start with" list row (LearnView only). A detailed, scannable row —
// square art thumbnail (real hero, blur-filled and uncropped via ArtPanel; token
// gradient as fallback) + a two-line Fraunces title + a "category · N min read"
// meta line, with a hairline divider between rows. Distinct from ArticleListCard
// (the image-only card used by Browse/Search). Tap → native reader (haptic.tap).
export const ReadRow = memo(function ReadRow({ article }: { article: ArticleListItem }) {
  const { fireHaptic } = useHaptics();
  const meta = [article.categoryName, article.readTime ? `${article.readTime} min read` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      accessibilityHint={article.categoryName}
      testID={`learn-read-${article.slug}`}
      onPress={() => {
        fireHaptic('tab');
        router.push(`/article/${article.slug}`);
      }}
      className="flex-row items-center gap-4 border-b border-border-hairline py-3.5 last:border-b-0"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <ArtPanel
        artKey={article.slug}
        imageUrl={article.heroImageUrl}
        className="h-16 w-16 rounded-2xl"
      />
      <View className="flex-1 gap-1">
        <Text variant="h2" numberOfLines={2} className="text-[17px] leading-[22px]">
          {article.title}
        </Text>
        {meta ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});
