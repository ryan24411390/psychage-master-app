import { describe, expect, it } from 'vitest';

import {
  BREATHING,
  EXERCISES,
  GROUNDING,
  nextPromptIndex,
  resolveExercise,
} from '@/features/toolkit/exercises';

describe('toolkit exercises', () => {
  it('resolves by kind, defaulting to breathing for unknown/absent', () => {
    expect(resolveExercise('breathing')).toBe(BREATHING);
    expect(resolveExercise('grounding').kind).toBe('grounding');
    expect(resolveExercise('body_scan').kind).toBe('body_scan');
    expect(resolveExercise(undefined)).toBe(BREATHING);
    expect(resolveExercise('nonsense')).toBe(BREATHING);
  });

  it('breathing pacing is 4-4-6', () => {
    expect(BREATHING.pacing).toEqual({ inhale: 4000, hold: 4000, exhale: 6000 });
  });

  it('nextPromptIndex advances, then signals completion (null) past the last', () => {
    expect(nextPromptIndex(0, 5)).toBe(1);
    expect(nextPromptIndex(3, 5)).toBe(4);
    expect(nextPromptIndex(4, 5)).toBeNull();
  });

  it('the grounding count lives in the label line (not a meter)', () => {
    expect(GROUNDING.prompts[0]?.label).toBe('SEE · 5');
  });

  it('exposes all three variants', () => {
    expect(Object.keys(EXERCISES).sort()).toEqual(['body_scan', 'breathing', 'grounding']);
  });
});
