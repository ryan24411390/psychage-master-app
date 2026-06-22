// Pure tool-usage recency for the Insights "Your Tools" rail (P47). React-free and
// store-free (takes an already-read ToolUsageData snapshot) so it is fully Vitest-testable.
// LOCAL-ONLY (SR-4): derives entirely from the on-device usage snapshot.
//
// NEUTRAL / DESCRIPTIVE ONLY: recency is "when you last opened it", never a streak, score,
// or achievement. Tools the user has never opened are excluded (they are not "recent").

import { TOOLS, type Tool, type ToolId, type ToolUsageData } from '@/lib/tool-usage-store';

export interface RecentTool {
  readonly tool: Tool;
  /** Epoch ms the tool was last opened. */
  readonly lastAtMs: number;
}

const DAY_MS = 86_400_000;

/**
 * The most-recently-opened tools, newest first, capped at `limit`. Tools never opened are
 * omitted, so the result has 0..limit entries. Pure — no clock, no store.
 */
export function recentTools(usage: ToolUsageData, limit = 4): RecentTool[] {
  const opened: RecentTool[] = [];
  for (const id of Object.keys(usage.usage) as ToolId[]) {
    const lastAtMs = usage.usage[id];
    const tool = TOOLS[id];
    if (lastAtMs == null || !tool) continue;
    opened.push({ tool, lastAtMs });
  }
  return opened.sort((a, b) => b.lastAtMs - a.lastAtMs).slice(0, Math.max(0, limit));
}

/** Local midnight (ms) for an instant — so "today"/"yesterday" follow the calendar, not 24h. */
function startOfLocalDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * A neutral, descriptive "when" phrase for a last-opened instant — "today", "yesterday",
 * "3 days ago", "2 weeks ago", "1 month ago". No streak/score framing. The caller supplies
 * `nowMs` (injectable for tests).
 */
export function relativeDayLabel(lastAtMs: number, nowMs: number): string {
  const days = Math.round((startOfLocalDayMs(nowMs) - startOfLocalDayMs(lastAtMs)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  const months = Math.max(1, Math.floor(days / 30));
  return `${months} month${months === 1 ? '' : 's'} ago`;
}
