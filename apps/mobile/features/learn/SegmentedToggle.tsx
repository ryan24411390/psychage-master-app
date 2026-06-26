import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';

// Two-segment control on a gray track: the active segment is a white pill, the
// inactive one is muted text on the track. Controlled by the parent (UI state, not
// server data). Used for the Browse "Topics / Conditions" switch. Equal-width
// segments — both labels are short, so no horizontal scroll.
//
// Selection toggles COLOR only (bg/text) — never a shape-affecting class (shadow/
// animation/transition/active:). Toggling such a class on re-render trips NativeWind's
// css-interop "upgrade" warning, whose stringify walks a child element's owner fiber
// into React Navigation's context getter and redboxes under the JS debugger.

export type SegmentedToggleProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const { fireHaptic } = useHaptics();
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row rounded-full bg-surface-active p-1 dark:bg-surface-active-dark"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            onPress={() => {
              if (selected) return;
              fireHaptic('tab');
              onChange(opt.value);
            }}
            className={[
              'min-h-[40px] flex-1 items-center justify-center rounded-full',
              selected ? 'bg-surface dark:bg-surface-dark' : 'bg-transparent',
            ].join(' ')}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Text
              variant="body"
              numberOfLines={1}
              className={
                selected
                  ? 'font-sans-medium text-text-primary dark:text-text-primary-dark'
                  : 'font-sans-medium text-text-secondary dark:text-text-secondary-dark'
              }
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
