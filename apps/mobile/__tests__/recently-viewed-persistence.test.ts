import { describe, expect, it } from 'vitest';

import { MAX_RECENT, migrate, pushRecent, type RecentProvider } from '@/lib/persistence/recently-viewed';

const a: RecentProvider = { id: 'a', name: 'Maya Feldman', photoUrl: null };
const b: RecentProvider = { id: 'b', name: 'Daniel O', photoUrl: 'https://x/p.jpg' };

describe('recently-viewed migrate (SR-13)', () => {
  it('seeds to an empty list', () => {
    expect(migrate(null)).toEqual({ version: 1, items: [] });
  });

  it('reseeds on corrupt / non-object / missing-or-future version / non-array items', () => {
    expect(migrate('nope')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ items: [a] }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 2, items: [a] }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 1, items: 'x' }))).toEqual(migrate(null));
  });

  it('drops malformed items, dedupes by id, caps to MAX_RECENT', () => {
    const items = [a, { id: 'a', name: 'dupe', photoUrl: null }, { name: 'no id' }, b];
    const out = migrate(JSON.stringify({ version: 1, items }));
    expect(out.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(out.items.length).toBeLessThanOrEqual(MAX_RECENT);
  });
});

describe('pushRecent transform', () => {
  it('prepends newest, dedupes, caps', () => {
    const seq = [a, b, a]; // viewing a again moves it to front
    const out = seq.reduce<RecentProvider[]>((acc, x) => pushRecent(acc, x), []);
    expect(out.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('never exceeds MAX_RECENT', () => {
    let acc: RecentProvider[] = [];
    for (let i = 0; i < MAX_RECENT + 3; i++) acc = pushRecent(acc, { id: `p${i}`, name: `P ${i}`, photoUrl: null });
    expect(acc.length).toBe(MAX_RECENT);
    expect(acc[0]?.id).toBe(`p${MAX_RECENT + 2}`); // newest first
  });
});
