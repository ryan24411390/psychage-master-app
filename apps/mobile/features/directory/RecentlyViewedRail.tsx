import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { RecentProvider } from '@/lib/persistence/recently-viewed';

import { Avatar } from './Avatar';
import { DIRECTORY_COPY } from './copy';

// Horizontal "recently viewed" rail for the directory's default (non-search)
// surface. Fed by the local recently-viewed cache (snapshots captured on the
// detail screen) — no network. Tapping re-opens the provider detail. Renders
// nothing when empty.

const t = DIRECTORY_COPY;

export function RecentlyViewedRail({
  items,
  onPress,
}: {
  items: readonly RecentProvider[];
  onPress: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View className="gap-2 pb-3">
      <Text variant="bodyMedium">{t.recentlyViewed}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            onPress={() => onPress(p.id)}
            testID={`recent-${p.id}`}
            className="w-20 items-center gap-1"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Avatar name={p.name} photoUrl={p.photoUrl} />
            <Text
              variant="caption"
              numberOfLines={2}
              className="text-center text-text-secondary dark:text-text-secondary-dark"
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
