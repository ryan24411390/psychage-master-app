import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { CompassPictogram } from '@/components/pictograms/Compass';
import { FindPictogram } from '@/components/pictograms/Find';
import { LearnPictogram } from '@/components/pictograms/Learn';
import type { PictogramProps } from '@/components/pictograms/shared';
import { TodayPictogram } from '@/components/pictograms/Today';
import { Text } from '@/components/ui/Text';
import { colorForScheme, tabBarTokens } from '@/lib/a1-tokens';
import { useHaptics } from '@/lib/haptic-context';

// C0.2 custom tab bar — applies the `tabBar` token group. Four tabs, labels
// ALWAYS visible (no icon-only mode), NO badges ever. Active = pressed pill
// (surface.active bg + a layered-overlay inset; RN has no native inset shadow —
// the overlay is a thin charcoal.950 strip along the pill's top inner edge per
// tabBar.activePill.insetShadow). Inactive = flat. Pictogram ink + label color
// follow active/inactive state (the only "weight" change — same glyph either way).
// Reduced motion: tab switches are instant (no transition is configured).

const PICTOGRAMS: Record<string, ComponentType<PictogramProps>> = {
  index: TodayPictogram,
  learn: LearnPictogram,
  compass: CompassPictogram,
  find: FindPictogram,
};

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { fireHaptic } = useHaptics();
  const { colorScheme } = useColorScheme();
  const activeInk = colorForScheme(tabBarTokens.color.labelActive, colorScheme);
  const inactiveInk = colorForScheme(tabBarTokens.color.labelInactive, colorScheme);

  return (
    <SafeAreaView
      edges={['bottom']}
      className="flex-row border-t border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
    >
      {state.routes.map((route, index) => {
        const Pictogram = PICTOGRAMS[route.name];
        const descriptor = descriptors[route.key];
        if (!Pictogram || !descriptor) return null;

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
          if (!isActive && !event.defaultPrevented) {
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
            className="flex-1 items-center justify-center py-1.5"
          >
            <View
              className={`min-h-[44px] items-center justify-center gap-0.5 rounded-lg px-3 ${
                isActive ? 'bg-surface-active dark:bg-surface-active-dark' : ''
              }`}
            >
              {isActive && (
                <View className="absolute left-0 right-0 top-0 h-[1.5px] rounded-t-lg bg-charcoal-950/10" />
              )}
              <Pictogram color={isActive ? activeInk : inactiveInk} />
              <Text
                variant="caption"
                className={`text-xs tracking-wide ${
                  isActive
                    ? 'text-text-primary dark:text-text-primary-dark font-sans-medium'
                    : 'text-text-secondary dark:text-text-secondary-dark'
                }`}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </SafeAreaView>
  );
}
