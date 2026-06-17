import { Switch, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// A labelled binary toggle row (S43 reminder on/off, S45 reduce-motion). The
// Switch is the platform affordance; its "on" track uses the brand primary — this
// is distinct from the C-RADIO selection-mark rule (those marks are charcoal,
// never teal). A binary switch is not a selection mark.

type SettingsToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
};

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
  testID,
}: SettingsToggleRowProps) {
  // "On" track follows the themed brand primary so it reads on the dark canvas.
  const tc = useThemeColors();
  return (
    <View className="min-h-[52px] flex-row items-center gap-3 px-4 py-3 border-b border-border-hairline last:border-b-0">
      <View className="flex-1 gap-0.5">
        <Text variant="bodyLarge">{label}</Text>
        {description ? (
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: tc.primary }}
        testID={testID}
      />
    </View>
  );
}
