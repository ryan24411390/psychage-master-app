import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { listRecentArticles } from '@/lib/articles';

// "Most read this week" — real, published Supabase articles via the shared article
// repo (same query key the Learn tab uses, so the cache is warm). Links to the real
// reader at /article/[slug]. Offset past the lead items the rails above surface so the
// home sections don't all repeat the same article.
export function MostRead() {
  const { data, isLoading } = useQuery({
    queryKey: ['articles', 'recent', 14],
    queryFn: () => listRecentArticles(14),
  });
  const articles = (data ?? []).slice(6, 10);

  return (
    <View className="gap-3 mt-6">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider ml-1 mb-2">
        Most read this week
      </Text>

      {isLoading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        articles.map((a, i) => (
          <React.Fragment key={a.slug}>
            <Link href={`/article/${a.slug}` as never} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${a.title}, ${a.categoryName}`}
                className="flex-row justify-between items-center py-3 active:opacity-70"
              >
                <View className="flex-1 pr-4">
                  <Text variant="caption" className="text-primary dark:text-primary-dark font-sans-medium mb-1">{a.categoryName}</Text>
                  <Text variant="h5" className="text-text-primary dark:text-text-primary-dark">{a.title}</Text>
                </View>
                {a.readTime ? (
                  <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark shrink-0">{a.readTime} min</Text>
                ) : null}
              </Pressable>
            </Link>
            {i < articles.length - 1 && (
              <View className="h-[1px] w-full bg-border/40 dark:bg-border-dark/40" />
            )}
          </React.Fragment>
        ))
      )}
    </View>
  );
}
