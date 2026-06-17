// Pure local↔cloud mappers for the Moments sync (SR-4 carve-out, ADR-001 Accepted
// 2026-06-14). Shapes a local `Moment` into the data layer's `MomentInput` for the PUSH,
// and a server `MomentRecord` back into a local `Moment` for the PULL/restore. No I/O, no
// deps — unit-testable in isolation. LOCAL stays the source of truth. Sync is dormant +
// consent-gated; this module only keeps the two shapes interconvertible.
//
// SCHEMA NOTE: the local Moment is now an AFFECT-LABELING shape (labelPrimary/secondary,
// intensity) with NO valence. The server `moments` table is the legacy shape (valence
// NOT NULL, labels[], context[]) and is OUT OF SCOPE to change here. The mapping bridges
// them: a word's band stands in for the server `valence` column (affect is a property of
// the WORD); the word(s) ride in `labels`; `context` is retired (sent empty); `intensity`
// has no server column yet, so it is NOT synced (local-only until the schema gains it).

import type { Moment } from '@psychage/shared/engagement';
import type { MomentInput, MomentRecord } from '@psychage/shared/data';

import { type AffectBand, BAND_ANCHOR_KEYS, bandForLabel } from '@/features/moments/vocab';

/**
 * Shape a local Moment into a data-layer `MomentInput` for `writeMoment`. The id is carried
 * through (the cloud idempotency key — the upsert collides on it); `experienced_at` is the
 * capture instant verbatim. `valence` is derived from the primary word's band to satisfy
 * the legacy NOT-NULL column.
 */
export function mapMomentToInput(moment: Moment, userId: string): MomentInput {
  const labels = [
    moment.labelPrimary,
    ...(moment.labelSecondary !== undefined ? [moment.labelSecondary] : []),
  ];
  return {
    id: moment.id,
    user_id: userId,
    experienced_at: moment.timestamp,
    valence: bandForLabel(moment.labelPrimary),
    labels,
    context: [],
    routed_to_support: moment.routedToSupport,
    ...(moment.note !== undefined ? { note: moment.note } : {}),
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

function clampBand(value: number): AffectBand {
  return Math.min(5, Math.max(1, Math.round(value))) as AffectBand;
}

/**
 * Shape a server `MomentRecord` back into a local `Moment` for the restore lane. The
 * server id/timestamp become the local id/timestamp (so a re-push stays idempotent on the
 * same id). `labels[0]`→labelPrimary, `labels[1]`→labelSecondary; a row with no words
 * (predating word-first capture) falls back to its band's ANCHOR word so no row is lost.
 */
export function mapRecordToMoment(record: MomentRecord): Moment {
  const labels = toStringArray(record.labels);
  const labelPrimary = labels[0] ?? BAND_ANCHOR_KEYS[clampBand(record.valence)];
  return {
    id: record.id,
    timestamp: record.experienced_at,
    labelPrimary,
    routedToSupport: record.routed_to_support === true,
    ...(labels[1] !== undefined ? { labelSecondary: labels[1] } : {}),
    ...(record.note !== undefined && record.note !== null ? { note: record.note } : {}),
  };
}
