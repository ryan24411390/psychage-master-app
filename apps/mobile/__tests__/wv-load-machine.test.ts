import { describe, expect, it } from 'vitest';

import tokens from '../../../tokens/mobile.tokens.json';
import {
  INITIAL_WV_LOAD_STATE,
  WV_LOAD_GRACE_MS,
  WV_STILL_LOADING_MS,
  type WvLoadEvent,
  type WvLoadState,
  timersFor,
  wvLoadReducer,
} from '@/features/webview/wv-load-machine';

function run(events: WvLoadEvent['type'][], start: WvLoadState = INITIAL_WV_LOAD_STATE): WvLoadState {
  return events.reduce<WvLoadState>((s, type) => wvLoadReducer(s, { type } as WvLoadEvent), start);
}

describe('C-WV-LOAD machine', () => {
  it('START enters grace and arms both timers', () => {
    const s = wvLoadReducer(INITIAL_WV_LOAD_STATE, { type: 'START' });
    expect(s.phase).toBe('grace');
    const events = timersFor('grace').map((t) => t.event);
    expect(events).toContain('GRACE_ELAPSED');
    expect(events).toContain('STILL_ELAPSED');
  });

  it('a fast load during grace skips the skeleton (0–400ms shows nothing)', () => {
    expect(run(['START', 'LOAD_END']).phase).toBe('loaded');
  });

  it('grace → skeleton → stillLoading → loaded', () => {
    expect(run(['START', 'GRACE_ELAPSED']).phase).toBe('skeleton');
    expect(run(['START', 'GRACE_ELAPSED', 'STILL_ELAPSED']).phase).toBe('stillLoading');
    expect(run(['START', 'GRACE_ELAPSED', 'STILL_ELAPSED', 'LOAD_END']).phase).toBe('loaded');
  });

  it('error then retry returns to grace', () => {
    expect(run(['START', 'GRACE_ELAPSED', 'LOAD_ERROR']).phase).toBe('error');
    expect(run(['START', 'GRACE_ELAPSED', 'LOAD_ERROR', 'RETRY']).phase).toBe('grace');
  });

  it('auth-expired → silent reissue → silent grace that never flashes the skeleton', () => {
    expect(run(['START', 'GRACE_ELAPSED', 'AUTH_EXPIRED']).phase).toBe('reissuing');
    const silentGrace = run(['START', 'GRACE_ELAPSED', 'AUTH_EXPIRED', 'REISSUE_OK']);
    expect(silentGrace).toEqual({ phase: 'grace', silent: true });
    // a silent grace stays put on GRACE_ELAPSED (no skeleton), then loads
    expect(run(['START', 'AUTH_EXPIRED', 'REISSUE_OK', 'GRACE_ELAPSED']).phase).toBe('grace');
    expect(run(['START', 'AUTH_EXPIRED', 'REISSUE_OK', 'GRACE_ELAPSED', 'LOAD_END']).phase).toBe(
      'loaded',
    );
  });

  it('reissue failure → error', () => {
    expect(run(['START', 'AUTH_EXPIRED', 'REISSUE_FAIL']).phase).toBe('error');
  });

  it('loaded is terminal for further LOAD_END', () => {
    expect(run(['START', 'LOAD_END', 'LOAD_END']).phase).toBe('loaded');
  });

  it('the still-loading threshold equals the breath token; grace is 400ms', () => {
    expect(WV_STILL_LOADING_MS).toBe(tokens.motion.duration.breath);
    expect(WV_LOAD_GRACE_MS).toBe(400);
  });
});
