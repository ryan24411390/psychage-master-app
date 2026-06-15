import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Text } from '@/components/ui/Text';
import { CONDITIONS_COPY } from '@/features/conditions/copy';
import { selectConditionDetail } from '@/features/conditions/select';
import { colors } from '@/lib/colors';

// Conditions library (topic overview). Pushed route → renders GlobalHeader (Help-
// now pill, SR-2) + native back row. The screen shows the reviewed topic NAME, the
// reviewed topic SUMMARY, and the reviewed sub-topic outline ("what this covers"),
// all VERBATIM from the web (summary + subTopics via data/condition-summaries.ts —
// sourced, never authored here), and routes into REAL content (the Library
// WebView). It authors no symptom list or likelihood — not a diagnostic flow
// (SR-3). Unknown / non-condition slugs fall back to a safe "not found" state.
export function ConditionDetailView({ slug }: { slug: string }) {
  const t = CONDITIONS_COPY;
  const detail = selectConditionDetail(slug);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="condition-detail-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </Pressable>
      </View>

      {detail == null ? (
        <View className="px-5 pt-4" testID="condition-not-found">
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {t.notFound}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-5 pb-12"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="headingLg">{detail.name}</Text>
          {/* Verbatim reviewed summary when ported (B1); else the generic intro. */}
          <Text
            variant="body"
            className="text-text-secondary dark:text-text-secondary-dark"
            testID={detail.summary ? 'condition-summary' : 'condition-intro'}
          >
            {detail.summary ?? t.detailIntro}
          </Text>

          {detail.subTopics.length > 0 ? (
            <View className="gap-1.5 pt-1" testID="condition-subtopics">
              <Text variant="bodyMedium">{t.coversLabel}</Text>
              {detail.subTopics.map((topic) => (
                <Text
                  key={topic}
                  variant="body"
                  className="text-text-secondary dark:text-text-secondary-dark"
                >
                  {`•  ${topic}`}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.browseLabel}
            onPress={() => router.push('/library')}
            testID="condition-browse-library"
            className="min-h-[44px] justify-center rounded-xl border border-border px-4 dark:border-border-dark"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
              {t.browseLabel}
            </Text>
          </Pressable>

          {detail.related.length > 0 ? (
            <View className="gap-2 pt-2" testID="condition-related">
              <Text variant="bodyMedium">{t.relatedLabel}</Text>
              {detail.related.map((rel) => (
                <Pressable
                  key={rel.slug}
                  accessibilityRole="button"
                  accessibilityLabel={rel.name}
                  onPress={() => router.push(`/conditions/${rel.slug}`)}
                  testID={`condition-related-${rel.slug}`}
                  className="min-h-[44px] justify-center rounded-xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text variant="body">{rel.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text variant="caption" className="px-1 pt-2">
            {t.disclaimer}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
