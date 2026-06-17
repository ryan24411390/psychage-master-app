import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colorForScheme, resolveColorRef } from '@/lib/a1-tokens';

// The S3 "reflection ready" ROW (Flow 12) — sits on the record well, announces an
// ARTIFACT (not something the app says about the person), so it uses the ink-2 Plex
// 500 register, NOT the Fraunces-italic voice. One-time: rendered only while the
// reflection is available AND not yet opened; the container owns that gate.
//
// reflectionRow token group (tokens/mobile.tokens.json). NativeWind needs static
// class strings, so the dp geometry maps 1:1 to className literals (the a1-tokens
// test pins the token values): dot.radius 7 → h/w-[14px] (diameter), gap 8 → gap-2,
// minTarget 44 → min-h-[44px], chevron.size 20. Colors are the token bindings:
// dot → color.primary (bg-primary), text → color.text.secondary (ink-2), chevron →
// color.text.tertiary (ink-3). The chevron is a lucide glyph taking a color string,
// so it resolves through a1-tokens (className can't reach an icon prop) — same seam
// the terrain + StateRows use.

// VERBATIM Flow 12 copy — the only new user-facing string in this slice. Do not alter.
export const REFLECTION_READY_LABEL = 'This week’s reflection is ready.';

export function ReflectionRow({ onOpen }: { onOpen?: () => void }) {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorForScheme(resolveColorRef('color.text.tertiary'), colorScheme);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={REFLECTION_READY_LABEL}
      onPress={onOpen}
      hitSlop={8}
      className="mt-3 min-h-[44px] flex-row items-center gap-2"
    >
      <View className="h-[14px] w-[14px] rounded-full bg-primary dark:bg-primary-dark" />
      <Text
        variant="bodyLarge"
        className="flex-1 text-text-secondary dark:text-text-secondary-dark"
      >
        {REFLECTION_READY_LABEL}
      </Text>
      <ChevronRight size={20} color={chevronColor} />
    </Pressable>
  );
}
