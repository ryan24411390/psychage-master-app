// Mascot asset manifest — the single source of truth mapping each named mascot state
// to its founder-delivered PNG (bone-white clay figure, one pose per state). Staged in
// apps/mobile/assets/mascot/ as mascot-<state>.png. Asset requires MUST be static string
// literals for Metro's asset resolver, so paths are relative (the @/ alias is import-only).

// The 20 canonical states. This union is the contract every render site selects from.
export type MascotState =
  | 'neutral'
  | 'morning'
  | 'night'
  | 'tilt'
  | 'seated'
  | 'listening'
  | 'meditating'
  | 'resting'
  | 'hi'
  | 'accomplished'
  | 'encouraging'
  | 'reaching-out'
  | 'guiding'
  | 'thoughtful'
  | 'oops'
  | 'searching'
  | 'looking-up'
  | 'looking-down'
  | 'open'
  | 'friendly';

// night-alt is a 21st staged asset (sleepy slit-eye night variant). It is NOT a selectable
// state (kept off the MascotState union by design) — it lives here as a documented reserve
// the night override may opt into later. Today the override deterministically picks 'night'.
export type MascotAsset = MascotState | 'night-alt';

export const MASCOT_SOURCES: Record<MascotAsset, number> = {
  neutral: require('../../assets/mascot/mascot-neutral.png'),
  morning: require('../../assets/mascot/mascot-morning.png'),
  night: require('../../assets/mascot/mascot-night.png'),
  'night-alt': require('../../assets/mascot/mascot-night-alt.png'),
  tilt: require('../../assets/mascot/mascot-tilt.png'),
  seated: require('../../assets/mascot/mascot-seated.png'),
  listening: require('../../assets/mascot/mascot-listening.png'),
  meditating: require('../../assets/mascot/mascot-meditating.png'),
  resting: require('../../assets/mascot/mascot-resting.png'),
  hi: require('../../assets/mascot/mascot-hi.png'),
  accomplished: require('../../assets/mascot/mascot-accomplished.png'),
  encouraging: require('../../assets/mascot/mascot-encouraging.png'),
  'reaching-out': require('../../assets/mascot/mascot-reaching-out.png'),
  guiding: require('../../assets/mascot/mascot-guiding.png'),
  thoughtful: require('../../assets/mascot/mascot-thoughtful.png'),
  oops: require('../../assets/mascot/mascot-oops.png'),
  searching: require('../../assets/mascot/mascot-searching.png'),
  'looking-up': require('../../assets/mascot/mascot-looking-up.png'),
  'looking-down': require('../../assets/mascot/mascot-looking-down.png'),
  open: require('../../assets/mascot/mascot-open.png'),
  friendly: require('../../assets/mascot/mascot-friendly.png'),
};

// Breathing scale-loop fires ONLY on these calm/idle states. Gesture and directional
// states (hi, oops, tilt, reaching-out, etc.) render static — a waving figure that also
// "breathes" reads as jitter, not calm. (Sacred: motion stays subtle and purposeful.)
export const MASCOT_IDLE_STATES: ReadonlySet<MascotState> = new Set<MascotState>([
  'neutral',
  'morning',
  'night',
  'seated',
]);

// All 20 canonical states, for exhaustiveness checks/tests.
export const MASCOT_STATES: readonly MascotState[] = Object.keys(MASCOT_SOURCES).filter(
  (k): k is MascotState => k !== 'night-alt',
);
