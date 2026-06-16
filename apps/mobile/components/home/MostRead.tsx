import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Link } from 'expo-router';
import { fetchMostRead, type Article } from '@/lib/content';

export function MostRead() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMostRead()
      .then(data => {
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
      <Text variant="heading" className="ml-1 mb-2">
        Most read this month
      </Text>

      {loading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        articles.map((a, i) => (
          <React.Fragment key={a.id}>
            <Link href={{ pathname: '/article/[slug]', params: { slug: a.id } }} asChild>
              <Pressable className="flex-row items-start gap-3 py-3 active:opacity-70">
                <Text variant="body" className="w-7 text-text-tertiary dark:text-text-tertiary-dark">
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <View className="flex-1">
                  <Text variant="bodyBold" className="text-text-primary dark:text-text-primary-dark">{a.title}</Text>
                  <Text variant="caption" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
                    {a.topic} · {a.minutes} min
                  </Text>
                </View>
              </Pressable>
            </Link>
            {i < articles.length - 1 && (
              <View className="ml-10 h-[1px] bg-border/40 dark:bg-border-dark/40" />
            )}
          </React.Fragment>
        ))
      )}
    </View>
  );
}
