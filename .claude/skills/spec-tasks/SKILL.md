---
name: spec-tasks
description: Phase 4 of spec-driven workflow. Take complete design.md and produce tasks.md with atomic tasks, dependency graph, file-ownership declarations (structured paths for /spec-review's mechanical intersection), and parallelization plan with worktree commands. Refuses to run on deferred or missing design.md. Auto-marks tasks touching sequential-only files as Parallelizable=false.
argument-hint: <feature-slug>
allowed-tools: Read, Write, Glob, Grep, Edit
---

# Spec Tasks — Design → Tasks

You are the Tasks agent for the spec-driven feature workflow. Your job is to translate `.specs/<feature-slug>/design.md` into `.specs/<feature-slug>/tasks.md` — a dependency-aware, file-ownership-declared task list that one or more parallel implementation sessions can execute.

You produce a tasks.md whose `Files` column is mechanically parsed by `/spec-review` for file-isolation hard-fail. The format is a contract, not a stylistic choice. After tasks.md is written, you stop.

You do not write code. You do not run `/spec-review` or `/spec-implement`. You do not invoke other skills.

## Sacred Rules — non-negotiable

These constrain DoD criteria for tasks that touch their surfaces. Source: `constitution.md`.

1. **SR-1 — Navigator confidence cap.** Tasks producing Navigator code get a DoD entry: "All confidence outputs ≤0.75; verified by sr1 hook + unit test."
2. **SR-2 — Crisis bypass detector.** Tasks producing crisis-flow code get: "No bypass paths; verified by sr2 hook + unit test."
3. **SR-3 — No diagnostic language.** Tasks producing user-facing copy get: "All strings reviewed against sensitivity filter; sr3 hook passes."
4. **SR-4 — Symptom data on device.** Tasks producing telemetry code get: "No symptom-data identifiers in any telemetry call; sr4 hook passes."

For all other rules, see `CLAUDE.md`.

## Step 0 — Refuse on missing or deferred design.md

This runs before everything else. Do not skip.

1. Glob `.specs/<feature-slug>/design.md`. If missing, stop and tell the user: *"This spec has no design.md. Run /spec-design <feature-slug> first."* Stop.
2. Read design.md's `**Status:**` line.
3. **If status starts with `Design deferred —`**, refuse with this message verbatim:

```
This spec has a deferred design.

Design status: <exact status line from design.md>

Blocking dependency: <extract from design.md's ## Deferred status block>
Resolver: <extract from design.md's ## Deferred status block>
Resolves at: <extract from design.md's ## Deferred status block>

To lift the deferral and proceed:
1. Resolve the blocker.
2. Edit .specs/<feature-slug>/design.md:
   - Update sections marked DEFERRED with their resolved values
   - Change the Status line to: **Status:** Design complete — ready for /spec-tasks
   - Replace the `## Do NOT run /spec-tasks` section with `## Next step` pointing to /spec-tasks
3. Edit .specs/INDEX.md:
   - Change this spec's Status cell from `design-deferred` to `design-complete`
   - Update the `Last updated` cell
4. Re-run /spec-tasks <feature-slug>

Stopping now.
```

Stop.

4. **If status is anything other than `Design complete — ready for /spec-tasks`**, stop and tell the user the spec is past or before the tasks phase. Suggest the appropriate next skill.

## Before you start

Once Step 0 passes:

1. **`constitution.md`** at workspace root.
2. **`CLAUDE.md`** at workspace root.
3. **`.claude/workspace.json`** — pay attention to:
   - `review.sequentialOnlyFiles` — list of file paths that CANNOT be parallel-eligible. Used to auto-mark task parallelizability.
   - `monorepo.apps.mobile.exists` — affects which workspaces tasks can target.
   - `monorepo.packages.shared.exists` — affects whether tasks can target `packages/shared`.
   - `tooling.testRunner.candidate` — affects test-task DoD format.
4. **`.specs/<feature-slug>/`** — read brief.md, requirements.md, design.md (validated by Step 0).
5. **`.specs/INDEX.md`** — confirm row exists with status `design-complete`.

## File-ownership format — the contract

Every task's `Files` column uses this exact format. No prose. No globs. No "and related files."

```
<path1> (create), <path2> (modify), <path3> (delete)
```

Rules:
- Paths are relative to workspace root: `packages/shared/src/auth/types.ts`, NOT `auth/types.ts`.
- Suffixes: `(create)`, `(modify)`, `(delete)`. If unmarked, default is `(modify)`.
- Multiple files comma-separated.
- **Ownership = files this task creates or modifies, NOT files it imports.** A task that imports `packages/shared/src/auth/types.ts` to use its types does NOT own that file. Only tasks that write to a file own it.
- No globs (`packages/i18n/src/*/auth.json` is invalid; expand to explicit paths).

This format is parsed by `/spec-review` for mechanical intersection. Two parallel-eligible tasks with overlapping path sets cause `/spec-review` to return Block.

## Sequential-only files — auto-enforcement

Read `workspace.json.review.sequentialOnlyFiles`. Default list (Phase 4):

- `package.json`
- `tsconfig.json`
- `biome.json`
- `.github/pull_request_template.md`
- `CLAUDE.md`
- `AGENTS.md` (if it exists)
- `PROJECT_CONTEXT.md`
- `.claude/workspace.json`

**Rule:** any task whose `Files` list includes one or more sequential-only files is automatically `Parallelizable=false`. The skill never gives the user the option to mark such a task parallel. This catches the "two parallel tasks both editing package.json" deadlock proactively.

When auto-marking, add a brief note in the task's row: `Parallelizable: ✗ (sequential-only file: package.json)`.

## Step 1 — Decompose the design

Walk every section of design.md and identify atomic tasks:

- Every screen → a UI implementation task (sometimes split into structure + interactivity if the screen is complex)
- Every data-model entry → a schema/migration task (or a typed-store task for client-only data)
- Every API contract → a wrapper task in `packages/api`
- Every error case → an error-handling task (often combined with the related screen task)
- Every Sacred Rule compliance map row → a DoD entry on the corresponding task (not its own task)
- Every telemetry event → an analytics-wiring task
- Every i18n key set → a translation task
- Every test mentioned in DoD → a test task
- Every infrastructure item (Sentry init, analytics wrapper, env config) → an infrastructure task

**Atomic = ~30 minutes of focused work for a competent implementation agent.** Bigger? Decompose. Smaller? Combine. A 45-minute coherent task beats three 15-minute fragmented tasks.

Number tasks T-001 onward. Stable IDs; never renumber once written.

## Step 2 — Decide path: complete OR deferred

**Path A — tasks-complete.** All tasks decomposed. Dependency graph clean. Parallelization plan workable. Write tasks.md with `Status: Tasks complete — ready for /spec-review`. Template in Step 2a.

**Path B — tasks-deferred.** A task requires infrastructure that doesn't exist yet (e.g., Phase 5 worktrees, Phase 6 mobile scaffold, Phase 7 hooks) AND the design.md didn't catch this dependency. Or a task requires SME input mid-decomposition. Write tasks.md with `Status: Tasks deferred — pending <blocker>`. Template in Step 2b.

If unsure, ask explicitly.

### Step 2a — Write `tasks.md` (complete path)

Path: `.specs/<feature-slug>/tasks.md`.

Use this structure verbatim:

```markdown
# Tasks: <Feature Name>

**Spec ID:** <feature-slug>
**Status:** Tasks complete — ready for /spec-review
**Reads from:** brief.md, requirements.md, design.md
**Created:** <ISO date>

## Task table

The `Files` column uses the structured format: `<path> (create|modify|delete), ...` — comma-separated, no globs, no prose. Ownership = files this task writes, NOT files it imports.

| ID | Title | Files | Depends on | Parallelizable | Est. | DoD summary |
|---|---|---|---|---|---|---|
| T-001 | <Title> | `<path1> (create)` | — | ✓ | 25m | <one-line summary> |
| T-002 | <Title> | `<path2> (create), <path3> (create)` | — | ✓ | 30m | <summary> |
| T-003 | <Title> | `<path1> (modify)` | T-001 | ✓ | 25m | <summary> |
| T-NNN | <auto-marked sequential> | `package.json (modify)` | — | ✗ (sequential-only file: package.json) | 10m | <summary> |
| ... | ... | ... | ... | ... | ... | ... |

## Per-task detail

Each task gets a section here with full DoD checklist. Implementation reads from this; the table above is the at-a-glance.

### T-001 — <Title>

**Files:**
- `<path1>` (create)

**Depends on:** none

**Parallelizable:** yes

**Estimated:** 25 minutes

**Description:** <2-3 sentences expanding the table title>

**Definition of Done (checklist):**
- [ ] Code written and TypeScript-clean
- [ ] Tests written (RED → GREEN per /spec-implement)
- [ ] Tests pass locally
- [ ] Sacred Rule check: <name applicable rule(s) — e.g., "SR-4 sr4 hook passes on this file" or "N/A — no Sacred Rule surface">
- [ ] Token discipline: <if UI task — "All values reference tokens; no raw hex/px"; if non-UI task — "N/A">
- [ ] Anti-slop check: <if UI task — "/mobile-design-audit static pass" or "/design-audit pass"; if non-UI — "N/A">
- [ ] Code reviewed by <human or /ultrareview>
- [ ] PR description references applicable spec sections (US-N, AC-N.M)

**Sacred Rule references:** <list which Sacred Rule ACs this task is responsible for satisfying, with reference to requirements.md's mapping table>

### T-002 — <Title>

[Repeat structure per task.]

## Parallelization plan

### First wave (no dependencies, parallelizable)

```bash
# Spin up worktrees per task. Phase 5 will ship `worktree-add.sh` to wrap this.
git worktree add ../psychage-master-app-T-001 main
git worktree add ../psychage-master-app-T-002 main
git worktree add ../psychage-master-app-T-008 main

# In each worktree:
cd ../psychage-master-app-T-001 && claude /spec-implement <feature-slug> T-001
cd ../psychage-master-app-T-002 && claude /spec-implement <feature-slug> T-002
cd ../psychage-master-app-T-008 && claude /spec-implement <feature-slug> T-008
```

### Second wave (after first wave merges)

Tasks: T-003 (needs T-001), T-004 (needs T-002), T-007 (needs T-002).

### Sequential tail

T-005 (needs T-002, T-003, T-004) → T-011 (needs T-005, T-006).

### Sequential-only tasks (single-thread regardless)

T-NNN (touches package.json) → run after all parallel waves complete.

### Practical recommendation

Spin up **<N>** parallel worktrees for the first wave. <Name the highest-value parallels.> Single-thread the rest after merges.

## File-creation summary

All files this feature creates or modifies, grouped by location. Useful for tree visualization and PR review.

```
apps/mobile/
  <path>                                        (T-NNN)
  <path>                                        (T-NNN)
packages/api/
  <path>                                        (T-NNN)
packages/i18n/translations/<feature>/
  en.json                                       (T-NNN)
  pt.json                                       (T-NNN)
  ...
supabase/migrations/
  NNN_<feature>.sql                             (T-NNN)
```

(Per workspace.json's per-feature-namespace rule for i18n: each feature gets its own translation file under `translations/<feature>/`. Avoids the i18n bottleneck flagged in audit.)

## Definition of Done — feature

Feature is complete when:
- [ ] All tasks T-001 through T-NNN merged on `main`
- [ ] `<test-runner-candidate from workspace.json>` passes across all workspaces
- [ ] Maestro E2E (T-NNN) passes on iOS sim and Android emulator (mobile features only)
- [ ] All Sacred Rule hooks pass on every commit
- [ ] /design-audit passes (web) or /mobile-design-audit passes (mobile)
- [ ] /ultrareview pass on the implementation PR
- [ ] PR description references applicable App Store / Play Store guidelines (mobile only)
- [ ] No Sentry breadcrumb, analytics event, or storage write contains symptom data, mood data, journal content, or chat messages (verified via test + sr4 hook)
- [ ] Manual QA: <list — usually language coverage, dark mode, edge devices>

## Next step

1. Run `/spec-review <feature-slug>` to audit this spec for gaps before implementation.
2. Once review passes, spin up worktrees per the parallelization plan and run `/spec-implement <feature-slug> <task-id>` in each.
```

### Step 2b — Write `tasks.md` (deferred path)

Same path: `.specs/<feature-slug>/tasks.md`. Use Step 2a's template with three differences:

1. **Status line names blocker:** `Status: Tasks deferred — pending <blocker>`
2. **Tasks affected by blocker marked DEFERRED in their rows.** E.g., a task requiring Phase 5 worktrees gets row entries `(blocked: Phase 5)` in the title; per-task detail's DoD list says `DEFERRED — depends on Phase 5 worktree scripts`.
3. **`## Next step` replaced with:**

```markdown
## Deferred status

**Blocking dependency:** <name>
**Workspace.json reference:** <field>
**Resolves at:** <action / phase close>
**Resolver:** <who>
**What can proceed now:** <partial work, or "nothing — full defer">

## Open questions (each tagged with blocker + resolver)

1. **<question>** — *blocker:* <name> — *resolver:* <who>

## Do NOT run /spec-review

This tasks.md is in a deferred state. /spec-review <feature-slug> will refuse to run on `tasks-deferred` status. When the blocker resolves:
1. Update affected task rows with their resolved values
2. Change the Status line to `Status: Tasks complete — ready for /spec-review`
3. Replace this section with `## Next step` pointing to /spec-review
4. Update INDEX.md from `tasks-deferred` to `tasks-complete`
5. Then /spec-review <feature-slug> becomes available
```

## Step 3 — Update `.specs/INDEX.md`

Read INDEX.md. Find the row for `<feature-slug>`. **Mutate the existing row** (do not append).

For Path A: `design-complete → tasks-complete`. Update `Last updated`.
For Path B: `design-complete → tasks-deferred`. Update `Last updated`.

## Step 4 — Tell the user, suggest the next step, stop

**On complete path:**

1. Path to tasks.md
2. Summary: number of tasks, number of parallelizable, number of sequential-only auto-marked, total estimated time
3. Suggested next: `/spec-review <feature-slug>`

**On deferred path:**

1. Path to tasks.md
2. Summary of what was decomposed
3. **Explicit "Do not run /spec-review on this spec. It is deferred until <blocker> resolves."**
4. Named lift procedure

Then **stop** in either case. Do not invoke other skills. Do not write code.

## Hard rules

- **Every task ≤45 minutes of focused work.** If estimate is higher, decompose. If <15, consider combining.
- **Every task names its files in the structured format.** Vague tasks ("update the auth flow") are forbidden. Concrete paths only.
- **File ownership = files the task creates or modifies, NOT files it imports.** Two tasks that both import `auth/types.ts` are parallelizable; two tasks that both write to it are not.
- **Sequential-only files force `Parallelizable=false`.** No override. Read the list from `workspace.json.review.sequentialOnlyFiles`; if a task's Files list includes any of them, mark it sequential and add the explanatory note.
- **No globs in the Files column.** Expand `packages/i18n/src/*/auth.json` to explicit paths per language.
- **Every task has a structured DoD checklist** in its per-task detail section, not just a one-line summary.
- **Mark parallelizability honestly.** Two tasks that touch the same non-imported file are NOT parallelizable. /spec-review will hard-fail; better to catch it here.
- **Tasks ≤500 lines total.** Bigger feature → split spec.
- **Do not skip Step 0.** Refusing on deferred or missing design is the load-bearing safety property.
- **Do not auto-lift any deferral.** Same as prior skills.
- **Do not write code.** Decomposition only.

## Anchor example: file-ownership and parallelization

Two parallel-eligible tasks that BOTH USE `packages/shared/src/auth/types.ts` but only ONE WRITES to it:

| ID | Title | Files | Depends on | Parallelizable |
|---|---|---|---|---|
| T-001 | Define auth types | `packages/shared/src/auth/types.ts (create)` | — | ✓ |
| T-002 | Implement signUp wrapper using types | `packages/api/src/auth/signUp.ts (create)` | T-001 | ✓ |
| T-003 | Implement signIn wrapper using types | `packages/api/src/auth/signIn.ts (create)` | T-001 | ✓ |

T-002 and T-003 both *import* `auth/types.ts` but neither writes to it. Both are parallelizable. T-001 is their common dependency, so they wait for it to merge first.

If T-002 and T-003 *both* needed to add fields to `auth/types.ts`, both would list `packages/shared/src/auth/types.ts (modify)` in their Files columns, and `/spec-review` would hard-fail because of the intersection. The fix in that case is to merge them into a single task, or order them sequentially.

A counter-example with sequential-only file:

| ID | Title | Files | Depends on | Parallelizable |
|---|---|---|---|---|
| T-008 | Add lucide-react-native dependency | `package.json (modify)` | — | ✗ (sequential-only file: package.json) |

The skill auto-marks this as not-parallelizable because `package.json` is in `workspace.json.review.sequentialOnlyFiles`. The user has no override.

## Anchor example: smoke test on `_smoke_test`

For Phase 4 turn 5 smoke test:

**User invocation:** `/spec-tasks _smoke_test`

**Skill takes Step 0 path:**
- Globs `.specs/_smoke_test/design.md`. File doesn't exist (turn 4's `/spec-design` correctly refused).
- Refuses with: *"This spec has no design.md. Run /spec-design <feature-slug> first."*
- Stops. No file writes. No INDEX mutation.

**Pass criterion:** No `tasks.md` written. INDEX.md SHA byte-identical. brief.md SHA byte-identical. Clear refusal naming the missing prerequisite.

The deeper tests — file-isolation hard-fail (Q5), sequential-only enforcement, parallelization plan output, per-task DoD generation — require a real complete design.md to exercise. They land in Phase 11 first-feature work. For Phase 4 turn 5, Step 0 refusal is sufficient to confirm the deferral pattern propagates.
