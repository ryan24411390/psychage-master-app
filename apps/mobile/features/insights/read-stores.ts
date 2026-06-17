// Thin impure adapter: reads every local tool singleton and hands the raw records
// to the pure aggregator. Kept separate from aggregate.ts so the aggregation logic
// stays unit-testable without touching MMKV/native storage.
//
// LOCAL-ONLY (SR-4/SR-11): every read is from an on-device store; nothing here
// touches the network, Supabase, analytics or Sentry.

import { dailyRollupReader } from '@/lib/daily-rollup';
import { getMomentStore } from '@/lib/moment-store';
import { getClarityStore } from '@/lib/clarity-store';
import { getMoodJournalStore } from '@/lib/mood-journal-store';
import { getNavigatorStore } from '@/lib/navigator-store';
import { getRelationshipStore } from '@/lib/relationship-store';
import { getSleepStore } from '@/lib/sleep-store';

import { buildToolSummaries, type InsightsInput, type ToolSummary } from './aggregate';

/** Read every tool's local history into one structure (generous caps — all local). */
export function readInsightsInput(): InsightsInput {
  return {
    checkins: dailyRollupReader(getMomentStore()).getRecent(400),
    clarity: getClarityStore().getRecent(100),
    navigator: getNavigatorStore().getRecent(50),
    relationship: getRelationshipStore().loadHistory(),
    mood: getMoodJournalStore().getRecent(400),
    sleep: getSleepStore().getRecent(400),
  };
}

/** Convenience: the home summary rows (newest-used first; empty tools omitted). */
export function readToolSummaries(): ToolSummary[] {
  return buildToolSummaries(readInsightsInput());
}
