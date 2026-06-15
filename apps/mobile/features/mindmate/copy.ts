// MindMate UI copy. Person-first, educational, NEVER diagnostic (SR-2/SR-3).
// No "you have", "you are", "diagnosed with". The mascot fronts the intro.
// FIXTURE — clinically reviewed (Dr. Dobson) before ship; not final.

export const MINDMATE_COPY = {
  title: 'MindMate',
  // Sets expectations up front: educator, not therapist; no diagnosis.
  intro:
    "Hi, I'm MindMate. I share mental-health education and help you find reliable resources. " +
    "I'm not a therapist or doctor, and I don't diagnose — but I'm here to help you make sense " +
    'of what you might be feeling. What would you like to understand?',
  inputPlaceholder: 'Share what’s on your mind',
  sendLabel: 'Send message',
  // Calm, non-clinical states.
  signInTitle: 'Sign in to chat with MindMate',
  signInBody: 'MindMate is available once you’re signed in.',
  signInCta: 'Sign in',
  errorRetry: 'Try again',
  // Crisis card — mirrors the web tone; routes to the full crisis surface (S11).
  crisisTitle: 'It sounds like you’re going through something really hard',
  crisisBody:
    'You deserve support right now, and you don’t have to face this alone. Trained people are ready to listen.',
  crisisCta: 'Get crisis support',
} as const;
