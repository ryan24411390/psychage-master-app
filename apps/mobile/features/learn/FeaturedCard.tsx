import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable } from 'react-native';

import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';
import type { ArticleListItem } from '@/lib/articles';

// Editor's pick — the one featured article (real, newest published; stub ranking
// until a popularity signal exists). Image-only: a large hero card (rounded +
// border + light shadow per the mobile card grammar; mobile elevates via border,
// DESIGN.mobile.md §1.4/§1.6), no title/meta/CTA text — announced to assistive
// tech via accessibilityLabel. Tap → native reader (haptic.tap).
export const FeaturedCard = memo(function FeaturedCard({ article }: { article: ArticleListItem }) {
  const { fireHaptic } = useHaptics();
  const open = () => {
    fireHaptic('tab');
    router.push(`/article/${article.slug}`);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      onPress={open}
      testID={`learn-featured-${article.slug}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <ArtPanel
        artKey={article.slug}
        imageUrl={article.heroImageUrl}
        className="aspect-[16/10] rounded-2xl border border-border shadow-sm dark:border-border-dark dark:shadow-none"
      />
    </Pressable>
  );
});
