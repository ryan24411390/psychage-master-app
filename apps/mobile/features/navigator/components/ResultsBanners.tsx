import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { CrisisCallRow } from '@/features/crisis/components/CrisisCallRow';
import { EmergencyButton } from '@/features/crisis/components/EmergencyButton';
import { CRISIS_COPY } from '@/features/crisis/copy';
import type { HelplineRow } from '@/features/crisis/helpline-schema';
import { useThemeColors } from '@/lib/use-theme-colors';

// Results-screen safety banners — mobile ports of web ResultsScreen's crisis/watch
// notices. The crisis banner reuses the crisis surface's own actions (EmergencyButton +
// CrisisCallRow) rather than rebuilding them, and renders the region helplines (mobile's
// region-resolved list) in place of web's KB crisis_resources cards.

export interface CrisisBannerProps {
  readonly emergencyNumber: string;
  readonly helplines: readonly HelplineRow[];
}

export function CrisisBanner({ emergencyNumber, helplines }: CrisisBannerProps) {
  const tc = useThemeColors();
  return (
    <View
      accessibilityRole="alert"
      className="gap-4 overflow-hidden rounded-xl border border-crisis/30 bg-crisis/5 p-5 dark:border-crisis-dark/30"
    >
      <View className="flex-row items-start gap-3">
        <ShieldAlert size={20} color={tc.crisis} strokeWidth={2} />
        <View className="flex-1 gap-1.5">
          <Text variant="bodyBold">Prioritizing Your Safety</Text>
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            You mentioned experiences that suggest you may be going through a particularly difficult
            time. Your safety matters deeply. Please reach out for immediate support.
          </Text>
        </View>
      </View>
      <EmergencyButton emergencyNumber={emergencyNumber} label={CRISIS_COPY.callEmergency} />
      {helplines.map((row) => (
        <CrisisCallRow key={`${row.region}:${row.name}`} row={row} />
      ))}
    </View>
  );
}

export function WatchBanner() {
  const tc = useThemeColors();
  return (
    <View className="flex-row items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <AlertTriangle size={18} color={tc.inkSecondary} strokeWidth={2} />
      <Text variant="bodySm" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
        Some of your reported experiences are worth monitoring closely. Consider speaking with a
        professional if they persist.
      </Text>
    </View>
  );
}
