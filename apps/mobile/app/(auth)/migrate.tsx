import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { MigrationProgress } from '@/components/auth/MigrationProgress';
import { ScreenShell } from '@/components/ui/ScreenShell';
import {
  lastSevenDayWindow,
  runMigration,
  stubMigrationRemote,
  type MigrationStatus,
} from '@/features/auth';
import { getCheckInStore } from '@/lib/check-in-store';

// S36 — Migration progress (THE LAUNCH-BLOCKER SURFACE). Reads the local record
// (last 7 days, the TTL window — rules/auth.md §4) and runs the merge LOCALLY. The
// remote push is STUBBED/GATED behind the SR-4 ADR (cooling-off → 2026-06-20) — no
// Supabase write happens here. Losing a single local entry during upgrade is a launch
// blocker; the merge that protects against it is unit-tested (Vitest).
export default function MigrateScreen() {
  const [status, setStatus] = useState<MigrationStatus>('merging');
  const [mergedCount, setMergedCount] = useState(0);
  const [conflictsResolved, setConflictsResolved] = useState(0);

  useEffect(() => {
    let active = true;
    void runMigration({
      readLocalEntries: () => {
        const { from, to } = lastSevenDayWindow(new Date());
        return getCheckInStore().getRange(from, to);
      },
      remote: stubMigrationRemote,
    }).then((outcome) => {
      if (!active) return;
      setStatus(outcome.status);
      setMergedCount(outcome.mergedCount);
      setConflictsResolved(outcome.conflictsResolved);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScreenShell>
      <View className="flex-1 justify-center">
        <MigrationProgress
          status={status}
          mergedCount={mergedCount}
          conflictsResolved={conflictsResolved}
        />
      </View>
    </ScreenShell>
  );
}
