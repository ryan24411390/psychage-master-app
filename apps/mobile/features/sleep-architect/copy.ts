// CT4 FIXTURE — Sleep Architect copy. NOT final wording. Every user-facing string
// that touches sleep "quality" is framed as optimization/education, never a
// verdict or diagnosis (SR-1 / SR-3) — flagged for Dr. Dobson clinical review
// before ship. The composite score is surfaced only as one of four bands; no
// number, gauge, or percentage bar ever reaches the UI (SR-1).
import type { SleepScoreBand } from '@psychage/shared/sleep';

const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_SLEEP = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  title: 'Sleep Architect',
  tagline: 'Understand your nights — gently, on your terms',

  tabs: {
    overview: 'Overview',
    diary: 'Diary',
    dashboard: 'Patterns',
  },

  disclaimer:
    'These are estimates based on what you log and typical adult sleep patterns. ' +
    'This is education, not medical advice or a diagnosis. If sleep difficulties ' +
    'persist, a healthcare provider or sleep specialist can help.',

  // SR-1: band id → gentle, non-verdict copy. Order low → rested.
  bands: {
    low: { label: 'Running low', note: 'Recent nights look light. Small steps can help.' },
    uneven: { label: 'A bit uneven', note: 'Your nights vary. Patterns below may show why.' },
    steady: { label: 'Mostly steady', note: 'A fairly steady stretch of nights.' },
    rested: { label: 'Well rested', note: 'Recent nights look steady and full.' },
  } satisfies Record<SleepScoreBand, { label: string; note: string }>,

  scoreCaption: 'Based on your recent nights',
  componentLabels: {
    duration: 'Length',
    efficiency: 'Efficiency',
    quality: 'Quality',
    consistency: 'Consistency',
    latency: 'Falling asleep',
  },

  metrics: {
    avgSleep: 'Typical sleep',
    efficiency: 'Time asleep in bed',
    latency: 'Time to fall asleep',
    streak: 'Nights logged in a row',
    trendTitle: 'Sleep length, recent nights',
  },

  diary: {
    logToday: 'Log last night',
    edit: 'Edit',
    emptyTitle: 'No nights logged yet',
    emptyBody: 'Log last night to start seeing your patterns.',
    quality: 'Quality',
  },

  dashboard: {
    emptyTitle: 'Patterns appear as you log',
    emptyBody: 'A few nights in, you’ll see your typical length, timing, and trend here.',
  },

  form: {
    heading: 'Last night',
    bedtime: 'Got into bed',
    lightsOut: 'Tried to sleep',
    onset: 'Minutes to fall asleep',
    wakings: 'Times woke in the night',
    wakeDuration: 'Minutes awake in the night',
    wakeTime: 'Woke up',
    outOfBed: 'Got out of bed',
    quality: 'How rested do you feel?',
    mood: 'Morning mood',
    dreamRecall: 'Remember a dream?',
    dreamNotes: 'Dream notes (optional)',
    substances: 'Before bed',
    alcohol: 'Alcohol',
    exercise: 'Exercised',
    medication: 'Sleep aid',
    caffeine: 'Last caffeine (optional)',
    notes: 'Notes (optional)',
    save: 'Save night',
    cancel: 'Cancel',
    timeHint: 'HH:MM, 24-hour (e.g. 23:30)',
    invalid: 'Please check the highlighted fields — times use HH:MM (00:00–23:59).',
  },

  ratingScale: ['Poorly', 'Not great', 'Okay', 'Good', 'Very good'] as const,
} as const;
