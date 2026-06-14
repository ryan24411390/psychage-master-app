// Supabase data layer — the dependency-injection seam.
//
// packages/shared has NO runtime deps and never imports the supabase-js client
// (CLAUDE.md). The real client (and the platform-claim source) are injected by
// apps/mobile (or packages/api) at the app boundary; this module declares only the
// minimal structural surface the wrappers actually call, plus safe no-op defaults
// so the shared tests run without any consumer wiring.
//
// DESIGN NOTE (decision the spec left open): design.md specifies only a "minimal
// `{ from, rpc }` surface" for `SupabaseLike` — it does not pin the builder chain.
// `PostgrestBuilder` below is the smallest thenable, PostgREST-shaped builder that
// covers every call the wrappers make (select / insert / upsert / eq / single /
// maybeSingle). The real supabase-js client satisfies it structurally by typing;
// the app adapts/casts at injection time.

/** A PostgREST-style error envelope. Only `message` is relied upon here. */
export interface PostgrestError {
  readonly message: string;
  readonly [key: string]: unknown;
}

/** The `{ data, error }` envelope every Supabase call resolves to. */
export interface PostgrestResult<T> {
  readonly data: T;
  readonly error: PostgrestError | null;
}

/** Insert/upsert payloads are loosely typed at the seam; wrappers own the typing. */
export type InsertValues = Record<string, unknown> | readonly Record<string, unknown>[];

/**
 * Minimal thenable query builder. A bare `await builder` resolves to a list
 * (`PostgrestResult<readonly Row[]>`); `.single()` / `.maybeSingle()` narrow to one.
 */
export interface PostgrestBuilder<Row> extends PromiseLike<PostgrestResult<readonly Row[]>> {
  select(columns?: string): PostgrestBuilder<Row>;
  insert(values: InsertValues): PostgrestBuilder<Row>;
  upsert(values: InsertValues): PostgrestBuilder<Row>;
  eq(column: string, value: string): PostgrestBuilder<Row>;
  single(): PromiseLike<PostgrestResult<Row>>;
  maybeSingle(): PromiseLike<PostgrestResult<Row | null>>;
}

/** The injected Supabase client surface — `{ from, rpc }` only. */
export interface SupabaseLike {
  from<Row>(table: string): PostgrestBuilder<Row>;
  rpc<Result>(fn: string, args?: Record<string, unknown>): PromiseLike<PostgrestResult<Result>>;
}

/** The two platforms a JWT can claim (ARCHITECTURE.md §4 write gate). */
export type Platform = 'mobile' | 'web';

/**
 * Source of the caller's platform claim. Exposed as part of the seam so the app can
 * thread its JWT platform into client construction. NOTE: the data layer does NOT
 * use this to gate writes — server-side RLS owns the platform write gate; this
 * layer never duplicates it client-side.
 */
export type PlatformClaimProvider = () => Platform;

/** Thrown when a wrapper read/write returns a PostgREST error. */
export class DataAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataAccessError';
  }
}

const NO_CLIENT_MESSAGE = 'no Supabase client injected';

/**
 * Safe default client (AC-8.2). Every method throws — a wrapper invoked without a
 * real client fails loud rather than silently no-op'ing a user-data write.
 */
export const noopSupabaseClient: SupabaseLike = {
  from<Row>(_table: string): PostgrestBuilder<Row> {
    throw new DataAccessError(NO_CLIENT_MESSAGE);
  },
  rpc<Result>(_fn: string, _args?: Record<string, unknown>): PromiseLike<PostgrestResult<Result>> {
    throw new DataAccessError(NO_CLIENT_MESSAGE);
  },
};

/** Safe default platform claim (AC-8.2): assume read-only `web` until told otherwise. */
export const defaultPlatformClaimProvider: PlatformClaimProvider = () => 'web';
