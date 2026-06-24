import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLoader } from '@/components/ui/AppLoader';
import { Text } from '@/components/ui/Text';
import { categoryHrefBySlug } from '@/features/learn/category-route';
import { CT4_LEARN } from '@/features/learn/copy';
import { groupCategories, guideCount } from '@/features/learn/group-buckets';
import { GroupSwitcher } from '@/features/learn/GroupSwitcher';
import { useLearnCategories } from '@/features/learn/hooks';
import { LearnHero } from '@/features/learn/LearnHero';
import { PathPickerSheet } from '@/features/learn/PathPickerSheet';
import { SectionHeader } from '@/features/learn/SectionHeader';
import { TopicTile } from '@/features/learn/TopicTile';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';

// S6 Learn — a topic index. The search hero (+ "Find your path") sits above a
// three-group switcher; the active group lists its populated categories as cards
// (token art + DB title + live guide count). Categories, counts, and group labels
// are read live from the DB taxonomy (useLearnCategories → listBrowseCategories) —
// never hardcoded; zero-content categories are already excluded upstream. Cards
// route via categoryHrefBySlug (condition-focused → /conditions/[slug]; everything
// else → /learn/[slug]). The GlobalHeader (Help-now pill, SR-2) is injected by the
// tabs layout; Browse drill-down and Search live on pushed routes.
export function LearnView() {
  const t = CT4_LEARN;
  const [pickerOpen, setPickerOpen] = useState(false);
  // Active group is local UI state (not server data) — null until the user picks,
  // then clamped to a present group below.
  const [pickedGroup, setPickedGroup] = useState<string | null>(null);

  // Two-column tile width. NativeWind drops arbitrary % widths in this setup, so
  // the grid columns are sized from the viewport: (width − px-4 gutters − gap)/2.
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colW = Math.floor((width - 32 - 12) / 2);

  const { data: categories } = useLearnCategories();

  // Bucket the live categories by group (total partition — see group-buckets.ts).
  const { orderedGroups, byGroup } = useMemo(() => groupCategories(categories ?? []), [categories]);

  // The user's pick when it is still a present group, else the first group.
  const activeGroup =
    pickedGroup && orderedGroups.includes(pickedGroup) ? pickedGroup : (orderedGroups[0] ?? null);
  const activeCats = activeGroup ? (byGroup.get(activeGroup) ?? []) : [];

  const onPick = (route: string) => {
    setPickerOpen(false);
    router.push(`/learn/${route}`);
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <ReadingTextSizeProvider>
        <ScrollView
          contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 16) }}
          showsVerticalScrollIndicator={false}
        >
          <LearnHero onFindPath={() => setPickerOpen(true)} />

          {categories === undefined ? (
            <View className="px-4 pt-10">
              <AppLoader label="Loading topics" />
            </View>
          ) : orderedGroups.length === 0 ? (
            <View className="px-4 pt-10">
              <Text variant="body" className="text-text-tertiary dark:text-text-tertiary-dark">
                {t.browseEmpty}
              </Text>
            </View>
          ) : (
            <View className="pt-7">
              <View className="px-4">
                <SectionHeader title={t.browseTopics} />
              </View>
              {activeGroup ? (
                <GroupSwitcher groups={orderedGroups} value={activeGroup} onChange={setPickedGroup} />
              ) : null}
              <View className="flex-row flex-wrap gap-3 px-4 pt-5">
                {activeCats.map((cat) => (
                  <View key={cat.slug} style={{ width: colW }}>
                    <TopicTile
                      label={cat.name}
                      count={guideCount(cat.articleCount)}
                      artKey={cat.slug}
                      onPress={() => router.push(categoryHrefBySlug(cat.slug))}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Doorways to the conditions reference + the full saved library. */}
          <View className="gap-3 px-4 pt-9">
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
    </View>
  );
}
