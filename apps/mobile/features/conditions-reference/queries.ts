// Conditions reference — live Supabase reads (READ-ONLY).
//
// Reads the SAME shared `conditions` table the web reads, via the app's anon read-only
// client (lib/supabase.ts). This is PUBLIC reference data (RLS withholds unverified
// rows from anon) — SR-4 compliant, NOT symptom / mood / navigator state. Mobile NEVER
// writes here: no insert/update/upsert, no schema, no seed, no migration. The web owns
// the data and the migration.
//
// Mirrors psychage-v2 `src/services/conditionsService.ts`:
//   • TABLE / COLUMNS identical.
//   • mapRow normalises nulls + defaults (crisis_flag → boolean, reading_level default).
//   • applyGate: public surface = verified rows ONLY; preview keeps unverified too.
// It does NOT mirror the web's bundled `conditionsCorpus` supplement — Claude Code
// authors no clinical copy and ships no corpus (task constraint). Mobile renders only
// what the table holds; today that table is still the legacy Navigator shape, so the
// column projection 400s → caught → [] (graceful empty, never a crash, never leaks the
// legacy rows because their columns don't match). When web applies the ICD-11 migration
// the same query returns real rows — plug-and-play.

import { getSupabaseClient } from '@/lib/supabase';

import { CONDITIONS_PREVIEW } from './flag';
import type { Condition } from './types';

// The deployed table name, per the web's authoritative conditionsService (TABLE =
// 'conditions'). The legacy 5-row Navigator table currently occupies this name and is
// migrated INTO the ICD-11 shape by web. One-line flip if web ever renames.
export const CONDITIONS_TABLE = 'conditions';

const COLUMNS =
  'id, slug, name, icd11_code, icd11_grouping, short_definition, what_it_feels_like, how_it_differs, when_more_than_everyday, crisis_flag, provenance, verification_status, reading_level';

interface ConditionRow {
  id?: string;
  slug: string;
  name: string;
  icd11_code: string;
  icd11_grouping: string;
  short_definition: string | null;
  what_it_feels_like: string | null;
  how_it_differs: string | null;
  when_more_than_everyday: string | null;
  crisis_flag: boolean | null;
  provenance: string | null;
  verification_status: string | null;
  reading_level: string | null;
}

/** Map a raw Supabase row to the `Condition` model (mirrors the web mapRow). */
function mapRow(row: ConditionRow): Condition {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icd11_code: row.icd11_code,
    icd11_grouping: row.icd11_grouping,
    short_definition: row.short_definition ?? null,
    what_it_feels_like: row.what_it_feels_like ?? null,
    how_it_differs: row.how_it_differs ?? null,
    when_more_than_everyday: row.when_more_than_everyday ?? null,
    crisis_flag: Boolean(row.crisis_flag),
    provenance: row.provenance ?? null,
    verification_status: row.verification_status === 'verified' ? 'verified' : 'unverified',
    reading_level: row.reading_level ?? '8th grade',
  };
}

/** Public keeps verified rows only; preview keeps everything. */
export function applyGate(rows: Condition[], includeUnverified: boolean): Condition[] {
  if (includeUnverified) return rows;
  return rows.filter((c) => c.verification_status === 'verified');
}

const byName = (a: Condition, b: Condition) => a.name.localeCompare(b.name);

/**
 * DEV-ONLY non-clinical placeholder rows, so the UI is demoable before the real table
 * lands. Double-gated: only when `__DEV__` (false in production bundles) AND the preview
 * flag is on (off in store builds). Lazy `require` keeps the fixture out of the prod
 * dependency graph entirely. Returns [] in every shippable build.
 */
function devSampleRows(): Condition[] {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && CONDITIONS_PREVIEW) {
    const { SAMPLE_CONDITIONS } = require('./__fixtures__/sample-conditions') as {
      SAMPLE_CONDITIONS: Condition[];
    };
    return SAMPLE_CONDITIONS;
  }
  return [];
}

/**
 * All conditions for the A–Z index, sorted by name, gated by verification.
 * Always resolves (never throws); returns [] when the client is unconfigured or the
 * read fails. `preview` lifts the client gate (review surface only).
 */
export async function listConditions(preview = CONDITIONS_PREVIEW): Promise<Condition[]> {
  const client = getSupabaseClient();
  let dbRows: Condition[] = [];
  if (client) {
    try {
      const { data, error } = await client
        .from(CONDITIONS_TABLE)
        .select(COLUMNS)
        .order('name', { ascending: true });
      if (!error && data) dbRows = (data as ConditionRow[]).map(mapRow);
    } catch {
      // swallow → fall back to empty / dev fixture
    }
  }

  // Real rows win by slug; the dev fixture only supplements slugs the DB didn't return
  // (so once any real verified rows exist, they take precedence over placeholders).
  const seen = new Set(dbRows.map((r) => r.slug));
  const supplemented = [...dbRows, ...devSampleRows().filter((c) => !seen.has(c.slug))];
  return applyGate(supplemented, preview).sort(byName);
}

/** A single condition by slug. Returns null when missing or gated off the public surface. */
export async function getConditionBySlug(
  slug: string,
  preview = CONDITIONS_PREVIEW,
): Promise<Condition | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(CONDITIONS_TABLE)
        .select(COLUMNS)
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) {
        return applyGate([mapRow(data as ConditionRow)], preview)[0] ?? null;
      }
    } catch {
      // swallow → fall back to dev fixture
    }
  }

  const fromFixture = devSampleRows().find((c) => c.slug === slug);
  if (!fromFixture) return null;
  return applyGate([fromFixture], preview)[0] ?? null;
}
