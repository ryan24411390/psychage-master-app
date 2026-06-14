// CT4 FIXTURE — placeholder UI copy for the Settings surfaces (Flow 18), NOT
// final/clinically-reviewed. The reminder confirmation lines marked (Flow 3) ARE
// the verbatim strings the order gives; everything else is a fixture to be
// resolved before ship. Every object carries `_fixture`/`_marker` so the design
// audit and grep find all placeholders.

const FIXTURE = 'FIXTURE — not final copy' as const;

export const CT4_SETTINGS = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  hub: {
    title: 'Settings',
    profileLabel: 'Profile',
    rows: {
      reminders: 'Reminders',
      makeItYours: 'Make it yours',
      appearance: 'Accessibility & appearance',
      privacy: 'Privacy & your data',
      about: 'About & legal',
      supporter: 'Keep Psychage free',
      signOut: 'Sign out',
    },
  },

  reminders: {
    title: 'Reminders',
    intro:
      'One gentle daily reminder to check in. People who check in around the same time each day notice patterns sooner.',
    enabledLabel: 'Daily reminder',
    timeLabel: 'Time',
    changeTime: 'Change time',
    notNow: 'Not now',
    never: 'Never',
    // (Flow 3) verbatim confirmation lines.
    setConfirmation: 'Set. 9:00 PM, changeable in Settings.',
    neverConfirmation: 'Okay — reminders stay off. You can turn them on any time in Settings.',
  },

  makeItYours: {
    title: 'Make it yours',
    nameLabel: 'What should we call you?',
    namePlaceholder: 'Your name (optional)',
    leadLabel: 'What leads your home screen',
    leadOptions: {
      'check-in': 'Daily check-in',
      navigator: 'Make sense of what you feel',
      toolkit: 'Steady yourself right now',
    },
    save: 'Save',
  },

  appearance: {
    title: 'Accessibility & appearance',
    appearanceLabel: 'Appearance',
    modeOptions: {
      light: 'Light',
      night: 'Night',
      system: 'Match system',
    },
    reduceMotionLabel: 'Reduce motion',
    reduceMotionDescription: 'Calms animations across the app.',
    dynamicTypeNote: 'Text follows your system text-size setting.',
  },

  about: {
    title: 'About & legal',
    rows: {
      terms: 'Terms of use',
      privacy: 'Privacy policy',
      disclaimer: 'Educational use disclaimer',
    },
    // U6 educational disclaimer — store-blocking; final copy is CT4/legal sign-off.
    disclaimerBody:
      'Psychage is an educational resource. It does not diagnose, treat, or replace professional care. If you need help now, use the Help now button.',
    version: 'Version',
  },
} as const;
