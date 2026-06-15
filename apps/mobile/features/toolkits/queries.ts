// Toolkits — live Supabase reads (published content only).
//
// Reads REAL toolkit content from the shared Supabase project via the app's anon
// read-only client (lib/supabase.ts). Toolkits/items are PUBLIC educational
// reference data — RLS restricts anon SELECT to status='published' (and items of
// a published parent). SR-4 compliant: this is NOT symptom / mood / navigator state.
//
// NO mock-data fallback (directory fidelity rule): when the client is unconfigured
// or a query errors, return EMPTY ([] / null), never a fabricated toolkit. If the
// tables are absent (404 / PGRST205 — not yet migrated to live), an error surfaces
// and we return empty; the index then shows its honest empty state.

import { getSupabaseClient } from '@/lib/supabase';

import type { Toolkit, ToolkitItem, ToolkitWithItems } from './types';

// Toolkits are a small, curated set; one page covers them comfortably. Kept
// paginated anyway so growth never silently truncates the index.
const PAGE_SIZE = 50;

const TOOLKIT_COLUMNS =
  'id, theme_title, clinical_subtitle, intro_md, status, needs_clinical_review, sort_order';
const ITEM_COLUMNS = 'id, toolkit_id, kind, ref_id, label, sort_order';

/** All published toolkits, ordered by `sort_order`. Empty on no-client / error. */
export async function listPublishedToolkits(): Promise<Toolkit[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const all: Toolkit[] = [];
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await client
      .from('toolkits')
      .select(TOOLKIT_COLUMNS)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) break;
    all.push(...(data as Toolkit[]));
    if (data.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * One published toolkit with its ordered items, or null when missing / unpublished
 * / unreachable. Items come back via PostgREST resource embedding; RLS already
 * scopes them to the published parent, but we re-sort defensively by `sort_order`.
 */
export async function getToolkit(id: string): Promise<ToolkitWithItems | null> {
  const client = getSupabaseClient();
  if (!client || !id) return null;

  const { data, error } = await client
    .from('toolkits')
    .select(`${TOOLKIT_COLUMNS}, items:toolkit_items(${ITEM_COLUMNS})`)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Toolkit & { items?: ToolkitItem[] };
  const items = [...(row.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: row.id,
    theme_title: row.theme_title,
    clinical_subtitle: row.clinical_subtitle,
    intro_md: row.intro_md,
    status: row.status,
    needs_clinical_review: row.needs_clinical_review,
    sort_order: row.sort_order,
    items,
  };
}
