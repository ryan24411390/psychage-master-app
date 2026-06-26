import { Image } from 'expo-image';
import { Pressable } from 'react-native';

import { ArtPanel } from '@/features/learn/ArtPanel';
import { topicPoster } from '@/features/learn/topic-posters';
import { useHaptics } from '@/lib/haptic-context';

// One Browse topic card: a full-bleed category poster (3:2), corners rounded, shown
// `cover`. The poster bakes in its own title, optional subtitle, and "Psychage"
// watermark over a dark figure render — so the card adds NO text overlay or label
// (that would double the baked title). Bundled locally (topic-posters.ts) so it
// ships in the app and renders offline. If a slug somehow has no bundled poster,
// ArtPanel's deterministic gradient fills the frame instead of a blank/broken image.

type TopicPosterCardProps = {
  slug: string;
  /** A11y label — the visible title is baked into the poster image. */
  title: string;
  onPress: () => void;
};

export function TopicPosterCard({ slug, title, onPress }: TopicPosterCardProps) {
  const { fireHaptic } = useHaptics();
  const poster = topicPoster(slug);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Opens this topic"
      testID={`topic-card-${slug}`}
      onPress={() => {
        fireHaptic('tab');
        onPress();
      }}
      className="aspect-[3/2] w-full overflow-hidden rounded-2xl"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {poster ? (
        <Image
          source={poster}
          accessibilityIgnoresInvertColors
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <ArtPanel artKey={slug} className="h-full w-full" />
      )}
    </Pressable>
  );
}
