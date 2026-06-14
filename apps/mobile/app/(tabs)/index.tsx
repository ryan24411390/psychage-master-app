import { Redirect, useLocalSearchParams } from 'expo-router';

import { HomeContainer } from '@/components/home/HomeContainer';
import { storage } from '@/lib/adapters/storage';
import { getCheckInStore } from '@/lib/check-in-store';
import { isOnboardingSeen } from '@/lib/persistence/onboarding';

// S3 "Today" home. Binds the real (MMKV-backed) CheckInRecordStore to HomeContainer.
//
// A2/PR-E: on first launch (no entries) and before onboarding is seen, redirect to S1.
// The `checkin` param (set by S2's "Do your first check-in") opens S4 over the first-run
// home via HomeContainer's autoOpenCheckIn seam — and suppresses the redirect, since the
// user is arriving FROM onboarding. Importing the shared package at runtime keeps this
// file off the Jest path (Jest does not transform the workspace TS package).
export default function TodayScreen() {
  const { checkin } = useLocalSearchParams<{ checkin?: string }>();
  const store = getCheckInStore();
  const firstRun = store.getRecent(1).length === 0;

  if (firstRun && checkin !== '1' && !isOnboardingSeen(storage)) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <HomeContainer store={store} autoOpenCheckIn={checkin === '1'} />;
}
