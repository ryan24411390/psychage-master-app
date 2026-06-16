import { runSymptomNavigator, type UserSymptomInput } from '@psychage/shared/navigator';
import { describe, expect, it } from 'vitest';

import { NAVIGATOR_KB } from '@/features/navigator/knowledge-base';

// Guards the REAL knowledge base (1:1 vendored copy of web V2 mock_knowledge_base) and
// proves web parity: the same engine + the same data ⇒ the same results. Pins the
// counts, referential integrity, the Sacred cap, and a representative ranking.

describe('real knowledge base integrity', () => {
  it('ships the full web V2 set (126 symptoms, 49 conditions)', () => {
    expect(NAVIGATOR_KB.symptoms).toHaveLength(126);
    expect(NAVIGATOR_KB.conditions).toHaveLength(49);
  });

  it('pins the Sacred matching config (cap 0.75, version 1.2.0)', () => {
    expect(NAVIGATOR_KB.matchingConfig.confidence_cap).toBe(0.75);
    expect(NAVIGATOR_KB.matchingConfig.version).toBe('1.2.0');
  });

  it('every condition→symptom mapping references a real symptom', () => {
    const ids = new Set(NAVIGATOR_KB.symptoms.map((s) => s.id));
    const dangling: string[] = [];
    for (const c of NAVIGATOR_KB.conditions) {
      for (const m of c.symptom_mappings) {
        if (!ids.has(m.symptom_id)) dangling.push(`${c.id}→${m.symptom_id}`);
      }
      for (const r of c.red_flags) {
        if (!ids.has(r.symptom_id)) dangling.push(`${c.id}⚑${r.symptom_id}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it('carries 712 symptom mappings (web parity)', () => {
    const total = NAVIGATOR_KB.conditions.reduce((n, c) => n + c.symptom_mappings.length, 0);
    expect(total).toBe(712);
  });

  it('flags the inherent CRISIS symptoms (self-harm / suicidal thoughts)', () => {
    const crisis = NAVIGATOR_KB.symptoms.filter(
      (s) => s.is_red_flag && s.red_flag_level === 'CRISIS',
    );
    expect(crisis.length).toBeGreaterThanOrEqual(3);
  });
});

describe('engine on the real KB (web parity)', () => {
  const depression: UserSymptomInput[] = [
    { symptom_id: 'MOD_001', severity: 8, duration: 'more_than_1_year', frequency: 'always' }, // persistent sadness
    { symptom_id: 'MOD_002', severity: 8, duration: 'more_than_1_year', frequency: 'always' }, // loss of interest
    { symptom_id: 'ENR_001', severity: 7, duration: 'more_than_1_year', frequency: 'often' }, // fatigue
    { symptom_id: 'SLP_001', severity: 6, duration: 'more_than_1_year', frequency: 'often' }, // sleep onset
  ];

  it('SACRED CAP: no relevance_score exceeds 0.75', () => {
    const out = runSymptomNavigator(depression, NAVIGATOR_KB, 'US', () => true);
    expect(out.results.length).toBeGreaterThan(0);
    for (const r of out.results) expect(r.relevance_score).toBeLessThanOrEqual(0.75);
  });

  it('produces the EXACT ranked output web produces for this input (parity snapshot)', () => {
    // Same engine + same KB + same config ⇒ byte-identical ranking to web V2. This pins
    // that guarantee: if the vendored KB ever drifts from web, this breaks. (The set
    // reflects the real KB's mappings/coverage — a depression-spectrum condition, PDD,
    // surfaces; MDE's 23-mapping breadth + its 5-symptom minimum keep it below the
    // shown set for a 4-symptom input. This is web's behavior, not a mobile change.)
    const out = runSymptomNavigator(depression, NAVIGATOR_KB, 'US', () => true);
    expect(out.results.map((r) => r.condition_id)).toEqual(['PPD_M', 'PDD', 'GRIEF', 'ADJ', 'INS']);
    expect(out.results.map((r) => Number(r.relevance_score.toFixed(3)))).toEqual([
      0.329, 0.263, 0.222, 0.208, 0.208,
    ]);
  });

  it('surfaces a depression-spectrum pattern for a depression profile', () => {
    const out = runSymptomNavigator(depression, NAVIGATOR_KB, 'US', () => true);
    expect(out.results.map((r) => r.condition_id)).toContain('PDD');
  });

  it('is deterministic — identical inputs ⇒ identical ranked output', () => {
    const a = runSymptomNavigator(depression, NAVIGATOR_KB, 'US', () => true);
    const b = runSymptomNavigator(depression, NAVIGATOR_KB, 'US', () => true);
    expect(a.results.map((r) => [r.condition_id, r.relevance_score])).toEqual(
      b.results.map((r) => [r.condition_id, r.relevance_score]),
    );
  });

  it('halts on an inherent CRISIS selection (suicidal thoughts)', () => {
    const out = runSymptomNavigator(
      [{ symptom_id: 'COG_009', severity: 5 }],
      NAVIGATOR_KB,
      'US',
      () => true,
    );
    expect(out.safety.should_halt).toBe(true);
  });
});
