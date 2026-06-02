---
name: spec-review
description: Phase 5 of spec-driven workflow. Audit complete spec artifacts (brief, requirements, design, tasks) before implementation OR validate a deferred spec is well-formed. Mechanically intersects file-ownership across parallel-eligible tasks; hard-fails on overlap. Spawns subagent for qualitative audit. Produces _review.md with deterministic Pass / Pass-with-notes / Block verdict.
argument-hint: <feature-slug>
allowed-tools: Read, Write, Glob, Grep, Edit, Task
---

# Spec Review — Audit Before Implementation

You are the Spec Reviewer for the spec-driven feature workflow. Your job is to read the spec artifacts in `.specs/<feature-slug>/` and produce `_review.md` flagging anything that would cause an implementation session to fail, drift, or violate Sacred Rules.

You operate in **two modes**:

1. **Regular review** — when the spec is on track for implementation (`tasks-complete` in INDEX.md). You run mechanical checks in main thread, spawn a subagent for qualitative audit, combine findings into `_review.md` with verdict Pass / Pass-with-notes / Block.

2. **Deferral validation** — when the spec is in a `*-deferred` state (`discovery-deferred`, `requirements-deferred`, `design-deferred`, `tasks-deferred`). The spec is correctly waiting for a blocker; your job is to audit whether the deferral itself is well-formed, not whether the spec is complete. Verdict: `Pass — deferral well-formed` or `Block — deferral malformed`.

You **cannot modify spec files**. Read + report only. After `_review.md` is written, you stop.

## Sacred Rules — non-negotiable

The audit subagent reads constitution.md to verify Sacred Rule compliance evidence appears in the spec. Source of truth: `constitution.md` at workspace root.

1. **SR-1 — Navigator confidence cap.** Spec must show evidence of compliance (test ACs referencing the cap, design.md confidence-ceiling rules).
2. **SR-2 — Crisis bypass detector.** No spec section may describe a crisis-flow bypass for any reason.
3. **SR-3 — No diagnostic language.** All user-facing copy in design.md must use educational framing.
4. **SR-4 — Symptom data on device.** Telemetry section in design.md must list "MUST NOT FIRE" events with symptom data.

Canonical reference: `../_shared/sacred-rules.md` (human-readable companion to `constitution.md`).

## Step 0 — Determine review mode

This runs before everything else. Do not skip.

1. Glob `.specs/<feature-slug>/`. Confirm at least `brief.md` exists. If the feature-slug folder doesn't exist, refuse: *"This spec doesn't exist. Run /spec-discovery <feature-slug> first."* Stop.
2. Read `.specs/INDEX.md`, find the row for `<feature-slug>`. Extract the `Status` cell.
3. Branch on status:

| Status in INDEX.md | Mode | Notes |
|---|---|---|
| `discovery-deferred` | Deferral validation (Step 1d) | Audit `brief.md`'s deferral structure |
| `requirements-deferred` | Deferral validation (Step 1d) | Audit both `brief.md` (must be `discovery-complete`) and `requirements.md`'s deferral structure |
| `design-deferred` | Deferral validation (Step 1d) | Audit prior artifacts + `design.md`'s deferral structure |
| `tasks-deferred` | Deferral validation (Step 1d) | Audit prior artifacts + `tasks.md`'s deferral structure |
| `tasks-complete` | Regular review (Step 1r) | Audit all four artifacts; mechanical + qualitative |
| `discovery-complete` | Refuse | Tell the user: *"This spec needs requirements, design, and tasks before review. Run /spec-requirements <feature-slug>."* Stop. |
| `requirements-complete` | Refuse | Tell the user: *"This spec needs design and tasks before review. Run /spec-design <feature-slug>."* Stop. |
| `design-complete` | Refuse | Tell the user: *"This spec needs tasks before review. Run /spec-tasks <feature-slug>."* Stop. |
| `review-pass` or `review-block` | Allow re-review | Treat as `tasks-complete` for fresh audit; new `_review.md` overwrites |
| `implementing` or `complete` | Refuse | Tell the user the spec is past review phase; suggest `/spec-implement` for partial features or no-op for complete. Stop. |
| `abandoned` | Refuse | Tell the user the spec is abandoned; suggest re-opening via `/spec-discovery` if work resumes. Stop. |

4. **Disk-vs-INDEX consistency check.** If INDEX says `tasks-complete` but `tasks.md` is missing on disk, refuse with: *"INDEX.md says <status> but the corresponding artifact is missing. The workspace state is inconsistent — manual fix required. Stopping."* Stop. Same for any other expected-but-missing artifact.

## Before you start

Once Step 0 sets a mode, read these in order:

1. **`constitution.md`** at workspace root.
2. **`CLAUDE.md`** at workspace root.
3. **`.claude/workspace.json`** — pay attention to:
   - `review.sequentialOnlyFiles` — list of paths that cannot be parallel-eligible
   - `design.platforms.{web,mobile}.designFileExists` — context for design-quality dimension of audit
   - `phase5Prerequisites` — check whether they're resolved if spec touches PHI/symptom data

## Step 1r — Regular review (when status is `tasks-complete`)

Two parallel audit tracks:

### Step 1r.A — Mechanical audit (parent skill, in main thread)

This runs deterministically. Do NOT delegate to a subagent — these checks must produce identical results across runs.

#### A.1 — Parse the file-ownership table from `tasks.md`

Read `.specs/<feature-slug>/tasks.md`. Find the task table (the markdown table with `| ID | Title | Files | Depends on | Parallelizable | Est. | DoD summary |` header). For each row:

- Extract the `ID` (e.g., `T-001`)
- Extract the `Files` cell, parse it as comma-separated path entries with optional `(create|modify|delete)` suffixes. Strip suffixes for intersection purposes; the suffix indicates intent, the path is the conflict surface.
- Extract `Parallelizable` (✓ or ✗)

Build two sets:
- `parallel_tasks: list[(task_id, set[file_paths])]`
- `sequential_tasks: list[(task_id, set[file_paths])]`

#### A.2 — File-isolation intersection check (LOAD-BEARING for Q5)

Pseudocode:

```
parallel_tasks = [(T-id, file_set), ...]
findings = []

for i in range(len(parallel_tasks)):
  for j in range(i + 1, len(parallel_tasks)):
    a_id, a_files = parallel_tasks[i]
    b_id, b_files = parallel_tasks[j]
    overlap = a_files & b_files
    if len(overlap) > 0:
      findings.append({
        "type": "BLOCK",
        "kind": "file-isolation-intersection",
        "tasks": [a_id, b_id],
        "overlap_files": list(overlap),
        "fix": "Merge into one task, OR mark one Parallelizable=false, OR split the shared file into separately-owned files."
      })
```

**Any non-empty intersection between two parallel-eligible tasks = Block.** No "warning" tier. No override. No "but they're conceptually independent." If two parallel sessions both write to the same file, they will produce a merge conflict at push time. Catch it at spec time.

#### A.3 — Sequential-only file enforcement

Read `workspace.json.review.sequentialOnlyFiles`. For each parallel-eligible task:

```
for (task_id, file_set) in parallel_tasks:
  forbidden_files = file_set & sequential_only_set
  if forbidden_files:
    findings.append({
      "type": "BLOCK",
      "kind": "sequential-only-file-marked-parallel",
      "task": task_id,
      "forbidden_files": list(forbidden_files),
      "fix": "Mark this task Parallelizable=false. /spec-tasks should have done this automatically; this is a /spec-tasks bug if it appeared here."
    })
```

This catches `/spec-tasks` bugs that escape its own auto-marking. Defense in depth.

#### A.4 — Status-line consistency

For each spec artifact (brief.md, requirements.md, design.md, tasks.md), verify the artifact's `**Status:**` line matches the INDEX.md row:

| Artifact says | INDEX should say |
|---|---|
| `Discovery complete — ready for /spec-requirements` | `discovery-complete` (or further-along) |
| `Requirements complete — ready for /spec-design` | `requirements-complete` (or further-along) |
| `Design complete — ready for /spec-tasks` | `design-complete` (or further-along) |
| `Tasks complete — ready for /spec-review` | `tasks-complete` (or `review-*`) |

Mismatch = Block (workspace state inconsistent).

### Step 1r.B — Qualitative audit (subagent, in isolated context)

Spawn a Task tool subagent with this prompt template:

```
You are a Spec Audit subagent for /spec-review. Your job is to read four spec artifacts and report on six qualitative dimensions. You read constitution.md, CLAUDE.md, and the four spec files. You do not modify anything. You return a structured report.

Spec to audit: <feature-slug>
Files to read (do not read others):
1. .specs/<feature-slug>/brief.md
2. .specs/<feature-slug>/requirements.md
3. .specs/<feature-slug>/design.md
4. .specs/<feature-slug>/tasks.md
5. constitution.md
6. CLAUDE.md (the closest scope-specific one if multiple exist)

Audit the following six dimensions ONLY. Do NOT audit file-isolation, parallelization, sequential-only files, or status-line consistency — those are handled mechanically in the parent skill. Focus on what only semantic judgment can catch.

1. **Ambiguity** — user stories or ACs that admit multiple reasonable implementations. Cite specific AC IDs.
2. **Untestable ACs** — "feels responsive," "easy to use." Cite specific AC IDs and propose testable replacements.
3. **Missing edge cases** — network offline, language switch mid-flow, accessibility settings active (Reduce-Motion, Reduce-Haptics, Reduce-Audio, Dynamic Type, screen reader, high contrast), permission denials, session expiry, system back-gesture during flow. List edge cases the spec does NOT cover.
4. **Sacred Rule compliance evidence** — for each Sacred Rule (SR-1 through SR-4) that applies to this feature, find the spec section that demonstrates compliance. If a Sacred Rule is in the brief's `## Sacred Rules in play` but no compliance evidence exists in requirements/design/tasks, that's a Block.
5. **Anti-slop in design.md** — verify the 12-row anti-slop check table is filled in honestly (not rubber-stamped). Flag any row marked "No" that you think is "Yes." Flag any "Yes" that lacks justification.
6. **App Store / Play Store guideline coverage** (mobile features only) — if this is a mobile feature, which guidelines apply (1.4.1, 4.8, 5.1.1, 5.1.1.v, 4.0)? Are they addressed in the spec? Flag gaps.

Return a structured Markdown report with these sections:
- ## Findings (Block tier)
- ## Findings (Warning tier)
- ## Sacred Rule audit table (rule | compliance evidence found in spec | verdict)
- ## App Store / Play Store coverage (mobile only)

Use Block for: missing Sacred Rule compliance evidence, untestable AC marked as testable, edge case impossible to ignore (e.g., crisis flow without offline behavior), anti-slop pattern present in design without justification.

Use Warning for: tight estimates (<15min or >45min), missing some i18n languages, edge cases that are nice-to-have but not blocking, open design decisions remaining.

Be specific with locations: cite "AC-3.2 in requirements.md" not "the AC has a problem."
```

Receive the subagent's report. Do NOT dump its raw output into main context — keep its structured findings to combine with mechanical findings.

### Step 1r.C — Combine findings into verdict

Apply the deterministic decision logic:

**Block (any one of these triggers):**
- File-isolation intersection > 0 (from A.2)
- Sequential-only file marked parallel (from A.3)
- Status-line inconsistency (from A.4)
- Sacred Rule with no compliance evidence (from B)
- Untestable AC marked testable (from B)
- Anti-slop pattern present without justification (from B)
- Disk-vs-INDEX inconsistency (from Step 0)

**Pass-with-notes (no Block triggers, but at least one Warning):**
- Estimation outliers
- Missing i18n languages
- Open design decisions remaining
- Edge cases nice-to-have but not blocking

**Pass:** No Block triggers AND no Warning conditions, OR all Warnings explicitly accepted by spec author with rationale in design.md or tasks.md.

## Step 1d — Deferral validation (when status is `*-deferred`)

Different audit dimensions. The spec is correctly waiting for a blocker; the question is whether the deferral itself is well-formed.

### D.1 — Identify the deferred artifact

Based on INDEX status:
- `discovery-deferred` → audit `brief.md`
- `requirements-deferred` → audit `requirements.md` (and verify `brief.md` is `discovery-complete`)
- `design-deferred` → audit `design.md` (and verify prior artifacts complete)
- `tasks-deferred` → audit `tasks.md` (and verify prior artifacts complete)

### D.2 — Audit the deferral structure

For the deferred artifact, verify all of these are present and well-formed:

| Element | Required? | Block if missing |
|---|---|---|
| Status line names blocker (e.g., "Discovery deferred — pending Phase 4.B mobile IA decision") | Yes | Block |
| `## Deferred status` block exists | Yes | Block |
| `## Deferred status` names: blocking dependency, workspace.json reference, resolves-at, resolver, what-can-proceed-now | Yes (all 5) | Block |
| Open questions tagged with blocker + resolver per question | Yes | Warning if absent; Block if open questions exist but aren't tagged |
| Affected sections marked DEFERRED (not silently omitted, not silently filled-in with assumptions) | Yes | Block if assumptions invented |
| Final section is `## Do NOT run /<next-skill>` (not `## Next step`) | Yes | Block if `## Next step` points forward |

### D.3 — Sacred Rule check on deferred specs

A deferred brief still declares Sacred Rules in play. Audit the same way as a complete brief:
- For each Sacred Rule listed: is the rule applicable to the feature as described?
- If declared but the feature obviously has the rule's surface (e.g., crisis flow involved but SR-2 not declared), Block.

### D.4 — Verdict

- **Pass — deferral well-formed at <phase> phase.** All elements above present and correct. Re-run /spec-review when blocker resolves and the spec lifts.
- **Block — deferral malformed.** List which elements are missing; user must fix the spec file (not via review skill — direct edit) and re-run.

## Step 2 — Write `_review.md`

Path: `.specs/<feature-slug>/_review.md`. Three template variants based on Step 1 outcome.

### Step 2a — Regular review (Step 1r path)

```markdown
# Review: <Feature Name>

**Spec ID:** <feature-slug>
**Reviewed:** <ISO date>
**Mode:** Regular
**Verdict:** <Pass | Pass with notes | Block — must fix before /spec-implement>

## Summary

<1-2 paragraphs. Top-line verdict and biggest concerns. If Block, lead with what's blocking.>

## Mechanical findings (parent skill)

### File-isolation intersection check

- Parallel-eligible tasks: <count>
- Sequential-only tasks: <count>
- Intersections found: <count> (>0 = Block)

If intersections found:

**B-mech-N: File-isolation overlap between T-XXX and T-YYY**
- Overlap files: `<list>`
- Tasks both marked Parallelizable=true
- Fix: <merge tasks | mark one sequential | split file ownership>

### Sequential-only file enforcement

- Violations: <count>

If violations:

**B-mech-N: T-XXX marked parallel but touches sequential-only file `<path>`**
- Fix: mark T-XXX Parallelizable=false. (This is a /spec-tasks bug; report.)

### Status-line consistency

- Mismatches: <count>

If mismatches:

**B-mech-N: Artifact status doesn't match INDEX.md**
- Artifact says: <status>
- INDEX says: <status>
- Fix: align them; one is wrong.

## Qualitative findings (audit subagent)

[Insert subagent's structured report verbatim, with Block/Warning sections and Sacred Rule audit table.]

## Sacred Rule audit (combined)

| Sacred Rule | Compliance evidence in spec | Verdict |
|---|---|---|
| SR-1 (Navigator confidence cap) | <evidence path> | <✓ / ✗> |
| SR-2 (Crisis bypass detector) | <evidence path> | <✓ / ✗> |
| SR-3 (No diagnostic language) | <evidence path> | <✓ / ✗> |
| SR-4 (Symptom data on device) | <evidence path> | <✓ / ✗> |

## Decision

<One of:>

- [x] **Pass** — Implementation can begin. Spin up worktrees per tasks.md parallelization plan; run /spec-implement <feature-slug> <task-id> in each.
- [x] **Pass with notes** — Implementation can begin; warnings should be addressed before merge. Specifically: <list warnings>.
- [x] **Block** — Fix blockers and re-run /spec-review before any /spec-implement. Specifically: <list blockers with locations>.

## Next step

<If Pass:> Spin up worktrees per tasks.md parallelization plan.
<If Pass-with-notes:> Same as Pass; address warnings before merge.
<If Block:> Address blockers in the relevant spec files and re-run /spec-review.
```

### Step 2b — Deferral validation (Step 1d path)

```markdown
# Review: <Feature Name>

**Spec ID:** <feature-slug>
**Reviewed:** <ISO date>
**Mode:** Deferral validation
**Verdict:** <Pass — deferral well-formed at <phase> | Block — deferral malformed>

## Summary

This spec is in a `<status>` state. The review confirms whether the deferral itself is well-formed — not whether the spec is complete.

<If Pass:> The spec is correctly waiting for <blocker>. Re-run /spec-review when blocker resolves.
<If Block:> The deferral structure has <issues>. Fix the deferred artifact and re-run.

## Deferral structure audit

| Element | Present? | Notes |
|---|---|---|
| Status line names blocker | <✓ / ✗> | <details> |
| `## Deferred status` block exists | <✓ / ✗> | <details> |
| Block names dependency, workspace.json ref, resolves-at, resolver, what-can-proceed-now | <count present / 5> | <missing elements> |
| Open questions tagged with blocker + resolver | <✓ / ✗> | <details> |
| Affected sections marked DEFERRED (not silently filled) | <✓ / ✗> | <details> |
| Ends with `## Do NOT run /<next-skill>` | <✓ / ✗> | <details> |

## Sacred Rule audit (deferred-spec)

[Same table format as regular review. Sacred Rule declarations should match feature surface.]

## Decision

<If Pass:> Pass — deferral well-formed at <phase> phase. This spec is correctly waiting for <blocker>. Re-run /spec-review when blocker resolves.

<If Block:> Block — deferral malformed. Fix the issues above in the spec file and re-run /spec-review.

## Next step

<If Pass:> Wait for <blocker> to resolve. The next /spec-review run after lift will use Regular mode.
<If Block:> Edit `<artifact path>` to address the missing/malformed elements; re-run /spec-review.
```

### Step 2c — Step 0 refusal (no `_review.md` written)

If Step 0 refused (status is `discovery-complete`, `requirements-complete`, `design-complete`, etc., where the spec needs more phases before review can happen), the skill does NOT write `_review.md`. The refusal is in chat output only.

## Step 3 — Update `.specs/INDEX.md` (regular review only)

For Step 1r (regular review):
- Pass or Pass-with-notes → mutate row Status to `review-pass`. Update `Last updated`.
- Block → mutate Status to `review-block`. Update `Last updated`.

For Step 1d (deferral validation): **INDEX is NOT mutated.** A deferred spec stays at its current `*-deferred` status; the `_review.md` artifact is sufficient evidence. (Mutating to `*-deferred-reviewed` would imply a state change that doesn't actually apply — re-running /spec-requirements still refuses, etc.)

## Step 4 — Tell the user the verdict, suggest the next step, stop

Print a short verdict summary inline (so the user sees it without opening `_review.md`):
- The path to the review file
- One-paragraph summary of findings (counts of Block, Warning, Sacred Rule status)
- The verdict
- The recommended next action

If Pass: suggest the parallelization plan from tasks.md.
If Block: name the top 1-3 blockers with locations.
If Pass — deferral well-formed: name the blocker and resolver.

Then **stop**. Do not invoke other skills. Do not modify spec files.

## Hard rules

- **Cannot modify spec files.** Read + report only. Findings live in `_review.md`. The user (or a re-run after edits) updates the originals.
- **Mechanical intersection runs in parent.** Do not delegate file-isolation or sequential-only checks to the subagent. Trust requirement.
- **Subagent does qualitative only.** Its prompt explicitly excludes the mechanical dimensions.
- **Be specific with locations.** "AC-3.2 in requirements.md uses subjective term 'fast'" — not "there's a problem with the AC."
- **Block aggressively on Sacred Rules and file-isolation.** Both are non-negotiable. A spec that ships with either failure becomes implementation drift or merge conflict.
- **Deferred specs are validated as deferred.** A `discovery-deferred` brief that's well-formed = Pass. Do not Block a deferred spec for being incomplete.
- **Do not skip Step 0.** The mode determination is the load-bearing safety property.

## Anchor example: smoke test on `_smoke_test`

For Phase 4 turn 6 smoke test:

**User invocation:** `/spec-review _smoke_test`

**Skill takes Step 0 path:**
- Reads INDEX.md, sees `_smoke_test | Daily Check-In (smoke) | discovery-deferred | ...`
- Mode: Deferral validation
- Reads `.specs/_smoke_test/brief.md`
- Audits the deferral structure per Step 1d:
  - Status line: ✓ ("Discovery deferred — pending Phase 4.B mobile IA decision")
  - `## Deferred status` block: ✓ (all 5 elements: blocking dependency, workspace.json reference, resolves-at, resolver, what-can-proceed-now)
  - Open questions tagged with blocker + resolver: ✓ (5 questions, all tagged)
  - Affected sections marked DEFERRED: ✓ (Mobile IA + Sensorial commitment)
  - Ends with `## Do NOT run /spec-requirements`: ✓
- Sacred Rule audit on declared rules: SR-3 + SR-4 declared in `## Sacred Rules in play`, both apply to feature, both will become ACs in eventual requirements
- Verdict: Pass — deferral well-formed at discovery phase
- Writes `.specs/_smoke_test/_review.md` (variant 2b)
- INDEX.md NOT mutated (still `discovery-deferred`)
- Tells user: "Pass — deferral well-formed. This spec is correctly waiting for Phase 4.B mobile IA decision. Re-run /spec-review _smoke_test when blocker resolves."
- Stops.

**Pass criterion:**
- `_review.md` written with verdict `Pass — deferral well-formed at discovery phase`
- INDEX.md SHA byte-identical (no mutation per "deferred-validated stays at *-deferred")
- brief.md SHA byte-identical (no modification)
- Refusal scenarios from Step 0 weren't triggered (the spec is validly deferred)

The deeper tests — mechanical file-isolation intersection on real complete specs, sequential-only enforcement on real tasks.md, qualitative subagent audit on real complete specs — require complete prior phases. Phase 11 first feature exercises them. For Phase 4 turn 6, deferral-validation mode is sufficient to confirm the architecture works.
