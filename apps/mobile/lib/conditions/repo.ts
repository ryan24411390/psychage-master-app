// Conditions reference repository — read-only queries against the shared Supabase
// `conditions_reference` table (the same source the web /conditions page reads),
// via the anon client. Mirrors lib/articles/repo.ts posture: every function
// swallows errors and returns empty/null, so a screen treats "no client / offline
// / query error" as "no content available" and shows a fallback — it never throws.
//
// SR-4: reads PUBLIC verified reference data only (RLS gates anon to
// verification_status='verified'). Never reads/writes symptom or navigator state.

import { type DbArticleListRow, mapListRow } from '@/lib/articles/mapper';
import type { ArticleListItem } from '@/lib/articles';
import { getSupabaseClient } from '@/lib/supabase';

import type { ConditionDetailRef, ConditionRef } from './types';

// List shape — name + ICD-11 code + family bucket + crisis flag.
const LIST_FIELDS = 'slug, name, icd11_code, icd11_grouping, crisis_flag';
// Guide shape — adds the row id (for the related-articles join) + the four
// reviewed definition sections (verbatim from the row).
const DETAIL_FIELDS = `id, ${LIST_FIELDS}, short_definition, what_it_feels_like, how_it_differs, when_more_than_everyday`;

// Article list fields WITHOUT the inner category join (we filter by condition, not
// category) — to-one category embed kept for the card's category label.
const ARTICLE_FIELDS =
  'slug, title, seo_description, hero_image_url, read_time, tags, created_at, category:article_categories!category_id(name, slug)';

type DbConditionRow = {
  id?: string;
  slug: string;
  name: string;
  icd11_code?: string | null;
  icd11_grouping?: string | null;
  crisis_flag?: boolean | null;
  short_definition?: string | null;
  what_it_feels_like?: string | null;
  how_it_differs?: string | null;
  when_more_than_everyday?: string | null;
};

function mapRef(row: DbConditionRow): ConditionRef {
  return {
    slug: row.slug,
    name: row.name,
    icd11Code: row.icd11_code ?? '',
    family: row.icd11_grouping ?? '',
    crisisFlag: row.crisis_flag ?? false,
  };
}

/**
 * Every VERIFIED condition in the reference taxonomy, name-ordered. The RLS policy
 * already gates anon reads to verified rows, but the filter is explicit for parity
 * with the web. Returns [] on no-client/offline/error.
 */
export async function listConditionsReference(): Promise<ConditionRef[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('conditions_reference')
      .select(LIST_FIELDS)
      .eq('verification_status', 'verified')
      .order('name', { ascending: true });
    if (error || !data) return [];
    return (data as DbConditionRow[]).map(mapRef);
  } catch {
    return [];
  }
}

/** One verified condition by slug, with its reviewed definition sections. `null`
 * when absent/unverified/offline — the guide then shows a safe not-found state. */
export async function getConditionReference(slug: string): Promise<ConditionDetailRef | null> {
  const sb = getSupabaseClient();
  if (!sb || !slug) return null;
  try {
    const { data, error } = await sb
      .from('conditions_reference')
      .select(DETAIL_FIELDS)
      .eq('slug', slug)
      .eq('verification_status', 'verified')
      .maybeSingle();
    if (error || !data) return null;
    const row = data as DbConditionRow;
    return {
      ...mapRef(row),
      id: row.id ?? '',
      shortDefinition: row.short_definition ?? null,
      whatItFeelsLike: row.what_it_feels_like ?? null,
      howItDiffers: row.how_it_differs ?? null,
      whenMoreThanEveryday: row.when_more_than_everyday ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Published articles linked to a condition, via the `articles.linked_condition_ids`
 * uuid[] containment (the clinical join the web uses). Cornerstone-first, then
 * newest. Empty on no-id/offline/error.
 */
export async function listArticlesForCondition(conditionId: string): Promise<ArticleListItem[]> {
  const sb = getSupabaseClient();
  if (!sb || !conditionId) return [];
  try {
    const { data, error } = await sb
      .from('articles')
      .select(ARTICLE_FIELDS)
      .eq('status', 'published')
      .not('content', 'is', null)
      .neq('content', '')
      .contains('linked_condition_ids', [conditionId])
      .order('is_cornerstone', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(40);
    if (error || !data) return [];
    return (data as unknown as DbArticleListRow[]).map(mapListRow);
  } catch {
    return [];
  }
}
