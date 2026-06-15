import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { ArticleCard } from '@/features/learn/ArticleCard';
import { SectionHeader } from '@/features/learn/SectionHeader';
import { useBookmarks, useCurrentUserId } from '@/features/bookmarks/hooks';
import { listArticlesBySlugs } from '@/lib/articles';
import type { ArticleListItem } from '@/lib/articles';

// "Saved to read" — the signed-in user's saved articles, newest-saved first.
// Replaces the web "Continue" rail: there is no reading-progress store (local
// content persistence is the deferred §5 offline scope), so we surface the real
// saved set instead of a fabricated %-complete. Hidden when signed out or empty.

export function SavedRail() {
  const { data: userId } = useCurrentUserId();
  const { data: bookmarks } = useBookmarks();

  // Saved article slugs in newest-first order (service already sorts desc).
  const slugs = (bookmarks ?? [])
    .filter((b) => b.resource_type === 'article')
    .map((b) => b.resource_id);

  const { data: articles } = useQuery({
    queryKey: ['articles', 'saved', slugs],
    queryFn: () => listArticlesBySlugs(slugs),
    enabled: slugs.length > 0,
  });

  if (!userId || slugs.length === 0) return null;

  // Re-impose the saved order (the IN query returns arbitrary order).
  const bySlug = new Map((articles ?? []).map((a) => [a.slug, a]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter((a): a is ArticleListItem => Boolean(a));
  if (ordered.length === 0) return null;

  return (
    <View>
      <View className="px-4">
        <SectionHeader
          title="Saved to read"
          onSeeAll={() => router.push('/library')}
          seeAllLabel="View all"
        />
      </View>
      <FlashList
        horizontal
        data={ordered}
        keyExtractor={(item: ArticleListItem) => item.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4"
        ItemSeparatorComponent={() => <View className="w-3.5" />}
        renderItem={({ item }: { item: ArticleListItem }) => (
          <ArticleCard article={item} className="w-[290px]" />
        )}
      />
    </View>
  );
}
