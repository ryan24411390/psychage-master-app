import { BookOpen } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
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
    <View className="mt-1 w-full gap-2 px-1" testID="mindmate-citations">
      <Text
        variant="caption"
        className="text-xs font-medium uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark"
      >
        {MINDMATE_COPY.sourcesLabel}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {citations.map((c) => (
          <AnimatedPressable
            key={c.id}
            accessibilityRole="link"
            accessibilityLabel={c.title}
            onPress={() => onOpen(`${WV_ORIGIN}${c.url}`)}
            hitSlop={6}
            className="flex-row items-center gap-1.5 rounded-full border border-border/40 bg-surface/80 px-3 py-1.5 shadow-sm dark:border-border-dark/40 dark:bg-surface-dark/80"
            scaleTo={0.97}
            haptic="tab"
            testID={`mindmate-citation-${c.id}`}
          >
            <BookOpen size={12} color={tc.primary} strokeWidth={2.5} />
            <Text
              variant="caption"
              className="font-medium text-text-secondary dark:text-text-secondary-dark"
              numberOfLines={1}
            >
              {c.title}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}
