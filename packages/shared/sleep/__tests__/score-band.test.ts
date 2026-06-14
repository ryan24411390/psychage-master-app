import { describe, expect, it } from 'vitest';

import { bandForScore, SLEEP_SCORE_BANDS } from '../score-band';

describe('bandForScore — SR-1 closed vocabulary', () => {
  it('maps the four buckets at their boundaries (80 / 60 / 40)', () => {
    expect(bandForScore(100)).toBe('rested');
    expect(bandForScore(80)).toBe('rested');
    expect(bandForScore(79)).toBe('steady');
    expect(bandForScore(60)).toBe('steady');
    expect(bandForScore(59)).toBe('uneven');
    expect(bandForScore(40)).toBe('uneven');
    expect(bandForScore(39)).toBe('low');
    expect(bandForScore(0)).toBe('low');
  });

  it('classifies out-of-range inputs without throwing or leaking a number', () => {
    expect(bandForScore(120)).toBe('rested');
    expect(bandForScore(-5)).toBe('low');
  });

  it('exposes the four bands lowest → highest', () => {
    expect(SLEEP_SCORE_BANDS).toEqual(['low', 'uneven', 'steady', 'rested']);
  });
});
