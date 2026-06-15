import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable } from 'react-native';

import { ArtPanel } from '@/features/learn/ArtPanel';
import type { ArticleListItem } from '@/lib/articles';

// One row in the category/search article list — image-only: a full-width 16:9
// hero card (real image, blur-filled and uncropped via ArtPanel; token gradient
// as fallback), styled with the mobile card grammar (rounded + border + light
// shadow). No title or meta text; the article is announced via accessibilityLabel.
// Tapping opens the native reader (S22). memo'd — FlashList re-renders rows on scroll.
export const ArticleListCard = memo(function ArticleListCard({ article }: { article: ArticleListItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      testID={`article-card-${article.slug}`}
      onPress={() => router.push(`/article/${article.slug}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <ArtPanel
        artKey={article.slug}
        imageUrl={article.heroImageUrl}
        className="aspect-[16/9] rounded-2xl border border-border shadow-sm dark:border-border-dark dark:shadow-none"
      />
    </Pressable>
  );
});
