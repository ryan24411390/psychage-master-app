// Pure projections of the unified Moments feeling data into the shared chart primitives.
// React-free and store-free (takes already-read `Moment[]` as input) so it is fully
// Vitest-testable. LOCAL-ONLY by construction (SR-4): operates only on data the caller read
// from the on-device Moments store; never reaches the network.
//
// DESCRIPTIVE ONLY (SR-1/SR-3): counts and a feeling-level (1–5) series. No composite SCORE,
// no percentages, no direction/verdict words — those would read as interpretation.

import type { Moment } from '@psychage/shared/engagement';

import type { MetricBar, TrendPoint } from '@/components/ui/charts';
import { ALL_LABELS, CONTEXT_DOMAINS } from '@/features/moments/constants';

// Feeling words + context are stored as curated KEYS; resolve to human display labels the
// same way MomentRow does (falls back to the raw key for any folded-in/legacy value).
const LABEL_BY_KEY = new Map([...ALL_LABELS, ...CONTEXT_DOMAINS].map((l) => [l.key, l.label]));
function display(key: string): string {
  return LABEL_BY_KEY.get(key) ?? key;
}

/** ISO `timestamp` → epoch ms, or 0 when unparseable. */
function timestampMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/** Moments at/after `cutoffMs` (0 ⇒ all), oldest → newest. */
function withinAscending(moments: readonly Moment[], cutoffMs: number): Moment[] {
  return [...moments]
    .filter((m) => timestampMs(m.timestamp) >= cutoffMs)
    .sort((a, b) => timestampMs(a.timestamp) - timestampMs(b.timestamp));
}

/**
 * Feeling level (valence 1–5) over time as <TrendLine> points, oldest → newest (most recent
 * on the right). `x` carries the capture instant for labelling; `y` is the 1–5 valence.
 */
export function valenceSeries(moments: readonly Moment[], cutoffMs = 0): TrendPoint[] {
  return withinAscending(moments, cutoffMs).map((m) => ({ x: m.timestamp, y: m.valence }));
}

/** Generic top-N display-label frequency tally over a chosen key list per moment. */
function countBars(
  moments: readonly Moment[],
  cutoffMs: number,
  pick: (m: Moment) => readonly string[],
  limit: number,
): MetricBar[] {
  const counts = new Map<string, number>();
  for (const m of moments) {
    if (timestampMs(m.timestamp) < cutoffMs) continue;
    for (const key of pick(m)) {
      const label = display(key);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

/** The feeling words named most often within the window, top-N by count. */
export function descriptorCounts(moments: readonly Moment[], cutoffMs = 0, limit = 6): MetricBar[] {
  return countBars(moments, cutoffMs, (m) => m.labels, limit);
}

/** What's been on the user's mind most often within the window, top-N by count. */
export function impactCounts(moments: readonly Moment[], cutoffMs = 0, limit = 6): MetricBar[] {
  return countBars(moments, cutoffMs, (m) => m.context, limit);
}
