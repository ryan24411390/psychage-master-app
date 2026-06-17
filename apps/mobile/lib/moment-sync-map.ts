// Pure local↔cloud mappers for the Moments sync (SR-4 carve-out, ADR-001 Accepted
// 2026-06-14). Shapes a local `Moment` into the data layer's `MomentInput` for the
// PUSH, and a server `MomentRecord` back into a local `Moment` for the PULL/restore.
// No I/O, no deps — unit-testable in isolation. LOCAL stays the source of truth.
//
// Unlike check-ins (whose 0..4 state mapped onto a 1..10 mood_score), Moment valence
// is already 1..5 and matches the server `valence` column directly — the mapping is
// the identity, so there is no scale to drift.

import type { Moment, MomentValence } from '@psychage/shared/engagement';
import type { MomentInput, MomentRecord } from '@psychage/shared/data';

/**
 * Shape a local Moment into a data-layer `MomentInput` for `writeMoment`. The id is
 * carried through (it is the cloud idempotency key — the upsert collides on it), and
 * `experienced_at` is the moment's capture instant verbatim.
 */
export function mapMomentToInput(moment: Moment, userId: string): MomentInput {
  return {
    id: moment.id,
    user_id: userId,
    experienced_at: moment.timestamp,
    valence: moment.valence,
    labels: [...moment.labels],
    context: [...moment.context],
    routed_to_support: moment.routedToSupport,
    ...(moment.note !== undefined ? { note: moment.note } : {}),
  };
}

/** Clamp an arbitrary server number to the 1..5 valence domain (defensive on pull). */
function toValence(value: number): MomentValence {
  const n = Math.round(value);
  return Math.min(5, Math.max(1, n)) as MomentValence;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * Shape a server `MomentRecord` back into a local `Moment` for the restore lane. The
 * server id/timestamp become the local id/timestamp (so a re-push stays idempotent
 * on the same id). Over-cap labels are truncated defensively — the store's own
 * validation would otherwise reject the whole record on the next normalize.
 */
export function mapRecordToMoment(record: MomentRecord): Moment {
  const base = {
    id: record.id,
    timestamp: record.experienced_at,
    valence: toValence(record.valence),
    labels: toStringArray(record.labels).slice(0, 3),
    context: toStringArray(record.context),
    routedToSupport: record.routed_to_support === true,
  };
  return record.note !== undefined && record.note !== null
    ? { ...base, note: record.note }
    : base;
}
