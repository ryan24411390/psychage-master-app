import { describe, expect, it } from 'vitest';

import { detectCrisisContent } from '../crisis';

describe('detectCrisisContent', () => {
  it('is false for empty / whitespace / benign text', () => {
    expect(detectCrisisContent('')).toBe(false);
    expect(detectCrisisContent('   ')).toBe(false);
    expect(detectCrisisContent('Slept badly, lots on my mind about work.')).toBe(false);
  });

  it('flags crisis phrases case-insensitively', () => {
    expect(detectCrisisContent('I want to die')).toBe(true);
    expect(detectCrisisContent('Sometimes I think about SELF-HARM late at night')).toBe(true);
    expect(detectCrisisContent("I can't go on like this")).toBe(true);
  });
});
