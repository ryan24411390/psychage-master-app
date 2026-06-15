// Mood Journal — the preset tag vocabularies.
//
// A "moment" is tagged with EMOTIONS (how it felt) and TRIGGERS (what was around
// it). Both lists are closed sets, lifted verbatim from the web tool
// (psychage-v2 StepEmotions / StepImpact) so the cross-platform vocabulary agrees.
// The unions are the validation surface: the migrator and the store reject any tag
// not in these arrays, so a corrupt blob can never inject a free-text "tag".
//
// Educational framing (SR-3): these are descriptive labels a person chooses, never
// a diagnosis. No tag here is a condition or a clinical category.

/** What a moment felt like. Closed set — multi-select, person chooses. */
export const EMOTION_TAGS = [
  'Happy',
  'Calm',
  'Grateful',
  'Excited',
  'Proud',
  'Relaxed',
  'Anxious',
  'Stressed',
  'Tired',
  'Sad',
  'Angry',
  'Lonely',
] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];

/** What was around a moment (the "impact areas" / triggers). Closed set. */
export const TRIGGER_TAGS = [
  'Work',
  'Family',
  'Relationships',
  'Health',
  'Sleep',
  'Hobbies',
  'Weather',
  'Finances',
  'News',
] as const;

export type TriggerTag = (typeof TRIGGER_TAGS)[number];

const EMOTION_SET: ReadonlySet<string> = new Set(EMOTION_TAGS);
const TRIGGER_SET: ReadonlySet<string> = new Set(TRIGGER_TAGS);

export function isEmotionTag(value: unknown): value is EmotionTag {
  return typeof value === 'string' && EMOTION_SET.has(value);
}

export function isTriggerTag(value: unknown): value is TriggerTag {
  return typeof value === 'string' && TRIGGER_SET.has(value);
}

/** Canonical preset index (for deterministic, vocabulary-ordered tie-breaks). */
export function emotionIndex(tag: EmotionTag): number {
  return EMOTION_TAGS.indexOf(tag);
}

export function triggerIndex(tag: TriggerTag): number {
  return TRIGGER_TAGS.indexOf(tag);
}
