import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { HomeContainer } from '@/components/home/HomeContainer';
import { FirstRunTour } from '@/features/onboarding/FirstRunTour';
import { useAuth } from '@/features/auth';
import { storage } from '@/lib/adapters/storage';
import { getCheckInStore } from '@/lib/check-in-store';
import { isOnboardingSeen, isWelcomeSeen } from '@/lib/persistence/onboarding';
import { isTourSeen, markTourSeen } from '@/lib/persistence/tour';

// S3 "Today" home. Binds the real (MMKV-backed) CheckInRecordStore to HomeContainer.
//
// First-launch routing (in order):
//   1. Front-door Welcome gate (S0) — shown once, only when NOT signed in and the gate
//      hasn't been engaged. "Continue" there enters anonymously (Tier-1 intact); signed-in
//      users skip it (anonymous-first invariant, Amendment 2026-06-16).
//   2. Product onboarding (S1) — on first run before onboarding is seen.
// The `checkin` param (set by S2's "Do your first check-in") opens S4 over the first-run
// home via HomeContainer's autoOpenCheckIn seam — and suppresses both redirects, since the
// user is arriving FROM onboarding. Importing the shared package at runtime keeps this
// file off the Jest path (Jest does not transform the workspace TS package).
export default function TodayScreen() {
  const { checkin } = useLocalSearchParams<{ checkin?: string }>();
  const { session } = useAuth();
  const store = getCheckInStore();
  const firstRun = store.getRecent(1).length === 0;
  const arrivingFromOnboarding = checkin === '1';
  // One-time cross-tab tour: after onboarding, on a normal launch (never over the
  // auto-opened first check-in sheet). Skippable; never blocks crisis.
  const [showTour, setShowTour] = useState(() => !arrivingFromOnboarding && !isTourSeen(storage));

  if (!session && !arrivingFromOnboarding && !isWelcomeSeen(storage)) {
    return <Redirect href="/welcome" />;
  }

  if (firstRun && !arrivingFromOnboarding && !isOnboardingSeen(storage)) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return (
    <>
      <HomeContainer store={store} autoOpenCheckIn={arrivingFromOnboarding} />
      {showTour && (
        <FirstRunTour
          onDone={() => {
            markTourSeen(storage);
            setShowTour(false);
          }}
        />
      )}
    </>
  );
}
