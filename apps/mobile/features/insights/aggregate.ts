// Pure cross-tool aggregation for the home "Your tools" summary + the Insights
// screen. React-free and store-free (takes already-read records as input) so it is
// fully Vitest-testable. LOCAL-ONLY by construction: it only ever receives data the
// caller read from on-device stores; it never reaches the network.
//
// Educational framing only (SR-2/SR-3): no diagnostic language, no condition claims.
// Navigator confidence is never surfaced here (SR-1 lives in the Navigator views).

import type { MomentEntry } from '@psychage/shared/mood-journal';
import type { SleepEntry } from '@psychage/shared/sleep';

import type { DailyEntry } from '@/lib/daily-rollup';
import type { ClaritySnapshot } from '@/features/clarity/result-store';
import type { NavigatorSnapshot } from '@/features/navigator/result-store';
import type { RelationshipHealthResult } from '@/features/relationship-health/types';

export type ToolKey = 'checkin' | 'clarity' | 'navigator' | 'relationship' | 'mood' | 'sleep';

/** A compact, presentational summary of one tool's local history. */
export interface ToolSummary {
  readonly key: ToolKey;
  readonly name: string;
  /** Short, educational metric line (e.g. "Latest clarity 64", "5 check-ins"). */
  readonly metric: string;
  /** Total stored entries/results for ordering + the count chip. */
  readonly count: number;
  /** Epoch ms of the most recent entry — drives "in the order you used them". */
  readonly lastAt: number;
  /** Route to that tool's full history/dashboard. */
  readonly route: string;
}

/** Raw, already-read store records. Caller reads the singletons; this stays pure. */
export interface InsightsInput {
  readonly checkins: readonly DailyEntry[];
  readonly clarity: readonly ClaritySnapshot[];
  readonly navigator: readonly NavigatorSnapshot[];
  readonly relationship: readonly RelationshipHealthResult[];
  readonly mood: readonly MomentEntry[];
  readonly sleep: readonly SleepEntry[];
}

const TOOL_NAMES: Record<ToolKey, string> = {
  checkin: 'Moments',
  clarity: 'Clarity Score',
  navigator: 'Symptom Navigator',
  relationship: 'Relationship Health',
  mood: 'Mood Journal',
  sleep: 'Sleep Architect',
};

const TOOL_ROUTES: Record<ToolKey, string> = {
  checkin: '/history',
  clarity: '/tools/clarity-history',
  navigator: '/tools/navigator-history',
  relationship: '/tools/relationship-history',
  mood: '/tools/mood-journal',
  sleep: '/tools/sleep',
};

/** Parse a `YYYY-MM-DD` local-day string to epoch ms at local midnight. */
function dayToMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
}

/** ISO timestamp → epoch ms, or 0 when unparseable. */
function isoToMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/** Most frequent emotion tag across moments, or null. */
export function topEmotion(moments: readonly MomentEntry[]): string | null {
  const counts = new Map<string, number>();
  for (const m of moments) {
    for (const e of m.emotions) counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [tag, n] of counts) {
    if (n > bestN) {
      best = tag;
      bestN = n;
    }
  }
  return best;
}

/**
 * Build the per-tool summaries, newest-used first. Tools with no local data are
 * omitted entirely — the home surface never shows an empty/zero row.
 */
export function buildToolSummaries(input: InsightsInput): ToolSummary[] {
  const out: ToolSummary[] = [];

  if (input.checkins.length > 0) {
    const lastAt = Math.max(...input.checkins.map((e) => dayToMs(e.date)));
    out.push({
      key: 'checkin',
      name: TOOL_NAMES.checkin,
      metric: `${input.checkins.length} day${input.checkins.length === 1 ? '' : 's'} recorded`,
      count: input.checkins.length,
      lastAt,
      route: TOOL_ROUTES.checkin,
    });
  }

  if (input.clarity.length > 0) {
    // clarity[0] is newest (store returns newest-first).
    const latest = input.clarity[0];
    out.push({
      key: 'clarity',
      name: TOOL_NAMES.clarity,
      metric: latest ? `Latest clarity ${latest.composite}` : `${input.clarity.length} taken`,
      count: input.clarity.length,
      lastAt: latest ? dayToMs(latest.date) : 0,
      route: TOOL_ROUTES.clarity,
    });
  }

  if (input.navigator.length > 0) {
    const latest = input.navigator[0];
    out.push({
      key: 'navigator',
      name: TOOL_NAMES.navigator,
      metric: `${input.navigator.length} exploration${input.navigator.length === 1 ? '' : 's'}`,
      count: input.navigator.length,
      lastAt: latest ? isoToMs(latest.createdAt) : 0,
      route: TOOL_ROUTES.navigator,
    });
  }

  if (input.relationship.length > 0) {
    const latest = input.relationship[0];
    out.push({
      key: 'relationship',
      name: TOOL_NAMES.relationship,
      metric: latest ? `Latest score ${latest.compositeScore}` : `${input.relationship.length} taken`,
      count: input.relationship.length,
      lastAt: latest ? isoToMs(latest.createdAt) : 0,
      route: TOOL_ROUTES.relationship,
    });
  }

  if (input.mood.length > 0) {
    const lastAt = Math.max(...input.mood.map((m) => isoToMs(m.createdAt)));
    const top = topEmotion(input.mood);
    out.push({
      key: 'mood',
      name: TOOL_NAMES.mood,
      metric: top ? `Most noted: ${top}` : `${input.mood.length} moment${input.mood.length === 1 ? '' : 's'}`,
      count: input.mood.length,
      lastAt,
      route: TOOL_ROUTES.mood,
    });
  }

  if (input.sleep.length > 0) {
    const lastAt = Math.max(...input.sleep.map((e) => isoToMs(e.created_at)));
    out.push({
      key: 'sleep',
      name: TOOL_NAMES.sleep,
      metric: `${input.sleep.length} night${input.sleep.length === 1 ? '' : 's'} logged`,
      count: input.sleep.length,
      lastAt,
      route: TOOL_ROUTES.sleep,
    });
  }

  // Most recently used first — "shows the data one by one in the order you used them".
  return out.sort((a, b) => b.lastAt - a.lastAt);
}
