// DEV-ONLY route. Slice 3a icon-system review surface. NOT a production screen.
// Production-gate or remove before V1 ship (mirrors dev-navigator.tsx).
//
// Renders the mood 5-point scale in BOTH draft directions side by side so
// Dr. Lena Dobson can pick A (abstract level) vs B (minimal face). Mood is an
// emotional concept → VERIFY: nothing here is wired into a live surface; the
// production FillGlyph / Terrain are untouched. Toggle Settings → Appearance to
// review the night palette (the glyphs theme themselves).
//
// Reach in dev via: router.push('/dev-icons').

import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { MoodGlyphFace, MoodGlyphGradient, MOOD_STATES } from '@/components/icon-system/mood';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { STATE_LABELS } from '@/lib/check-in-labels';

function MoodRow({ direction }: { direction: 'gradient' | 'face' }) {
  const Glyph = direction === 'gradient' ? MoodGlyphGradient : MoodGlyphFace;
  return (
    <View className="gap-3">
      <Text variant="caption">
        {direction === 'gradient' ? 'DIRECTION A — abstract level' : 'DIRECTION B — minimal face'}
      </Text>
      <View className="flex-row justify-between">
        {MOOD_STATES.map((state) => (
          <View key={state} className="items-center gap-1.5">
            <Glyph state={state} size={44} />
            <Glyph state={state} size={24} />
            <Text variant="bodySm" className="text-center">
              {STATE_LABELS[state]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DevIconsScreen() {
  if (!__DEV__) {
    return (
      <ScreenShell>
        <Stack.Screen options={{ headerShown: true, title: 'Dev — Icons' }} />
        <Text variant="body" className="py-8">
          Dev-only surface.
        </Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Stack.Screen options={{ headerShown: true, title: 'Dev — Icons' }} />
      <ScrollView contentContainerClassName="gap-8 py-4">
        <View className="gap-2">
          <Text variant="heading">Mood scale — DRAFT</Text>
          <Text variant="body">
            Two directions for the five-point mood glyph (Very low → Very good). Review-only;
            no live surface uses these yet. Dr. Lena Dobson selects A or B before wire-in.
            Each column shows the glyph at 44dp and 24dp; toggle Appearance for the night palette.
          </Text>
        </View>
        <MoodRow direction="gradient" />
        <MoodRow direction="face" />
      </ScrollView>
    </ScreenShell>
  );
}
