import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/motion';

export interface ScreenEntranceProps {
  children: React.ReactNode;
  staggerMs?: number;
  delayMs?: number;
}

export function ScreenEntrance({ children, staggerMs = 80, delayMs = 0 }: ScreenEntranceProps) {
  const reduced = useReducedMotion();
  const childrenArray = React.Children.toArray(children);

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <>
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <Animated.View
            key={child.key || index}
            entering={FadeInDown.springify()
              .damping(18)
              .stiffness(150)
              .mass(0.8)
              .delay(delayMs + index * staggerMs)}
          >
            {child}
          </Animated.View>
        );
      })}
    </>
  );
}
