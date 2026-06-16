/**
 * S-3 saved list (T-006). FlashList of bookmarks (newest-first via the hook),
 * client-side type-filter chips, skeleton/empty/error states. Mirrors
 * features/directory/DirectoryView (FlashList + TanStack Query); simpler — no search.
 */

import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { BookmarkPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';
import { BOOKMARKS_COPY } from './copy';
import { useBookmarks } from './hooks';
import { SavedRow } from './SavedRow';
import type { ResourceType } from './types';

type FilterKey = 'all' | ResourceType;

const FILTERS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: 'all', label: BOOKMARKS_COPY.filter.all },
  { key: 'article', label: BOOKMARKS_COPY.filter.articles },
  { key: 'provider', label: BOOKMARKS_COPY.filter.providers },
  { key: 'tool', label: BOOKMARKS_COPY.filter.tools },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-[44px] justify-center rounded-full border px-4 ${
        selected ? 'border-primary dark:border-primary-dark' : 'border-border dark:border-border-dark'
      }`}
    >
      <Text
        variant="h6"
        className={
          selected
            ? 'text-primary dark:text-primary-dark'
            : 'text-text-secondary dark:text-text-secondary-dark'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState() {
  const tc = useThemeColors();
  return (
    <View className="items-center gap-3 px-6 py-16">
      <BookmarkPlus size={40} color={tc.inkSecondary} strokeWidth={1.5} />
      <Text variant="h5" className="text-center text-text-primary dark:text-text-primary-dark">
        {BOOKMARKS_COPY.empty.title}
      </Text>
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        {BOOKMARKS_COPY.empty.body}
      </Text>
      <View className="mt-2">
        <Button variant="secondary" onPress={() => router.push('/learn')}>
          {BOOKMARKS_COPY.empty.cta}
        </Button>
      </View>
    </View>
  );
}

export function SavedList() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data, isLoading, isError } = useBookmarks();
  const items = (data ?? []).filter((b) => filter === 'all' || b.resource_type === filter);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>
      <FlashList
        data={items}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <SavedRow item={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          isLoading ? (
            <View className="px-6 py-16">
              <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
                …
              </Text>
            </View>
          ) : isError ? (
            <View className="px-6 py-16">
              <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
                {BOOKMARKS_COPY.error.load}
              </Text>
            </View>
          ) : (
            <EmptyState />
          )
        }
      />
    </View>
  );
}
