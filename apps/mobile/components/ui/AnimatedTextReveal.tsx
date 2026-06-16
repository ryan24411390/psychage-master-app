
import { View, type TextProps } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from './Text';
import { useReducedMotion } from '@/lib/motion';

export interface AnimatedTextRevealProps extends TextProps {
  children: string;
  className?: string;
  delayMs?: number;
  direction?: 'up' | 'down';
  staggerMs?: number;
}

export function AnimatedTextReveal({
  children,
  className,
  delayMs = 0,
  direction = 'up',
  staggerMs = 40,
  ...props
}: AnimatedTextRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <Text className={className} {...props}>
        {children}
      </Text>
    );
  }

  const seenCounts = new Map<string, number>();
  const words = children.split(' ').map((word) => {
    const occurrence = seenCounts.get(word) ?? 0;
    seenCounts.set(word, occurrence + 1);
    return { word, key: `${word}-${occurrence}` };
  });

  return (
    <View className="flex-row flex-wrap" accessibilityRole="text" accessibilityLabel={children}>
      {words.map(({ word, key }, index) => {
        const animation = direction === 'up' ? FadeInUp : FadeInDown;
        return (
          <Animated.View
            key={key}
            entering={animation
              .springify()
              .damping(16)
              .stiffness(200)
              .delay(delayMs + index * staggerMs)}
            className="mr-1 mb-1"
          >
            <Text className={className} {...props}>
              {word}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
