import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/Text';
import { openArticle } from '@/lib/nav';
import { type ArticleListItem, listArticlesByCategorySlugs, listRecentArticles } from '@/lib/articles';
import { storage } from '@/lib/adapters/storage';
import { loadPersonalization } from '@/lib/persistence/personalization';

// Home article rail (P20). When the user chose interests at onboarding, this shows
// "Recommended for you" — published articles in those content categories. Otherwise
// (or if those categories hold nothing) it falls back to "Most read this month",
// which ranks by recency (no popularity signal yet, open decision §6). Real articles
// with real slugs, so every row opens its reader. Hidden when nothing is available.
const MOST_READ_LIMIT = 4;

export function MostRead() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Did we actually render interest-matched picks (vs the recency fallback)? Drives
  // the heading so "Recommended for you" is never shown over recency results.
  const [personalized, setPersonalized] = useState(false);
  const interests = useMemo(() => loadPersonalization(storage).interests, []);

  useEffect(() => {
    let active = true;
    (async () => {
      let data = interests.length > 0 ? await listArticlesByCategorySlugs(interests) : [];
      const used = data.length > 0;
      if (!used) data = await listRecentArticles(MOST_READ_LIMIT);
      if (!active) return;
      setPersonalized(used);
      setArticles(data.slice(0, MOST_READ_LIMIT));
      setLoading(false);
    })().catch(() => {
      // Fetch failed — degrade to an empty rail rather than an infinite spinner.
      if (active) {
        setArticles([]);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [interests]);

  // Nothing to show (failed fetch / empty) once settled: render nothing rather than
  // a dangling section header.
  if (!loading && articles.length === 0) return null;

  return (
    <View className="gap-3 mt-6">
      <Text variant="h2" className="ml-1 mb-2">
        {personalized ? 'Recommended for you' : 'Most read this month'}
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
              {personalized ? null : (
                <Text variant="body" className="w-7 text-text-tertiary dark:text-text-tertiary-dark">
                  {String(i + 1).padStart(2, '0')}
                </Text>
              )}
              <View className="flex-1">
                <Text variant="label" className="text-text-primary dark:text-text-primary-dark">{a.title}</Text>
                <Text variant="caption" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
                  {a.categoryName}
                  {a.readTime ? ` · ${a.readTime} min` : ''}
                </Text>
              </View>
            </Pressable>
            {i < articles.length - 1 && (
              <View className={`h-[1px] bg-border/40 dark:bg-border-dark/40 ${personalized ? '' : 'ml-10'}`} />
            )}
          </React.Fragment>
        ))
      )}
    </View>
  );
}
