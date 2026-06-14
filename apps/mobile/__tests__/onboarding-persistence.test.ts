import { describe, expect, it } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';
import {
  isOnboardingSeen,
  markOnboardingSeen,
  migrate,
  SCHEMA_VERSION,
} from '@/lib/persistence/onboarding';

function makeStorage(init?: Record<string, string>): Storage {
  const m = new Map<string, string>(Object.entries(init ?? {}));
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

describe('onboarding-seen persistence (SR-13 migrator)', () => {
  it('defaults to not-seen and round-trips markSeen', () => {
    const s = makeStorage();
    expect(isOnboardingSeen(s)).toBe(false);
    markOnboardingSeen(s);
    expect(isOnboardingSeen(s)).toBe(true);
  });

  it('reseeds to not-seen on corrupt / missing-version / future-version', () => {
    expect(migrate(null).seen).toBe(false);
    expect(migrate('nope').seen).toBe(false);
    expect(migrate(JSON.stringify({ seen: true })).seen).toBe(false);
    expect(migrate(JSON.stringify({ version: 99, seen: true })).seen).toBe(false);
  });

  it('passes a current-version envelope through', () => {
    expect(migrate(JSON.stringify({ version: SCHEMA_VERSION, seen: true }))).toEqual({
      version: SCHEMA_VERSION,
      seen: true,
    });
  });
});
