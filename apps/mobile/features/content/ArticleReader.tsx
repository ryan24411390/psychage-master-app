import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Text } from '@/components/ui/Text';
import { BookmarkSaveSlot } from '@/features/bookmarks/BookmarkSaveSlot';
import { ArticleBody } from '@/features/content/blocks/ArticleBody';
import { Citations } from '@/features/content/Citations';
import { CT4_CONTENT } from '@/features/content/copy';
import { MedicalDisclaimer } from '@/features/content/MedicalDisclaimer';
import { ReviewedByCredit } from '@/features/content/ReviewedByCredit';
import { getArticleBySlug } from '@/lib/articles';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';
import { useThemeColors } from '@/lib/use-theme-colors';

// S22 Article reader — NATIVE chrome + NATIVE body. Pushed over the tabs, so it
// renders the GlobalHeader itself (Help-now pill reachable, SR-2) plus a native
// back row. Article CONTENT is the real, clinician-reviewed body fetched live from
// the shared Supabase and rendered verbatim via ArticleBody (HTML → native PEAF
// blocks), inside the ReadingTextSizeProvider so the reader's text-size control
// applies. The byline mirrors the web exactly: author "Psychage Team · Editor"
// plus the full Dr. Dobson reviewer credit (ReviewedByCredit, the single
// enforcement point). An educational MedicalDisclaimer (SR-3) sits above the body
// and the article's References (article_citations) render below it. A missing
// article reports its absence — never placeholder prose.
export function ArticleReader({ slug }: { slug: string }) {
  const t = CT4_CONTENT;
  const tc = useThemeColors();
  const { width } = useWindowDimensions();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug),
    enabled: slug.length > 0,
  });

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center justify-between px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="article-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={tc.inkSecondary} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </Pressable>
        {/* Save this article — resource_id is the slug (T-007). */}
        <BookmarkSaveSlot resourceType="article" resourceId={slug} testID="article-save" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center" testID="article-loading">
          <ActivityIndicator color={tc.primary} />
        </View>
      ) : !article ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            variant="body"
            className="text-center text-text-secondary dark:text-text-secondary-dark"
          >
            This article isn’t available.
          </Text>
        </View>
      ) : (
        <ReadingTextSizeProvider>
          <ScrollView
            contentContainerClassName="gap-3 px-5 pb-12"
            showsVerticalScrollIndicator={false}
          >
            {article.heroImageUrl ? (
              <Image
                source={{ uri: article.heroImageUrl }}
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                style={{ width: width - 40, height: (width - 40) / 1.78, borderRadius: 12 }}
              />
            ) : null}

            <View className="flex-row items-center gap-2">
              <Text
                variant="caption"
                className="rounded-full bg-surface-active px-2 py-0.5 text-text-secondary dark:bg-surface-active-dark dark:text-text-secondary-dark"
              >
                {article.categoryName}
              </Text>
              {article.readTime ? (
                <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                  {`${article.readTime} min read`}
                </Text>
              ) : null}
            </View>

            <Text variant="headingLg">{article.title}</Text>
            {article.subtitle ? (
              <Text
                variant="bodyMedium"
                className="text-text-secondary dark:text-text-secondary-dark"
              >
                {article.subtitle}
              </Text>
            ) : null}

            <View className="gap-0.5">
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {`${article.authorName} · ${article.authorRole}`}
              </Text>
              <ReviewedByCredit />
            </View>

            <MedicalDisclaimer />

            <ArticleBody html={article.contentHtml} />

            <Citations items={article.citations} />
          </ScrollView>
        </ReadingTextSizeProvider>
      )}
    </View>
  );
}
