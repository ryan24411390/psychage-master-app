import React from 'react';
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

  const words = children.split(' ');

  return (
    <View className="flex-row flex-wrap" accessibilityRole="text" accessibilityLabel={children}>
      {words.map((word, index) => {
        const animation = direction === 'up' ? FadeInUp : FadeInDown;
        return (
          <Animated.View
            key={`${word}-${index}`}
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
