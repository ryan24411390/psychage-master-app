---
name: spec-implement
description: Phase 6 of spec-driven workflow. Implement ONE task from a review-passed spec using TDD (RED → GREEN), run /ultrareview, then commit atomically with structured trailers. Designed for parallel sessions in git worktrees. Refuses on any non-review-pass status, on main branch, on detached HEAD, on missing workspace dependencies (apps/mobile, packages/shared).
argument-hint: <feature-slug> <task-id>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Spec Implement — One Task, Atomic Commit

You are an Implementation agent for the spec-driven feature workflow. Your job is to take exactly **one task** from `.specs/<feature-slug>/tasks.md` (identified by `<task-id>`, e.g., `T-004`) and implement it: failing test first, then minimum code to pass, then `/ultrareview`, then atomic commit with structured trailers.

You implement one task per invocation. You do not auto-chain to the next task. You do not modify spec files. You do not invoke other skills (except `/ultrareview` as a final gate). After the commit lands, you stop.

## Sacred Rules — non-negotiable

These rules are deterministically enforced by `.claude/hooks/sr*.sh` on every Edit/Write/MultiEdit during this skill's execution. The hooks block at write-time; this skill cannot violate them even if it tried. Source of truth: `constitution.md`.

1. **SR-1 — Navigator confidence cap.** Hook enforces.
2. **SR-2 — Crisis bypass detector.** Hook enforces.
3. **SR-3 — No diagnostic language.** Hook enforces (prompt-type via Haiku).
4. **SR-4 — Symptom data on device.** Hook enforces.

If a hook blocks during implementation, **read the hook's error message carefully**. The hook is correct; your code or test is wrong. Fix the violation; do not work around the hook.

## Step 0 — Refusal cascade

Five defensive layers run in this order. Stop at the first refusal.

### 0.1 — Argument validation

Confirm `$ARGUMENTS` parses as `<feature-slug> <task-id>` (e.g., `daily-check-in T-004`). If not, refuse: *"Usage: /spec-implement <feature-slug> <task-id>. E.g., /spec-implement daily-check-in T-004."* Stop.

### 0.2 — Workspace identity

Run:
```bash
git rev-parse --show-toplevel
```

The returned path's basename must match `psychage-master-app` OR `psychage-master-app-<task-suffix>` (a worktree per Phase 5's `worktree-add.sh` convention). If not, refuse: *"This skill must run inside the psychage-master-app repo or one of its worktrees. Current root: <path>. Stopping."* Stop.

### 0.3 — Branch and HEAD state

Run:
```bash
git branch --show-current
git symbolic-ref -q HEAD || echo "DETACHED"
```

Refuse if:
- Current branch is `main`: *"`/spec-implement` cannot run on `main`. Create a feature branch or worktree per tasks.md parallelization plan. Stopping."*
- HEAD is detached: *"HEAD is detached. Check out a feature branch or worktree before running. Stopping."*

### 0.4 — Spec status (INDEX.md)

Read `.claude/workspace.json` and `.specs/INDEX.md`. Find the row for `<feature-slug>`. Branch on Status:

| Status | Action |
|---|---|
| `review-pass` | Proceed to Step 0.5 (the only green-light status) |
| `implementing` | Allow, but read `.specs/<feature-slug>/_implement-log.md` and confirm the requested `<task-id>` is not already being worked on in another worktree. If it is, refuse with location of conflicting session. |
| `review-block` | Refuse: *"Spec review found blockers; address them and re-run /spec-review. Stopping."* |
| `tasks-complete` | Refuse: *"Spec has tasks but no review yet. Run /spec-review <feature-slug> first. Stopping."* |
| `*-deferred` (any phase) | Refuse with deferral message naming blocker + lift procedure (same pattern as prior skills). Stop. |
| `discovery-complete`, `requirements-complete`, `design-complete` | Refuse: *"Spec needs more phases before implementation. Run /<next-skill>. Stopping."* |
| `complete` | Refuse: *"Feature is already complete. Task <task-id> is in a finished spec. Stopping."* |
| `abandoned` | Refuse: *"Spec is abandoned. Re-open via /spec-discovery if work resumes. Stopping."* |

Disk-vs-INDEX check: if status is `review-pass` but `_review.md` is missing, refuse with workspace-inconsistency message.

If `_review.md` says verdict is `Block` (despite INDEX claiming `review-pass`), refuse with the same workspace-inconsistency message.

### 0.5 — Workspace dependency check

Read the task's `Files` cell from tasks.md. Parse the comma-separated paths. Check each path's prefix against `workspace.json.monorepo`:

- If any file under `apps/mobile/` AND `monorepo.apps.mobile.exists: false`: refuse with *"Task T-XXX targets apps/mobile/ but the mobile workspace doesn't exist yet. Phase 6 ships the Expo scaffold; come back after that. Stopping."*
- If any file under `packages/shared/` AND `monorepo.packages.shared.exists: false`: refuse with *"Task T-XXX targets packages/shared/ but the shared package hasn't been lifted yet. Phase 5 ships this; come back after that. Stopping."*
- Same for `packages/api/` and `packages/i18n/` (Phase 6 dependencies).

This is the graceful refusal layer that lets the skill ship now (Phase 4) and not fail confusingly when invoked before Phase 6 lands its substrate.

### 0.6 — Dependency task check

Read the task's `Depends on` cell from tasks.md. For each dependency task ID:
- Search `.specs/<feature-slug>/_implement-log.md` for a "Completed: T-XXX" entry with a commit SHA
- If absent: refuse with *"Task T-XXX depends on T-YYY which hasn't been implemented yet. Run /spec-implement <feature-slug> T-YYY first. Stopping."*

This prevents racing dependency violations across parallel sessions.

## Before you start

Once Step 0 passes, read these in order:

1. **`constitution.md`** at workspace root.
2. **The closest scope-specific `CLAUDE.md`** (e.g., `apps/mobile/CLAUDE.md` if the task touches mobile, post-Phase 6).
3. **`.specs/<feature-slug>/_review.md`** — confirm verdict is `Pass` or `Pass with notes`. If verdict is `Pass with notes`, read the notes; you'll address them before commit.
4. **`.specs/<feature-slug>/tasks.md`** — find the specific task by ID.
5. **`.specs/<feature-slug>/design.md`** — read the section relevant to your task's files.
6. **`.specs/<feature-slug>/requirements.md`** — find the AC(s) your task satisfies.

Do not read the entire spec set. Surgical reading.

## Process — strict TDD

This skill is opinionated about TDD because parallel sessions need automated backpressure. Skip TDD and the pre-commit hooks become your only gate, which catches Sacred Rule violations but doesn't shape design. TDD shapes design.

### Step 1 — RED: write the failing test

Find or create the test file corresponding to your task. Convention:

- Component: `<dir>/__tests__/<name>.test.tsx`
- Service / hook: `<dir>/__tests__/<name>.test.ts`
- E2E flow: `<workspace>/e2e/<name>.maestro.yaml`

Write tests that assert the AC behavior from requirements.md. The tests must **fail** because the implementation doesn't exist yet (or does the wrong thing).

Run them and confirm failure. Test runner per `workspace.json.tooling.testRunner.candidate`:

```bash
# Default candidate: vitest+rntl+maestro (locked at Phase 6)
<test-runner> --filter <test-file-pattern>
```

If the test passes by accident, stop and investigate — that's a sign of pre-existing code that wasn't accounted for in the spec.

### Step 2 — GREEN: minimum code to pass

Write the **simplest code** that makes the failing tests pass.

- Do not add features beyond what the tests assert
- Do not add error handling for impossible scenarios
- Do not refactor adjacent code (Surgical Changes rule from global CLAUDE.md)
- Do not optimize prematurely

Run the tests:

```bash
<test-runner> --filter <test-file-pattern>
```

If they pass, move on. If not, fix until they do.

**Sacred Rule hooks fire on every Edit/Write/MultiEdit during this step.** If a hook blocks, the message will name which Sacred Rule and where. Fix the violation; do not work around the hook.

### Step 3 — Verify: full gate

Run the full pre-commit gate manually before staging:

```bash
<typecheck-cmd>     # tsc clean across workspace
<lint-cmd>          # biome clean (post-Phase 7) or eslint
<test-cmd>          # all tests pass (not just yours)
```

If any fail, fix before proceeding. The pre-commit hook will reject the commit otherwise.

### Step 4 — `/ultrareview` final pass

Invoke `/ultrareview` on the staged diff:

```bash
git add <exact files from tasks.md for this task>
# Then invoke /ultrareview via the slash command interface
```

`/ultrareview` runs Anthropic's multi-agent review pass. It catches design and code flaws a standard single-pass review misses. Anthropic reports +10% recall on complex PRs at stable precision.

Branch on `/ultrareview` verdict:

- **Pass:** proceed to Step 5 (commit).
- **Pass-with-notes:** proceed to Step 5; append `/ultrareview` notes to `.specs/<feature-slug>/_implement-notes.md` (create file if absent). The notes are tracked for merge-time human review.
- **Block:** refuse to commit. Print the blocking findings. Tell the user to address them and re-run `/spec-implement <feature-slug> <task-id>` (the skill will pick up where it left off; tests already written, code already passing).

If `/ultrareview` is unavailable in the current environment (e.g., earlier Claude Code version), log this in `_implement-notes.md` and proceed to Step 5 with a notation in the commit footer: `/ultrareview: skipped (unavailable)`.

### Step 5 — Commit: atomic with structured trailers

Confirm staging matches the task's Files list exactly:

```bash
git status --short
# All staged files should be in the task's Files cell. Nothing extra.
```

If extra files are staged, unstage them. The pre-commit hook may otherwise reject the commit, and `/spec-review`'s file-isolation rule depends on commit-level adherence to the declared file ownership.

Commit with this message format:

```
feat(<feature-slug>): <task-id> <task title>

Implements <feature-slug> task <task-id>.
Satisfies AC: <comma-separated AC IDs from requirements.md>
Files: <comma-separated paths from tasks.md Files cell>

Spec-Id: <feature-slug>
Task-Id: <task-id>
Sacred-Rules-Validated: SR-1, SR-2, SR-3, SR-4 (via .claude/hooks/)
/ultrareview: <Pass | Pass-with-notes — see _implement-notes.md | skipped>
Worktree: <basename of git rev-parse --show-toplevel>

Co-authored-by: Claude <noreply@anthropic.com>
```

The `Spec-Id` and `Task-Id` trailers are explicit so Phase 7's eventual `/spec-verify` per-PR hook can find them via `git log --grep`.

The pre-commit hook will run the Sacred Rule scripts (Stop hook re-validates). If it rejects, fix the issue and re-attempt — **do not bypass with `--no-verify`**. Ever.

### Step 6 — Update `_implement-log.md` and INDEX.md

Append to `.specs/<feature-slug>/_implement-log.md` (create if absent):

```markdown
## T-<task-id>: <task title>

- **Completed:** <ISO date>
- **Commit SHA:** <sha>
- **Worktree:** <path>
- **Files changed:** <list>
- **/ultrareview verdict:** <Pass | Pass-with-notes | skipped>
- **Hooks fired and passed:** SR-1, SR-2, SR-3, SR-4
- **Notes:** <any follow-ups>
```

Then mutate INDEX.md:

- If this is the first task implemented for this feature: `review-pass → implementing`
- If this is the last task (verify by counting tasks in tasks.md vs. completed entries in _implement-log.md): `implementing → complete`
- Otherwise: leave INDEX at `implementing`

Update `Last updated`.

### Step 7 — Report

Tell the user:
- Which task you implemented (ID + title)
- Which files changed
- Which ACs are now satisfied
- The commit SHA
- The worktree path
- `/ultrareview` verdict
- Any follow-ups for the spec (e.g., "T-004 surfaced an ambiguity in design.md S-1 — see _implement-notes.md")
- The next task they (or a parallel session) can pick up — read the parallelization plan from tasks.md
- INDEX.md status (typically `implementing`; if final task, `complete`)

Then **stop**. Do not invoke `/spec-implement` for the next task. Do not invoke any other skill. The next task is a separate invocation, possibly in a different worktree.

## Hard rules

- **One task per invocation.** Finishing T-004 doesn't auto-start T-005. Exit and let the user invoke `/spec-implement <feature> T-005` (possibly in a different worktree).
- **Tests first. Always.** Even for "trivial" tasks. Even for UI components. The test can be visual (snapshot) or behavioral (RNTL `userEvent`); it must exist before the implementation.
- **No Sacred Rule violations.** If the task as specified would violate a Sacred Rule, stop and report. Hooks will block at write-time anyway, but refuse explicitly so the spec gets fixed, not the implementation worked around.
- **No `--no-verify`.** Ever. The whole parallel infrastructure depends on the pre-commit hook chain being inviolable.
- **No `git push --force`** on shared branches. Per global CLAUDE.md.
- **No work outside the task's named files.** If you discover a bug elsewhere, write it to `learnings.md` and continue. Do not fix unrelated code (Surgical Changes rule).
- **No work past the spec.** If the design is wrong, stop and tell the user. Update the spec, then implement. Do not "improve" the design inline.
- **No `[bypass]` commits from this skill.** The bypass path is for trivial direct commits outside the spec workflow. If you find yourself wanting to bypass while inside `/spec-implement`, the task is too small for the spec workflow and shouldn't have been specced. Either complete it properly or escalate to redesign the task scope.
- **No skipping `/ultrareview`** unless it's genuinely unavailable. Logged in `_implement-notes.md` with explanation.

## When things go wrong

- **Tests pass but feel wrong:** the spec might be wrong. Stop, write the issue in `.specs/<feature>/_implement-notes.md`, escalate. Do not commit.
- **Pre-commit hook keeps failing:** read the error carefully. Don't loop blindly. If the failure is from another workspace's code that you didn't touch, it's pre-existing — escalate before bypassing (and there's no way to bypass anyway).
- **Sacred Rule hook blocks repeatedly:** the hook is right. Read the hook's output, find the violation in your code or test, fix it. Do not edit the hook to "make it more lenient" — that's a Sacred Rule violation by proxy.
- **Merge conflict on push:** another parallel session merged something that conflicts with your branch. Rebase your branch (`git pull --rebase origin main`), re-run typecheck + lint + test, then push. Never force-push.
- **`/ultrareview` is slow:** acceptable. The recall improvement is worth the latency. Don't skip.
- **Worktree gets corrupted:** abandon the worktree (delete via `git worktree remove`) and create a fresh one for this task. Don't try to fix in place; you'll lose track of state.

## Anchor example: smoke test on `_smoke_test`

For Phase 4 turn 7 smoke test, the load-bearing verification is the **Step 0 refusal cascade**.

`_smoke_test` is `discovery-deferred`. The skill should refuse before reaching any TDD work.

**User invocation:** `/spec-implement _smoke_test T-001`

**Skill takes Step 0 path:**

1. Step 0.1 — Argument validation: `_smoke_test T-001` parses fine. Pass.
2. Step 0.2 — Workspace identity: confirms `psychage-master-app`. Pass.
3. Step 0.3 — Branch check: user is on `main`. **Refuse here.**
   - Output: *"You're on `main`. /spec-implement runs in a feature branch or worktree per tasks.md parallelization plan. Create a worktree (Phase 5 will ship `worktree-add.sh`) or feature branch first. Stopping."*

If you manually checkout a feature branch and re-run, the next refusal layer fires:

4. Step 0.4 — Spec status: INDEX says `discovery-deferred`. **Refuse here.**
   - Output: *"This spec is in a deferred state. Brief status: Discovery deferred — pending Phase 4.B mobile IA decision. Blocking dependency: ... Resolver: ... Resolves at: ... To lift the deferral and proceed: ..."* (full deferral message with lift procedure).

**Pass criterion for turn 7:** the cascade refuses at the FIRST applicable layer (likely 0.3 since you're probably running from main). No `_implement-log.md` written. No git commits. INDEX.md SHA byte-identical. brief.md SHA byte-identical. `_review.md` (from turn 6) SHA byte-identical. Clear refusal naming the specific defensive layer.

The deeper exercise — actual TDD cycle, hook firings, /ultrareview, atomic commit, INDEX mutation to `implementing` — requires:
- A complete spec through `review-pass` status
- A real workspace (`apps/mobile/` or `packages/shared/` exist)
- A test runner locked at Phase 6
- A worktree set up at Phase 5

None of those exist now. The skill ships, ready, refusing gracefully when invoked before its substrate exists. Phase 11's first feature is when `/spec-implement` first runs end-to-end.

This is the "skill ships untested through Phases 5-6" mitigation from the original Phase 4 plan §9 risk table — accepted because deferring `/spec-implement` deployment splits Phase 4 across two phases. The Step 0 refusal cascade is the verifiable behavior; deeper code paths are reviewable structurally via the SKILL.md and memo.
