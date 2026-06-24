import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { SectionHeader } from '@/features/learn/SectionHeader';
import { resolveInterest } from '@/lib/discovery/signal-map';
import type { ArticleRef, CategoryRef } from '@/lib/discovery/types';
import { openArticle } from '@/lib/nav';
import { storage } from '@/lib/adapters/storage';
import { loadPersonalization } from '@/lib/persistence/personalization';

// Home interest rails — the user's stored interests, surfaced as category rails.
// For the top 1–2 interest slugs (the on-device personalization `interests`, read
// once on mount, never written and never sent anywhere), each rail resolves through
// `resolveInterest` — the ONE signal→content resolver (wayfinding only: no diagnosis,
// no score, no symptom data, no telemetry). A rail is the curated "{Category} ·
// N guides · See all →" layout (shared SectionHeader) over a horizontal strip of
// poster cards; "See all" opens the category, each card opens its article.
//
// Posters are ArtPanel's deterministic teal/charcoal gradient until the article
// imagery slice lands (resolveInterest returns wayfinding refs, not hero images) —
// the card body is the swap seam. When the user has set no interests this renders
// nothing; the recency MostRead rail below is the de-facto fallback (no empty state).
//
// Self-fetches (the frozen home shell mounts rails without a TanStack QueryClient),
// mirroring MostRead/PickUpRail. Returns a Fragment so each rail is a direct child of
// the shell's gap-spaced column and a resolved-empty rail contributes no phantom gap.

const MAX_RAILS = 2;

export function InterestRails() {
  const interests = useMemo(() => loadPersonalization(storage).interests, []);
  const top = interests.slice(0, MAX_RAILS);
  if (top.length === 0) return null;

  return (
    <>
      {top.map((slug) => (
        <CategoryRail key={slug} slug={slug} />
      ))}
    </>
  );
}

type Resolved = { category: CategoryRef; articles: ArticleRef[] };

function CategoryRail({ slug }: { slug: string }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(264, width * 0.72);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    resolveInterest(slug)
      .then((r) => {
        if (!active) return;
        const category = r.categories[0];
        setResolved(category ? { category, articles: r.articles } : null);
        setLoading(false);
      })
      .catch(() => {
        // Resolve failed — degrade to an absent rail, never a dangling header.
        if (active) {
          setResolved(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // Render nothing until we have a resolved category (the header title comes from
  // the resolver), and nothing when it resolves empty — no empty rail, no fabricated
  // rows. A brief absence below the fold beats an empty-titled header.
  if (loading || !resolved || resolved.articles.length === 0) return null;

  const { category, articles } = resolved;

  return (
    <View>
      <View className="px-1">
        <SectionHeader
          title={category.title}
          count={`${articles.length} guides`}
          onSeeAll={() => router.push(category.href)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="px-5 gap-3.5"
      >
        {articles.map((a) => (
          <Pressable
            key={a.slug}
            accessibilityRole="button"
            accessibilityLabel={a.title}
            onPress={() => openArticle(a.slug)}
            style={{ width: cardWidth }}
            className="active:opacity-90"
          >
            <ArtPanel
              artKey={a.slug}
              scrim
              className="aspect-[16/10] w-full rounded-2xl border border-border dark:border-border-dark"
            >
              {/* Title rides over the scrim — the swap seam for real poster imagery. */}
              <View className="absolute bottom-0 left-0 right-0 p-3">
                <Text variant="label" numberOfLines={2} className="font-sans-medium text-white">
                  {a.title}
                </Text>
              </View>
            </ArtPanel>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
