// C-WV-LOAD — the WebView loading state machine. PURE: no react, no react-native,
// no react-native-webview imports, so it runs under Vitest. The WebViewSurface
// component owns the real timers + WebView event wiring and delegates every
// DECISION here.
//
// The treatment (NO spinner, STATIC — no shimmer, which would be a forbidden 5th
// motion verb):
//   0–400ms        → nothing (paper/night base only) — `grace`
//   >400ms, <4s    → static clay skeleton on the settle verb — `skeleton`
//   >4s            → skeleton + a quiet "Still loading…" line — `stillLoading`
//   load complete  → ONE settle swaps to the page — `loaded`
//   error          → frame swap + retry — `error`
//   auth expired   → SILENT re-handshake (no skeleton re-show) — `reissuing` → silent grace

export const WV_LOAD_GRACE_MS = 400;
// Equals tokens/mobile.tokens.json motion.duration.breath (4000). A unit test pins
// the equality so a token change is caught (the token is the canonical source; this
// module stays Vitest-pure by not importing lib/motion, which pulls in Reanimated).
export const WV_STILL_LOADING_MS = 4000;

export type WvPhase =
  | 'idle'
  | 'grace'
  | 'skeleton'
  | 'stillLoading'
  | 'loaded'
  | 'error'
  | 'reissuing';

export interface WvLoadState {
  readonly phase: WvPhase;
  // During a silent auth re-handshake reload, the already-painted page stays put and
  // the skeleton is suppressed — `silent` carries that intent through `grace`.
  readonly silent: boolean;
}

export type WvLoadEvent =
  | { type: 'START' }
  | { type: 'GRACE_ELAPSED' }
  | { type: 'STILL_ELAPSED' }
  | { type: 'LOAD_END' }
  | { type: 'LOAD_ERROR' }
  | { type: 'RETRY' }
  | { type: 'AUTH_EXPIRED' }
  | { type: 'REISSUE_OK' }
  | { type: 'REISSUE_FAIL' };

export const INITIAL_WV_LOAD_STATE: WvLoadState = { phase: 'idle', silent: false };

const grace = (silent: boolean): WvLoadState => ({ phase: 'grace', silent });
const loaded: WvLoadState = { phase: 'loaded', silent: false };
const error: WvLoadState = { phase: 'error', silent: false };

export function wvLoadReducer(state: WvLoadState, event: WvLoadEvent): WvLoadState {
  switch (event.type) {
    case 'START':
      return grace(false);

    case 'GRACE_ELAPSED':
      if (state.phase !== 'grace') return state;
      // A silent reissue reload keeps the frozen page — never flashes the skeleton.
      return state.silent ? state : { phase: 'skeleton', silent: false };

    case 'STILL_ELAPSED':
      return state.phase === 'skeleton' ? { phase: 'stillLoading', silent: false } : state;

    case 'LOAD_END':
      // Any in-flight phase resolves to the painted page with one settle.
      if (
        state.phase === 'grace' ||
        state.phase === 'skeleton' ||
        state.phase === 'stillLoading'
      ) {
        return loaded;
      }
      return state;

    case 'LOAD_ERROR':
      if (
        state.phase === 'grace' ||
        state.phase === 'skeleton' ||
        state.phase === 'stillLoading'
      ) {
        return error;
      }
      return state;

    case 'RETRY':
      return state.phase === 'error' ? grace(false) : state;

    case 'AUTH_EXPIRED':
      // Auth can expire mid-load or after the page is up — both go to a silent reissue.
      if (
        state.phase === 'grace' ||
        state.phase === 'skeleton' ||
        state.phase === 'stillLoading' ||
        state.phase === 'loaded'
      ) {
        return { phase: 'reissuing', silent: true };
      }
      return state;

    case 'REISSUE_OK':
      // Reload silently — suppress the skeleton via the silent grace.
      return state.phase === 'reissuing' ? grace(true) : state;

    case 'REISSUE_FAIL':
      return state.phase === 'reissuing' ? error : state;

    default:
      return state;
  }
}

// Which timers the surface should arm for a phase (pure descriptor — the component
// turns these into real setTimeout calls). Only the loading phases arm timers.
export interface TimerSpec {
  readonly event: WvLoadEvent['type'];
  readonly ms: number;
}

export function timersFor(phase: WvPhase): readonly TimerSpec[] {
  if (phase === 'grace') {
    return [
      { event: 'GRACE_ELAPSED', ms: WV_LOAD_GRACE_MS },
      { event: 'STILL_ELAPSED', ms: WV_STILL_LOADING_MS },
    ];
  }
  return [];
}
