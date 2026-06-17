import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

// A calm navigation row for the Settings hub and its sub-screens. Label
// left, optional value + chevron right. Enhanced with Reanimated for a
// fluid spring compression press interaction in the Bento Grid.

type SettingsRowProps = {
  label: string;
  /** Trailing value text (e.g. the current reminder time, the selected mode). */
  value?: string;
  onPress?: () => void;
  /** Show the trailing chevron (navigation affordance). Default true. */
  chevron?: boolean;
  /** Tints the label as a destructive entry point (charcoal→error). Default false. */
  destructive?: boolean;
  /** Leading icon slot. */
  icon?: ReactNode;
  testID?: string;
};

const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };

export function SettingsRow({
  label,
  value,
  onPress,
  chevron = true,
  destructive = false,
  icon,
  testID,
}: SettingsRowProps) {
  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isPressed.value ? 0.98 : 1, SPRING_CONFIG) }],
    opacity: withSpring(isPressed.value ? 0.7 : 1, SPRING_CONFIG),
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={() => (isPressed.value = true)}
        onPressOut={() => (isPressed.value = false)}
        testID={testID}
        className="min-h-[52px] flex-row items-center gap-3 px-4 py-3 border-b border-border-hairline last:border-b-0"
      >
        {icon ? <View>{icon}</View> : null}
        <Text
          variant="bodyLarge"
          className={`flex-1 ${destructive ? 'text-error dark:text-error-dark' : ''}`}
        >
          {label}
        </Text>
        {value ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {value}
          </Text>
        ) : null}
        {chevron ? (
          <ChevronRight size={18} color={colors.charcoal[400]} strokeWidth={2} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
