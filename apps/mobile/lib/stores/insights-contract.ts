// Typed read-contract between the Insights read-hub and the per-tool producer stores.
//
// `features/insights/read-stores.ts` reads one local singleton per tool and hands the
// raw records to the pure aggregator. That coupling used to be implicit — a producer
// renaming a field Insights reads only surfaced as an error deep inside aggregate.ts.
// This file makes the coupling explicit so the producer groups (C/H/I/J) and the
// Insights consumer (D) can evolve in parallel without colliding.
//
// Two halves:
//   1. Reader interfaces — the exact method surface read-stores.ts invokes. read-stores
//      asserts each singleton `satisfies` its reader, so a removed/renamed METHOD fails
//      at the call site.
//   2. Field-level conformance assertions — the exact record fields the aggregator reads.
//      A renamed/removed FIELD fails right here, locally, with a clear error.
//
// PRODUCER OBLIGATION: a producer store MAY add fields or methods, but MUST NOT rename
// or remove the methods or record fields declared below. If an assertion below fails,
// fix the producer to restore the field/method — do NOT loosen the contract.
//
// Type-only: this module emits no runtime code.

import type { ClaritySnapshot } from '@/features/clarity/result-store';
import type { NavigatorSnapshot } from '@/features/navigator/result-store';
import type { RelationshipHealthResult } from '@/features/relationship-health/types';
import type { DailyEntry } from '@/lib/daily-rollup';
import type { DailyJournalCheckIn } from '@psychage/shared/clarity-journal';
import type { MomentEntry } from '@psychage/shared/mood-journal';
import type { SleepEntry } from '@psychage/shared/sleep';

// ---------------------------------------------------------------------------
// 1. Reader method surface — exactly what read-stores.ts invokes per producer.
// ---------------------------------------------------------------------------

/** Day-rollup reader over the Moments store (`dailyRollupReader(getMomentStore())`). */
export interface CheckinReader {
  getRecent(n: number): readonly DailyEntry[];
}

export interface ClarityReader {
  getRecent(n: number): readonly ClaritySnapshot[];
}

export interface NavigatorReader {
  getRecent(n: number): readonly NavigatorSnapshot[];
}

export interface RelationshipReader {
  loadHistory(): readonly RelationshipHealthResult[];
}

export interface MoodReader {
  getRecent(n: number): readonly MomentEntry[];
}

export interface SleepReader {
  getRecent(n: number): readonly SleepEntry[];
}

/** Clarity Journal — the only store carrying self-reported energy. */
export interface EnergyJournalReader {
  getRecentDailyCheckIns(n: number): readonly DailyJournalCheckIn[];
}

// ---------------------------------------------------------------------------
// 2. Field-level conformance ("teeth"). Each minimal shape lists exactly the
//    fields features/insights/aggregate.ts reads off that record. The assert
//    fails to compile if a producer drops or renames one of those fields.
// ---------------------------------------------------------------------------

type Extends<A, B> = A extends B ? true : false;
type Assert<T extends true> = T;

type _CheckinFields = Assert<Extends<DailyEntry, { readonly date: string }>>;
type _ClarityFields = Assert<
  Extends<ClaritySnapshot, { readonly composite: number; readonly date: string }>
>;
type _NavigatorFields = Assert<Extends<NavigatorSnapshot, { readonly createdAt: string }>>;
type _RelationshipFields = Assert<
  Extends<RelationshipHealthResult, { readonly compositeScore: number; readonly createdAt: string }>
>;
type _MoodFields = Assert<
  Extends<MomentEntry, { readonly createdAt: string; readonly emotions: readonly string[] }>
>;
type _SleepFields = Assert<Extends<SleepEntry, { readonly created_at: string }>>;
type _EnergyFields = Assert<
  Extends<DailyJournalCheckIn, { readonly date: string; readonly energy: number }>
>;
