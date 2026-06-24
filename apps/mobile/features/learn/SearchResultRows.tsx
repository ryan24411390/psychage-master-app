import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CategoryRef, ConditionRef } from '@/lib/discovery/types';
import { useThemeColors } from '@/lib/use-theme-colors';

// Search result rows for the two non-article kinds. Both are thin wayfinding rows
// — a label and a chevron — that route via the ref's OWN href (the resolver
// already chose the destination; the UI never re-derives it). Condition rows
// carry NO parent-category chip: conditions live in their own section, and a
// condition-only result must read as a single guide, not a categorised one.
// Labels render the resolver's text verbatim — KB educational labels, never
// diagnostic phrasing (Sacred Rule #2). Articles keep ArticleListCard.

function ResultRow({
  label,
  href,
  testID,
}: {
  label: string;
  href: string;
  testID: string;
}) {
  const tc = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(href)}
      testID={testID}
      className="min-h-[56px] flex-row items-center justify-between gap-3 border-b border-border-hairline py-3.5 dark:border-border-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text variant="h2" numberOfLines={2} className="flex-1">
        {label}
      </Text>
      <ChevronRight size={18} color={tc.inkTertiary} strokeWidth={2} />
    </Pressable>
  );
}

export const CategoryRow = memo(function CategoryRow({ refItem }: { refItem: CategoryRef }) {
  return <ResultRow label={refItem.title} href={refItem.href} testID={`search-category-${refItem.slug}`} />;
});

export const ConditionRow = memo(function ConditionRow({ refItem }: { refItem: ConditionRef }) {
  return <ResultRow label={refItem.title} href={refItem.href} testID={`search-condition-${refItem.id}`} />;
});
