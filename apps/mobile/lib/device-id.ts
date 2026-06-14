// Stable per-install device id for the audit_events trail.
//
// device_id is a NON-PII install identifier (Sacred Rule #11 N/A) — safe to keep
// in the MMKV-backed `storage` adapter, NOT secure-store (that is reserved for
// session tokens). Generated once and reused so audit rows from one install
// correlate. No symptom/PII data is stored here.

import { storage } from '@/lib/adapters';
import { generateId } from '@/lib/id';

const DEVICE_ID_KEY = 'mobile:device-id';

export function getOrCreateDeviceId(store = storage): string {
  const existing = store.get(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = generateId();
  store.set(DEVICE_ID_KEY, id);
  return id;
}
