import { Phone } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';

import { type Dial, dial as defaultDial } from '../dialer';
import { telUrl } from '../intents';

// The single FILLED rust element in the entire app — the loudest thing on any
// surface. Full-width, ≥60px. Dials the region-correct emergency number directly
// (tel: intent, no intermediate screen). PLAIN register: no gradient, no animation,
// reduced-motion == full-motion (there is no motion). A haptic CONFIRM on press is
// the one sanctioned sensory feedback on this surface (DESIGN.mobile.md crisis rule:
// "essential feedback only").
//
// `label` is the verbatim Flow Book string, passed by S11. `dial` is injectable so a
// render test asserts the exact tel: intent formed without touching the native layer.

export interface EmergencyButtonProps {
  readonly emergencyNumber: string;
  readonly label: string;
  readonly dial?: Dial;
}

export function EmergencyButton({ emergencyNumber, label, dial = defaultDial }: EmergencyButtonProps) {
  const { fireHaptic } = useHaptics();

  const handlePress = () => {
    fireHaptic('affirm');
    dial(telUrl(emergencyNumber));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      className="min-h-[60px] w-full items-center justify-center rounded-lg bg-crisis px-5 py-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View className="flex-row items-center gap-2">
        <Phone size={22} color="#FFFFFF" strokeWidth={2} />
        <Text variant="bodyBold" className="text-center text-white">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
