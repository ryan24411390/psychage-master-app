import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { ArtPanel } from '@/features/learn/ArtPanel';
import { Text } from '@/components/ui/Text';
import { type ArticleListItem, listArticlesBySlugs } from '@/lib/articles';

type PickUpRailProps = {
  reads: { id: string; progress: number; lastAt: number }[];
};

// "Pick up where you left off" — driven by real reading progress (reading-progress
// store, keyed by article slug, populated as the real ArticleReader is scrolled).
// Each card is the article's real hero image via ArtPanel (gradient fallback, never
// blank) with a scrim so the white title + progress read over it. Resolves from the
// live article repo; opens the real reader at /article/[slug]. Hidden when empty.
export function PickUpRail({ reads }: PickUpRailProps) {
  const slugs = reads.map((r) => r.id);
  const { data } = useQuery({
    queryKey: ['articles', 'bySlugs', slugs],
    queryFn: () => listArticlesBySlugs(slugs),
    enabled: slugs.length > 0,
  });
  const bySlug = new Map<string, ArticleListItem>((data ?? []).map((a) => [a.slug, a]));

  if (!reads || reads.length === 0) return null;

  return (
    <View className="mb-6 mt-2">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider ml-1 mb-3">
        Pick up where you left off
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5" contentContainerClassName="gap-3">
        {reads.map((r) => {
          const art = bySlug.get(r.id);
          const title = art?.title ?? 'Article';
          return (
            <Link key={r.id} href={`/article/${r.id}` as never} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={title}
                className="w-56 h-32 rounded-xl overflow-hidden shadow-sm border border-border/40 dark:border-border-dark/40 active:scale-[0.98]"
              >
                {/* Real hero cover (gradient fallback) + scrim for legible overlay */}
                <ArtPanel artKey={r.id} imageUrl={art?.heroImageUrl} scrim cover className="absolute inset-0" />
                <View className="flex-1 p-4 justify-end gap-2">
                  <Text variant="h5" className="text-white" numberOfLines={2}>
                    {title}
                  </Text>
                  <View className="h-1 bg-white/30 rounded-full overflow-hidden w-full">
                    <View className="h-full bg-white rounded-full" style={{ width: `${r.progress * 100}%` }} />
                  </View>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}
