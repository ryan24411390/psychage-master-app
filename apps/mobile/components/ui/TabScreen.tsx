import { NavigationContext } from '@react-navigation/native';
import { type ReactNode, useContext, useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DURATION, SPRING_PRESETS, easingFn, useReducedMotion } from '@/lib/motion';

// Wraps a tab screen's content so it cross-fades + settles up a few px each time
// the tab becomes focused. A plain `entering` animation can't do this: tab screens
// stay mounted, so we re-trigger off the navigation focus listener rather than
// mount. The same `calm` spring drives every tab → all four feel identical.
//
// We read NavigationContext directly instead of useIsFocused() so the component
// never throws outside a navigator (tests, previews) — there it simply renders
// its content statically (focused = true, no listeners).
//
// Reduced motion: content is in place (no fade, no translate).

/** Upward settle distance on focus, px (spec: 8–12px). */
const TAB_ENTER_TRANSLATE = 10;

function useNavFocus(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    if (!navigation) return;
    setFocused(navigation.isFocused());
    const subFocus = navigation.addListener('focus', () => setFocused(true));
    const subBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      subFocus();
      subBlur();
    };
  }, [navigation]);
  return focused;
}

type TabScreenProps = {
  children: ReactNode;
  className?: string;
};

export function TabScreen({ children, className }: TabScreenProps) {
  const reduced = useReducedMotion();
  const focused = useNavFocus();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    if (focused) {
      // Reset to the start pose, then animate in — withTiming/withSpring read the
      // just-set current value (0 opacity / +translate) as their start.
      opacity.value = 0;
      translateY.value = TAB_ENTER_TRANSLATE;
      opacity.value = withTiming(1, { duration: DURATION.base, easing: easingFn('out') });
      translateY.value = withSpring(0, SPRING_PRESETS.calm);
    }
  }, [focused, reduced, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style} className={className ?? 'flex-1'}>
      {children}
    </Animated.View>
  );
}
