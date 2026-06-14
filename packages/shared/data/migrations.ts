// Supabase data layer — forward-only schema-version migration runner (Sacred
// Rule #13). ARCHITECTURE.md §9: read a row's `schema_version`, apply v1→v2→…
// in-memory, persist on the next write.
//
// V1 ships with an EMPTY migrator registry (AC-9.2): v1 is the first schema, so
// there is no legacy shape to expand. A future v2 adds one entry here; the runner
// already walks it. Mirrors the forward-only `TRANSFORMS` shape in
// packages/shared/check-in/migrate.ts.

/** The current data-layer schema version every write stamps. */
export const DATA_SCHEMA_VERSION = 1 as const;

/** One forward step: transform a row from schema version `from` to `to` (= from+1). */
export interface DataMigrator {
  readonly from: number;
  readonly to: number;
  readonly migrate: (row: Record<string, unknown>) => Record<string, unknown>;
}

// Empty by design at v1 (AC-9.2). Indexed-by-`from` lookup, walked forward.
const MIGRATORS: readonly DataMigrator[] = [];

/**
 * Walk `row` forward from `fromVersion` to `toVersion` (default: current), applying
 * each registered migrator in sequence. Forward-only — a missing step throws rather
 * than silently dropping data (user-data rows are never quietly lost). With the
 * empty V1 registry and a row already at v1, this is a passthrough.
 */
export function runForwardMigrations(
  row: Record<string, unknown>,
  fromVersion: number,
  toVersion: number = DATA_SCHEMA_VERSION,
): Record<string, unknown> {
  let cursor = fromVersion;
  let current = row;
  while (cursor < toVersion) {
    const step = MIGRATORS.find((m) => m.from === cursor);
    if (!step) {
      throw new Error(
        `No forward migration path from schema_version ${cursor} to ${toVersion}`,
      );
    }
    current = step.migrate(current);
    cursor = step.to;
  }
  return current;
}

/** Number of registered migrators. 0 at V1 (the contract is present; no steps exist). */
export function migratorCount(): number {
  return MIGRATORS.length;
}
