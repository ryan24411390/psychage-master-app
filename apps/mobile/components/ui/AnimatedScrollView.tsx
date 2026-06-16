import type React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/motion';

export interface AnimatedScrollViewProps extends React.ComponentProps<typeof Animated.ScrollView> {
  headerImage?: React.ReactNode;
  headerHeight?: number;
  children: React.ReactNode;
}

export function AnimatedScrollView({
  headerImage,
  headerHeight = 250,
  children,
  scrollEventThrottle = 16,
  ...props
}: AnimatedScrollViewProps) {
  const scrollY = useSharedValue(0);
  const reduced = useReducedMotion();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    
    const translateY = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [-headerHeight / 2, 0, headerHeight * 0.5],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0],
      [2, 1],
      { extrapolateRight: Extrapolation.CLAMP }
    );

    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {headerImage && (
        <Animated.View style={[styles.headerContainer, { height: headerHeight }, headerAnimatedStyle]}>
          {headerImage}
        </Animated.View>
      )}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ paddingTop: headerImage ? headerHeight : 0 }}
        decelerationRate="normal"
        alwaysBounceVertical={true}
        bounces={true}
        showsVerticalScrollIndicator={false}
        overScrollMode="always"
        {...props}
      >
        <View className="bg-surface dark:bg-surface-dark min-h-screen rounded-t-3xl shadow-sm z-10">
          {children}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
});
