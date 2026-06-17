import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { FeaturedCard } from '@/features/learn/FeaturedCard';
import { LearnHero } from '@/features/learn/LearnHero';
import { LEARN_CATEGORIES } from '@/features/learn/categories';
import { CT4_LEARN } from '@/features/learn/copy';
import { MostReadList } from '@/features/learn/MostReadList';
import { PathPickerSheet } from '@/features/learn/PathPickerSheet';
import { ReadRow } from '@/features/learn/ReadRow';
import { SavedRail } from '@/features/learn/SavedRail';
import { SectionHeader } from '@/features/learn/SectionHeader';
import { TopicRail } from '@/features/learn/TopicRail';
import { TopicTile } from '@/features/learn/TopicTile';
import { listRecentArticles } from '@/lib/articles';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';

// S6 Learn — a scannable library feed (search hero → path picker → Editor's pick
// → Saved → topic rails → Most read → Reads → Browse). All content is real,
// published Supabase rows; the "Editor's pick" / "Most read" / "Reads" modules
// slice ONE recent-articles query so they never overlap and never fabricate.
// Topic rails are category-scoped (sharing CategoryArticlesView's cache keys so
// "See all" opens warm). The GlobalHeader (Help-now pill, SR-2) is injected by
// the tabs layout. Browse drill-down and Search live on pushed routes.
export function LearnView() {
  const t = CT4_LEARN;
  const [pickerOpen, setPickerOpen] = useState(false);
  // Two-column tile width. NativeWind drops arbitrary % widths in this setup, so
  // the grid columns are sized from the viewport: (width − px-4 gutters − gap)/2.
  const { width } = useWindowDimensions();
  const colW = Math.floor((width - 32 - 12) / 2);

  const { data } = useQuery({
    queryKey: ['articles', 'recent', 14],
    queryFn: () => listRecentArticles(14),
  });
  const recent = data ?? [];
  const featured = recent[0];
  const mostRead = recent.slice(1, 6);
  const reads = recent.slice(6, 12);

  // Topic rails: the curated categories minus the "More topics" catch-all (it has
  // no single article set worth a preview rail — it lives in the tile grid below).
  const railCategories = LEARN_CATEGORIES.filter((c) => c.id !== 'more');

  const onPick = (route: string) => {
    setPickerOpen(false);
    router.push(`/learn/${route}`);
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ReadingTextSizeProvider>
        <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
          <LearnHero onFindPath={() => setPickerOpen(true)} />

          {featured ? (
            <View className="px-4 pt-7">
              <SectionHeader title={t.editorsPick} overline />
              <FeaturedCard article={featured} />
            </View>
          ) : null}

          <View className="pt-7">
            <SavedRail />
          </View>

          {railCategories.map((cat) => (
            <View key={cat.id} className="pt-7">
              <TopicRail category={cat} />
            </View>
          ))}

          {mostRead.length > 0 ? (
            <View className="px-4 pt-8">
              <SectionHeader title={t.mostRead} overline />
              <MostReadList articles={mostRead} />
            </View>
          ) : null}

          {reads.length > 0 ? (
            <View className="px-4 pt-8">
              <SectionHeader title={t.reads} onSeeAll={() => router.push('/learn/browse')} />
              <View>
                {reads.map((a) => (
                  <ReadRow key={a.slug} article={a} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Browse by topic — compact tile grid over the curated categories. */}
          <View className="px-4 pt-8">
            <SectionHeader title={t.browseTopics} onSeeAll={() => router.push('/learn/browse')} />
            <View className="flex-row flex-wrap gap-3">
              {LEARN_CATEGORIES.map((cat) => (
                <View key={cat.id} style={{ width: colW }}>
                  <TopicTile
                    label={cat.label}
                    artKey={cat.id}
                    onPress={() => router.push(`/learn/${cat.id}`)}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Conditions + full library entries (retained from the original Learn). */}
          <View className="gap-3 px-4 pt-8">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.conditionsLabel}
              onPress={() => router.push('/conditions')}
              testID="learn-conditions-entry"
              className="min-h-[52px] flex-row items-center justify-center rounded-xl border border-border px-4 dark:border-border-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text variant="bodyLarge" className="text-teal-700 dark:text-primary-dark">
                {t.conditionsLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.libraryLabel}
              onPress={() => router.push('/library')}
              testID="learn-library-entry"
              className="min-h-[52px] flex-row items-center justify-center rounded-xl border border-border px-4 dark:border-border-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text variant="bodyLarge" className="text-teal-700 dark:text-primary-dark">
                {t.libraryLabel}
              </Text>
            </Pressable>
          </View>

          <Text
            variant="caption"
            className="px-4 pt-6 leading-[18px] text-text-tertiary dark:text-text-tertiary-dark"
          >
            {t.footnote}
          </Text>
        </ScrollView>
      </ReadingTextSizeProvider>

      <PathPickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPick} />
    </SafeAreaView>
  );
}
