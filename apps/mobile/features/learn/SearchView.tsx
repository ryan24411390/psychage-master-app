import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { AppLoader } from '@/components/ui/AppLoader';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { ArticleListCard } from '@/features/content/ArticleListCard';
import { CT4_LEARN } from '@/features/learn/copy';
import { CategoryRow, ConditionRow } from '@/features/learn/SearchResultRows';
import { SectionHeader } from '@/features/learn/SectionHeader';
import {
  buildSearchRows,
  chipQuery,
  isEmptySections,
  type SearchRow,
  type SearchSections,
} from '@/features/learn/search-rows';
import { MASCOT_CONTEXTUAL } from '@/features/mascot';
import { listPopulatedCategories, searchArticles } from '@/lib/articles';
import { resolveQuery } from '@/lib/discovery/signal-map';
import { useThemeColors } from '@/lib/use-theme-colors';

// Pushed search screen. A real input here (the Learn hero only routes in). The
// term is debounced (250ms) and only queried at ≥2 chars. A query resolves to
// THREE kinds of target in priority order — categories, then conditions, then
// articles — via the discovery resolver (lib/discovery, the one blessed
// signal→content mapping) for categories/conditions, plus a cap-lifted article
// search. Empty/idle/loading/error states report honestly — never fabricated.

// Article cap — lifts the legacy 40-row ceiling. The corpus is small enough that
// one high-cap page shows everything that matches without pagination; FlashList
// virtualises. Categories/conditions are bounded by the taxonomy + KB, so only
// the article section needs a raised limit.
const ARTICLE_LIMIT = 100;

// Idle-state topic chips, trimmed so the launchpad stays a launchpad, not a wall.
const MAX_CHIPS = 10;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function renderSearchRow({ item }: { item: SearchRow }) {
  switch (item.kind) {
    case 'header':
      return (
        <View className="mb-1 mt-5">
          <SectionHeader title={item.title} overline />
        </View>
      );
    case 'category':
      return <CategoryRow refItem={item.ref} />;
    case 'condition':
      return <ConditionRow refItem={item.ref} />;
    case 'article':
      return (
        <View className="pb-3">
          <ArticleListCard article={item.item} />
        </View>
      );
    default:
      return null;
  }
}

export function SearchView() {
  const tc = useThemeColors();
  const t = CT4_LEARN;
  const [raw, setRaw] = useState('');
  const query = useDebounced(raw.trim(), 250);
  const active = query.length >= 2;

  // Resolver supplies the wayfinding mapping (categories + conditions). Its own
  // compact-rail article slice is intentionally ignored — the displayed articles
  // come from the cap-lifted search below, not the resolver's MAX_ARTICLE_REFS.
  const resolved = useQuery({
    queryKey: ['discovery', 'resolve', query],
    queryFn: () => resolveQuery(query),
    enabled: active,
  });
  const articles = useQuery({
    queryKey: ['articles', 'search', query, ARTICLE_LIMIT],
    queryFn: () => searchArticles(query, ARTICLE_LIMIT),
    enabled: active,
  });
  // Idle launchpad — the live populated-category set (same source the resolver
  // matches against), shown as pre-fill chips before the user types.
  const chips = useQuery({
    queryKey: ['articles', 'populated-categories'],
    queryFn: listPopulatedCategories,
    enabled: !active,
  });

  const sections: SearchSections = {
    categories: resolved.data?.categories ?? [],
    conditions: resolved.data?.conditions ?? [],
    articles: articles.data ?? [],
  };
  const rows = buildSearchRows(sections, {
    categories: t.searchSectionCategories,
    conditions: t.searchSectionConditions,
    articles: t.searchSectionArticles,
  });

  const isLoading = resolved.isLoading || articles.isLoading;
  const isError = resolved.isError || articles.isError;

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />

      <View className="flex-row items-center gap-2 px-2 py-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={8}
          testID="search-back"
          className="min-h-[44px] w-10 items-center justify-center"
        >
          <ChevronLeft size={22} color={tc.inkSecondary} strokeWidth={2} />
        </Pressable>

        <View className="min-h-[44px] flex-1 flex-row items-center gap-2.5 rounded-full border border-border-hairline bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
          <Search size={18} color={tc.inkTertiary} strokeWidth={2} />
          <TextInput
            autoFocus
            value={raw}
            onChangeText={setRaw}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={tc.inkTertiary}
            returnKeyType="search"
            accessibilityLabel="Search the library"
            testID="search-input"
            className="flex-1 font-sans text-[15px] text-text-primary dark:text-text-primary-dark"
          />
          {raw.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setRaw('')}
              hitSlop={8}
            >
              <X size={18} color={tc.inkTertiary} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!active ? (
        chips.data && chips.data.length > 0 ? (
          <View className="px-5 pt-4">
            <SectionHeader title={t.searchChipsIntro} overline />
            <View className="flex-row flex-wrap gap-2">
              {chips.data.slice(0, MAX_CHIPS).map((c) => (
                <Pressable
                  key={c.slug}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                  onPress={() => setRaw(chipQuery(c.name))}
                  hitSlop={6}
                  testID={`search-chip-${c.slug}`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Badge variant="outline">{chipQuery(c.name)}</Badge>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center p-8 pb-32">
            <Text
              variant="body"
              className="text-center text-text-tertiary dark:text-text-tertiary-dark"
            >
              {t.searchIdlePrompt}
            </Text>
          </View>
        )
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(item: SearchRow) => item.key}
          getItemType={(item: SearchRow) => item.kind}
          contentContainerClassName="px-5 pb-12 pt-1"
          keyboardShouldPersistTaps="handled"
          renderItem={renderSearchRow}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8 pt-20">
              {isLoading ? (
                <AppLoader />
              ) : (
                <>
                  {/* Contextual placement (see MASCOT_CONTEXTUAL): empty search / no
                      results → 'searching'. Not shown on the error branch. */}
                  {!isError && isEmptySections(sections) && (
                    <Mascot
                      state={MASCOT_CONTEXTUAL.emptySearch}
                      size={156}
                      testID="search-empty-mascot"
                    />
                  )}
                  <Text
                    variant="body"
                    className="mt-3 text-center text-text-secondary dark:text-text-secondary-dark"
                  >
                    {isError
                      ? 'Search is unavailable right now. Please try again.'
                      : `No guides match “${query}”.`}
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
