import { router, Stack } from 'expo-router';

import { runSymptomNavigator, type UserSymptomInput } from '@psychage/shared/navigator';

import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';
import {
  defaultDeviceRegionHint,
  getEmergencyNumber,
  getHelplines,
  loadRegionOverride,
  resolveRegion,
} from '@/features/crisis/region';
import { toSymptomOptions } from '@/features/navigator/areas';
import { CLARIFIERS } from '@/features/navigator/clarifiers';
import { NAVIGATOR_KB } from '@/features/navigator/kb.fixtures';
import { NavigatorFlow } from '@/features/navigator/NavigatorFlow';
import { isTierEnabled } from '@/lib/adapters';
import { storage } from '@/lib/adapters/storage';

// S13–S18 route. The ONLY place the shared navigator engine is imported as a value —
// it is injected into NavigatorFlow so the flow + its tests stay off the Jest path
// (the shared TS package is not Jest-transformed; mirrors dev-navigator.tsx). Fully
// on-device, fully offline. The flow's reducer state is in-memory, so navigating away
// leaves zero residue (SR-4).

export default function NavigatorScreen() {
  const region = resolveRegion({
    storedOverride: loadRegionOverride(storage),
    deviceHint: defaultDeviceRegionHint(),
  });
  const symptoms = toSymptomOptions(NAVIGATOR_KB.symptoms);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <NavigatorFlow
        symptoms={symptoms}
        clarifiers={CLARIFIERS}
        runNavigator={(inputs: UserSymptomInput[]) =>
          runSymptomNavigator(inputs, NAVIGATOR_KB, region, isTierEnabled)
        }
        onExit={() => router.back()}
        emergencyNumber={getEmergencyNumber(CRISIS_DATASET, region)}
        helplines={getHelplines(CRISIS_DATASET, region)}
        // Onward paths. Learn/Find are B2-owned tab stubs; Toolkit (S19) lands in PR C
        // (this href resolves when PR C merges).
        onReadAbout={() => router.push('/learn')}
        onSteadyingNow={() => router.push('/toolkit')}
        onFindCare={() => router.push('/find')}
      />
    </>
  );
}
