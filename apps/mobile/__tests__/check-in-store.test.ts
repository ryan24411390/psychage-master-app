import { describe, expect, it } from 'vitest';

import { getCheckInStore } from '@/lib/check-in-store';

// Vitest can transform the workspace shared package, so this exercises the REAL
// CheckInRecordStore wired with the mobile adapters (in-memory storage seam + the
// local id factory) end-to-end — the runtime path the Jest render tests deliberately
// avoid. Local-only; no network.
describe('getCheckInStore (real local store)', () => {
  it('saves today, reads it back, and overwrites on a same-day re-save', () => {
    const store = getCheckInStore();

    const first = store.saveToday(2);
    expect(first.state).toBe(2);
    expect(store.getToday()?.state).toBe(2);

    const second = store.saveToday(4);
    expect(store.getToday()?.state).toBe(4);
    expect(second.id).toBe(first.id); // same-day re-save edits, keeps the id
    expect(store.getRecent(7).length).toBe(1); // still one day
  });
});
