import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';

import { ArtPanel } from '@/features/learn/ArtPanel';
import { Text } from '@/components/ui/Text';
import { getFeatured, listRecentArticles } from '@/lib/articles';

// "Top reads by topic" — a horizontal scroll rail of cover cards. Real, published
// Supabase articles: the editor-featured set (closest honest analog to "top reads"),
// falling back to the most recent corpus if nothing is flagged featured. The cover is
// the article's real hero image via ArtPanel (the same renderer the Learn cards use:
// expo-image with a deterministic gradient fallback, never blank), with the category
// pill over a scrim and the read-time pill ArtPanel draws. Links to /article/[slug].
export function TopReads() {
  const { data, isLoading } = useQuery({
    queryKey: ['articles', 'featured', 6],
    queryFn: async () => {
      const featured = await getFeatured(6);
      return featured.length > 0 ? featured : listRecentArticles(6);
    },
  });
  const reads = data ?? [];
  const loading = isLoading;

  return (
    <View className="mt-2 gap-3">
      <Text
        variant="caption"
        className="ml-1 uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
      >
        Top reads by topic
      </Text>

      {loading ? (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5"
          contentContainerClassName="gap-3"
        >
          {reads.map((r) => (
            <Link key={r.slug} href={`/article/${r.slug}` as never} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${r.title}, ${r.categoryName}${r.readTime ? `, ${r.readTime} min` : ''}`}
                className="w-72 active:scale-[0.98]"
              >
                {/* Cover — the real hero image (gradient fallback when absent); the
                    category pill sits over the scrim, read-time pill drawn by ArtPanel. */}
                <ArtPanel
                  artKey={r.slug}
                  imageUrl={r.heroImageUrl}
                  readTime={r.readTime}
                  scrim
                  cover
                  className="h-28 rounded-xl"
                >
                  <View className="absolute left-2 top-2 rounded-full bg-black/40 px-2.5 py-1">
                    <Text variant="caption" className="font-sans-medium text-white">
                      {r.categoryName}
                    </Text>
                  </View>
                </ArtPanel>
                <Text
                  variant="h3"
                  className="mt-2.5 text-lg text-text-primary dark:text-text-primary-dark"
                  numberOfLines={2}
                >
                  {r.title}
                </Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
