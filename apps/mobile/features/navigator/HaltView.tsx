import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { CrisisCallRow } from '@/features/crisis/components/CrisisCallRow';
import { EmergencyButton } from '@/features/crisis/components/EmergencyButton';
import { CRISIS_COPY } from '@/features/crisis/copy';
import type { HelplineRow } from '@/features/crisis/helpline-schema';

import { NAVIGATOR_COPY } from './copy';

// S17 — the Navigator halt. Fires on a "Yes" to the severity question OR on a
// CRISIS-flagged selection (the engine's safety screen). PLAIN register, NO mascot.
// EMBEDS the crisis surface's own primary actions (emergency button + helplines) by
// reusing S11's components — never a rebuilt crisis UI. A quiet "Go back" covers a
// mis-tap; the flow never resumes into results past a halt without walking back.
//
// Lead copy is VERBATIM Flow Book (Flow 13), sourced from ./copy (CT4 §9); the
// embedded emergency label is single-sourced from the crisis copy.
const HALT_LEAD = NAVIGATOR_COPY.haltLead;
const EMERGENCY_LABEL = CRISIS_COPY.callEmergency;

export interface HaltViewProps {
  readonly emergencyNumber: string;
  readonly helplines: readonly HelplineRow[];
  readonly onGoBack: () => void;
}

export function HaltView({ emergencyNumber, helplines, onGoBack }: HaltViewProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-8">
        <Text variant="h2" accessibilityRole="header">
          {HALT_LEAD}
        </Text>

        <EmergencyButton emergencyNumber={emergencyNumber} label={EMERGENCY_LABEL} />

        {helplines.map((row) => (
          <CrisisCallRow key={`${row.region}:${row.name}`} row={row} />
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={NAVIGATOR_COPY.goBack}
          onPress={onGoBack}
          hitSlop={8}
          className="min-h-[44px] justify-center"
        >
          <Text
            variant="bodySmall"
            className="text-text-secondary underline dark:text-text-secondary-dark"
          >
            {NAVIGATOR_COPY.goBack}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
