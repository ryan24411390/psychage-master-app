// S13 area → symptom-set mapping. The four areas (Body · Mind · Sleep · Both/not
// sure) are derived from the shared Symptom's domain + category. Pure logic (no React,
// type-only shared import) → Vitest. The mapping is structural; the symptom CONTENT is
// the fixture KB (CT4/clinical).

import type { Symptom } from '@psychage/shared/navigator';

export type NavigatorArea = 'body' | 'mind' | 'sleep' | 'both';

/** A lean symptom shape the UI renders — decoupled from the full clinical Symptom so
 *  the flow container/tests never import the KB (keeps shared off the Jest path). */
export interface SymptomOption {
  readonly id: string;
  readonly name: string;
  readonly area: Exclude<NavigatorArea, 'both'>;
  /** display ordering — common-first (lower = shown first). */
  readonly order: number;
}

/** Which area a symptom belongs to: sleep category wins; mind = emotional/cognitive;
 *  everything else (physical/behavioral, non-sleep) is body. */
export function areaOfSymptom(s: Pick<Symptom, 'domain' | 'category'>): Exclude<NavigatorArea, 'both'> {
  if (s.category === 'sleep') return 'sleep';
  if (s.domain === 'emotional' || s.domain === 'cognitive') return 'mind';
  return 'body';
}

/** Project the KB symptoms into UI options (active only), tagged with their area and
 *  common-first order. */
export function toSymptomOptions(symptoms: readonly Symptom[]): SymptomOption[] {
  return symptoms
    .filter((s) => s.is_active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      area: areaOfSymptom(s),
      order: s.display_order,
    }));
}

/** The symptoms shown on S14 for the chosen area, common-first. 'both' shows all. */
export function symptomsForArea(
  options: readonly SymptomOption[],
  area: NavigatorArea,
): SymptomOption[] {
  const scoped = area === 'both' ? [...options] : options.filter((o) => o.area === area);
  return scoped.sort((a, b) => a.order - b.order);
}
