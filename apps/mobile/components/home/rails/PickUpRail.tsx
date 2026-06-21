import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { listArticlesBySlugs } from '@/lib/articles';
import { openArticle } from '@/lib/nav';

type PickUpRailProps = {
  // `id` is the article slug; `title` is captured by the reader as it's read.
  reads: { id: string; progress: number; lastAt: number; title?: string; readTime?: number }[];
};

// "Pick up where you left off" — image-led cards (P23): each card is the article's
// cover image (ArtPanel: real hero blur-filled + uncropped, deterministic gradient
// fallback) with a large teal progress line pinned to the bottom. No text on the card
// — the title rides the accessibilityLabel only. Hero images are joined in A-side from
// the in-progress slugs (reading-progress carries no image); reads stay a prop from the
// frozen home shell.
export function PickUpRail({ reads }: PickUpRailProps) {
  // Stable key so the metadata fetch doesn't churn on every home re-render. The home
  // shell renders rails without a TanStack QueryClient, so this self-fetches (like
  // MostRead) rather than using useQuery.
  const slugKey = useMemo(() => (reads ?? []).map((r) => r.id).sort().join(','), [reads]);
  const [imageBySlug, setImageBySlug] = useState<ReadonlyMap<string, string | null>>(new Map());

  useEffect(() => {
    const ids = slugKey ? slugKey.split(',') : [];
    if (ids.length === 0) {
      setImageBySlug(new Map());
      return;
    }
    let active = true;
    listArticlesBySlugs(ids)
      .then((meta) => {
        if (!active) return;
        const m = new Map<string, string | null>();
        for (const a of meta) m.set(a.slug, a.heroImageUrl);
        setImageBySlug(m);
      })
      .catch(() => {
        // Image join failed — cards fall back to ArtPanel's gradient. Never blocks.
      });
    return () => {
      active = false;
    };
  }, [slugKey]);

  if (!reads || reads.length === 0) return null;

  return (
    <View className="mb-6 mt-2">
      <Text variant="h2" className="ml-1 mb-3">
        Pick up where you left off
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="px-5 gap-3"
      >
        {reads.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={`Continue reading: ${r.title || 'article'}`}
            onPress={() => openArticle(r.id)}
            className="h-32 w-56 active:scale-[0.98]"
          >
            <ArtPanel artKey={r.id} imageUrl={imageBySlug.get(r.id) ?? null} className="h-full w-full rounded-xl">
              {/* Large teal progress line — pinned to the bottom, no text. */}
              <View className="absolute bottom-0 left-0 right-0 h-2 bg-black/20">
                <View
                  className="h-full bg-primary dark:bg-primary-dark"
                  style={{ width: `${Math.round(r.progress * 100)}%` }}
                />
              </View>
            </ArtPanel>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
