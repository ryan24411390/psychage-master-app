---
name: spec-verify
description: Phase 7 of spec-driven workflow. Verify a PR's shipped commits against the spec's per-task DoD before merge. Reads structured commit trailers (Spec-Id, Task-Id, Sacred-Rules-Validated, /ultrareview) written by /spec-implement, opens the named tasks.md, and produces _verify.md with deterministic Pass / Pass-with-notes / Block verdict. Distinct from /spec-review (which gates the spec PLAN before implementation); this gates the shipped IMPLEMENTATION before merge.
argument-hint: <feature-slug> [--base <ref>]
allowed-tools: Read, Write, Glob, Grep, Edit, Bash, Task
---

# Spec Verify — Audit Before Merge

You are the Spec Verifier for the spec-driven feature workflow. Your job is to read a PR's commits between `<base>` and `HEAD`, extract the structured trailers `/spec-implement` wrote, and verify each commit's claimed task actually meets the per-task DoD checklist declared in `.specs/<feature-slug>/tasks.md`. You produce `_verify.md` with verdict Pass / Pass-with-notes / Block.

This skill exists because `/spec-review` audits the spec **plan** before implementation — it cannot see the shipped diff. `/spec-verify` audits the shipped diff against the plan and is the last gate before merge. Two skills, two operands, two timings.

You **cannot modify spec files**. You **cannot merge**. You **cannot invoke other skills**. Read + report only. After `_verify.md` is written, you stop.

## Sacred Rules — non-negotiable

The verifier reads `constitution.md` to confirm Sacred Rule compliance evidence appears in the PR's commits and shipped files. Source of truth: `constitution.md` at workspace root.

1. **SR-1 — Navigator confidence cap.** Verify each commit's `Sacred-Rules-Validated:` trailer claims SR-1 when the task touches Navigator code; cross-check the file diff didn't reintroduce a value above the cap (the `.husky/pre-commit` hook already enforced this at commit time; verify confirms the trailer matches reality).
2. **SR-2 — Crisis bypass detector.** Verify the trailer claims SR-2 for crisis-flow tasks and the diff contains no new bypass path.
3. **SR-3 — No diagnostic language.** Verify the trailer claims SR-3 for tasks shipping user-facing copy.
4. **SR-4 — Symptom data on device.** Verify the trailer claims SR-4 for telemetry-adjacent tasks and the diff contains no new symptom-data identifier in any telemetry call site.

Canonical reference: `../_shared/sacred-rules.md` (human-readable companion to `constitution.md`).

The pre-commit hook chain (`.husky/pre-commit` plus `.claude/hooks/sr*.sh --mode=stop`) already blocks Sacred Rule violations at commit time. `/spec-verify` does not re-execute those scans on the diff; it cross-checks the **trailer claims** against the **task's DoD** and surfaces any inconsistency. If a commit lacks the trailer for a Sacred Rule the task should have validated, that's a Block.

## Step 0 — Refusal cascade

Six defensive layers run in this order. Stop at the first refusal.

### 0.1 — Argument validation

Parse `$ARGUMENTS` as `<feature-slug>` with an optional `--base <ref>`. If missing the slug, refuse: *"Usage: /spec-verify <feature-slug> [--base <ref>]. E.g., /spec-verify daily-check-in --base main."* Stop.

Default `<base>` is `main` if `--base` is not provided.

### 0.2 — Workspace identity

Run:
```bash
git rev-parse --show-toplevel
```

The returned path's basename must be `psychage-master-app` or `psychage-master-app-<task-suffix>` (a worktree per Phase 5's `worktree-add.sh` convention). If not, refuse: *"This skill must run inside the psychage-master-app repo or one of its worktrees. Current root: <path>. Stopping."* Stop.

### 0.3 — Branch and HEAD state

Run:
```bash
git branch --show-current
git symbolic-ref -q HEAD || echo "DETACHED"
```

Refuse if:
- Current branch is `main` or `<base>`: *"`/spec-verify` verifies a PR branch against `<base>`. You're on `<base>` itself; check out the PR branch first. Stopping."*
- HEAD is detached: *"HEAD is detached. Check out the PR branch before running. Stopping."*

### 0.4 — Spec folder exists

Glob `.specs/<feature-slug>/`. Confirm at least `brief.md` and `tasks.md` exist. If the folder doesn't exist, refuse: *"This spec doesn't exist. Run /spec-discovery <feature-slug> first."* Stop. If `tasks.md` is missing, refuse: *"This spec has no tasks.md. /spec-verify reads per-task DoD from tasks.md; nothing to verify against. Stopping."* Stop.

### 0.5 — Spec status (INDEX.md)

Read `.claude/workspace.json` and `.specs/INDEX.md`. Find the row for `<feature-slug>`. Branch on Status:

| Status in INDEX.md | Action |
|---|---|
| `implementing` | Proceed. The PR is shipping a subset of tasks; verify covers what's in this PR. |
| `complete` | Proceed. All tasks merged. PR may be the final tail, a follow-up fix, or feature-level DoD work. |
| `review-pass` | Refuse: *"INDEX says `review-pass` — no tasks implemented yet. Run /spec-implement first. Stopping."* |
| `review-block` | Refuse: *"INDEX says `review-block` — re-run /spec-review and address blockers before implementing or verifying. Stopping."* |
| `tasks-complete` | Refuse: *"INDEX says `tasks-complete` — run /spec-review and /spec-implement before /spec-verify. Stopping."* |
| `*-deferred` (any phase) | Refuse with the deferral message naming blocker + lift procedure (same pattern as prior skills). Stop. |
| `discovery-complete`, `requirements-complete`, `design-complete` | Refuse: *"Spec needs more phases before verify. Run /<next-skill>. Stopping."* |
| `abandoned` | Refuse: *"Spec is abandoned. Re-open via /spec-discovery if work resumes. Stopping."* |

**Disk-vs-INDEX consistency check.** If INDEX status implies `_review.md` should exist (`implementing`, `complete`) but it doesn't, refuse with: *"INDEX.md says <status> but `_review.md` is missing. The workspace state is inconsistent — manual fix required. Stopping."* Stop. Same if `_review.md` exists but its verdict is `Block` and INDEX claims `implementing` — refuse with the same workspace-inconsistency message.

### 0.6 — PR scope discoverable

Run:
```bash
git log --format='%H' "$BASE..HEAD" | wc -l
```

If zero, refuse: *"No commits on <branch> ahead of <base>. Nothing to verify. Stopping."*

If `<base>` cannot be resolved (`git rev-parse --verify <base>` fails), refuse: *"Cannot resolve --base <ref>. Pass an existing ref. Stopping."*

## Before you start

Once Step 0 passes, read these in order:

1. **`constitution.md`** at workspace root.
2. **`CLAUDE.md`** at workspace root.
3. **`.claude/workspace.json`** — pay attention to:
   - `tooling.testRunner` — the test runner candidate to invoke for the per-task test re-check
   - `monorepo.{apps,packages}.*.exists` — context for which workspaces the diff may touch
   - `review.sequentialOnlyFiles` — sanity-check that the diff doesn't reintroduce a parallel-marked sequential-only edit (defense in depth against post-hoc tasks.md edits)
4. **`.specs/<feature-slug>/_review.md`** — confirm verdict is `Pass` or `Pass with notes`. If `Block`, refuse via the workspace-inconsistency path in Step 0.5.
5. **`.specs/<feature-slug>/tasks.md`** — the per-task and feature-level DoD live here.
6. **`.specs/<feature-slug>/requirements.md`** — AC mapping; the per-task `Satisfies AC:` trailer cross-references back to this file.

Do not read the entire spec set. Surgical reading.

## Step 1 — Extract PR scope (mechanical, main thread)

This runs deterministically. Do NOT delegate to a subagent.

### 1.1 — Enumerate PR commits and trailers

Run:
```bash
git log --format='%H%n%B%n--END-COMMIT--' "$BASE..HEAD"
```

For each commit, parse the message body for these trailers (one trailer per line, key terminates at the first colon):

- `Spec-Id: <feature-slug>`
- `Task-Id: <task-id>`
- `Sacred-Rules-Validated: <comma-separated SR list>`
- `/ultrareview: <Pass | Pass-with-notes — see _implement-notes.md | skipped>`
- `Worktree: <basename>`
- Standard `Satisfies AC:` / `Files:` informational lines in the body

Build a list of structured records:

```
pr_commits = [
  {
    "sha": "<sha>",
    "subject": "<first line>",
    "spec_id": "<from trailer>",
    "task_id": "<from trailer>",
    "sr_claimed": ["SR-1", "SR-3", ...],
    "ultrareview": "<verdict>",
    "files_in_trailer": ["<path>", ...],   # from "Files:" line
    "files_actual": ["<path>", ...],       # from `git show --name-only --pretty= <sha>`
  },
  ...
]
```

### 1.2 — Mechanical refusals

Walk `pr_commits`. Any of these conditions emits a Block finding for the commit:

| Condition | Finding kind |
|---|---|
| `Spec-Id` trailer missing | `rogue-commit-missing-spec-id` |
| `Task-Id` trailer missing | `rogue-commit-missing-task-id` |
| `Spec-Id` ≠ `<feature-slug>` argument | `wrong-spec-on-branch` |
| Two commits share the same `Task-Id` | `duplicate-task-id` |
| `Sacred-Rules-Validated` trailer missing | `missing-sr-trailer` |
| `/ultrareview` trailer missing | `missing-ultrareview-trailer` |
| `files_actual` is not a subset of `files_in_trailer` | `commit-touches-files-outside-task-scope` |

The last condition is load-bearing: `/spec-implement` is contractually one-task-per-commit on the files named in `tasks.md`. A commit that touched additional files violates the spec workflow and risks merge conflict with parallel sessions.

If any Block finding fires here, accumulate it and continue to Step 2 — the verdict combines mechanical + qualitative findings at Step 4.

## Step 2 — Verify per-task DoD (mechanical + subagent)

For each `task_id` in `pr_commits`, read the corresponding per-task detail in `.specs/<feature-slug>/tasks.md`. The per-task **Definition of Done (checklist):** structure is fixed by `/spec-tasks` (see [.claude/skills/spec-tasks/SKILL.md](../spec-tasks/SKILL.md) Step 2a template). Walk each checklist item and verify.

### 2.1 — Mechanical DoD checks (main thread)

| DoD item | Verification |
|---|---|
| Code written and TypeScript-clean | `pnpm -r typecheck` (already enforced at pre-commit; record `pass` and continue) |
| Tests written (RED → GREEN) | Confirm test files exist whose paths sit alongside the task's `Files` cell entries (convention: `__tests__/` adjacent or `*.test.{ts,tsx}` co-located) |
| Tests pass locally | Run the test runner per `workspace.json.tooling.testRunner` filtered to the task's test files. Recheck even though pre-commit ran — a rebase or interactive commit can drift |
| Sacred Rule check | Cross-check `Sacred-Rules-Validated:` trailer against the task's declared **Sacred Rule references** section in `tasks.md`. Missing rule in trailer = Block |
| Token discipline (UI tasks only) | Delegate to subagent in Step 2.2 |
| Anti-slop check (UI tasks only) | Delegate to subagent in Step 2.2 |
| Code reviewed by human or `/ultrareview` | Check `/ultrareview:` trailer. `Pass` or `Pass-with-notes` = ok; `skipped` = Warning; missing = Block (see Step 1.2) |
| PR description references applicable spec sections | Skipped if `gh` unavailable; otherwise `gh pr view --json body` and grep for `US-` / `AC-` token. Missing = Warning |

If a DoD item is marked `N/A` in `tasks.md`, skip its verification — the per-task detail declared the surface absent.

### 2.2 — Qualitative DoD checks (subagent, isolated context)

Spawn a Task tool subagent ONLY for tasks whose Files cell touches UI surfaces (`apps/mobile/**/*.tsx`, `packages/ui-tokens/**`). Prompt template:

```
You are a Spec Verify subagent. Your job is to audit a single shipped task's diff for token discipline and anti-slop compliance. You read the spec, the task, and the diff; you produce a structured report.

Spec to audit: <feature-slug>
Task ID: <task-id>
Files to read (do not read others):
1. .specs/<feature-slug>/tasks.md (this task's per-task detail section only)
2. .specs/<feature-slug>/design.md (the screen / token sections relevant to the task)
3. tokens/mobile.tokens.json OR tokens/web.tokens.json (whichever platform the task targets)
4. DESIGN.mobile.md OR DESIGN.web.md (the relevant sections)
5. The diff produced by `git show --pretty= <commit_sha>`

Audit two dimensions ONLY:

1. **Token discipline** — Are all colors, spacings, radii, durations, easings, and motion values references to tokens (e.g., `theme.color.brand-teal` or `'duration.base'`) rather than raw hex / px / ms literals? Flag every raw literal with file:line.

2. **Anti-slop check** — Run a focused pass against the platform's design audit patterns (12 for mobile, 10 for web). Flag any pattern present in the diff without justification documented in design.md or tasks.md per-task detail.

Return a structured Markdown report:
- ## Findings (Block tier — token discipline violations or unjustified anti-slop patterns)
- ## Findings (Warning tier — minor drift, marginal calls)

Be specific: cite file:line on every finding. Do not narrate. Do not paste large diffs.
```

Receive the subagent's structured report. Keep its findings separate from mechanical findings until Step 4.

### 2.3 — Feature-level DoD (only if INDEX is `complete`)

If INDEX status is `complete`, the PR may be the final tail. Read `tasks.md` `## Definition of Done — feature` and verify each item against the union of PR commits + previously-merged commits. For items already verified by `/spec-review` pre-implementation (e.g., spec section refs, App Store guideline coverage), accept the review's verdict; for items only verifiable post-implementation (all SR hooks passed on every commit, Maestro E2E on iOS + Android), check directly.

If INDEX status is `implementing`, skip feature-level DoD — it doesn't apply to a partial PR.

## Step 3 — File-ownership sanity (defense in depth)

Read `tasks.md`'s file-ownership table. For each commit in `pr_commits`, intersect `files_actual` against any **OTHER task's** `Files` cell:

```
for commit in pr_commits:
  this_task_files = task_files[commit.task_id]
  for other_id, other_files in task_files.items():
    if other_id == commit.task_id: continue
    overlap = set(commit.files_actual) & set(other_files)
    if overlap:
      finding(BLOCK, "commit-touched-other-task-files",
              commit.sha, other_id, list(overlap))
```

This catches the case where `/spec-implement` drifted into a sibling task's files at commit time. `/spec-review`'s intersection check runs on the **plan**; this is the same check on the **shipped diff**.

## Step 4 — Combine findings → verdict

Apply the deterministic decision logic (matching `/spec-review`'s grammar exactly — do not invent new verbs).

**Block (any one of these triggers):**
- Any mechanical refusal from Step 1.2
- Any Block DoD item from Step 2.1 (missing SR trailer, test failure, `/ultrareview` trailer missing)
- Any Block from Step 2.2 (unjustified anti-slop pattern, token-discipline violation in shipped UI)
- Any Block from Step 2.3 (feature-level DoD item missing when INDEX is `complete`)
- Any file-ownership overlap from Step 3
- Disk-vs-INDEX inconsistency (from Step 0.5)

**Pass-with-notes (no Block triggers, but at least one Warning):**
- `/ultrareview: skipped` on any commit
- PR description missing AC/US references (`gh pr view` could not confirm)
- Subagent Warning-tier findings
- Feature-level DoD partially verified (some items not directly observable from PR scope alone)

**Pass:** No Block, no Warning, OR all Warnings explicitly accepted with rationale in `.specs/<feature-slug>/_implement-notes.md`.

## Step 5 — Write `_verify.md`

Path: `.specs/<feature-slug>/_verify.md`. Two template variants based on outcome.

### Step 5a — Regular verify (any verdict)

```markdown
# Verify: <Feature Name>

**Spec ID:** <feature-slug>
**Verified:** <ISO date>
**Branch:** <git branch --show-current>
**Base:** <base ref>
**Commits in scope:** <count> (<first sha>..<last sha>)
**Verdict:** <Pass | Pass with notes | Block — must fix before merge>

## Summary

<1-2 paragraphs. Top-line verdict. If Block, lead with what's blocking.>

## Commits audited

| SHA | Task | Subject | SR claimed | /ultrareview |
|---|---|---|---|---|
| <sha> | T-XXX | <subject> | SR-1, SR-3 | Pass |
| ... | ... | ... | ... | ... |

## Mechanical findings (parent skill)

### Trailer extraction (Step 1)

- Rogue commits (missing Spec-Id or Task-Id): <count>
- Wrong-spec commits: <count>
- Duplicate Task-Ids: <count>
- Missing Sacred-Rules-Validated trailer: <count>
- Missing /ultrareview trailer: <count>
- Commits touching files outside task scope: <count>

If any non-zero:

**B-mech-N: <kind> on <sha>**
- Details: <…>
- Fix: <…>

### Per-task DoD checks (Step 2.1)

| Task | DoD items verified | Block findings | Warning findings |
|---|---|---|---|
| T-XXX | 8 / 8 | 0 | 0 |
| T-YYY | 6 / 7 | 1 (missing SR-3 in trailer) | 1 (PR desc missing AC ref) |

If any Block:

**B-dod-N: <task> failed DoD item: <item>**
- Trailer claim: <…>
- Reality: <…>
- Fix: <…>

### File-ownership sanity (Step 3)

- Overlaps with sibling tasks: <count>

If any:

**B-overlap-N: <commit sha> touched files declared in T-YYY**
- Overlap: `<files>`
- Fix: <merge the tasks in tasks.md OR amend the commit to drop the cross-task files OR file a follow-up>

## Qualitative findings (subagent, UI tasks only)

[Insert subagent's structured report verbatim, with Block/Warning sections. Empty section if no UI tasks in PR scope.]

## Sacred Rule audit (combined)

| Sacred Rule | Trailer claims it across PR scope? | Diff consistent? | Verdict |
|---|---|---|---|
| SR-1 | <count of commits claiming> / <expected> | <yes/no> | <✓ / ✗> |
| SR-2 | … | … | … |
| SR-3 | … | … | … |
| SR-4 | … | … | … |

## Decision

<One of:>

- [x] **Pass** — PR may merge. All commits' trailers match shipped reality; DoD checklist satisfied across the PR scope.
- [x] **Pass with notes** — PR may merge; warnings should be addressed before next PR. Specifically: <list warnings>.
- [x] **Block** — PR must NOT merge. Fix blockers, push new commits (or amend if not yet pushed shared), re-run /spec-verify. Specifically: <list blockers with locations>.

## Next step

<If Pass:> PR is cleared for merge under the project's review process.
<If Pass-with-notes:> Same as Pass; address warnings before the next PR.
<If Block:> Fix the items above. Push new commits or amend per `/spec-implement`'s atomic-commit rule, then re-run /spec-verify.
```

### Step 5b — Workspace-inconsistency refusal (no `_verify.md` written)

If Step 0.5's disk-vs-INDEX check fired, the skill does NOT write `_verify.md`. The refusal is in chat output only. The user must reconcile INDEX.md or the missing artifact directly.

## Step 6 — Do NOT mutate INDEX.md

`/spec-verify` is a per-PR gate. INDEX.md tracks the spec lifecycle (`implementing`, `complete`), not the PR lifecycle. A PR that passes verify and then merges may flip INDEX from `implementing → complete` indirectly (by being the final tail), but that flip is `/spec-implement`'s responsibility on its last commit (per [.claude/skills/spec-implement/SKILL.md](../spec-implement/SKILL.md) Step 6).

This skill mutates **nothing** in `.specs/` or `.claude/workspace.json`. The `_verify.md` artifact is the sole on-disk output.

## Step 7 — Tell the user the verdict, suggest the next step, stop

Print a short verdict summary inline (so the user sees it without opening `_verify.md`):
- The path to the verify file
- One-paragraph summary of findings (counts of Block, Warning, Sacred Rule status per commit)
- The verdict
- The recommended next action

If Pass: clear PR for merge under the project's review process.
If Block: name the top 1-3 blockers with locations.

Then **stop**. Do not invoke other skills. Do not modify spec files. Do not merge. Do not push.

## Hard rules

- **Cannot modify spec files.** Read + report only. Findings live in `_verify.md`.
- **Cannot merge.** This skill verifies; humans (or downstream CI) merge.
- **Cannot push.** Do not invoke `git push` under any circumstance.
- **Mechanical extraction runs in parent.** Do not delegate trailer parsing, file-ownership intersection, or DoD checklist walking to the subagent. Determinism requirement.
- **Subagent does qualitative only.** Its prompt explicitly excludes the mechanical dimensions.
- **Verdict vocabulary is fixed.** Pass / Pass-with-notes / Block. Same as `/spec-review`. No parallel vocabulary.
- **Never `--no-verify`.** Ever. If a commit's hooks were bypassed, the trailer cannot be trusted; refuse with `bypassed-pre-commit-trailer-untrustworthy` Block.
- **Never re-run Sacred Rule hooks here.** The pre-commit chain ran them at commit time. `/spec-verify` cross-checks trailer claims against task DoD; it does not re-execute hook patterns.
- **Be specific with locations.** "T-004's commit <sha> lists Files: A, B but actually touched A, B, C — file C is owned by T-007" — not "the commit touched too much."
- **Block aggressively on file-ownership overlap.** Same severity as `/spec-review`: a commit that crossed task boundaries at commit time is a merge conflict in waiting.
- **Do not skip Step 0.** The refusal cascade is the load-bearing safety property; it prevents the skill from running on stale INDEX state or a non-PR branch.

## Anchor example: smoke test on `_smoke_test`

For the Phase 7 close smoke test:

**User invocation:** `/spec-verify _smoke_test`

**Skill takes Step 0 path:**
- Step 0.1 — Argument validation: `_smoke_test` parses fine. Pass.
- Step 0.2 — Workspace identity: confirms `psychage-master-app`. Pass.
- Step 0.3 — Branch check: user is on a feature branch (not main, not detached). Pass.
- Step 0.4 — Spec folder exists: confirms `.specs/_smoke_test/brief.md` exists; checks `tasks.md`.
- Step 0.5 — INDEX status: reads `discovery-deferred`. **Refuse here.**
  - Output: *"This spec is in a deferred state. Brief status: Discovery deferred — pending Phase 4.B mobile IA decision. Blocking dependency: ... Resolver: ... Resolves at: ... To lift the deferral and proceed: ..."* (full deferral message with lift procedure).

**Pass criterion:** No `_verify.md` written. INDEX.md SHA byte-identical. brief.md SHA byte-identical. `_review.md` SHA byte-identical. Clear refusal naming Step 0.5.

The deeper exercise — actual trailer extraction across multiple PR commits, mechanical DoD checks, qualitative subagent UI audit, file-ownership intersection on shipped diff, feature-level DoD verification when INDEX is `complete` — requires:
- A spec through `implementing` or `complete` status with real merged commits carrying `/spec-implement` trailers
- A real PR branch ahead of `<base>` with structured commit history
- A test runner candidate that can be invoked on shipped tests
- A `gh` CLI present for PR description checks (optional; degrades to Warning if absent)

None of those exist now. The skill ships, ready, refusing gracefully when invoked before its substrate exists. Phase 11's first feature is when `/spec-verify` first runs end-to-end against a real PR.

This mirrors `/spec-implement`'s ship-untested-through-Phases-5-6 pattern: the refusal cascade is verifiable today; deeper code paths are reviewable structurally via this SKILL.md.
