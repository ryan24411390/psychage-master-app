import { router } from 'expo-router';
import { memo } from 'react';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ArtPanel } from '@/features/learn/ArtPanel';
import { useHaptics } from '@/lib/haptic-context';
import type { ArticleListItem } from '@/lib/articles';

// The content card used inside a topic rail — image-only: the hero (real, blur-
// filled and uncropped via ArtPanel; token gradient as fallback) styled as a
// self-contained card (rounded + border + light shadow per the mobile card
// grammar; mobile elevates via border, DESIGN.mobile.md §1.4/§1.6). No title or
// meta text — the article is announced to assistive tech via accessibilityLabel.
// Tap → native reader (haptic.tap, DESIGN.mobile.md §3.3). memo'd — rails
// re-render on scroll/parent state and the row props are stable.

type ArticleCardProps = {
  article: ArticleListItem;
  /** Width class for the rail (e.g. "w-[300px]"). */
  className?: string;
};

export const ArticleCard = memo(function ArticleCard({ article, className }: ArticleCardProps) {
  const { fireHaptic } = useHaptics();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={article.title}
      accessibilityHint={article.categoryName}
      testID={`learn-article-card-${article.slug}`}
      onPress={() => {
        fireHaptic('tab');
        router.push(`/article/${article.slug}`);
      }}
      className={['active:opacity-90', className].filter(Boolean).join(' ')}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <ArtPanel
        artKey={article.slug}
        imageUrl={article.heroImageUrl}
        readTime={article.readTime}
        className="aspect-[16/10] rounded-2xl border border-border shadow-sm dark:border-border-dark dark:shadow-none"
      />
    </AnimatedPressable>
  );
});
