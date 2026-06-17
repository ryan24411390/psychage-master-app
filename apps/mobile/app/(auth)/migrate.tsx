import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { MigrationProgress } from '@/components/auth/MigrationProgress';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { lastSevenDayWindow, runMigration, type MigrationStatus } from '@/features/auth';
// Real remote imported DIRECTLY (not via the @/features/auth barrel) so its
// transitive check-in-store → Supabase/MMKV chain never loads in Jest-rendered
// paths that import the barrel (check-in-store.ts header).
import { productionMigrationRemote } from '@/features/auth/migration/remote';
import { getMomentStore } from '@/lib/moment-store';

// S36 — Migration progress (THE LAUNCH-BLOCKER SURFACE). Reads the local record
// (last 7 days, the TTL window — rules/auth.md §4) and runs the merge LOCALLY, then
// pushes the merged set to the user's new account as a best-effort PUSH-ONLY backup
// (#72 write path, ADR-001 Accepted). The push is the user's explicit "bring my data"
// action, so a failure surfaces as an honest `offline` outcome (retryable) — never a
// false `done`, and the local record is never touched. Losing a single local entry
// during upgrade is a launch blocker; the merge that protects against it is
// unit-tested (Vitest).
export default function MigrateScreen() {
  const [status, setStatus] = useState<MigrationStatus>('merging');
  const [mergedCount, setMergedCount] = useState(0);
  const [conflictsResolved, setConflictsResolved] = useState(0);

  useEffect(() => {
    let active = true;
    void runMigration({
      readLocalEntries: () => {
        const { from, to } = lastSevenDayWindow(new Date());
        return getMomentStore().getRange(from, to);
      },
      remote: productionMigrationRemote,
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
