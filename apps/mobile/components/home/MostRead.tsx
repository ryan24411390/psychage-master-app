import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Link } from 'expo-router';
import { fetchMostRead, type Article } from '@/lib/content';

export function MostRead() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMostRead().then(data => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  return (
    <View className="gap-3 mt-6">
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider ml-1 mb-2">
        Most read this week
      </Text>
      
      {loading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        articles.map((a, i) => (
          <React.Fragment key={a.id}>
            <Link href={`/read/${a.id}` as any} asChild>
              <Pressable className="flex-row justify-between items-center py-3 active:opacity-70">
                <View className="flex-1 pr-4">
                  <Text variant="caption" className="text-primary dark:text-primary-dark font-sans-medium mb-1">{a.topic}</Text>
                  <Text variant="bodyBold" className="text-text-primary dark:text-text-primary-dark">{a.title}</Text>
                </View>
                <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark shrink-0">{a.minutes} min</Text>
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
