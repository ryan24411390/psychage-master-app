import { describe, expect, it } from 'vitest';
import { syncAccountName } from '@/features/auth/sync-account-name';
import type { Storage } from '@/lib/adapters/storage';
import { loadPersonalization, savePersonalization } from '@/lib/persistence/personalization';

function memStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

describe('syncAccountName (P63)', () => {
  it('persists a verified session name, preserving homeLead + interests (A-flag)', () => {
    const s = memStorage();
    savePersonalization(s, { name: null, homeLead: 'navigator', interests: ['sleep-body-connection'] });

    syncAccountName({ email: 'a@b.co', verified: true, name: 'Mara' }, s);

    const loaded = loadPersonalization(s);
    expect(loaded.name).toBe('Mara');
    expect(loaded.homeLead).toBe('navigator');
    expect(loaded.interests).toEqual(['sleep-body-connection']); // never clobbered
  });

  it('no-ops for an unverified session (no verified method → no name saved)', () => {
    const s = memStorage();
    syncAccountName({ email: 'a@b.co', verified: false, name: 'Mara' }, s);
    expect(loadPersonalization(s).name).toBeNull();
  });

  it('no-ops when the verified method carries no name', () => {
    const s = memStorage();
    syncAccountName({ email: 'a@b.co', verified: true, name: null }, s);
    expect(loadPersonalization(s).name).toBeNull();
  });

  it('no-ops for a signed-out (null) session', () => {
    const s = memStorage();
    savePersonalization(s, { name: 'Kept', homeLead: 'check-in', interests: ['x'] });
    syncAccountName(null, s);
    const loaded = loadPersonalization(s);
    expect(loaded.name).toBe('Kept'); // never cleared here
    expect(loaded.interests).toEqual(['x']);
  });
});
