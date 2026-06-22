import { describe, expect, it } from 'vitest';

import { buildToolSummaries, type InsightsInput, topEmotion } from '@/features/insights/aggregate';

// Pure aggregation: tools with no data are omitted; the rest sort newest-used first. The
// duplicate 'mood'/'Mood Journal' row was collapsed (P45) — Moments is the single 'checkin'
// row now.

const EMPTY: InsightsInput = {
  checkins: [],
  clarity: [],
  navigator: [],
  relationship: [],
  moments: [],
  sleep: [],
  toolUsage: { installedAt: 0, usage: {} },
};

// Minimal record stubs — only the fields the aggregator reads. Cast keeps the test
// focused without reconstructing every full domain type.
const checkin = (date: string) => ({ id: date, date, state: 'okay' }) as never;
const clarity = (date: string, composite: number) =>
  ({ id: date, date, composite, tier: 'balanced', domains: {} }) as never;
const nav = (createdAt: string) => ({ id: createdAt, date: '2026-06-15', createdAt, inputs: [], results: {} }) as never;
const rel = (createdAt: string, compositeScore: number) => ({ id: createdAt, createdAt, compositeScore }) as never;
const moment = (createdAt: string, emotions: string[]) => ({ createdAt, emotions });
const sleep = (created_at: string) => ({ id: created_at, date: '2026-06-15', created_at }) as never;

describe('buildToolSummaries', () => {
  it('returns [] when no tool has data', () => {
    expect(buildToolSummaries(EMPTY)).toEqual([]);
  });

  it('omits tools with zero entries, includes those with data', () => {
    const out = buildToolSummaries({ ...EMPTY, clarity: [clarity('2026-06-10', 70)] });
    expect(out.map((s) => s.key)).toEqual(['clarity']);
    expect(out[0]?.metric).toBe('Latest clarity 70');
    expect(out[0]?.count).toBe(1);
  });

  it('orders tools by most-recently-used first', () => {
    const out = buildToolSummaries({
      ...EMPTY,
      checkins: [checkin('2026-06-01')],
      clarity: [clarity('2026-06-16', 60)],
      sleep: [sleep('2026-06-10T22:00:00.000Z')],
    });
    expect(out.map((s) => s.key)).toEqual(['clarity', 'sleep', 'checkin']);
  });

  it('does not emit a separate Mood Journal row (duplicate collapsed)', () => {
    const out = buildToolSummaries({ ...EMPTY, checkins: [checkin('2026-06-01')] });
    expect(out.map((s) => s.key)).toEqual(['checkin']);
    expect(out.map((s) => s.name)).not.toContain('Mood Journal');
  });

  it('pluralizes counts correctly', () => {
    const one = buildToolSummaries({ ...EMPTY, checkins: [checkin('2026-06-01')] });
    expect(one[0]?.metric).toBe('1 day recorded');
    const many = buildToolSummaries({
      ...EMPTY,
      checkins: [checkin('2026-06-01'), checkin('2026-06-02')],
    });
    expect(many[0]?.metric).toBe('2 days recorded');
  });

  it('uses each tool history route', () => {
    const out = buildToolSummaries({
      ...EMPTY,
      navigator: [nav('2026-06-12T08:00:00.000Z')],
      relationship: [rel('2026-06-13T08:00:00.000Z', 55)],
    });
    const byKey = Object.fromEntries(out.map((s) => [s.key, s.route]));
    expect(byKey.navigator).toBe('/tools/navigator-history');
    expect(byKey.relationship).toBe('/tools/relationship-history');
  });
});

describe('topEmotion', () => {
  it('returns null for no moments', () => {
    expect(topEmotion([])).toBeNull();
  });
  it('returns the most frequent tag', () => {
    expect(
      topEmotion([
        moment('a', ['anxiety', 'calm']),
        moment('b', ['anxiety']),
        moment('c', ['joy']),
      ]),
    ).toBe('anxiety');
  });
});
