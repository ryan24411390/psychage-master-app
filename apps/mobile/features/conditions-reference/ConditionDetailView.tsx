import { router } from 'expo-router';
import { ChevronLeft, LifeBuoy } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ScreenEntrance } from '@/components/ui/ScreenEntrance';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { useThemeColors } from '@/lib/use-theme-colors';

import { CONDITIONS_REF_COPY } from './copy';
import { useCondition } from './hooks';
import { ListenControl } from './ListenControl';
import {
  type Condition,
  DEFINITION_FIELDS,
  DEFINITION_FIELD_LABELS,
  hasDefinition,
} from './types';

// Condition detail. A pushed route → renders its own GlobalHeader (Help-now pill, SR-2)
// + native back row. Shows the ICD-11 code chip + family, the four labelled definition
// sections (verbatim from the shared table — never authored here), a "Listen" read-aloud
// when a definition exists, and a prominent crisis affordance when crisis_flag is set.
// Null-definition rows show a calm "definition in review" state, never a broken screen.
// No mascot. The fixed educational disclaimer is pinned at the foot, verbatim.
export function ConditionDetailView({ slug }: { slug: string }) {
  const t = CONDITIONS_REF_COPY;
  const { data: condition, isLoading } = useCondition(slug);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />

      <View className="flex-row items-center px-2">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="condition-ref-detail-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
          haptic="tab"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </AnimatedPressable>
      </View>

      {isLoading ? (
        <DetailSkeleton />
      ) : condition == null ? (
        <NotFound title={t.notFoundTitle} body={t.notFoundBody} />
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-12"
          showsVerticalScrollIndicator={false}
        >
          <ScreenEntrance>
            <DetailBody condition={condition} />
          </ScreenEntrance>
        </ScrollView>
      )}
    </View>
  );
}

function DetailBody({ condition }: { condition: Condition }) {
  const t = CONDITIONS_REF_COPY;
  const definitionPresent = hasDefinition(condition);

  return (
    <View>
      <Text variant="h1" className="pt-1" testID="condition-ref-name">
        {condition.name}
      </Text>

      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <View className="rounded-md bg-surface-accent px-2 py-1 dark:bg-surface-accent-dark" testID="condition-ref-icd-chip">
          <Text variant="caption" className="font-sans-medium text-text-secondary dark:text-text-secondary-dark">
            ICD-11 {condition.icd11_code}
          </Text>
        </View>
        <Text variant="caption" className="text-teal-700 dark:text-primary-dark">
          {condition.icd11_grouping}
        </Text>
      </View>

      {condition.crisis_flag ? <CrisisCallout /> : null}

      {definitionPresent ? (
        <>
          <View className="mt-5">
            <ListenControl text={buildListenText(condition)} />
          </View>

          <View className="mt-5 gap-5">
            {DEFINITION_FIELDS.map((field) => {
              const value = condition[field];
              if (typeof value !== 'string' || value.trim().length === 0) return null;
              return (
                <View key={field} testID={`condition-ref-section-${field}`}>
                  <Text variant="label" className="text-text-tertiary dark:text-text-tertiary-dark">
                    {DEFINITION_FIELD_LABELS[field]}
                  </Text>
                  <Text variant="bodyLarge" className="mt-1.5 leading-7">
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <InReview title={t.inReviewTitle} body={t.inReviewBody} />
      )}

      {condition.provenance ? (
        <Text
          variant="caption"
          className="mt-6 text-text-tertiary dark:text-text-tertiary-dark"
          testID="condition-ref-provenance"
        >
          {`Source basis: ${condition.provenance}`}
        </Text>
      ) : null}

      <Text variant="caption" className="mt-3 leading-[18px] text-text-tertiary dark:text-text-tertiary-dark">
        {t.disclaimer}
      </Text>
    </View>
  );
}

// Builds the read-aloud script: name, then each present definition section announced by
// its label, so a listener hears the structure as well as the content.
function buildListenText(condition: Condition): string {
  const parts: string[] = [condition.name];
  for (const field of DEFINITION_FIELDS) {
    const value = condition[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      parts.push(`${DEFINITION_FIELD_LABELS[field]}.`, value.trim());
    }
  }
  return parts.join(' ');
}

function CrisisCallout() {
  const t = CONDITIONS_REF_COPY;
  const tc = useThemeColors();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={t.crisisCta}
      onPress={() => router.push('/crisis')}
      testID="condition-ref-crisis"
      haptic="tab"
      className="mt-5 flex-row items-center gap-3 rounded-xl border border-crisis bg-surface px-4 py-3.5 dark:border-crisis-dark dark:bg-surface-dark"
    >
      <LifeBuoy size={22} color={tc.crisis} strokeWidth={1.75} />
      <View className="flex-1">
        <Text variant="label" className="text-crisis dark:text-crisis-dark">
          {t.crisisTitle}
        </Text>
        <Text variant="caption" className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">
          {t.crisisBody}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function InReview({ title, body }: { title: string; body: string }) {
  return (
    <View className="mt-6 rounded-xl border border-border bg-surface px-4 py-5 dark:border-border-dark dark:bg-surface-dark" testID="condition-ref-in-review">
      <Text variant="h3">{title}</Text>
      <Text variant="body" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
        {body}
      </Text>
    </View>
  );
}

function NotFound({ title, body }: { title: string; body: string }) {
  return (
    <View className="px-5 pt-6" testID="condition-ref-not-found">
      <Text variant="h2">{title}</Text>
      <Text variant="body" className="mt-2 text-text-secondary dark:text-text-secondary-dark">
        {body}
      </Text>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="px-5 pt-4" testID="condition-ref-detail-skeleton">
      <Skeleton className="h-9 w-2/3 rounded-md" />
      <Skeleton className="mt-3 h-5 w-1/3 rounded-md" />
      <Skeleton className="mt-6 h-4 w-1/4 rounded-md" />
      <Skeleton className="mt-2 h-20 w-full rounded-md" />
      <Skeleton className="mt-5 h-4 w-1/4 rounded-md" />
      <Skeleton className="mt-2 h-16 w-full rounded-md" />
    </View>
  );
}
