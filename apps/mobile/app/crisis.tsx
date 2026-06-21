import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { CrisisView } from '@/features/crisis/CrisisView';
import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';
import {
  defaultDeviceRegionHint,
  getEmergencyNumber,
  getHelplines,
  getRegionName,
  loadRegionOverride,
  resolveRegion,
} from '@/features/crisis/region';
import { storage } from '@/lib/adapters/storage';
import { useReducedMotion } from '@/lib/motion';

// S11 route. Plain full-screen surface OUTSIDE the tabs (its own Back, no GlobalHeader,
// no tab bar). Slides in/out like every other route (slide_from_right, fade under
// reduced-motion) — the explicit Back control is the close. Offline-complete: the
// dataset ships in the bundle; no network on this path (SR-4-adjacent — nothing about
// the user leaves device).

function resolveActiveRegion() {
  return resolveRegion({
    storedOverride: loadRegionOverride(storage),
    deviceHint: defaultDeviceRegionHint(),
  });
}

export default function CrisisScreen() {
  const reduced = useReducedMotion();
  const [region, setRegion] = useState(resolveActiveRegion);

  // S11 stays mounted under the pushed S12 picker; re-resolve on focus so a region
  // change there is reflected on return.
  useFocusEffect(
    useCallback(() => {
      setRegion(resolveActiveRegion());
    }, []),
  );

  return (
    <>
      <Stack.Screen
        options={{ headerShown: false, animation: reduced ? 'fade' : 'slide_from_right' }}
      />
      <CrisisView
        regionName={getRegionName(CRISIS_DATASET, region)}
        emergencyNumber={getEmergencyNumber(CRISIS_DATASET, region)}
        helplines={getHelplines(CRISIS_DATASET, region)}
        onBack={() => router.back()}
        onChangeRegion={() => router.push('/crisis-region')}
      />
    </>
  );
}
