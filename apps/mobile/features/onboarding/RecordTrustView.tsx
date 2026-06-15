import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Mascot } from '@/components/home/Mascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { ONBOARDING_COPY } from './copy';

// S2 record + trust (Flow 1). GlobalHeader, the STANDARD mascot (76×88, reused from A1 —
// not a third size step) in the upper third, three verbatim body lines, a primary
// "Do your first check-in" that opens S4 over the first-run home, and a quiet "Look
// around first". Reduced motion: mascot still (the Mascot component handles it). All copy
// VERBATIM Flow Book (now sourced from ./copy — CT4 §1).

const L1 = ONBOARDING_COPY.trustL1;
const L2 = ONBOARDING_COPY.trustL2;
const L3 = ONBOARDING_COPY.trustL3;
const PRIMARY = ONBOARDING_COPY.firstCheckin;
const SECONDARY = ONBOARDING_COPY.lookAround;

export interface RecordTrustViewProps {
  readonly onCheckIn: () => void;
  readonly onLookAround: () => void;
}

export function RecordTrustView({ onCheckIn, onLookAround }: RecordTrustViewProps) {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-1 gap-8 px-6 pt-6">
        <View className="items-center mt-4 mb-2">
          <Mascot />
        </View>
        <Card variant="elevated" className="gap-4 p-5">
          <Text variant="body">{L1}</Text>
          <Text variant="body">{L2}</Text>
          <Text variant="body">{L3}</Text>
        </Card>
      </View>
      <SafeAreaView edges={['bottom']} className="gap-3 px-6 pb-2">
        <Button variant="primary" size="lg" className="w-full" onPress={onCheckIn}>
          {PRIMARY}
        </Button>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={SECONDARY}
          onPress={onLookAround}
          hitSlop={8}
          className="min-h-[52px] items-center justify-center active:scale-[0.98]"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text variant="bodyMedium" className="text-primary dark:text-primary-dark">
            {SECONDARY}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
