import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the shared anon client so the gate/read is exercised without a network.
vi.mock('@/lib/supabase', () => ({ getSupabaseClient: vi.fn() }));

import { applyGate, listConditions } from '@/features/conditions-reference/queries';
import {
  buildIndex,
  extractFamilies,
  filterConditions,
  letterOf,
} from '@/features/conditions-reference/group';
import { hasDefinition, type Condition } from '@/features/conditions-reference/types';
import { getSupabaseClient } from '@/lib/supabase';

const clientMock = getSupabaseClient as unknown as ReturnType<typeof vi.fn>;

function cond(partial: Partial<Condition> & { name: string; slug: string }): Condition {
  return {
    icd11_code: '6X00',
    icd11_grouping: 'Family',
    short_definition: 'def',
    what_it_feels_like: null,
    how_it_differs: null,
    when_more_than_everyday: null,
    crisis_flag: false,
    provenance: null,
    verification_status: 'verified',
    reading_level: '8th grade',
    ...partial,
  };
}

/** Minimal chainable PostgREST-builder stub that resolves to `result` (mirrors directory test). */
function builder(result: unknown) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'eq', 'maybeSingle']) {
    b[m] = () => b;
  }
  // biome-ignore lint/suspicious/noThenProperty: a PostgREST builder is itself thenable (`await query`); the stub mirrors that.
  (b as { then: unknown }).then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  return b;
}

beforeEach(() => {
  clientMock.mockReset();
});

describe('verification gate', () => {
  const rows = [
    cond({ slug: 'a', name: 'Alpha', verification_status: 'verified' }),
    cond({ slug: 'b', name: 'Beta', verification_status: 'unverified' }),
  ];

  it('applyGate drops unverified on the public surface', () => {
    expect(applyGate(rows, false).map((c) => c.slug)).toEqual(['a']);
  });

  it('applyGate keeps unverified in preview', () => {
    expect(applyGate(rows, true).map((c) => c.slug)).toEqual(['a', 'b']);
  });

  it('listConditions returns ONLY verified rows when preview is off', async () => {
    clientMock.mockReturnValue({
      from: vi.fn(() =>
        builder({
          data: [
            { slug: 'a', name: 'Alpha', verification_status: 'verified' },
            { slug: 'b', name: 'Beta', verification_status: 'unverified' },
          ],
          error: null,
        }),
      ),
    });
    const out = await listConditions(false);
    expect(out.map((c) => c.slug)).toEqual(['a']);
  });

  it('listConditions includes unverified when preview is on, sorted by name', async () => {
    clientMock.mockReturnValue({
      from: vi.fn(() =>
        builder({
          data: [
            { slug: 'z', name: 'Zeta', verification_status: 'unverified' },
            { slug: 'a', name: 'Alpha', verification_status: 'verified' },
          ],
          error: null,
        }),
      ),
    });
    const out = await listConditions(true);
    expect(out.map((c) => c.name)).toEqual(['Alpha', 'Zeta']);
  });

  it('listConditions returns [] (never throws) when the client is absent', async () => {
    clientMock.mockReturnValue(null);
    expect(await listConditions(false)).toEqual([]);
  });

  it('listConditions returns [] when the read errors (legacy/absent table)', async () => {
    clientMock.mockReturnValue({
      from: vi.fn(() => builder({ data: null, error: { message: '42703 undefined column' } })),
    });
    expect(await listConditions(false)).toEqual([]);
  });
});

describe('A–Z grouping (buildIndex)', () => {
  it('groups into letter headers with rows, headers sticky, # last', () => {
    const built = buildIndex([
      cond({ slug: '1', name: 'Beta' }),
      cond({ slug: '2', name: 'Alpha' }),
      cond({ slug: '3', name: '4th thing' }), // non-letter → '#'
      cond({ slug: '4', name: 'Apple' }),
    ]);
    expect(built.letters).toEqual(['A', 'B', '#']);
    // first item is the 'A' header, sticky at 0
    expect(built.items[0]).toEqual({ type: 'header', letter: 'A' });
    expect(built.stickyIndices[0]).toBe(0);
    expect(built.letterToIndex.B).toBe(built.items.findIndex((i) => i.type === 'header' && i.letter === 'B'));
    // every sticky index points at a header
    for (const idx of built.stickyIndices) {
      expect(built.items[idx]?.type).toBe('header');
    }
  });

  it('letterOf normalises case and non-letters', () => {
    expect(letterOf('anxiety')).toBe('A');
    expect(letterOf('  bipolar')).toBe('B');
    expect(letterOf('3 strikes')).toBe('#');
  });
});

describe('family filter', () => {
  const rows = [
    cond({ slug: 'a', name: 'A', icd11_grouping: 'Mood disorders', icd11_code: '6A70' }),
    cond({ slug: 'b', name: 'B', icd11_grouping: 'Anxiety or fear-related', icd11_code: '6B00' }),
    cond({ slug: 'c', name: 'C', icd11_grouping: 'Mood disorders', icd11_code: '6A71' }),
  ];

  it('extractFamilies returns distinct, alphabetised groupings', () => {
    expect(extractFamilies(rows)).toEqual(['Anxiety or fear-related', 'Mood disorders']);
  });

  it('filterConditions narrows by family', () => {
    expect(filterConditions(rows, '', 'Mood disorders').map((c) => c.slug)).toEqual(['a', 'c']);
  });

  it('filterConditions matches name and ICD-11 code', () => {
    expect(filterConditions(rows, '6b00', null).map((c) => c.slug)).toEqual(['b']);
    expect(filterConditions(rows, 'c', null).map((c) => c.slug)).toEqual(['c']);
  });
});

describe('hasDefinition', () => {
  it('is true when any definition field has content', () => {
    expect(hasDefinition(cond({ slug: 'a', name: 'A', short_definition: 'x' }))).toBe(true);
  });

  it('is false when all four are null/blank', () => {
    expect(
      hasDefinition(
        cond({
          slug: 'a',
          name: 'A',
          short_definition: null,
          what_it_feels_like: '   ',
          how_it_differs: null,
          when_more_than_everyday: null,
        }),
      ),
    ).toBe(false);
  });
});
