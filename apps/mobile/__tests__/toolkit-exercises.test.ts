import { describe, expect, it } from 'vitest';

import {
  BREATHING,
  DEFAULT_PACE,
  EXERCISES,
  GROUNDING,
  nextPromptIndex,
  PACES,
  resolveExercise,
  resolvePace,
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

  it('DEFAULT_PACE is Steady and single-sources the 4-4-6 default', () => {
    expect(DEFAULT_PACE.id).toBe('steady');
    expect(DEFAULT_PACE.pacing).toBe(BREATHING.pacing);
    expect(PACES[0]).toBe(DEFAULT_PACE);
  });

  it('every pace uses whole-second durations (clean countdown)', () => {
    for (const p of PACES) {
      for (const ms of [p.pacing.inhale, p.pacing.hold, p.pacing.exhale]) {
        expect(ms % 1000).toBe(0);
      }
    }
  });

  it('resolvePace returns the match, defaulting to Steady for unknown/absent', () => {
    expect(resolvePace('even').id).toBe('even');
    expect(resolvePace('longer').id).toBe('longer');
    expect(resolvePace(undefined)).toBe(DEFAULT_PACE);
    expect(resolvePace('nonsense')).toBe(DEFAULT_PACE);
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
