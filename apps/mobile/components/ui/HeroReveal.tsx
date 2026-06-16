import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';

import { heroEnter, useReducedMotion } from '@/lib/motion';

// The app's one signature hero moment. Wrap the element a detail screen shares
// with the card it was opened from — the article's art, a provider's photo — so it
// reveals with a deliberate scale-from + fade (heroEnter / gentle spring) instead
// of cross-fading like everything else. Use sparingly: it earns its weight by being
// rare. Reduced motion collapses it to a plain 200ms fade (handled inside heroEnter).
type HeroRevealProps = {
  children: ReactNode;
  className?: string;
};

export function HeroReveal({ children, className }: HeroRevealProps) {
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={heroEnter(reduced)} className={className}>
      {children}
    </Animated.View>
  );
}
