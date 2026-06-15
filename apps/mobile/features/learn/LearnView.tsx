import { router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CategoryStillLife } from '@/features/learn/CategoryStillLife';
import { LEARN_CATEGORIES } from '@/features/learn/categories';
import { CT4_LEARN } from '@/features/learn/copy';

// S6 Learn — the article rail by topic (fixed order) + a Library entry. A plain
// ScrollView + map (the category set is small; no FlashList). Each topic opens the
// article reader (S22); the Library entry opens the WebView browse (S23, PR E).
export function LearnView() {
  const t = CT4_LEARN;
  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>

        {LEARN_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            accessibilityRole="button"
            accessibilityLabel={cat.label}
            onPress={() => router.push(`/article/${cat.id}`)}
            testID={`learn-category-${cat.id}`}
            className="flex-row items-center gap-4 rounded-xl border border-border/50 bg-surface p-4 shadow-sm dark:border-border-dark/50 dark:bg-surface-dark"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <CategoryStillLife testID={`learn-art-${cat.id}`} />
            <Text variant="bodyMedium" className="flex-1">
              {cat.label}
            </Text>
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.libraryLabel}
          onPress={() => router.push('/library')}
          testID="learn-library-entry"
          className="min-h-[44px] justify-center rounded-xl border border-border/50 bg-surface px-4 py-3 shadow-sm dark:border-border-dark/50 dark:bg-surface-dark"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
            {t.libraryLabel}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}
