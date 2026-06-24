import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { openArticle } from '@/lib/nav';
import { type ArticleListItem, listRecentArticles } from '@/lib/articles';

// Home editorial rail (P20). "Most read this month" — ranked by recency (no
// popularity signal yet, open decision §6). Interest-matched picks now live in
// InterestRails (the signal-driven category rails above); this rail is the
// recency-only editorial list shown to everyone, and the de-facto fallback when
// the user has set no interests. Real articles with real slugs, so every row opens
// its reader. Self-fetches (the home shell has no QueryClient). Hidden when nothing
// is available.
const MOST_READ_LIMIT = 4;

export function MostRead() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listRecentArticles(MOST_READ_LIMIT)
      .then((data) => {
        if (!active) return;
        setArticles(data.slice(0, MOST_READ_LIMIT));
        setLoading(false);
      })
      .catch(() => {
        // Fetch failed — degrade to an empty rail rather than an infinite spinner.
        if (active) {
          setArticles([]);
          setLoading(false);
        }
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
              <View className="h-[1px] bg-border/40 dark:bg-border-dark/40 ml-10" />
            )}
          </React.Fragment>
        ))
      )}
    </View>
  );
}
