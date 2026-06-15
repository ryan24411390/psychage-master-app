import { afterEach, describe, expect, it, vi } from 'vitest';

// The anon client is the single seam; mock it per-test via the mutable holder.
let mockClient: unknown = null;
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => mockClient,
}));

import { getToolkit, listPublishedToolkits } from '@/features/toolkits/queries';

// A chainable PostgREST-ish builder: every filter returns itself; the terminal
// calls (.range / .maybeSingle) resolve to the configured result.
function builder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order']) b[m] = () => b;
  b.range = () => Promise.resolve(result);
  b.maybeSingle = () => Promise.resolve(result);
  return b;
}

afterEach(() => {
  mockClient = null;
  vi.clearAllMocks();
});

describe('listPublishedToolkits', () => {
  it('returns [] when no client is configured', async () => {
    mockClient = null;
    expect(await listPublishedToolkits()).toEqual([]);
  });

  it('returns the published rows from a single page', async () => {
    const rows = [
      { id: 'a', theme_title: 'A', sort_order: 0 },
      { id: 'b', theme_title: 'B', sort_order: 1 },
    ];
    mockClient = { from: () => builder({ data: rows, error: null }) };
    const out = await listPublishedToolkits();
    expect(out.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('returns [] on query error (no fabricated data)', async () => {
    mockClient = { from: () => builder({ data: null, error: { message: 'boom' } }) };
    expect(await listPublishedToolkits()).toEqual([]);
  });
});

describe('getToolkit', () => {
  it('returns null without an id', async () => {
    mockClient = { from: () => builder({ data: {}, error: null }) };
    expect(await getToolkit('')).toBeNull();
  });

  it('returns null on error / missing row', async () => {
    mockClient = { from: () => builder({ data: null, error: null }) };
    expect(await getToolkit('tk1')).toBeNull();
  });

  it('returns the toolkit with items sorted by sort_order', async () => {
    const data = {
      id: 'tk1',
      theme_title: 'Worry',
      clinical_subtitle: null,
      intro_md: null,
      status: 'published',
      needs_clinical_review: true,
      sort_order: 0,
      items: [
        { id: 'i2', toolkit_id: 'tk1', kind: 'article', ref_id: 'article:x/y', label: 'Y', sort_order: 2 },
        { id: 'i1', toolkit_id: 'tk1', kind: 'tool', ref_id: 'tool:mood-journal', label: 'X', sort_order: 1 },
      ],
    };
    mockClient = { from: () => builder({ data, error: null }) };
    const out = await getToolkit('tk1');
    expect(out?.items.map((i) => i.id)).toEqual(['i1', 'i2']);
  });
});
