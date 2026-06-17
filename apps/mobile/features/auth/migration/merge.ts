import { type Moment, mergeMoments } from '@psychage/shared/engagement';

// Anonymous → account MOMENTS merge. LOCAL + Vitest-testable; this is the part of the
// upgrade (Flow 9 / SYS-S5) that must NEVER lose a moment — losing local data during
// upgrade is a launch blocker.
//
// Moments are append-only and carry a CLIENT-MINTED id, so the merge is a union BY ID
// (not by calendar day, as the retired check-in merge was): every distinct id from
// either set appears once. A shared id means the same capture exists on both sides
// (the local copy already synced); local wins the tie. In V1 the account side is empty
// (a fresh account; rules/auth.md §4 — one-way, one-time, no account-merge), so no real
// collision occurs; this is the forward-looking generalisation.

export interface MergeResult {
  /** Union of both sets, one moment per id, sorted ascending by timestamp. */
  readonly merged: readonly Moment[];
  /** Count of ids present in BOTH sets (resolved local-wins). */
  readonly conflictsResolved: number;
}

export function mergeMomentRecords(
  accountMoments: readonly Moment[],
  localMoments: readonly Moment[],
): MergeResult {
  const accountIds = new Set(accountMoments.map((m) => m.id));
  let conflictsResolved = 0;
  for (const m of localMoments) if (accountIds.has(m.id)) conflictsResolved += 1;

  return { merged: mergeMoments(localMoments, accountMoments), conflictsResolved };
}
