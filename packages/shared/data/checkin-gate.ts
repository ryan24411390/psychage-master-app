// Supabase data layer — the check-in persistence GATE.
//
// ADR-001 (mood-sync) is Accepted, but the live write-flip is a separate FINAL
// slice (the platform-claim slice). In THIS layer the gate stays OFF:
//
//   - CHECKIN_PERSISTENCE_ENABLED = false
//   - writeCheckIn() early-throws while the flag is false
//   - this file is NOT re-exported from index.ts (AC-2.4 / AC-8.4)
//
// Two independent OFF layers back each other (EC-4): this flag-guarded wrapper,
// AND the absence of any check_ins INSERT/UPDATE RLS policy in the applied
// migrations (default-deny). The write path is inert until both flip. Enabling it
// here would ship an untested live write — do not flip the flag in this slice.

import { DataAccessError, type SupabaseLike } from './adapters';
import { DATA_SCHEMA_VERSION } from './migrations';
import type { CheckInRecord, InsertInput, WriteContext } from './types';

/** Master switch for the check-in write path. Stays `false` until the write-flip slice. */
export const CHECKIN_PERSISTENCE_ENABLED = false;

/** Caller-supplied check-in fields on write; the wrapper stamps the §2 provenance. */
export type CheckInInput = InsertInput<CheckInRecord>;

/** Thrown when `writeCheckIn` is called while the gate is OFF. */
export class CheckInPersistenceDisabledError extends Error {
  constructor() {
    super('check-in persistence is disabled (CHECKIN_PERSISTENCE_ENABLED is false)');
    this.name = 'CheckInPersistenceDisabledError';
  }
}

/**
 * Gated check-in write. Early-throws while `CHECKIN_PERSISTENCE_ENABLED` is false.
 * The body below mirrors `writeNavigatorHistory` so the eventual flip is a one-line
 * change, but it is unreachable in this slice. NOT exported from the barrel.
 */
export async function writeCheckIn(
  client: SupabaseLike,
  input: CheckInInput,
  ctx: WriteContext,
): Promise<CheckInRecord> {
  if (!CHECKIN_PERSISTENCE_ENABLED) {
    throw new CheckInPersistenceDisabledError();
  }

  // Unreachable while the flag is false. Lands live in the write-flip slice.
  const row = {
    ...input,
    device_id: ctx.device_id,
    client_version: ctx.client_version,
    schema_version: DATA_SCHEMA_VERSION,
  };
  const result = await client.from<CheckInRecord>('check_ins').insert(row).select().single();
  if (result.error) {
    throw new DataAccessError(result.error.message);
  }
  return result.data;
}
