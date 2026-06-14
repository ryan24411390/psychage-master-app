import { router, Stack } from 'expo-router';

import type { RegionCode } from '@/features/crisis/helpline-schema';
import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';
import {
  defaultDeviceRegionHint,
  loadRegionOverride,
  resolveRegion,
  saveRegionOverride,
} from '@/features/crisis/region';
import { RegionPickerView } from '@/features/crisis/RegionPickerView';
import { storage } from '@/lib/adapters/storage';

// S12 route. The C-SEARCH-LIST region picker. Selecting persists the override
// (local-only) and returns to S11, which re-resolves on focus. Instant navigation
// (animation: 'none') to match the crisis register.

export default function CrisisRegionScreen() {
  const current = resolveRegion({
    storedOverride: loadRegionOverride(storage),
    deviceHint: defaultDeviceRegionHint(),
  });

  const handleSelect = (code: RegionCode) => {
    saveRegionOverride(storage, code);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      <RegionPickerView
        regions={CRISIS_DATASET.regions}
        currentRegion={current}
        onSelect={handleSelect}
        onBack={() => router.back()}
      />
    </>
  );
}
