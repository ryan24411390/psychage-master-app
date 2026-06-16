import { Linking, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { CT4_CONTENT } from '@/features/content/copy';
import type { Citation } from '@/lib/articles';

// Reader References section — the article's sources (article_citations), rendered
// verbatim and numbered to match the inline citation markers in the body. Each
// entry links out to the source (url, else a DOI link). Nothing is invented or
// paraphrased; an article with no citations renders nothing.

function formatMeta(c: Citation): string {
  const parts: string[] = [];
  if (c.authors.length > 0) parts.push(c.authors.join(', '));
  if (c.year != null) parts.push(`(${c.year})`);
  if (c.journalName) parts.push(c.journalName);
  return parts.join(' · ');
}

function sourceHref(c: Citation): string | null {
  if (c.url) return c.url;
  if (c.doi) return `https://doi.org/${c.doi}`;
  return null;
}

export function Citations({ items }: { items: readonly Citation[] }) {
  if (items.length === 0) return null;
  return (
    <View
      className="mt-4 gap-2 border-t border-border pt-4 dark:border-border-dark"
      testID="article-references"
    >
      <Text variant="h5">{CT4_CONTENT.referencesTitle}</Text>
      {items.map((c, i) => {
        const meta = formatMeta(c);
        const href = sourceHref(c);
        return (
          <View key={`${c.sortOrder}-${c.title}`} className="flex-row gap-2">
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {`${i + 1}.`}
            </Text>
            <View className="flex-1 gap-0.5">
              <Text variant="bodySmall" className="leading-5">
                {c.title}
              </Text>
              {meta ? (
                <Text
                  variant="caption"
                  className="text-text-secondary dark:text-text-secondary-dark"
                >
                  {meta}
                </Text>
              ) : null}
              {href ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={CT4_CONTENT.viewSource}
                  onPress={() => void Linking.openURL(href).catch(() => {})}
                  hitSlop={6}
                >
                  <Text
                    variant="caption"
                    className="text-primary underline dark:text-primary-dark"
                  >
                    {CT4_CONTENT.viewSource}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
