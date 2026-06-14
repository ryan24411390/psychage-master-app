import { describe, expect, it } from 'vitest';

import { areaOfSymptom, symptomsForArea, toSymptomOptions } from '@/features/navigator/areas';
import { NAVIGATOR_KB } from '@/features/navigator/kb.fixtures';

describe('navigator area mapping', () => {
  it('maps symptoms to areas (sleep wins; mind = emotional/cognitive; else body)', () => {
    expect(areaOfSymptom({ domain: 'physical', category: 'sleep' })).toBe('sleep');
    expect(areaOfSymptom({ domain: 'emotional', category: 'mood' })).toBe('mind');
    expect(areaOfSymptom({ domain: 'cognitive', category: 'cognition' })).toBe('mind');
    expect(areaOfSymptom({ domain: 'physical', category: 'energy' })).toBe('body');
    expect(areaOfSymptom({ domain: 'behavioral', category: 'coping' })).toBe('body');
  });

  it('projects active KB symptoms into options with area + order', () => {
    const opts = toSymptomOptions(NAVIGATOR_KB.symptoms);
    expect(opts.length).toBe(NAVIGATOR_KB.symptoms.filter((s) => s.is_active).length);
    const sleep = opts.filter((o) => o.area === 'sleep').map((o) => o.id);
    expect(sleep).toContain('cant_sleep');
    expect(sleep).toContain('oversleep');
  });

  it('filters by area common-first; "both" returns all sorted', () => {
    const opts = toSymptomOptions(NAVIGATOR_KB.symptoms);
    const mind = symptomsForArea(opts, 'mind');
    expect(mind.every((o) => o.area === 'mind')).toBe(true);
    // common-first: ascending display order
    expect(mind.map((o) => o.order)).toEqual([...mind.map((o) => o.order)].sort((a, b) => a - b));
    expect(symptomsForArea(opts, 'both').length).toBe(opts.length);
  });
});
