import { ShieldAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { EmergencyButton } from '@/features/crisis/components/EmergencyButton';
import { CRISIS_COPY } from '@/features/crisis/copy';
import { useThemeColors } from '@/lib/use-theme-colors';

// Inline crisis notice shown on the symptom screen when a CRISIS-flagged symptom is
// selected — mobile port of web SafetyBanner. Non-halting and informational (the full
// halt is the safety question / engine red-flag screen → HaltView); this just surfaces
// immediate support without interrupting selection. Reuses the crisis EmergencyButton.

export interface SafetyBannerProps {
  readonly emergencyNumber: string;
}

export function SafetyBanner({ emergencyNumber }: SafetyBannerProps) {
  const tc = useThemeColors();
  return (
    <View
      accessibilityRole="alert"
      className="gap-3 rounded-xl border border-crisis/30 bg-crisis/5 p-4 dark:border-crisis-dark/30"
    >
      <View className="flex-row items-start gap-3">
        <ShieldAlert size={20} color={tc.crisis} strokeWidth={2} />
        <Text variant="bodyMedium" className="flex-1 text-text-primary dark:text-text-primary-dark">
          If you're in crisis or thinking about harming yourself, support is available right now.
        </Text>
      </View>
      <EmergencyButton emergencyNumber={emergencyNumber} label={CRISIS_COPY.callEmergency} />
    </View>
  );
}
