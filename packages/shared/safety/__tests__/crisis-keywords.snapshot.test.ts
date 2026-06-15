import { describe, expect, it } from 'vitest';

import { CRISIS_KEYWORDS, precheckCrisis } from '../crisis-keywords';

// ─── Drift guard ─────────────────────────────────────────────────────────────
// Committed verbatim copy of the WEB source of truth:
//   psychage-v2/src/lib/ai/safety.ts CRISIS_KEYWORDS (lines 49-61),
//   last verified 2026-06-16.
// The shared list MUST stay byte-identical to this. If the shared list is edited,
// this test fails until the reference below is updated too — which is the moment
// to re-verify against the live web source (separate repo, can't be imported).
// Mobile mirrors ONLY the CRISIS tier (not URGENT/HARMFUL_REQUEST) by design.
const WEB_CRISIS_KEYWORDS_REFERENCE: RegExp[] = [
  /\b(kill\s*(my)?self|suicide|suicidal)\b/i,
  /\b(end(ing)?\s*(my\s*life|it\s*all|this\s*(life|all)))\b/i,
  /\b(want\s*to\s*die|wanna\s*die|wish\s*i\s*was\s*dead)\b/i,
  /\b(no\s*reason\s*to\s*live|nothing\s*to\s*live\s*for)\b/i,
  /\b(going\s*to\s*(hurt|harm|kill)\s*(myself|me))\b/i,
  /\b(took\s*(a\s*bunch\s*of\s*)?pills|overdos(e|ed|ing))\b/i,
  /\b(cutting\s*(myself|my\s*wrist)|self[\s-]?harm(ing)?)\b/i,
  /\b(jump(ing)?\s*(off|from)|hang(ing)?\s*myself)\b/i,
  /\b(want\s*to\s*kill|going\s*to\s*kill)\s+\w+/i,
  /\b(someone\s*is\s*(hurting|abusing|attacking)\s*me)\b/i,
  /\b(i['']?m\s*in\s*danger)\b/i,
];

describe('shared CRISIS_KEYWORDS drift guard', () => {
  it('matches the committed web reference exactly (source + flags + count)', () => {
    expect(CRISIS_KEYWORDS).toHaveLength(WEB_CRISIS_KEYWORDS_REFERENCE.length);
    expect(CRISIS_KEYWORDS.map((r) => r.source)).toEqual(
      WEB_CRISIS_KEYWORDS_REFERENCE.map((r) => r.source),
    );
    expect(CRISIS_KEYWORDS.map((r) => r.flags)).toEqual(
      WEB_CRISIS_KEYWORDS_REFERENCE.map((r) => r.flags),
    );
  });

  it('every pattern is case-insensitive', () => {
    for (const r of CRISIS_KEYWORDS) {
      expect(r.flags).toContain('i');
    }
  });
});

describe('precheckCrisis behavior', () => {
  it('flags representative CRISIS phrasing across the tiers', () => {
    for (const phrase of [
      'I want to kill myself',
      'I am suicidal',
      'thinking about ending my life',
      'I just want to die',
      'there is no reason to live',
      'I took a bunch of pills',
      'cutting myself again',
      'someone is hurting me',
      "i'm in danger",
    ]) {
      expect(precheckCrisis(phrase), phrase).toBe(true);
    }
  });

  it('is case-insensitive and tolerant of surrounding text', () => {
    expect(precheckCrisis('honestly, I just WANT TO DIE lately')).toBe(true);
  });

  it('does not flag ordinary low-mood phrasing', () => {
    for (const phrase of [
      'I had a rough day',
      'feeling a bit down lately',
      'work has been stressful',
      '',
    ]) {
      expect(precheckCrisis(phrase), phrase).toBe(false);
    }
  });
});
