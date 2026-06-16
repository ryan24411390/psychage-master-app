import { BookOpen } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { WV_ORIGIN } from '@/features/webview/wv-url';
import { useThemeColors } from '@/lib/use-theme-colors';

import { MINDMATE_COPY } from '../copy';
import type { Citation } from '../types';

// Server-provided grounding sources for an assistant reply. Rendered VERBATIM — the
// server validates + de-dupes citations against actually-retrieved content (SR-1 cap
// is server-enforced); the client never re-ranks or fabricates. Tapping a chip opens
// the source article on the web origin (canonical URL — the in-app reader is keyed by
// native slug, which a web url_path can't be safely mapped to here). `onOpen` is
// injectable so the tap is testable without the native Linking layer.
export function Citations({
  citations,
  onOpen = (url) => {
    void Linking.openURL(url).catch(() => {});
  },
}: {
  citations: Citation[];
  onOpen?: (url: string) => void;
}) {
  const tc = useThemeColors();
  if (citations.length === 0) return null;

  return (
    <View className="mt-1.5 w-full gap-1.5 px-4" testID="mindmate-citations">
      <Text
        variant="caption"
        className="text-text-tertiary dark:text-text-tertiary-dark"
      >
        {MINDMATE_COPY.sourcesLabel}
      </Text>
      <View className="gap-1.5">
        {citations.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="link"
            accessibilityLabel={c.title}
            onPress={() => onOpen(`${WV_ORIGIN}${c.url}`)}
            hitSlop={6}
            className="min-h-[36px] flex-row items-center gap-2 self-start rounded-xl border border-border/50 bg-surface px-3 py-2 dark:border-border-dark/50 dark:bg-surface-dark"
            testID={`mindmate-citation-${c.id}`}
          >
            <BookOpen size={14} color={tc.primary} strokeWidth={2} />
            <Text
              variant="bodySmall"
              className="text-text-primary dark:text-text-primary-dark"
            >
              {c.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
