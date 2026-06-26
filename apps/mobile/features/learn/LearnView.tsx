import { router } from 'expo-router';
import { Compass, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiFab } from '@/components/ui/AiFab';
import { Text } from '@/components/ui/Text';
import {
  type BrowseGroup,
  filterBrowseCards,
  groupBrowseCards,
} from '@/features/learn/browse-manifest';
import { categoryHrefBySlug } from '@/features/learn/category-route';
import { ConditionsAccordion } from '@/features/learn/ConditionsAccordion';
import { CT4_LEARN } from '@/features/learn/copy';
import { GroupSwitcher } from '@/features/learn/GroupSwitcher';
import { PathPickerSheet } from '@/features/learn/PathPickerSheet';
import { SegmentedToggle } from '@/features/learn/SegmentedToggle';
import { TopicPosterCard } from '@/features/learn/TopicPosterCard';
import { useHaptics } from '@/lib/haptic-context';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';
import { useThemeColors } from '@/lib/use-theme-colors';

// S6 Browse — the topic index, web-parity. An editorial header (LEARN / Browse /
// subtitle), a "find your path" prompt card, a live search box, and a Topics /
// Conditions segmented control sit above the body. In Topics mode a three-group
// chip row filters a 2-column grid of full-bleed category posters (titles baked
// into the image — no overlay); in Conditions mode the live ICD-11 family accordion
// renders. The whole screen is one ScrollView (both bodies are small) — NOT a
// FlashList: an interactive FlashList ListHeaderComponent detaches its navigation
// context on screen freeze/thaw and redboxes. GlobalHeader (Help-now) is injected
// by the tabs layout; the AI FAB floats here. Search/segment/group are local state.

type Mode = 'topics' | 'conditions';

export function LearnView() {
  const t = CT4_LEARN;
  const tc = useThemeColors();
  const { fireHaptic } = useHaptics();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('topics');
  const [pickedGroup, setPickedGroup] = useState<BrowseGroup | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Two-column tile width: (viewport − px-5 gutters − gap) / 2.
  const { width } = useWindowDimensions();
  const colW = Math.floor((width - 40 - 14) / 2);

  const { orderedGroups, byGroup } = useMemo(() => groupBrowseCards(), []);
  const activeGroup =
    pickedGroup && orderedGroups.includes(pickedGroup) ? pickedGroup : (orderedGroups[0] ?? null);
  const activeCards = activeGroup ? (byGroup.get(activeGroup) ?? []) : [];
  const visibleCards = useMemo(() => filterBrowseCards(activeCards, query), [activeCards, query]);

  const onPick = (route: string) => {
    setPickerOpen(false);
    router.push(`/learn/${route}`);
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <ReadingTextSizeProvider>
        <ScrollView
          contentContainerStyle={{ paddingBottom: Math.max(140, insets.bottom + 120) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Editorial header */}
          <View className="gap-1.5 px-5 pt-3">
            <Text
              variant="caption"
              accessibilityRole="header"
              className="uppercase tracking-[2px] text-text-tertiary dark:text-text-tertiary-dark"
            >
              {t.eyebrow}
            </Text>
            <Text variant="display" className="text-[34px] leading-[40px]">
              {t.browseTitle}
            </Text>
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {t.browseSubtitle}
            </Text>
          </View>

          {/* "Not sure where to start?" — opens the wayfinding sheet. */}
          <View className="px-5 pt-5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.notSureTitle} ${t.notSureSubtitle}`}
              testID="browse-find-path"
              onPress={() => {
                fireHaptic('tab');
                setPickerOpen(true);
              }}
              className="flex-row items-center gap-3 rounded-2xl border border-border-hairline bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-active dark:bg-surface-active-dark">
                <Compass size={22} color={tc.primary} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text variant="h3" className="text-[16px] leading-[20px]">
                  {t.notSureTitle}
                </Text>
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                  {t.notSureSubtitle}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Search */}
          <View className="px-5 pt-4">
            <View className="min-h-[48px] flex-row items-center gap-2.5 rounded-xl border border-border-hairline bg-surface px-3.5 dark:border-border-dark dark:bg-surface-dark">
              <Search size={18} color={tc.inkTertiary} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={mode === 'topics' ? t.searchTopicsPlaceholder : t.searchPlaceholder}
                placeholderTextColor={tc.inkTertiary}
                returnKeyType="search"
                autoCorrect={false}
                testID="browse-search-input"
                accessibilityLabel={t.searchTopicsPlaceholder}
                className="h-12 flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark"
              />
            </View>
          </View>

          {/* Topics / Conditions */}
          <View className="px-5 pt-4">
            <SegmentedToggle<Mode>
              options={[
                { value: 'topics', label: t.segTopics },
                { value: 'conditions', label: t.segConditions },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>

          {mode === 'topics' ? (
            <View className="pt-4">
              {activeGroup ? (
                <GroupSwitcher
                  groups={orderedGroups}
                  value={activeGroup}
                  onChange={(g) => setPickedGroup(g as BrowseGroup)}
                />
              ) : null}
              <View className="flex-row flex-wrap gap-3.5 px-5 pt-4">
                {visibleCards.map((card) => (
                  <View key={card.slug} style={{ width: colW }}>
                    <TopicPosterCard
                      slug={card.slug}
                      title={card.title}
                      onPress={() => router.push(categoryHrefBySlug(card.slug))}
                    />
                  </View>
                ))}
              </View>
              {visibleCards.length === 0 ? (
                <Text
                  variant="body"
                  className="px-5 pt-6 text-text-tertiary dark:text-text-tertiary-dark"
                >
                  {t.topicsEmpty}
                </Text>
              ) : null}
            </View>
          ) : (
            <ConditionsAccordion query={query} />
          )}
        </ScrollView>
      </ReadingTextSizeProvider>

      <AiFab />
      <PathPickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPick} />
    </View>
  );
}
