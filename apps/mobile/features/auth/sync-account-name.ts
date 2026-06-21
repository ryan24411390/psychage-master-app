// P63 — keep the local display name in step with the VERIFIED account.
//
// When a verified session carries a name (Google profile name / the full_name entered
// at email signup), persist it as personalization.name so the home greeting + settings
// reflect the account. The write PRESERVES homeLead + interests (the A-flag: interests
// omitted from savePersonalization are kept). No-ops for anonymous / unverified / no-name
// sessions — we never save a name without a verified method, and never clear one here.

import { loadPersonalization, savePersonalization } from '@/lib/persistence/personalization';
import type { Storage } from '@/lib/adapters/storage';
import type { AuthSession } from './auth-service';

export function syncAccountName(session: AuthSession | null, storage: Storage): void {
  if (!session?.verified) return;
  const name = session.name;
  if (!name) return;
  const current = loadPersonalization(storage);
  if (current.name === name) return; // already in step — skip the redundant write
  savePersonalization(storage, { name, homeLead: current.homeLead });
}
