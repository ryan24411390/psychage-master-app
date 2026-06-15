import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { readingProgressStore } from '@/lib/reading-progress-store';
import { ARTICLE_TITLES } from '@/lib/content';

export default function ReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Simulate reading up to 50% to show up in the PickUpRail
      readingProgressStore.setProgress(id, 0.5);
    }
  }, [id]);

  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark p-6 gap-6">
      <Text variant="headingLg" className="text-center">{id ? ARTICLE_TITLES[id] || 'Article' : 'Not Found'}</Text>
      <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
        This is a stub screen for reading an article. We've artificially set your progress to 50% so you can see it in the "Pick up where you left off" rail.
      </Text>
      <Button variant="secondary" onPress={() => router.back()}>
        Back to Today
      </Button>
    </View>
  );
}
