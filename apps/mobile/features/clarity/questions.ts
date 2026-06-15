// Clarity Score — the 20 questions, ported VERBATIM from psychage-v2
// src/lib/clarity/questions.ts (item text + option scales unchanged). Pure data,
// no components. The instrument scales differ per block, so each question carries
// its own options; the scoring in scoring.ts depends on these exact value ranges.
//
//   PHQ-4  (q1–q4)   0–3, higher = worse
//   WHO-5  (q5–q9)   0–5, INVERTED (0 = best mental state, 5 = worst)
//   UCLA-3 (q10–q12) 1–3, higher = worse
//   PSS-4  (q13–q16) 0–4 (q14 & q15 reverse-scored in scoring.ts)
//   FUNC   (q17–q20) 0–4, higher = worse
//
// `lead` is the small calm context line shown above the prompt on the per-question
// screen (one question per screen on mobile). Carried from the web's domain citations.

export type ClarityInstrument = 'PHQ-4' | 'WHO-5' | 'UCLA-3' | 'PSS-4' | 'FUNC';

export interface ClarityScaleOption {
  readonly value: number;
  readonly label: string;
}

export interface ClarityQuestion {
  readonly id: string;
  readonly instrument: ClarityInstrument;
  readonly lead: string;
  readonly prompt: string;
  readonly options: readonly ClarityScaleOption[];
}

const phqOptions: readonly ClarityScaleOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const who5Options: readonly ClarityScaleOption[] = [
  { value: 0, label: 'All of the time' },
  { value: 1, label: 'Most of the time' },
  { value: 2, label: 'More than half of the time' },
  { value: 3, label: 'Less than half of the time' },
  { value: 4, label: 'Some of the time' },
  { value: 5, label: 'At no time' },
];

const uclaOptions: readonly ClarityScaleOption[] = [
  { value: 1, label: 'Hardly ever' },
  { value: 2, label: 'Some of the time' },
  { value: 3, label: 'Often' },
];

const pssOptions: readonly ClarityScaleOption[] = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly often' },
  { value: 4, label: 'Very often' },
];

const funcOptions: readonly ClarityScaleOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little bit' },
  { value: 2, label: 'Moderately' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Extremely' },
];

const PHQ_LEAD = 'Over the last 2 weeks, how often have you been bothered by…';
const WHO_LEAD = 'Over the last 2 weeks…';
const UCLA_LEAD = 'How often do you feel…';
const PSS_LEAD = 'In the last month…';
const FUNC_LEAD = 'Over the last 2 weeks…';

export const CLARITY_QUESTIONS: readonly ClarityQuestion[] = [
  // PHQ-4 → Emotional Wellness
  { id: 'q1', instrument: 'PHQ-4', lead: PHQ_LEAD, prompt: 'Feeling nervous, anxious, or on edge', options: phqOptions },
  { id: 'q2', instrument: 'PHQ-4', lead: PHQ_LEAD, prompt: 'Not being able to stop or control worrying', options: phqOptions },
  { id: 'q3', instrument: 'PHQ-4', lead: PHQ_LEAD, prompt: 'Little interest or pleasure in doing things', options: phqOptions },
  { id: 'q4', instrument: 'PHQ-4', lead: PHQ_LEAD, prompt: 'Feeling down, depressed, or hopeless', options: phqOptions },

  // WHO-5 → Overall Wellbeing
  { id: 'q5', instrument: 'WHO-5', lead: WHO_LEAD, prompt: 'I have felt cheerful and in good spirits', options: who5Options },
  { id: 'q6', instrument: 'WHO-5', lead: WHO_LEAD, prompt: 'I have felt calm and relaxed', options: who5Options },
  { id: 'q7', instrument: 'WHO-5', lead: WHO_LEAD, prompt: 'I have felt active and vigorous', options: who5Options },
  { id: 'q8', instrument: 'WHO-5', lead: WHO_LEAD, prompt: 'I woke up feeling fresh and rested', options: who5Options },
  { id: 'q9', instrument: 'WHO-5', lead: WHO_LEAD, prompt: 'My daily life has been filled with things that interest me', options: who5Options },

  // UCLA 3-Item → Social Connection
  { id: 'q10', instrument: 'UCLA-3', lead: UCLA_LEAD, prompt: 'How often do you feel that you lack companionship?', options: uclaOptions },
  { id: 'q11', instrument: 'UCLA-3', lead: UCLA_LEAD, prompt: 'How often do you feel left out?', options: uclaOptions },
  { id: 'q12', instrument: 'UCLA-3', lead: UCLA_LEAD, prompt: 'How often do you feel isolated from others?', options: uclaOptions },

  // PSS-4 → Stress Load
  { id: 'q13', instrument: 'PSS-4', lead: PSS_LEAD, prompt: 'How often have you felt that you were unable to control the important things in your life?', options: pssOptions },
  { id: 'q14', instrument: 'PSS-4', lead: PSS_LEAD, prompt: 'How often have you felt confident about your ability to handle your personal problems?', options: pssOptions },
  { id: 'q15', instrument: 'PSS-4', lead: PSS_LEAD, prompt: 'How often have you felt that things were going your way?', options: pssOptions },
  { id: 'q16', instrument: 'PSS-4', lead: PSS_LEAD, prompt: 'How often have you felt difficulties were piling up so high that you could not overcome them?', options: pssOptions },

  // Custom → Daily Functioning
  { id: 'q17', instrument: 'FUNC', lead: FUNC_LEAD, prompt: 'How much have your symptoms interfered with your daily life or work?', options: funcOptions },
  { id: 'q18', instrument: 'FUNC', lead: FUNC_LEAD, prompt: 'How much difficulty have you had maintaining personal relationships?', options: funcOptions },
  { id: 'q19', instrument: 'FUNC', lead: FUNC_LEAD, prompt: 'How often have you struggled to fulfill your responsibilities?', options: funcOptions },
  { id: 'q20', instrument: 'FUNC', lead: FUNC_LEAD, prompt: 'How much has your mental state affected your physical health?', options: funcOptions },
];

/** Total item count — the flow's terminal index is `CLARITY_QUESTION_COUNT - 1`. */
export const CLARITY_QUESTION_COUNT = CLARITY_QUESTIONS.length;

/** The PHQ-4 boundary: the crisis pattern is re-checked right after this index. */
export const PHQ4_LAST_INDEX = 3; // q4
