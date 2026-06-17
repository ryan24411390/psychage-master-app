import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/motion';

type BentoGridProps = {
  children: ReactNode;
};

// Responsive stack for the Bento Grid. On mobile, this is a vertical column.
// Children are automatically staggered in for a premium entrance.
export function BentoGrid({ children }: BentoGridProps) {
  const reduced = useReducedMotion();
  const childrenArray = React.Children.toArray(children);

  return (
    <View className="flex-col gap-4">
      {childrenArray.map((child, index) => (
        <Animated.View
          key={index}
          entering={
            reduced
              ? undefined
              : FadeInUp.delay(index * 50)
                  .springify()
                  .damping(18)
                  .stiffness(150)
                  .mass(0.8)
          }
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}
