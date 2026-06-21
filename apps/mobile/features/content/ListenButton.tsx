// P21 — "Listen to this article" control (accessibility). Reads the full article
// start to finish via expo-speech (title → subtitle → every body block). Idle shows a
// single Listen pill; while reading it becomes Pause/Resume with a trailing Stop. The
// hook owns playback + stops on unmount.

import { Pause, Play, Square, Volume2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';
import { CT4_CONTENT } from './copy';
import { useReadAloud } from './use-read-aloud';

const PILL =
  'min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 dark:border-border-dark dark:bg-surface-dark';

export function ListenButton({ segments }: { segments: readonly string[] }) {
  const tc = useThemeColors();
  const { status, hasContent, play, pause, stop } = useReadAloud(segments);

  if (!hasContent) return null;

  const t = CT4_CONTENT.readAloud;
  const playing = status === 'playing';
  const Icon = playing ? Pause : status === 'paused' ? Play : Volume2;
  const label = playing ? t.pause : status === 'paused' ? t.resume : t.listen;

  return (
    <View className="flex-row items-center gap-2" testID="article-listen">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: playing }}
        accessibilityLabel={label}
        testID="article-listen-toggle"
        onPress={playing ? pause : play}
        className={PILL}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Icon size={18} color={tc.primary} strokeWidth={1.75} />
        <Text className="font-sans-medium text-base text-text-primary dark:text-text-primary-dark">
          {label}
        </Text>
      </Pressable>

      {status !== 'idle' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.stop}
          testID="article-listen-stop"
          onPress={stop}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-border dark:border-border-dark"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Square size={16} color={tc.inkSecondary} strokeWidth={2} fill={tc.inkSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
