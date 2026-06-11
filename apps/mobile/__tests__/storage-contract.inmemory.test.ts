// In-memory Storage impl run against the shared contract (storage-contract.ts).
//
// Proves lib/adapters/storage.ts — the impl vitest/node/Metro-web see — honors
// every clause of the Storage contract. The MMKV native impl runs the same
// suite on-device (Maestro / A-5); see storage-contract.ts.
//
// The in-memory `storage` export is a module-global Map-backed singleton, so
// every contract case uses a unique `contract:` key namespace to stay isolated
// without a reset hook. The factory simply hands back the singleton.

import { storage } from '@/lib/adapters/storage';
import { runStorageContract } from './storage-contract';

runStorageContract('in-memory', () => storage);
