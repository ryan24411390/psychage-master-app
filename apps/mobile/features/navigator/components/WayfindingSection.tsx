import type { ElementType, ReactNode } from 'react';
import { type Href, router } from 'expo-router';
import { BookOpen, ChevronRight, Compass, FileText } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { SignalToContent } from '@/lib/discovery/types';
import { openArticle } from '@/lib/nav';
import { useThemeColors } from '@/lib/use-theme-colors';

import { NAVIGATOR_COPY } from '../copy';

// "Explore what we have" — turns a resolved Navigator signal (resolveNavigatorResult)
// into plain WAYFINDING rows: topics (categories), conditions, and reading (articles) to
// OPEN. Pure navigation — a tap is a link: it asserts nothing clinical, reads no scores or
// symptom data, and emits no telemetry. The resolver's mapping is consumed verbatim; this
// component reads only the {slug/id, title, href} refs it returns. Framing is "areas your
// experience touches → here is what we have", NEVER "you have X" (SR-2/SR-3). The 0.75 cap
// and on-device symptom state (SR-1/SR-4) are never read into this layer.
//
// Condition rows route to a LIVE native destination — the resolver maps each condition to
// its owning content-category page (or the `/conditions` index), never the old web-shaped
// `guide_path` that dead-ended on `+not-found`. The fix lives in the resolver
// (lib/discovery/signal-map.ts `conditionHref`); this surface still consumes hrefs verbatim.

type RowProps = {
  readonly icon: ElementType;
  readonly title: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

function Row({ icon: Icon, title, onPress, testID }: RowProps) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      testID={testID}
      className="min-h-[44px] flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4 active:opacity-70 dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-accent/40 dark:bg-surface-accent-dark/20">
        <Icon size={18} color={c.primary} strokeWidth={1.75} />
      </View>
      <Text
        variant="label"
        numberOfLines={2}
        className="flex-1 text-text-primary dark:text-text-primary-dark"
      >
        {title}
      </Text>
      <ChevronRight
        size={18}
        color={c.inkTertiary}
        strokeWidth={1.75}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text
        variant="caption"
        className="uppercase tracking-wide text-text-secondary dark:text-text-secondary-dark"
      >
        {heading}
      </Text>
      {children}
    </View>
  );
}

export function WayfindingSection({ content }: { content: SignalToContent | null }) {
  if (!content) return null;
  const { categories, conditions, articles } = content;
  if (categories.length === 0 && conditions.length === 0 && articles.length === 0) return null;

  return (
    <View className="gap-6 border-b border-border pb-10 dark:border-border-dark">
      <View>
        <Text variant="h2" accessibilityRole="header">
          {NAVIGATOR_COPY.exploreTitle}
        </Text>
        <Text variant="caption" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
          {NAVIGATOR_COPY.exploreCaption}
        </Text>
      </View>

      {categories.length > 0 ? (
        <Group heading={NAVIGATOR_COPY.exploreTopics}>
          {categories.map((cat) => (
            <Row
              key={cat.slug}
              icon={Compass}
              title={cat.title}
              testID={`wayfind-category-${cat.slug}`}
              onPress={() => router.push(cat.href as Href)}
            />
          ))}
        </Group>
      ) : null}

      {conditions.length > 0 ? (
        <Group heading={NAVIGATOR_COPY.exploreConditions}>
          {conditions.map((cond) => (
            <Row
              key={cond.id}
              icon={BookOpen}
              title={cond.title}
              testID={`wayfind-condition-${cond.id}`}
              onPress={() => router.push(cond.href as Href)}
            />
          ))}
        </Group>
      ) : null}

      {articles.length > 0 ? (
        <Group heading={NAVIGATOR_COPY.exploreReading}>
          {articles.map((a) => (
            <Row
              key={a.slug}
              icon={FileText}
              title={a.title}
              testID={`wayfind-article-${a.slug}`}
              onPress={() => openArticle(a.slug)}
            />
          ))}
        </Group>
      ) : null}
    </View>
  );
}
