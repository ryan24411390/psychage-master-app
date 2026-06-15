import { describe, expect, it } from 'vitest';

import { precheckCrisis } from '@psychage/shared/safety';

// SR-2 client pre-check. Now single-sourced in @psychage/shared/safety (mirrors
// psychage-v2 CRISIS_KEYWORDS) — the instant, offline crisis route. These
// assertions pin the behavior the safety layer depends on; a regression here is a
// safety regression. The shared drift guard
// (packages/shared/safety/__tests__/crisis-keywords.snapshot.test.ts) pins the list
// itself to the committed web reference.
describe('precheckCrisis (SR-2 client pre-check)', () => {
  it('flags explicit self-harm / suicidal ideation', () => {
    for (const phrase of [
      'I want to kill myself',
      'i am suicidal',
      'I want to die',
      'thinking about ending my life',
      'I took a bunch of pills',
      'I have been cutting myself',
      "I'm in danger",
    ]) {
      expect(precheckCrisis(phrase), phrase).toBe(true);
    }
  });

  it('does not flag benign, educational messages', () => {
    for (const phrase of [
      'What is generalized anxiety?',
      'I had a stressful day at work',
      'Can you explain CBT?',
      'I want to learn about depression',
      'how do I sleep better',
    ]) {
      expect(precheckCrisis(phrase), phrase).toBe(false);
    }
  });

  it('is case-insensitive and tolerant of surrounding text', () => {
    expect(precheckCrisis('honestly, I just WANT TO DIE lately')).toBe(true);
  });
});
