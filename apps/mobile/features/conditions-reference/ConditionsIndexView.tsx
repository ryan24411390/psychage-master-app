import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ChevronLeft, Search, XCircle } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { AlphabetScrubber } from './AlphabetScrubber';
import { CONDITIONS_REF_COPY } from './copy';
import { buildIndex, extractFamilies, filterConditions, type IndexItem } from './group';
import { useConditions } from './hooks';
import type { Condition } from './types';

// Conditions A–Z reference index. A pushed route OUTSIDE the tabs, so it renders the
// GlobalHeader itself (Help-now pill → crisis reachable in ≤1 tap, SR-2) plus a native
// back row. Every condition is organised A–Z + by ICD-11 family ONLY — never by the 30
// categories (separate entity). One FlashList (stack rule: >20 items) over a flattened
// header+row stream; the right-edge scrubber jumps to a letter via scrollToIndex.
export function ConditionsIndexView() {
  const t = CONDITIONS_REF_COPY;
  const reduced = useReducedMotion();
  const { data, isLoading } = useConditions();
  const conditions = useMemo(() => data ?? [], [data]);

  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<string | null>(null);

  const families = useMemo(() => extractFamilies(conditions), [conditions]);
  const filtered = useMemo(
    () => filterConditions(conditions, query, family),
    [conditions, query, family],
  );
  const built = useMemo(() => buildIndex(filtered), [filtered]);

  const listRef = useRef<FlashListRef<IndexItem>>(null);
  const onSelectLetter = useCallback(
    (letter: string) => {
      const idx = built.letterToIndex[letter];
      if (idx != null) {
        listRef.current?.scrollToIndex({ index: idx, animated: !reduced, viewPosition: 0 });
      }
    },
    [built, reduced],
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />

      <View className="flex-row items-center px-2">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="conditions-ref-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
          haptic="tab"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </AnimatedPressable>
      </View>

      <View className="px-5 pb-2">
        <Text variant="h1">{t.title}</Text>
        <Text variant="body" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>

        <SearchField value={query} onChange={setQuery} placeholder={t.searchPlaceholder} a11y={t.searchA11y} clearA11y={t.clearSearch} />

        {families.length > 0 ? (
          <FamilyChips
            families={families}
            selected={family}
            onSelect={setFamily}
            allLabel={t.allFamilies}
            a11y={t.familyFilterA11y}
          />
        ) : null}
      </View>

      <View className="flex-1">
        {isLoading ? (
          <IndexSkeleton />
        ) : conditions.length === 0 ? (
          <EmptyState title={t.emptyTitle} body={t.emptyBody} />
        ) : (
          <>
            <FlashList
              ref={listRef}
              data={built.items}
              keyExtractor={(item, i) =>
                item.type === 'header' ? `h:${item.letter}` : `r:${item.condition.slug}:${i}`
              }
              getItemType={(item) => item.type}
              renderItem={renderIndexItem}
              contentContainerStyle={{ paddingBottom: 56 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<NoMatch label={t.noMatch} />}
            />
            <AlphabetScrubber present={built.letters} onSelectLetter={onSelectLetter} />
          </>
        )}
      </View>
    </View>
  );
}

function renderIndexItem({ item }: { item: IndexItem }) {
  if (item.type === 'header') return <SectionHeader letter={item.letter} />;
  return <ConditionRow condition={item.condition} />;
}

function SectionHeader({ letter }: { letter: string }) {
  return (
    <View className="bg-background px-5 pb-1 pt-4 dark:bg-background-dark">
      <Text variant="label" className="text-text-tertiary dark:text-text-tertiary-dark">
        {letter}
      </Text>
    </View>
  );
}

function ConditionRow({ condition }: { condition: Condition }) {
  return (
    // pr-9 keeps the name clear of the right-edge alphabet scrubber (Contacts idiom —
    // no chevron accessory competing with the index).
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${condition.name}, ${condition.icd11_grouping}`}
      onPress={() => router.push(`/reference/${condition.slug}`)}
      testID={`condition-ref-row-${condition.slug}`}
      className="min-h-[44px] py-2.5 pl-5 pr-9"
      haptic="tab"
    >
      <Text variant="h3" className="font-display">
        {condition.name}
      </Text>
      <Text variant="caption" className="mt-0.5 text-teal-700 dark:text-primary-dark">
        {condition.icd11_grouping}
      </Text>
    </AnimatedPressable>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  a11y,
  clearA11y,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  a11y: string;
  clearA11y: string;
}) {
  const tc = useThemeColors();
  return (
    <View className="mt-3 flex-row items-center gap-2 rounded-lg border border-border bg-surface px-3 dark:border-border-dark dark:bg-surface-dark">
      <Search size={18} color={colors.charcoal[400]} strokeWidth={1.75} />
      <TextInput
        accessibilityLabel={a11y}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tc.inkTertiary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        className="min-h-[44px] flex-1 font-sans text-base text-text-primary dark:text-text-primary-dark"
      />
      {value.length > 0 ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={clearA11y}
          onPress={() => onChange('')}
          hitSlop={8}
          className="p-1"
        >
          <XCircle size={18} color={colors.charcoal[400]} strokeWidth={1.75} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function FamilyChips({
  families,
  selected,
  onSelect,
  allLabel,
  a11y,
}: {
  families: string[];
  selected: string | null;
  onSelect: (f: string | null) => void;
  allLabel: string;
  a11y: string;
}) {
  const chips: { key: string; label: string; value: string | null }[] = [
    { key: '__all', label: allLabel, value: null },
    ...families.map((f) => ({ key: f, label: f, value: f })),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5 mt-3"
      contentContainerClassName="px-5 gap-2"
      accessibilityLabel={a11y}
    >
      {chips.map((chip) => {
        const isActive = selected === chip.value;
        return (
          <AnimatedPressable
            key={chip.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={chip.label}
            onPress={() => onSelect(chip.value)}
            haptic="tab"
            className={`min-h-[44px] justify-center rounded-full border px-3.5 ${
              isActive
                ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
            }`}
          >
            <Text
              variant="caption"
              className={
                isActive
                  ? 'font-sans-medium text-white'
                  : 'font-sans-medium text-text-secondary dark:text-text-secondary-dark'
              }
            >
              {chip.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

function IndexSkeleton() {
  return (
    <View className="px-5 pt-4" testID="conditions-ref-skeleton">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <View key={i} className="border-b border-border/40 py-3.5 dark:border-border-dark/40">
          <Skeleton className="h-4 w-1/2 rounded-md" />
          <Skeleton className="mt-2 h-3 w-1/3 rounded-md" />
        </View>
      ))}
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="items-center px-8 pt-16" testID="conditions-ref-empty">
      <Text variant="h2" className="text-center">
        {title}
      </Text>
      <Text variant="body" className="mt-2 text-center text-text-secondary dark:text-text-secondary-dark">
        {body}
      </Text>
    </View>
  );
}

function NoMatch({ label }: { label: string }) {
  return (
    <View className="items-center px-8 pt-12" testID="conditions-ref-no-match">
      <Search size={28} color={colors.charcoal[300]} strokeWidth={1.5} />
      <Text variant="body" className="mt-3 text-center text-text-secondary dark:text-text-secondary-dark">
        {label}
      </Text>
    </View>
  );
}
