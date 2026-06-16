import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Link } from 'expo-router';

type PickUpRailProps = {
  // `id` is the article slug; `title` is captured by the reader as it's read.
  reads: { id: string; progress: number; lastAt: number; title?: string; readTime?: number }[];
};

export function PickUpRail({ reads }: PickUpRailProps) {
  if (!reads || reads.length === 0) return null;

  return (
    <View className="mb-6 mt-2">
      <Text variant="heading" className="ml-1 mb-3">
        Pick up where you left off
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5" contentContainerClassName="gap-3">
        {reads.map((r) => (
          <Link key={r.id} href={{ pathname: '/article/[slug]', params: { slug: r.id } }} asChild>
            <Pressable className="w-56 h-32 rounded-xl overflow-hidden bg-surface dark:bg-surface-dark shadow-sm border border-border/40 dark:border-border-dark/40 active:scale-[0.98]">
              {/* Subtle tinted background for visual flair */}
              <View className="absolute inset-0 bg-surface-active dark:bg-surface-active-dark opacity-50" />
              <View className="flex-1 p-4 justify-between">
                <Text variant="bodyBold" className="text-text-primary dark:text-text-primary-dark" numberOfLines={2}>
                  {r.title || 'Article'}
                </Text>
                <View className="h-1 bg-border dark:bg-border-dark rounded-full overflow-hidden w-full">
                  <View className="h-full bg-primary dark:bg-primary-dark" style={{ width: `${r.progress * 100}%` }} />
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
