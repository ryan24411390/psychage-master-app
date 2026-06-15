// Client-side crisis pre-check (SR-2) — DEFENSE IN DEPTH, not the only line.
//
// The authoritative crisis classifier is server-side (keyword pre-check + Haiku
// classifier in psychage-v2/src/lib/ai/safety.ts; the server returns CRISIS and
// NEVER invokes the LLM). This mirror exists so the mobile client can surface the
// crisis surface INSTANTLY and OFFLINE — before a network round-trip, and even if
// the request never lands. Both signals are honored: this pre-check AND the
// server's `isCrisis` / `safety` event.
//
// SOURCE OF TRUTH: psychage-v2/src/lib/ai/safety.ts CRISIS_KEYWORDS (lines 49-61).
// Keep in sync with that set when it changes. We intentionally mirror ONLY the
// CRISIS tier here (not URGENT/HARMFUL_REQUEST) — those get the server's gentler,
// nuanced handling rather than an instant hard route to the crisis surface.
//
// SR-3: never store, log, or transmit the matched text. This runs and returns a
// boolean; the input is not retained.

const CRISIS_KEYWORDS: readonly RegExp[] = [
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

/**
 * True when the message matches a CRISIS keyword. Pure + synchronous so it runs
 * before the message is ever sent. The caller routes to the crisis surface and
 * suppresses the AI reply when this returns true.
 */
export function precheckCrisis(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  return CRISIS_KEYWORDS.some((pattern) => pattern.test(normalized));
}
