// Thin impure adapter: reads every local tool singleton and hands the raw records
// to the pure aggregator. Kept separate from aggregate.ts so the aggregation logic
// stays unit-testable without touching MMKV/native storage.
//
// LOCAL-ONLY (SR-4/SR-11): every read is from an on-device store; nothing here
// touches the network, Supabase, analytics or Sentry.

import { dailyRollupReader } from '@/lib/daily-rollup';
import { getMomentStore } from '@/lib/moment-store';
import { getClarityStore } from '@/lib/clarity-store';
import { getNavigatorStore } from '@/lib/navigator-store';
import { getRelationshipStore } from '@/lib/relationship-store';
import { getSleepStore } from '@/lib/sleep-store';
import { toolUsageStore } from '@/lib/tool-usage-store';
import type {
  CheckinReader,
  ClarityReader,
  MomentsReader,
  NavigatorReader,
  RelationshipReader,
  SleepReader,
} from '@/lib/stores/insights-contract';

import { buildToolSummaries, type InsightsInput, type ToolSummary } from './aggregate';

/** Read every tool's local history into one structure (generous caps — all local). */
export function readInsightsInput(): InsightsInput {
  // Each singleton is asserted (`satisfies`) against its reader interface in
  // @/lib/stores/insights-contract — a removed/renamed reader method fails here.
  return {
    checkins: (dailyRollupReader(getMomentStore()) satisfies CheckinReader).getRecent(400),
    clarity: (getClarityStore() satisfies ClarityReader).getRecent(100),
    navigator: (getNavigatorStore() satisfies NavigatorReader).getRecent(50),
    relationship: (getRelationshipStore() satisfies RelationshipReader).loadHistory(),
    // The single Moments projection (P45–P48): the Insights spine reads the raw moments
    // off the one store. The home "Your tools" card still derives its Moments row from
    // `checkins` above (same store, day-rollup view) — one store, two read shapes.
    moments: (getMomentStore() satisfies MomentsReader).getRecent(400),
    sleep: (getSleepStore() satisfies SleepReader).getRecent(400),
    // Which tools were opened, and when — drives the "Your Tools" recency rail. Local MMKV.
    toolUsage: toolUsageStore.getUsage(),
  };
}

/** Convenience: the home summary rows (newest-used first; empty tools omitted). */
export function readToolSummaries(): ToolSummary[] {
  return buildToolSummaries(readInsightsInput());
}
