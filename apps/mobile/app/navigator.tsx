import { router, Stack } from 'expo-router';

import {
  generateProviderQuestions,
  runSymptomNavigator,
  type NavigatorResults,
  type UserSymptomInput,
} from '@psychage/shared/navigator';

import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';
import {
  defaultDeviceRegionHint,
  getEmergencyNumber,
  getHelplines,
  loadRegionOverride,
  resolveRegion,
} from '@/features/crisis/region';
import { NAVIGATOR_KB } from '@/features/navigator/knowledge-base';
import { NavigatorFlow } from '@/features/navigator/NavigatorFlow';
import { isTierEnabled } from '@/lib/adapters';
import { storage } from '@/lib/adapters/storage';

// S — Symptom Navigator route. The ONLY place the shared navigator engine +
// provider-question generator are imported as VALUES — both are injected into
// NavigatorFlow so the flow + its tests stay off the Jest path (the shared TS package is
// not Jest-transformed; mirrors dev-navigator.tsx). The KB is the real, clinically-
// reviewed data (knowledge-base.ts). Fully on-device, fully offline; the flow's reducer
// state is in-memory, so navigating away leaves zero residue (SR-4).

export default function NavigatorScreen() {
  const region = resolveRegion({
    storedOverride: loadRegionOverride(storage),
    deviceHint: defaultDeviceRegionHint(),
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <NavigatorFlow
        kb={NAVIGATOR_KB}
        runNavigator={(inputs: UserSymptomInput[]) =>
          runSymptomNavigator(inputs, NAVIGATOR_KB, region, isTierEnabled)
        }
        getProviderQuestions={(results: NavigatorResults, inputs: UserSymptomInput[]) =>
          generateProviderQuestions({
            results,
            selectedSymptoms: new Map(inputs.map((i) => [i.symptom_id, i])),
            knowledgeBase: NAVIGATOR_KB,
          })
        }
        onExit={() => router.back()}
        emergencyNumber={getEmergencyNumber(CRISIS_DATASET, region)}
        helplines={getHelplines(CRISIS_DATASET, region)}
        onTrack={() => router.push('/tools/mood-journal')}
        onFindCare={() => router.push('/find')}
        onLearn={() => router.push('/learn')}
      />
    </>
  );
}
