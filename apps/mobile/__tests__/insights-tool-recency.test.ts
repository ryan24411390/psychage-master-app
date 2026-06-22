import { describe, expect, it } from 'vitest';

import { recentTools, relativeDayLabel } from '@/features/insights/tool-recency';
import type { ToolUsageData } from '@/lib/tool-usage-store';

// Pure tool-usage recency for the "Your Tools" rail (P47). No store, no clock — fully pure.

const usage = (u: Record<string, number>): ToolUsageData =>
  ({ installedAt: 0, usage: u as ToolUsageData['usage'] });

const DAY = 86_400_000;
const NOW = new Date(2026, 5, 17, 12, 0, 0).getTime(); // 2026-06-17 noon, local

describe('recentTools', () => {
  it('returns opened tools newest-first', () => {
    const out = recentTools(usage({ clarity: 100, breathing: 300, navigator: 200 }));
    expect(out.map((t) => t.tool.id)).toEqual(['breathing', 'navigator', 'clarity']);
  });

  it('caps at the 4 most-recently-used', () => {
    const out = recentTools(usage({ toolkit: 5, navigator: 4, mindmate: 3, clarity: 2, breathing: 1 }));
    expect(out).toHaveLength(4);
    expect(out.map((t) => t.tool.id)).toEqual(['toolkit', 'navigator', 'mindmate', 'clarity']);
  });

  it('excludes tools never opened (0..limit entries)', () => {
    expect(recentTools(usage({}))).toHaveLength(0);
    expect(recentTools(usage({ clarity: 10 })).map((t) => t.tool.id)).toEqual(['clarity']);
  });

  it('ignores unknown tool ids defensively', () => {
    const out = recentTools(usage({ clarity: 10, bogus: 99 }));
    expect(out.map((t) => t.tool.id)).toEqual(['clarity']);
  });

  it('carries the last-opened instant through', () => {
    const out = recentTools(usage({ clarity: 42 }));
    expect(out[0]?.lastAtMs).toBe(42);
  });
});

describe('relativeDayLabel', () => {
  it('reads today / yesterday / N days ago by local calendar day', () => {
    expect(relativeDayLabel(NOW, NOW)).toBe('today');
    expect(relativeDayLabel(NOW - DAY, NOW)).toBe('yesterday');
    expect(relativeDayLabel(NOW - 3 * DAY, NOW)).toBe('3 days ago');
  });

  it('rolls up to weeks and months', () => {
    expect(relativeDayLabel(NOW - 8 * DAY, NOW)).toBe('last week');
    expect(relativeDayLabel(NOW - 21 * DAY, NOW)).toBe('3 weeks ago');
    expect(relativeDayLabel(NOW - 65 * DAY, NOW)).toBe('2 months ago');
  });
});
