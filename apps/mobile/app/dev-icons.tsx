// DEV-ONLY route. Slice 3a icon-system review surface. NOT a production screen.
// Production-gate or remove before V1 ship (mirrors dev-navigator.tsx).
//
// Renders the mood 5-point scale glyph (MoodGlyphFace — the direction Dr. Lena
// Dobson chose and signed off) at two sizes as a dev reference. This is the same
// glyph now wired into the live check-in surfaces (StateRows + EntryDetailSheet).
// Toggle Settings → Appearance to review the night palette (the glyph themes
// itself).
//
// Reach in dev via: router.push('/dev-icons').

import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { MoodGlyphFace, MOOD_STATES } from '@/components/icon-system/mood';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { DAILY_STATE_LABELS as STATE_LABELS } from '@/lib/daily-rollup';

function MoodRow() {
  return (
    <View className="gap-3">
      <Text variant="caption">MOOD FACE — minimal face (wired)</Text>
      <View className="flex-row justify-between">
        {MOOD_STATES.map((state) => (
          <View key={state} className="items-center gap-1.5">
            <MoodGlyphFace state={state} size={44} />
            <MoodGlyphFace state={state} size={24} />
            <Text variant="caption" className="text-center">
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
          <Text variant="h2">Mood scale</Text>
          <Text variant="body">
            The five-point mood glyph (Very low → Very good) — Dr. Lena Dobson's chosen face,
            now wired into check-in. Each column shows the glyph at 44dp and 24dp; toggle
            Appearance for the night palette.
          </Text>
        </View>
        <MoodRow />
      </ScrollView>
    </ScreenShell>
  );
}
