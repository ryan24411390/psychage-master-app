// Toolkit exercise definitions (Flow 14). The exercise GEOMETRY + motion + sequencing
// is the build; all CUE / PROMPT / name / need COPY below is CT4 FIXTURE (not Flow Book
// verbatim) — flagged for content review. Pure data + a tiny sequencing helper (no
// React) → Vitest.

export type ExerciseKind = 'breathing' | 'grounding' | 'body_scan';

/** In/hold/out durations in ms. Whole-second multiples so the per-phase countdown
 *  reads cleanly (e.g. 4000 → "4 3 2 1"). HOLD is stillness, not animation. */
export interface BreathingPacing {
  readonly inhale: number;
  readonly hold: number;
  readonly exhale: number;
}

export interface BreathingExercise {
  readonly kind: 'breathing';
  readonly name: string;
  readonly need: string;
  /** Phase words (the active-phase cue). Rendered in ink/Fraunces under the form, or
   *  at promptLg when reduced motion removes the form. */
  readonly cues: { readonly inhale: string; readonly hold: string; readonly exhale: string };
  /** 4-4-6 pacing in ms. HOLD is stillness, not animation. */
  readonly pacing: BreathingPacing;
}

/** A selectable breathing pace. The user picks one on the intro before they begin. */
export interface BreathingPace {
  readonly id: string;
  readonly label: string;
  readonly pacing: BreathingPacing;
}

export interface PromptStep {
  /** Count lives in the label line ("SEE · 5") — NEVER a meter. */
  readonly label: string;
  readonly text: string;
}

export interface PromptExercise {
  readonly kind: 'grounding' | 'body_scan';
  readonly name: string;
  readonly need: string;
  readonly prompts: readonly PromptStep[];
}

export type Exercise = BreathingExercise | PromptExercise;

// FIXTURE copy → CT4 ───────────────────────────────────────────────────────────────
export const BREATHING: BreathingExercise = {
  kind: 'breathing',
  name: 'Breathing',
  need: 'A moment to steady your breath.',
  cues: { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' },
  pacing: { inhale: 4000, hold: 4000, exhale: 6000 },
};

/** The default pace — reuses BREATHING.pacing so the 4-4-6 default stays single-sourced. */
export const DEFAULT_PACE: BreathingPace = {
  id: 'steady',
  label: 'Steady',
  pacing: BREATHING.pacing,
};

/** Selectable paces for the breathing form. DEFAULT_PACE (Steady) leads. All durations
 *  are whole-second multiples (the countdown shows whole seconds). */
export const PACES: readonly BreathingPace[] = [
  DEFAULT_PACE,
  { id: 'even', label: 'Even', pacing: { inhale: 4000, hold: 4000, exhale: 4000 } },
  { id: 'longer', label: 'Longer exhale', pacing: { inhale: 4000, hold: 7000, exhale: 8000 } },
];

/** Resolve a pace by id, defaulting to Steady for an unknown/absent value. */
export function resolvePace(id: string | undefined): BreathingPace {
  return PACES.find((p) => p.id === id) ?? DEFAULT_PACE;
}

/** Calm, non-gamified line shown on the breathing surface. CT4 fixture — content review. */
export const ENCOURAGEMENT = 'Let the breath lead — there’s nothing to get right.';

/** Warm acknowledgement on the wind-down screen. CT4 fixture — content review. */
export const END_NOTE = 'Whenever you need it, it’s here.';

export const GROUNDING: PromptExercise = {
  kind: 'grounding',
  name: 'Grounding',
  need: 'Come back to where you are.',
  prompts: [
    { label: 'SEE · 5', text: 'Notice five things you can see.' },
    { label: 'HEAR · 4', text: 'Notice four things you can hear.' },
    { label: 'TOUCH · 3', text: 'Notice three things you can feel.' },
    { label: 'SMELL · 2', text: 'Notice two things you can smell.' },
    { label: 'TASTE · 1', text: 'Notice one thing you can taste.' },
  ],
};

export const BODY_SCAN: PromptExercise = {
  kind: 'body_scan',
  name: 'Body scan',
  need: 'Soften, one part at a time.',
  prompts: [
    { label: '1 of 5', text: 'Rest your attention on your feet.' },
    { label: '2 of 5', text: 'Let your legs grow heavy.' },
    { label: '3 of 5', text: 'Soften through your stomach and chest.' },
    { label: '4 of 5', text: 'Loosen your shoulders and arms.' },
    { label: '5 of 5', text: 'Ease the muscles of your face.' },
  ],
};

export const EXERCISES: Readonly<Record<ExerciseKind, Exercise>> = {
  breathing: BREATHING,
  grounding: GROUNDING,
  body_scan: BODY_SCAN,
};

/** Resolve an exercise by kind, defaulting to breathing for an unknown/absent value. */
export function resolveExercise(kind: string | undefined): Exercise {
  if (kind === 'grounding') return GROUNDING;
  if (kind === 'body_scan') return BODY_SCAN;
  return BREATHING;
}

/** Next prompt index, or null when the sequence is complete (tap past the last step). */
export function nextPromptIndex(current: number, total: number): number | null {
  return current + 1 < total ? current + 1 : null;
}
