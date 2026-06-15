import { Image } from 'expo-image';
import { Layers } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import type { Toolkit } from './types';

// Index grid card for one published toolkit. The cover uses expo-image as the
// image primitive (cached, list-scroll friendly) layered over a themed tint —
// the content model carries no cover-image column today, so `coverUrl` is
// undefined and the tint shows with a watermark glyph; expo-image is wired so a
// real cover URL drops in later with no structural change.
type ToolkitCardProps = {
  toolkit: Toolkit;
  onPress: (id: string) => void;
  coverUrl?: string;
};

export function ToolkitCard({ toolkit, onPress, coverUrl }: ToolkitCardProps) {
  const tc = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={toolkit.theme_title}
      onPress={() => onPress(toolkit.id)}
      testID={`toolkit-card-${toolkit.id}`}
      className="overflow-hidden rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View className="h-20 w-full items-center justify-center bg-surface-accent dark:bg-surface-accent-dark">
        {coverUrl ? (
          <Image
            source={coverUrl}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <Layers size={22} color={tc.primary} strokeWidth={1.75} />
      </View>
      <View className="gap-1 p-3">
        <Text variant="bodyMedium" numberOfLines={2}>
          {toolkit.theme_title}
        </Text>
        {toolkit.clinical_subtitle ? (
          <Text
            variant="caption"
            numberOfLines={2}
            className="text-text-secondary dark:text-text-secondary-dark"
          >
            {toolkit.clinical_subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
