# Pull Request

## Summary

<!-- One-line description of what this PR does and why. -->

## Sacred Rules

- [ ] **SR-1** — Navigator confidence cap respected (max 0.75); no surface exposes a value above the cap. See constitution.md SR-1.
- [ ] **SR-2** — Crisis-detection path untouched; no flag, env, or config introduces a bypass. See constitution.md SR-2.
- [ ] **SR-3** — Person-first, educational framing only; no clinical-assertion phrasing. See constitution.md SR-3 for the seed-phrase list.
- [ ] **SR-4** — Navigator and check-in state remain client-side; nothing leaves the device via telemetry, logs, or backend. See constitution.md SR-4.

## Definition of Done

- [ ] Acceptance criteria from the task spec are met.
- [ ] Scope matches the task — no unrelated changes.
- [ ] Docs / comments updated where behavior changed.

## Local verification

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
