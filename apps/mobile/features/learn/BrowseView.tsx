import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { AppLoader } from '@/components/ui/AppLoader';
import { Text } from '@/components/ui/Text';
import { ArticleListCard } from '@/features/content/ArticleListCard';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { getLearnCategory, LEARN_CATEGORIES, type LearnCategory } from '@/features/learn/categories';
import { useHaptics } from '@/lib/haptic-context';
import { listArticlesByCategorySlugs } from '@/lib/articles';
import type { ArticleListItem } from '@/lib/articles';
import { useThemeColors } from '@/lib/use-theme-colors';

// Pushed Browse — the web's hierarchical drill-down, as a native two-level view:
//   tier 1 — the curated category grid.
//   tier 2 — a category's real articles, with tag subchips + Sort/Length filters
//            applied client-side over the fetched rows (no fabricated taxonomy;
//            "Level" is dropped — the corpus carries no difficulty field).

const ALL = 'All';

export function BrowseView() {
  const [catId, setCatId] = useState<string | null>(null);
  const tc = useThemeColors();

  const category = catId ? getLearnCategory(catId) : undefined;

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center px-2 py-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (category ? setCatId(null) : router.back())}
          hitSlop={8}
          testID="browse-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={tc.inkSecondary} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {category ? 'All topics' : 'Back'}
          </Text>
        </Pressable>
      </View>

      {category ? (
        <Tier2 category={category} />
      ) : (
        <Tier1 onPick={setCatId} />
      )}
    </View>
  );
}

function Tier1({ onPick }: { onPick: (id: string) => void }) {
  const { fireHaptic } = useHaptics();
  // Two-column width from the viewport (NativeWind drops arbitrary % widths here).
  const { width } = useWindowDimensions();
  const colW = Math.floor((width - 32 - 12) / 2);
  return (
    <ScrollView contentContainerClassName="px-4 pb-12" showsVerticalScrollIndicator={false}>
      <Text variant="headingLg" className="py-3" accessibilityRole="header">
        Browse by topic
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {LEARN_CATEGORIES.map((cat) => (
          <View key={cat.id} style={{ width: colW }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              testID={`browse-cat-${cat.id}`}
              onPress={() => {
                fireHaptic('tab');
                onPick(cat.id);
              }}
              className="flex-row items-center gap-3 rounded-xl border border-border p-3 dark:border-border-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <ArtPanel artKey={cat.id} className="h-11 w-11 rounded-lg" />
              <View className="flex-1">
                <Text variant="bodyMedium">{cat.label}</Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

type SortKey = 'Newest' | 'Longest';
type LengthKey = 'Any' | 'Under 5 min' | 'In-depth';

function Tier2({ category }: { category: LearnCategory }) {
  const [sub, setSub] = useState(ALL);
  const [sort, setSort] = useState<SortKey>('Newest');
  const [length, setLength] = useState<LengthKey>('Any');

  const { data, isLoading } = useQuery({
    queryKey: ['articles', 'category', category.id],
    queryFn: () => listArticlesByCategorySlugs(category.slugs),
    enabled: category.slugs.length > 0,
  });
  const articles = useMemo(() => data ?? [], [data]);

  // Subchips = the distinct tags actually present in this category's rows (capped).
  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const a of articles) for (const tag of a.tags) seen.add(tag);
    return [ALL, ...Array.from(seen).slice(0, 10)];
  }, [articles]);

  const list = useMemo(() => {
    let out = articles.slice();
    if (sub !== ALL) out = out.filter((a) => a.tags.includes(sub));
    if (length === 'Under 5 min') out = out.filter((a) => (a.readTime ?? 0) > 0 && (a.readTime ?? 0) < 5);
    if (length === 'In-depth') out = out.filter((a) => (a.readTime ?? 0) >= 7);
    out.sort((a, b) =>
      sort === 'Newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : (b.readTime ?? 0) - (a.readTime ?? 0),
    );
    return out;
  }, [articles, sub, length, sort]);

  return (
    <FlashList
      data={list}
      keyExtractor={(item: ArticleListItem) => item.slug}
      contentContainerClassName="px-4 pb-12"
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <View>
          <View className="flex-row items-baseline gap-2 py-3">
            <Text variant="headingLg" accessibilityRole="header">
              {category.label}
            </Text>
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {`${articles.length} guides`}
            </Text>
          </View>

          {tags.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pb-3"
            >
              {tags.map((s) => (
                <Chip key={s} label={s} active={s === sub} onPress={() => setSub(s)} />
              ))}
            </ScrollView>
          ) : null}

          <View className="mb-3 flex-row flex-wrap items-center gap-2 border-t border-border pt-3 dark:border-border-dark">
            <Filter label="Newest" active={sort === 'Newest'} onPress={() => setSort('Newest')} />
            <Filter label="Longest" active={sort === 'Longest'} onPress={() => setSort('Longest')} />
            <View className="w-2" />
            <Filter label="Any" active={length === 'Any'} onPress={() => setLength('Any')} />
            <Filter label="Under 5 min" active={length === 'Under 5 min'} onPress={() => setLength('Under 5 min')} />
            <Filter label="In-depth" active={length === 'In-depth'} onPress={() => setLength('In-depth')} />
          </View>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <View className="items-center py-12">
            <AppLoader />
          </View>
        ) : (
          <Text
            variant="body"
            className="px-1 py-8 text-center text-text-secondary dark:text-text-secondary-dark"
          >
            No guides match these filters.
          </Text>
        )
      }
      renderItem={({ item }: { item: ArticleListItem }) => <ArticleListCard article={item} />}
    />
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-[36px] justify-center rounded-lg border px-4 ${
        active
          ? 'border-charcoal-900 bg-charcoal-900 dark:border-text-primary-dark dark:bg-text-primary-dark'
          : 'border-border dark:border-border-dark'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text
        variant="bodySm"
        className={`font-sans-medium ${active ? 'text-white dark:text-charcoal-950' : 'text-text-secondary dark:text-text-secondary-dark'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Filter({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-[36px] justify-center rounded-lg border px-3 ${
        active ? 'border-primary bg-teal-50 dark:border-primary-dark dark:bg-transparent' : 'border-border dark:border-border-dark'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text
        variant="caption"
        className={`font-sans-medium ${active ? 'text-teal-700 dark:text-primary-dark' : 'text-text-tertiary dark:text-text-tertiary-dark'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
