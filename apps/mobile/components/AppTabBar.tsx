import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { BookOpen, Compass, type LucideIcon, MapPin, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { colorForScheme, tabBarTokens } from '@/lib/a1-tokens';
import { useHaptics } from '@/lib/haptic-context';
import { DURATION, useReducedMotion } from '@/lib/motion';

// C0.2 — the custom bottom tab bar (Direction B: active pill). The focused tab is
// a content-sized teal pill (icon + label); the rest are icon-only. lucide outline
// icons (CLAUDE.md icon convention) replace the prior teal-dot pictograms per the
// approved redesign. Active teal resolves from the themed primary token so dark
// mode swaps it; the pill tint, hairline, paper bar and label teal are NativeWind
// arbitrary-value classes because an alpha tint and the #157F73 label teal have no
// existing token leaf (a tab-bar-local choice, not a shared palette edit).
//
// Transition: switching tabs animates the pill. Each tab's content is ONE persistent
// Animated.View (not a remounted branch), so LinearTransition morphs its width as the
// label/padding change and reflows the row; the label fades in/out. All gated on
// useReducedMotion() — reduced motion swaps to instant layout, no fade.
// Keyed by the tab route names, which are the group-folder names after the
// per-tab nested-stack restructure ((today)/(learn)/(compass)/(find)).
const ICONS: Record<string, LucideIcon> = {
  '(today)': Sun,
  '(learn)': BookOpen,
  '(compass)': Compass,
  '(find)': MapPin,
};

const ICON_SIZE = 23;

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { fireHaptic } = useHaptics();
  const { colorScheme } = useColorScheme();
  const reduced = useReducedMotion();

  const activeInk = colorForScheme(tabBarTokens.color.iconTealDot, colorScheme);
  const inactiveInk = colorScheme === 'dark' ? '#8A8A8A' : '#6B6660';

  return (
    <SafeAreaView
      edges={['bottom']}
      className="border-t border-border bg-paper dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="min-h-[56px] flex-row items-center justify-around px-2">
        {state.routes.map((route, index) => {
          const Icon = ICONS[route.name];
          const descriptor = descriptors[route.key];
          if (!Icon || !descriptor) return null;

          const label =
            typeof descriptor.options.title === 'string' ? descriptor.options.title : route.name;
          const isActive = state.index === index;

          const onPress = () => {
            fireHaptic('tab');
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;
            if (isActive) {
              // Re-tapping the focused tab pops its nested stack back to the
              // landing (standard tab behavior). canDismiss() guards the no-op
              // case where the tab is already at its root.
              if (router.canDismiss()) router.dismissAll();
            } else {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={label}
              onPress={onPress}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <Animated.View
                layout={
                  reduced 
                    ? undefined 
                    : LinearTransition.springify().damping(20).stiffness(350).mass(0.3)
                }
                className={
                  isActive
                    ? 'flex-row items-center gap-2 rounded-full bg-primary/15 px-4 py-[9px] dark:bg-primary-dark/20'
                    : 'items-center justify-center px-3'
                }
              >
                <Icon size={ICON_SIZE} color={isActive ? activeInk : inactiveInk} />
                {isActive ? (
                  <Animated.View
                    entering={reduced ? undefined : FadeIn.duration(100)}
                    exiting={reduced ? undefined : FadeOut.duration(100)}
                  >
                    <Text
                      variant="caption"
                      className="font-sans-medium text-[13px] tracking-normal text-teal-900 dark:text-teal-400"
                    >
                      {label}
                    </Text>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
