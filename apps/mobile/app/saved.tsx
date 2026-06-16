/**
 * /saved — the Saved list route (T-006), reached from Settings → "Saved".
 * Pushed outside the tabs; renders GlobalHeader (keeps the Help-now pill reachable,
 * SR-2) + a back row, then the SavedList. Fires the count-only open event.
 */

import { Stack, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Text } from '@/components/ui/Text';
import { trackSavedListOpened } from '@/features/bookmarks/analytics';
import { BOOKMARKS_COPY } from '@/features/bookmarks/copy';
import { SavedList } from '@/features/bookmarks/SavedList';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function SavedScreen() {
  const tc = useThemeColors();

  useEffect(() => {
    trackSavedListOpened();
  }, []);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <GlobalHeader />
      <View className="flex-row items-center gap-1 px-2 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={24} color={tc.ink} strokeWidth={1.75} />
        </Pressable>
        <Text variant="h2" className="text-text-primary dark:text-text-primary-dark">
          {BOOKMARKS_COPY.list.title}
        </Text>
      </View>
      <SavedList />
    </View>
  );
}
