import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppLoader } from '@/components/ui/AppLoader';
import { Text } from '@/components/ui/Text';
import { ArticleListCard } from '@/features/content/ArticleListCard';
import { CT4_LEARN } from '@/features/learn/copy';
import { searchArticles } from '@/lib/articles';
import type { ArticleListItem } from '@/lib/articles';
import { useThemeColors } from '@/lib/use-theme-colors';

// Pushed search screen. A real input here (the Learn hero only routes in). The
// term is debounced (250ms) and only queried at ≥2 chars. Results are real
// published rows via searchArticles (ilike on title/seo_description); empty/
// idle/loading states report honestly — never fabricated rows.

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function SearchView() {
  const tc = useThemeColors();
  const t = CT4_LEARN;
  const [raw, setRaw] = useState('');
  const query = useDebounced(raw.trim(), 250);
  const active = query.length >= 2;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', 'search', query],
    queryFn: () => searchArticles(query),
    enabled: active,
  });
  const results = data ?? [];

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />

      <View className="flex-row items-center gap-2 px-2 py-1">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={8}
          testID="search-back"
          className="min-h-[44px] w-10 items-center justify-center"
        >
          <ChevronLeft size={22} color={tc.inkSecondary} strokeWidth={2} />
        </AnimatedPressable>

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
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setRaw('')}
              hitSlop={8}
            >
              <X size={18} color={tc.inkTertiary} strokeWidth={2} />
            </AnimatedPressable>
          ) : null}
        </View>
      </View>

      {!active ? (
        <View className="flex-1 items-center justify-center p-8 pb-32">
          <Text
            variant="body"
            className="text-center text-text-tertiary dark:text-text-tertiary-dark"
          >
            Search a feeling, topic, or condition to find guides.
          </Text>
        </View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item: ArticleListItem) => item.slug}
          contentContainerClassName="px-5 pb-12 pt-3"
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8 pt-20">
              {isLoading ? (
                <AppLoader />
              ) : (
                <Text
                  variant="body"
                  className="text-center text-text-secondary dark:text-text-secondary-dark"
                >
                  {isError
                    ? 'Search is unavailable right now. Please try again.'
                    : `No guides match “${query}”.`}
                </Text>
              )}
            </View>
          }
          renderItem={({ item }: { item: ArticleListItem }) => <ArticleListCard article={item} />}
        />
      )}
    </View>
  );
}
