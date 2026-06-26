import type { ConditionFamilyGroup, ConditionRef } from './types';

// ICD-11 Chapter 6 family presentation order — the canonical chapter order the web
// /conditions page uses (mirrors src/data/conditions/groupings.ts). These are the
// public ICD-11 grouping labels (presentation order only — no clinical content is
// authored here). Families returned by the DB but absent from this list are
// appended last (defensive), so the accordion never silently drops a bucket.
export const ICD11_FAMILY_ORDER: readonly string[] = [
  'Neurodevelopmental disorders',
  'Schizophrenia or other primary psychotic disorders',
  'Catatonia',
  'Mood disorders',
  'Anxiety or fear-related disorders',
  'Obsessive-compulsive or related disorders',
  'Disorders specifically associated with stress',
  'Dissociative disorders',
  'Feeding or eating disorders',
  'Elimination disorders',
  'Disorders of bodily distress or bodily experience',
  'Disorders due to substance use or addictive behaviours',
  'Impulse control disorders',
  'Disruptive behaviour or dissocial disorders',
  'Personality disorders and related traits',
  'Paraphilic disorders',
  'Factitious disorders',
  'Neurocognitive disorders',
  'Disorders associated with pregnancy, childbirth or the puerperium',
  'Secondary mental or behavioural syndromes',
];

const ORDER_INDEX = new Map(ICD11_FAMILY_ORDER.map((f, i) => [f, i]));

// Bucket conditions into their ICD-11 families. Mirrors the web grouping: members
// sorted alphabetically by name, families in canonical order (unknown families
// appended after, alphabetical), member count is the family count shown in the UI.
// Total partition — every input lands under exactly one family.
export function groupByFamily(conditions: readonly ConditionRef[]): ConditionFamilyGroup[] {
  const byFamily = new Map<string, ConditionRef[]>();
  for (const c of conditions) {
    const bucket = byFamily.get(c.family);
    if (bucket) bucket.push(c);
    else byFamily.set(c.family, [c]);
  }
  const families = [...byFamily.keys()].sort((a, b) => {
    const ia = ORDER_INDEX.get(a);
    const ib = ORDER_INDEX.get(b);
    if (ia != null && ib != null) return ia - ib;
    if (ia != null) return -1;
    if (ib != null) return 1;
    return a.localeCompare(b);
  });
  return families.map((family) => {
    const members = [...(byFamily.get(family) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return { family, members, count: members.length };
  });
}

// Live search filter for the accordion. A family is kept when its name matches OR
// it has ≥1 matching member; matching members are narrowed to the hits so an
// expanded family shows only what matched. Empty/blank query returns groups as-is.
export function filterConditions(
  groups: readonly ConditionFamilyGroup[],
  query: string,
): ConditionFamilyGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...groups];
  const out: ConditionFamilyGroup[] = [];
  for (const g of groups) {
    if (g.family.toLowerCase().includes(q)) {
      out.push(g);
      continue;
    }
    const members = g.members.filter((m) => m.name.toLowerCase().includes(q));
    if (members.length > 0) out.push({ family: g.family, members, count: members.length });
  }
  return out;
}
