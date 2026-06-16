import { memo, useMemo } from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';

import { useReducedMotion, DURATION, easingFn } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Brand loading mark, ported from the web preloader (psychage-v2
// public/animations/preloader.json → lottie-web). The web asset is a one-shot
// intro whose orbit stops a hexagon edge short of its start and whose dots fade
// in once; looping it pops. The bundled app-loader.json is the derived LOOP
// variant — the teal dot orbits a closed hexagon over a static dark-dot
// constellation, so it cycles seamlessly. Layer names `Teal_Dot` /
// `Black_Dots_Group` are kept as colorFilter keypaths for theme recolor.
//
// Convention #9 note: NativeWind owns the box sizing (the wrapper className);
// LottieView is a third-party native view NativeWind can't className-interop, so
// it fills its sized parent via a fixed style — the same sanctioned exception as
// Reanimated value objects.

import appLoaderSource from '@/assets/animations/app-loader.json';

export type AppLoaderSize = 'sm' | 'md' | 'lg';

type AppLoaderProps = {
  /** 32 / 64 / 120 px. Default `md`. */
  size?: AppLoaderSize;
  /** Fill + center the parent (replaces a centered fullscreen spinner). */
  fullscreen?: boolean;
  /** Loop the orbit (default). `false` plays it once. */
  loop?: boolean;
  /** Accessibility label announced to screen readers. */
  label?: string;
  testID?: string;
  /** Extra classes on the outer container. */
  className?: string;
};

const sizeClasses: Record<AppLoaderSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-[120px] h-[120px]',
};

function AppLoaderComponent({
  size = 'md',
  fullscreen = false,
  loop = true,
  label = 'Loading',
  testID,
  className,
}: AppLoaderProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();

  // Recolor the two named layers per active scheme. Teal tracks the brand accent
  // (#1A9B8C light / #20B8A6 dark). The dark dots are near-black in the raw asset,
  // which is invisible on the true-black dark canvas — so they flip to a light ink
  // in dark mode. Memoized so a parent re-render doesn't churn a new filter array.
  const colorFilters = useMemo(
    () => [
      { keypath: 'Teal_Dot', color: tc.primary },
      { keypath: 'Black_Dots_Group', color: tc.ink },
    ],
    [tc.primary, tc.ink],
  );

  const lottie = (
    <View className={sizeClasses[size]}>
      <LottieView
        source={appLoaderSource}
        // Reduced motion: hold a representative static frame, no animation.
        autoPlay={!reduced}
        loop={!reduced && loop}
        progress={reduced ? 0.5 : undefined}
        colorFilters={colorFilters}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );

  const containerClass = fullscreen
    ? ['flex-1 items-center justify-center bg-background dark:bg-background-dark', className]
    : ['items-center justify-center', className];

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
      exiting={reduced ? undefined : FadeOut.duration(DURATION.swift)}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
      className={containerClass.filter(Boolean).join(' ')}
    >
      {lottie}
    </Animated.View>
  );
}

/** Reusable brand Lottie loader. Memoized — props are primitives, so it only
 *  re-renders on a genuine size/mode/theme change. */
export const AppLoader = memo(AppLoaderComponent);
