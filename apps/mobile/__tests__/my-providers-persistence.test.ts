import { describe, expect, it } from 'vitest';

import {
  MAX_PROVIDERS,
  migrate,
  removeById,
  type SavedProvider,
  setContacted,
  toggleSaved,
} from '@/lib/persistence/my-providers';

function provider(id: string, over: Partial<SavedProvider> = {}): SavedProvider {
  return {
    id,
    name: `Dr ${id}`,
    credentials: null,
    typeLabel: null,
    phone: null,
    city: null,
    state: null,
    savedAt: '2026-06-21T00:00:00.000Z',
    contactedAt: null,
    manual: false,
    ...over,
  };
}

const NOW = '2026-06-21T12:00:00.000Z';

describe('my-providers migrate (SR-13)', () => {
  it('seeds to an empty list', () => {
    expect(migrate(null)).toEqual({ version: 1, items: [] });
  });

  it('reseeds on corrupt / non-object / missing-or-future version / non-array items', () => {
    expect(migrate('nope')).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ items: [provider('a')] }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 2, items: [provider('a')] }))).toEqual(migrate(null));
    expect(migrate(JSON.stringify({ version: 1, items: 'x' }))).toEqual(migrate(null));
  });

  it('drops malformed items, dedupes by id, caps to MAX_PROVIDERS', () => {
    const items = [provider('a'), provider('a', { name: 'dupe' }), { name: 'no id' }, provider('b')];
    const out = migrate(JSON.stringify({ version: 1, items }));
    expect(out.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(out.items.length).toBeLessThanOrEqual(MAX_PROVIDERS);
  });

  it('preserves the contacted + manual flags through a round-trip', () => {
    const saved = provider('a', { contactedAt: NOW, manual: true, phone: '555-1212' });
    const out = migrate(JSON.stringify({ version: 1, items: [saved] }));
    expect(out.items[0]).toMatchObject({ id: 'a', contactedAt: NOW, manual: true, phone: '555-1212' });
  });
});

describe('toggleSaved transform', () => {
  it('adds (newest-first) when absent and removes when present', () => {
    const added = toggleSaved([], { id: 'a', name: 'Dr A' }, NOW);
    expect(added.map((p) => p.id)).toEqual(['a']);
    expect(added[0]?.savedAt).toBe(NOW);
    expect(added[0]?.contactedAt).toBeNull();

    const removed = toggleSaved(added, { id: 'a', name: 'Dr A' }, NOW);
    expect(removed).toEqual([]);
  });

  it('caps at MAX_PROVIDERS', () => {
    let acc: SavedProvider[] = [];
    for (let i = 0; i < MAX_PROVIDERS + 3; i++) acc = toggleSaved(acc, { id: `p${i}`, name: `P${i}` }, NOW);
    expect(acc.length).toBe(MAX_PROVIDERS);
    expect(acc[0]?.id).toBe(`p${MAX_PROVIDERS + 2}`); // newest first
  });
});

describe('setContacted / removeById transforms', () => {
  it('sets and clears the contacted timestamp for one provider', () => {
    const base = [provider('a'), provider('b')];
    const marked = setContacted(base, 'a', true, NOW);
    expect(marked.find((p) => p.id === 'a')?.contactedAt).toBe(NOW);
    expect(marked.find((p) => p.id === 'b')?.contactedAt).toBeNull();

    const cleared = setContacted(marked, 'a', false, NOW);
    expect(cleared.find((p) => p.id === 'a')?.contactedAt).toBeNull();
  });

  it('removes one provider by id', () => {
    expect(removeById([provider('a'), provider('b')], 'a').map((p) => p.id)).toEqual(['b']);
  });
});
