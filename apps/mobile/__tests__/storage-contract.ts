// Storage contract — shared behavioral suite for the `Storage` interface.
//
// The interface has two implementations resolved by Metro platform resolution:
//   - lib/adapters/storage.ts        — in-memory (node / vitest / Metro web)
//   - lib/adapters/storage.native.ts — MMKV-backed (iOS / Android)
//
// This file is the SINGLE source of truth for what either impl must promise. It
// exports `runStorageContract(name, makeStorage)` so any runner can point it at
// a concrete impl. The in-memory invocation runs here under vitest
// (storage-contract.inmemory.test.ts).
//
// NATIVE INTENT: storage.native.ts cannot load `react-native-mmkv` in a node
// env, so it is NOT exercised here. A future on-device test (Maestro / A-5)
// imports `runStorageContract` and runs the identical suite against the real
// MMKV impl on a simulator/device — proving both sides honor the same contract
// without duplicating a single assertion.
//
// `globals: false` in vitest.config.ts → describe/it/expect are imported, not
// ambient. The contract only asserts the declared surface (get / set / remove);
// it invents no capability the interface doesn't promise.

import { describe, it, expect } from 'vitest';

import type { Storage } from '@/lib/adapters/storage';

/**
 * Run the full Storage behavioral contract against an implementation.
 *
 * @param name        label for the describe block (e.g. 'in-memory', 'mmkv')
 * @param makeStorage factory returning a Storage to exercise. Cases use unique
 *                    namespaced keys so a shared/singleton-backed impl stays
 *                    isolated without a per-test reset hook.
 */
export function runStorageContract(name: string, makeStorage: () => Storage): void {
  describe(`Storage contract: ${name}`, () => {
    it('set → get round-trips the value', () => {
      const storage = makeStorage();
      storage.set('contract:roundtrip', 'hello');
      expect(storage.get('contract:roundtrip')).toBe('hello');
    });

    it('get on a missing key → null', () => {
      const storage = makeStorage();
      expect(storage.get('contract:never-written')).toBeNull();
    });

    it('set twice on the same key → last write wins', () => {
      const storage = makeStorage();
      storage.set('contract:overwrite', 'first');
      storage.set('contract:overwrite', 'second');
      expect(storage.get('contract:overwrite')).toBe('second');
    });

    it('remove deletes the value → get returns null after', () => {
      const storage = makeStorage();
      storage.set('contract:remove', 'doomed');
      storage.remove('contract:remove');
      expect(storage.get('contract:remove')).toBeNull();
    });

    it('remove on a missing key → no throw, stays null', () => {
      const storage = makeStorage();
      expect(() => storage.remove('contract:remove-missing')).not.toThrow();
      expect(storage.get('contract:remove-missing')).toBeNull();
    });

    it('keys are independent — set A does not affect B', () => {
      const storage = makeStorage();
      storage.set('contract:key-a', 'a-value');
      storage.set('contract:key-b', 'b-value');
      storage.remove('contract:key-a');
      expect(storage.get('contract:key-a')).toBeNull();
      expect(storage.get('contract:key-b')).toBe('b-value');
    });

    it('empty string round-trips and is distinct from a missing key', () => {
      const storage = makeStorage();
      storage.set('contract:empty', '');
      expect(storage.get('contract:empty')).toBe('');
      expect(storage.get('contract:empty')).not.toBeNull();
    });

    it('JSON-string payload round-trips byte-identical (the real usage)', () => {
      const storage = makeStorage();
      const payload = JSON.stringify({
        version: 1,
        data: { 1: true, 2: false, 3: true, 4: false, 5: true, 6: true },
      });
      storage.set('contract:json', payload);
      expect(storage.get('contract:json')).toBe(payload);
    });

    it('re-set after remove works (key is reusable)', () => {
      const storage = makeStorage();
      storage.set('contract:reuse', 'one');
      storage.remove('contract:reuse');
      storage.set('contract:reuse', 'two');
      expect(storage.get('contract:reuse')).toBe('two');
    });
  });
}
