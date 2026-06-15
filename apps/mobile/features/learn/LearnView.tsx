import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CategoryStillLife } from '@/features/learn/CategoryStillLife';
import { CT4_LEARN } from '@/features/learn/copy';
import { useLearnCategories } from '@/features/learn/hooks';
import { colors } from '@/lib/colors';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';

// S6 Learn — the article rail by topic + a Conditions entry + a Library entry.
// Topics are read LIVE from the DB taxonomy (only populated categories, in the
// DB's display order — never hardcoded). A plain ScrollView + map (the set is
// small; no FlashList). Each topic opens the category article list (real
// Supabase content, S6→list → reader S22); Conditions opens /conditions; Library
// opens the WebView browse (S23, PR E). Empty/error states report the absence.
export function LearnView() {
  const t = CT4_LEARN;
  const { data, isLoading, isError } = useLearnCategories();
  const categories = data ?? [];

  return (
    <ScreenShell edges={['bottom']}>
      <ReadingTextSizeProvider>
        <ScrollView contentContainerClassName="gap-3 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.teal[500]} />
          </View>
        ) : isError || categories.length === 0 ? (
          <Text
            variant="body"
            className="px-1 py-8 text-center text-text-secondary dark:text-text-secondary-dark"
          >
            {isError ? t.listError : t.listEmpty}
          </Text>
        ) : (
          categories.map((cat) => (
            <Pressable
              key={cat.slug}
              accessibilityRole="button"
              accessibilityLabel={cat.name}
              onPress={() =>
                router.push({
                  pathname: '/learn/[category]',
                  params: { category: cat.slug, name: cat.name },
                })
              }
              testID={`learn-category-${cat.slug}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card variant="elevated" className="flex-row items-center gap-4">
                <CategoryStillLife testID={`learn-art-${cat.slug}`} />
                <Text variant="bodyMedium" className="flex-1">
                  {cat.name}
                </Text>
              </Card>
            </Pressable>
          ))
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.conditionsLabel}
          onPress={() => router.push('/conditions')}
          testID="learn-conditions-entry"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Card variant="outline" className="min-h-[44px] justify-center px-4 py-0">
            <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
              {t.conditionsLabel}
            </Text>
          </Card>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.libraryLabel}
          onPress={() => router.push('/library')}
          testID="learn-library-entry"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Card variant="elevated" className="min-h-[44px] justify-center px-4 py-3">
            <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
              {t.libraryLabel}
            </Text>
          </Card>
        </Pressable>
        </ScrollView>
      </ReadingTextSizeProvider>
    </ScreenShell>
  );
}
