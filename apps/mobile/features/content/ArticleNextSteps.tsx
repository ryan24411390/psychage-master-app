import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Anchor, ArrowUpRight, Compass, HeartHandshake, Moon, Notebook } from 'lucide-react-native';
import type { ElementType } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { RelatedArticleCard } from '@/features/content/RelatedArticleCard';
import { CT4_CONTENT } from '@/features/content/copy';
import { type ToolIconKey, toolForCategory } from '@/features/content/related-tools';
import { getRelatedArticles } from '@/lib/articles';
import type { ArticleListItem } from '@/lib/articles';
import { useThemeColors } from '@/lib/use-theme-colors';

const ICONS: Record<ToolIconKey, ElementType> = {
  anchor: Anchor,
  moon: Moon,
  heart: HeartHandshake,
  notebook: Notebook,
  compass: Compass,
};

const HEADING = 'font-display text-[16px] text-text-primary dark:text-text-primary-dark';

// Closes the content loop (audit H1): after the references, give the reader somewhere
// to go — related reading (same category, tag-ranked, cross-category backfill) plus one
// contextual self-help tool. The reader was the app's highest-traffic dead end. The
// tool suggestion is educational, never prescriptive (SR-3). Self-contained: the related
// query lives here so the reader chrome stays unchanged; an empty/offline result simply
// drops the rail while the tool CTA (deterministic from category) always shows.
export function ArticleNextSteps({
  slug,
  categorySlug,
  tags,
}: {
  slug: string;
  categorySlug: string;
  tags: readonly string[];
}) {
  const tc = useThemeColors();
  const tool = toolForCategory(categorySlug);
  const Icon = ICONS[tool.iconKey];

  // P22 — a horizontal rail of 4–5 related articles (same category, tag-ranked,
  // cross-category backfill). Request 5; FlashList renders whatever fills.
  const { data: related } = useQuery({
    queryKey: ['related-articles', slug],
    queryFn: () => getRelatedArticles(slug, categorySlug, tags, 5),
    enabled: slug.length > 0 && categorySlug.length > 0,
  });

  return (
    <View className="mt-6 gap-3" testID="article-next-steps">
      {related && related.length > 0 ? (
        <View className="gap-3" testID="article-related">
          <Text variant="h2" className={HEADING}>
            {CT4_CONTENT.relatedTitle}
          </Text>
          <FlashList
            horizontal
            data={related}
            keyExtractor={(a: ArticleListItem) => a.slug}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View className="w-3" />}
            renderItem={({ item }: { item: ArticleListItem }) => <RelatedArticleCard article={item} />}
          />
        </View>
      ) : null}

      <Text variant="h2" className={`mt-3 ${HEADING}`}>
        {CT4_CONTENT.nextStepTitle}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tool.label}
        testID="article-tool-cta"
        onPress={() => router.push(tool.route)}
        className="min-h-[44px] w-full flex-row items-center justify-between rounded-[20px] border border-primary/20 bg-primary/10 p-4 dark:border-border-dark dark:bg-surface-dark"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View className="flex-1 flex-row items-center gap-3 pr-3">
          <Icon size={24} color={tc.primary} strokeWidth={1.75} />
          <View className="flex-1">
            <Text
              className="font-sans-medium text-base text-text-primary dark:text-text-primary-dark"
              numberOfLines={2}
            >
              {tool.label}
            </Text>
            <Text className="mt-0.5 font-sans text-xs text-text-secondary dark:text-text-secondary-dark">
              {tool.sub}
            </Text>
          </View>
        </View>
        <ArrowUpRight
          size={18}
          color={tc.primary}
          strokeWidth={1.75}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>
    </View>
  );
}
