import { router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CategoryStillLife } from '@/features/learn/CategoryStillLife';
import { LEARN_CATEGORIES } from '@/features/learn/categories';
import { CT4_LEARN } from '@/features/learn/copy';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';

// S6 Learn — the article rail by topic (fixed order) + a Conditions entry + a
// Library entry. A plain ScrollView + map (the category set is small; no
// FlashList). Each topic opens the category article list (real Supabase content,
// S6→list → reader S22); the Conditions entry opens the conditions library
// (/conditions); the Library entry opens the WebView browse (S23, PR E).
export function LearnView() {
  const t = CT4_LEARN;
  return (
    <ScreenShell edges={['bottom']}>
      <ReadingTextSizeProvider>
        <ScrollView contentContainerClassName="gap-3 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>

        {LEARN_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            accessibilityRole="button"
            accessibilityLabel={cat.label}
            onPress={() => router.push(`/learn/${cat.id}`)}
            testID={`learn-category-${cat.id}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card variant="elevated" className="flex-row items-center gap-4">
              <CategoryStillLife testID={`learn-art-${cat.id}`} />
              <Text variant="bodyMedium" className="flex-1">
                {cat.label}
              </Text>
            </Card>
          </Pressable>
        ))}

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
