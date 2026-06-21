import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/Text';
import { openArticle } from '@/lib/nav';
import { type ArticleListItem, listRecentArticles } from '@/lib/articles';

// "Most read this month" — backed by the live Supabase `articles` table. No
// popularity/view-count signal exists yet (open decision §6), so the rail ranks by
// recency (newest published first) — real articles with real slugs, so every row
// opens its reader. Degrades to an empty (hidden) rail when the fetch fails.
const MOST_READ_LIMIT = 4;

export function MostRead() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listRecentArticles(MOST_READ_LIMIT)
      .then((data) => {
        if (active) setArticles(data);
      })
      .catch(() => {
        // Fetch failed — degrade to an empty rail rather than an infinite spinner.
        if (active) setArticles([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Nothing to show (failed fetch / empty) once settled: render nothing rather than
  // a dangling section header.
  if (!loading && articles.length === 0) return null;

  return (
    <View className="gap-3 mt-6">
      <Text variant="h2" className="ml-1 mb-2">
        Most read this month
      </Text>

      {loading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        articles.map((a, i) => (
          <React.Fragment key={a.slug}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openArticle(a.slug)}
              className="flex-row items-start gap-3 py-3 active:opacity-70"
            >
              <Text variant="body" className="w-7 text-text-tertiary dark:text-text-tertiary-dark">
                {String(i + 1).padStart(2, '0')}
              </Text>
              <View className="flex-1">
                <Text variant="label" className="text-text-primary dark:text-text-primary-dark">{a.title}</Text>
                <Text variant="caption" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
                  {a.categoryName}
                  {a.readTime ? ` · ${a.readTime} min` : ''}
                </Text>
              </View>
            </Pressable>
            {i < articles.length - 1 && (
              <View className="ml-10 h-[1px] bg-border/40 dark:bg-border-dark/40" />
            )}
          </React.Fragment>
        ))
      )}
    </View>
  );
}
