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
    tools: 'Tools',
  },

  tools: {
    menuTitle: 'Sleep tools',
    chronotype: { title: 'Chronotype', sub: 'Find your natural sleep window' },
    bedtime: { title: 'Bedtime calculator', sub: 'Work back from your wake time' },
    debt: { title: 'Sleep debt', sub: 'Catch-up across your recent nights' },
    back: 'Back to tools',

    chronotypeIntro: 'Five quick questions about your natural rhythm. Educational — not a test.',
    chronotypeResult: 'Your pattern',
    chronotypeIdeal: 'A sleep window that often suits this pattern',
    chronotypeSave: 'Use these as my targets',
    chronotypeRetake: 'Retake',

    bedtimeWake: 'When do you want to wake up?',
    bedtimeResult: 'Aim to be asleep around one of these — each lands at the end of a ~90-minute cycle:',
    bedtimeCycles: (cycles: number, hours: string) => `${cycles} cycles · ~${hours}`,

    debtEmpty: 'Log a few nights to estimate recent sleep debt.',
    debtTotal: 'Estimated shortfall, last 14 nights',
    debtRecovery: 'A few steadier nights can ease this gradually.',
  },

  // rMEQ questions (reduced Morningness–Eveningness Questionnaire). Option values
  // feed scoreChronotype; the labels are CT4 content. NOT a clinical instrument.
  chronotypeQuestions: [
    {
      id: 1,
      question: 'If you were free to plan your day, when would you get up?',
      options: [
        { value: 5, label: '5:00–6:30 AM' },
        { value: 4, label: '6:30–7:45 AM' },
        { value: 3, label: '7:45–9:45 AM' },
        { value: 2, label: '9:45–11:00 AM' },
        { value: 1, label: '11:00 AM–12:00 PM' },
      ],
    },
    {
      id: 2,
      question: 'If you were free to plan your evening, when would you go to bed?',
      options: [
        { value: 5, label: '8:00–9:00 PM' },
        { value: 4, label: '9:00–10:15 PM' },
        { value: 3, label: '10:15 PM–12:30 AM' },
        { value: 2, label: '12:30–1:45 AM' },
        { value: 1, label: '1:45–3:00 AM' },
      ],
    },
    {
      id: 3,
      question: 'How alert do you feel in the first half hour after waking?',
      options: [
        { value: 1, label: 'Not at all alert' },
        { value: 2, label: 'Slightly alert' },
        { value: 3, label: 'Fairly alert' },
        { value: 4, label: 'Very alert' },
      ],
    },
    {
      id: 4,
      question: 'Around what time of day do you usually feel your best?',
      options: [
        { value: 5, label: '5:00–8:00 AM' },
        { value: 4, label: '8:00–10:00 AM' },
        { value: 3, label: '10:00 AM–5:00 PM' },
        { value: 2, label: '5:00–10:00 PM' },
        { value: 1, label: '10:00 PM–5:00 AM' },
      ],
    },
    {
      id: 5,
      question: 'Which type do you consider yourself?',
      options: [
        { value: 6, label: 'Definitely a morning type' },
        { value: 4, label: 'More a morning type' },
        { value: 2, label: 'More an evening type' },
        { value: 0, label: 'Definitely an evening type' },
      ],
    },
  ],

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
