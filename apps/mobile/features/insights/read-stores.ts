// Thin impure adapter: reads every local tool singleton and hands the raw records
// to the pure aggregator. Kept separate from aggregate.ts so the aggregation logic
// stays unit-testable without touching MMKV/native storage.
//
// LOCAL-ONLY (SR-4/SR-11): every read is from an on-device store; nothing here
// touches the network, Supabase, analytics or Sentry.

import { dailyRollupReader } from '@/lib/daily-rollup';
import { getMomentStore } from '@/lib/moment-store';
import { moodReaderFromMoments } from '@/lib/mood-reader';
import { getClarityStore } from '@/lib/clarity-store';
import { getClarityJournalStore } from '@/lib/clarity-journal-store';
import { getNavigatorStore } from '@/lib/navigator-store';
import { getRelationshipStore } from '@/lib/relationship-store';
import { getSleepStore } from '@/lib/sleep-store';
import type {
  CheckinReader,
  ClarityReader,
  EnergyJournalReader,
  MoodReader,
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
    // The Mood Journal was folded into Moments (P42–P44): "most noted feeling" now
    // projects feeling words off the one Moments store via moodReaderFromMoments.
    mood: (moodReaderFromMoments(getMomentStore()) satisfies MoodReader).getRecent(400),
    sleep: (getSleepStore() satisfies SleepReader).getRecent(400),
    // Energy lives in the Clarity Journal (1–10, one per day) — the only store that has it.
    // No mobile capture writes it yet, so this is usually empty until that screen lands.
    energy: (getClarityJournalStore() satisfies EnergyJournalReader)
      .getRecentDailyCheckIns(400)
      .map((c) => ({ date: c.date as string, energy: c.energy })),
  };
}

/** Convenience: the home summary rows (newest-used first; empty tools omitted). */
export function readToolSummaries(): ToolSummary[] {
  return buildToolSummaries(readInsightsInput());
}
