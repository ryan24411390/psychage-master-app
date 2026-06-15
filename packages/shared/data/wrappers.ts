// Supabase data layer — typed read/write wrappers.
//
// Stateless pass-through over the injected `SupabaseLike` seam. Every write stamps
// the §2 provenance fields (device_id / client_version / schema_version — AC-8.3).
// Therapist links cross a SECURITY DEFINER RPC boundary (encrypt/decrypt at rest);
// everything else is a direct table read/write under owner-only RLS.
//
// No client-side platform gating: the mobile-only write gate is enforced by
// server-side RLS (ARCHITECTURE.md §4); this layer never duplicates it. SR-1: the
// layer never computes or raises confidence. SR-4: no symptom identifier is passed
// to any sink — `navigator_history` is summary-only by type.

import { DataAccessError, type PostgrestResult, type SupabaseLike } from './adapters';
import { DATA_SCHEMA_VERSION } from './migrations';
import type {
  CheckInRecord,
  InsertInput,
  JournalEntryRecord,
  NavigatorHistoryRecord,
  ProfileRecord,
  ShareHistoryRecord,
  TherapistLinkRecord,
  WriteContext,
} from './types';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Unwrap a `{ data, error }` result; throw on error so callers never see a half-state. */
export function unwrap<T>(result: PostgrestResult<T>): T {
  if (result.error) {
    throw new DataAccessError(result.error.message);
  }
  return result.data;
}

/** Build the §2 write stamp from caller-provided provenance + the current schema version. */
export function buildWriteStamp(ctx: WriteContext): {
  device_id: string;
  client_version: string;
  schema_version: number;
} {
  return {
    device_id: ctx.device_id,
    client_version: ctx.client_version,
    schema_version: DATA_SCHEMA_VERSION,
  };
}

// ── profiles (both-platform write per §4) ─────────────────────────────────────

/** Caller-supplied profile fields on upsert; the wrapper stamps `schema_version`. */
export type ProfileUpsertInput = Omit<ProfileRecord, 'created_at' | 'updated_at' | 'schema_version'>;

export async function readProfile(
  client: SupabaseLike,
  userId: string,
): Promise<ProfileRecord | null> {
  const result = await client
    .from<ProfileRecord>('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return unwrap(result);
}

export async function writeProfile(
  client: SupabaseLike,
  input: ProfileUpsertInput,
): Promise<ProfileRecord> {
  // profiles has no device_id/client_version (§2 exception) — only schema_version.
  const row = { ...input, schema_version: DATA_SCHEMA_VERSION };
  const result = await client.from<ProfileRecord>('profiles').upsert(row).select().single();
  return unwrap(result);
}

// ── check_ins (READ ONLY here; the write path is gated — see checkin-gate.ts) ──

export async function readCheckIns(
  client: SupabaseLike,
  userId: string,
): Promise<readonly CheckInRecord[]> {
  const result = await client.from<CheckInRecord>('check_ins').select('*').eq('user_id', userId);
  return unwrap(result);
}

// ── navigator_history (summary-only; mobile-write) ────────────────────────────

export type NavigatorHistoryInput = InsertInput<NavigatorHistoryRecord>;

export async function readNavigatorHistory(
  client: SupabaseLike,
  userId: string,
): Promise<readonly NavigatorHistoryRecord[]> {
  const result = await client
    .from<NavigatorHistoryRecord>('navigator_history')
    .select('*')
    .eq('user_id', userId);
  return unwrap(result);
}

export async function writeNavigatorHistory(
  client: SupabaseLike,
  input: NavigatorHistoryInput,
  ctx: WriteContext,
): Promise<NavigatorHistoryRecord> {
  const row = { ...input, ...buildWriteStamp(ctx) };
  const result = await client
    .from<NavigatorHistoryRecord>('navigator_history')
    .insert(row)
    .select()
    .single();
  return unwrap(result);
}

// ── journal_entries (forward-compat; no V1 [A] caller, but wired) ─────────────

export type JournalEntryInput = InsertInput<JournalEntryRecord>;

export async function readJournalEntries(
  client: SupabaseLike,
  userId: string,
): Promise<readonly JournalEntryRecord[]> {
  const result = await client
    .from<JournalEntryRecord>('journal_entries')
    .select('*')
    .eq('user_id', userId);
  return unwrap(result);
}

export async function writeJournalEntry(
  client: SupabaseLike,
  input: JournalEntryInput,
  ctx: WriteContext,
): Promise<JournalEntryRecord> {
  const row = { ...input, ...buildWriteStamp(ctx) };
  const result = await client
    .from<JournalEntryRecord>('journal_entries')
    .insert(row)
    .select()
    .single();
  return unwrap(result);
}

// ── share_history (mobile-write) ──────────────────────────────────────────────

export type ShareHistoryInput = InsertInput<ShareHistoryRecord>;

export async function readShareHistory(
  client: SupabaseLike,
  userId: string,
): Promise<readonly ShareHistoryRecord[]> {
  const result = await client
    .from<ShareHistoryRecord>('share_history')
    .select('*')
    .eq('user_id', userId);
  return unwrap(result);
}

export async function writeShareHistory(
  client: SupabaseLike,
  input: ShareHistoryInput,
  ctx: WriteContext,
): Promise<ShareHistoryRecord> {
  const row = { ...input, ...buildWriteStamp(ctx) };
  const result = await client
    .from<ShareHistoryRecord>('share_history')
    .insert(row)
    .select()
    .single();
  return unwrap(result);
}

// ── therapist_links (via SECURITY DEFINER RPCs — encrypt/decrypt at rest) ──────
// The RPCs (get_therapist_links / upsert_therapist_link) are slice-3 deliverables;
// these wrappers target the contract (Q-4/Q-5) and are mocked in tests.

/** Plaintext therapist fields on write; `id` present ⇒ update, absent ⇒ insert. */
export type TherapistLinkUpsertInput = InsertInput<TherapistLinkRecord> & { readonly id?: string };

export async function readTherapistLinks(
  client: SupabaseLike,
): Promise<readonly TherapistLinkRecord[]> {
  // Owner-scoped server-side (auth.uid()); no user filter passed from the client.
  const result = await client.rpc<readonly TherapistLinkRecord[]>('get_therapist_links');
  return unwrap(result);
}

export async function writeTherapistLink(
  client: SupabaseLike,
  input: TherapistLinkUpsertInput,
  ctx: WriteContext,
): Promise<{ id: string }> {
  const args = { ...input, ...buildWriteStamp(ctx) };
  const result = await client.rpc<{ id: string }>('upsert_therapist_link', args);
  return unwrap(result);
}
