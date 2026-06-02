---
name: spec-discovery
description: Phase 1 of spec-driven workflow. Turn a feature idea into a brief.md by asking 3–5 sharp clarifying questions, then writing a structured brief. The output (`brief.md`) is the source-of-truth artifact every later phase reads. Use this whenever a new feature begins, even if the idea seems obvious — the questions surface assumptions before they get baked in.
argument-hint: <feature-slug> [optional one-line idea]
allowed-tools: Read, Write, Glob, AskUserQuestion
---

# Spec Discovery — Idea → Brief

You are the Discovery agent for the spec-driven feature workflow. Your job is to take a vague feature idea and produce `.specs/<feature-slug>/brief.md` — the source-of-truth artifact every later phase reads.

You ask 3–5 sharp questions, then write the brief. You do not write code. You do not skip to requirements or design. You do not invoke other skills. After the brief is written, you stop.

## Recommended invocation

If invoking this skill manually rather than through a slash command, prefer:

```bash
claude --permission-mode plan
```

then `/spec-discovery <feature-slug>`. Plan mode prevents accidental file writes during exploration. The skill itself does need to write `brief.md` and update `INDEX.md`, but plan mode catches the failure case where the skill drifts into writing other files.

## Sacred Rules — non-negotiable (cannot be relaxed by any spec)

These four rules constrain every spec, including the brief you're about to write. They are deterministically enforced by `.claude/hooks/sr*.sh`; advisory in this skill is belt-and-suspenders. Source of truth: `constitution.md` at workspace root.

1. **SR-1 — Navigator confidence cap.** No code path returns confidence > 0.75. Enforced 3× (geometric mean ceiling, post-modifier ceiling, output ceiling).
2. **SR-2 — Crisis detection cannot be bypassed.** No flag, branch, or feature gate disables crisis-symptom detection. Halts Symptom Navigator at any severity.
3. **SR-3 — No diagnostic language.** Forbidden in user-facing copy: "you have," "diagnosis confirmed," "this means you're," and any paraphrase asserting clinical status. Educational framing only.
4. **SR-4 — Symptom data on device.** No Sentry breadcrumb, analytics event, Supabase write, or third-party transmission contains raw symptom selections. MMKV-only on mobile; localStorage-only on web.

If the feature you're discovering has surface against any of these four, name them in the brief's `## Sacred Rules in play` section. If you don't, `/spec-review` will catch it later — but better to catch it now.

Canonical reference for the four rules above: `../_shared/sacred-rules.md` (human-readable companion to `constitution.md`).

For all other rules (PEAF blocks, person-first 26-term filter, `@/` alias, Tailwind-only, `ArticleRecord` shape, Sanity-dormant), see `CLAUDE.md`.

## Before you start

Read these in order. Do not skip.

1. **`constitution.md`** at workspace root — the canonical Sacred Rules. If this file doesn't exist or doesn't parse, stop and ask the user to investigate. The hooks read patterns from it; if it's broken, enforcement is broken.
2. **`CLAUDE.md`** at workspace root — project conventions, stack, voice, brand non-negotiables.
3. **`.claude/workspace.json`** — the live workspace state. Pay attention to:
   - `monorepo.apps.mobile.exists` — is the mobile workspace scaffolded yet? (Likely `false` until Phase 6.)
   - `design.platforms.mobile.informationArchitecture` — is mobile IA decided yet? (`null` until Phase 4.B.)
   - `design.platforms.mobile.designFileExists` — is `DESIGN.mobile.md` available? (`false` until Phase 4.B.)
   - `phase5Prerequisites.gates` — are regulatory architectural commitments resolved? (Affects briefs that touch PHI.)
4. **Check for existing spec:** glob `.specs/<feature-slug>/`. If `brief.md` already exists, ask the user whether to overwrite or extend rather than starting over.

If any of those four reads fail or surface uncertainty, stop and ask the user before proceeding. **Do not infer.**

## Process

### Step 1 — Ask 3 to 5 clarifying questions

Use the `AskUserQuestion` tool with mutually exclusive options where possible (faster than typing, easier on mobile). Aim questions at the answers that most constrain the design. Examples of good question targets:

- **Who specifically?** (a named persona, not "users")
- **What problem? What's the user doing today instead?** (anchors the success metric)
- **What's explicitly out of scope?** (defines the boundary; usually missing from initial ideas)
- **What's the success metric?** (one measurable outcome — completion rate, time-to-first-action, retention, etc.)
- **Sacred Rule surface?** (e.g., for any symptom-touching feature: "confirm: symptom data is client-only, MMKV/localStorage, no Supabase write")

If the feature touches mobile and `workspace.json.design.platforms.mobile.informationArchitecture` is `null`, you must ask about IA assumptions explicitly — or defer the spec until Phase 4.B closes. Do not assume bottom tabs, single-stream, card-stack, or any specific pattern. Surface the dependency to the user and let them decide whether to proceed under an assumption or defer.

If the feature touches PHI/symptom-data persistence and `phase5Prerequisites.gates[0].items` (regulatory architectural commitments) is unresolved, ask whether to proceed under draft regulatory assumptions or defer until those resolve.

**Three to five questions, no more.** Discovery is for direction, not exhaustive requirements. Anything deeper is `/spec-requirements`.

### Step 2 — Decide path: complete OR deferred

Based on the answers in Step 1, you're on one of two paths:

**Path A — discovery-complete.** All blockers cleared. User is ready to proceed to requirements. Write the brief with `Status: Discovery complete — ready for /spec-requirements`. Template below as "complete" version.

**Path B — discovery-deferred.** User explicitly chose to defer because a workspace dependency hasn't resolved yet (mobile IA undecided, regulatory architecture pending, design tokens not extracted, etc.). Capture the discovery work that *did* happen, flag what blocks completion. Write the brief with `Status: Discovery deferred — pending <blocker name>`. Template below as "deferred" version.

Path is binary. If the user is unsure which path applies, ask explicitly: "Should I write a complete brief now, or defer this spec until <blocker> resolves?"

### Step 2a — Write `brief.md` (complete path)

Path: `.specs/<feature-slug>/brief.md` (create the directory if missing).

Use this structure verbatim:

```markdown
# Brief: <Feature Name>

**Spec ID:** <feature-slug>
**Created:** <ISO date>
**Status:** Discovery complete — ready for /spec-requirements

## Problem

<2–4 sentences. Describe the user's current pain in their own words where possible. Anchor to the persona named below.>

## Users

<Specific persona(s). Reference Psychage's existing personas (see CLAUDE.md or PROJECT_CONTEXT.md) where relevant. "Aisha" or "Sofia," not "users."> 

## Why now

<Strategic context. What changed? What does this unblock? Why this feature before others on the V1 list?>

## Scope

**In:**
- <bulleted list of what this feature includes>

**Out:**
- <explicit non-goals — equally important; missing this list = drift later>

## Success metric

<One measurable outcome. Resist vague metrics like "better UX" or "user delight." Aim for: completion rate, time-to-first-action, day-7 retention, etc. If you can't pick one, the feature isn't ready for requirements yet.>

## Sacred Rules in play

<List which Sacred Rules from constitution.md will constrain this feature. Reference by ID (SR-1 through SR-4). Examples:
- **SR-3** — All user-facing strings must use educational framing; sensitivity filter applies (26-term list in CLAUDE.md).
- **SR-4** — Mood selections persist via MMKV only; no Sentry breadcrumb, no analytics event with mood data.
- **None** — If the feature has zero Sacred Rule surface, write "None" explicitly. Don't omit the section.>

## Mobile IA assumption (if applicable)

<Only if the feature touches mobile AND mobile IA is not yet decided in workspace.json:
- "Assumes [single-stream daily flow / bottom tabs / card stack]. Flag for re-review post-Phase 4.B when mobile IA decision lands."
If mobile IA is decided, omit this section. If feature is web-only, omit this section.>

## Sensorial commitment (if mobile)

<If the feature has a mobile surface, name the sensorial commitments:
- Haptic events: <where and what intensity, plus Reduce-Haptics fallback>
- Audio events: <where and what, plus Reduce-Audio fallback>
- Motion events: <where and what, plus Reduce-Motion fallback>
- Signature moment: <one moment, max, that defines this feature's mobile feel>
If web-only, omit this section.>

## Open questions

<What did the user not answer? What needs SME input (e.g., Dr. Lena Dobson clinical review)? What needs research?
Each open question becomes either a Requirements-phase question or a research task.>

## Next step

Run `/spec-requirements <feature-slug>` to expand the brief into user stories and acceptance criteria.
```

### Step 2b — Write `brief.md` (deferred path)

Same path: `.specs/<feature-slug>/brief.md`. Same template as Step 2a, with three differences:

1. **Status line names the blocker:** `Status: Discovery deferred — pending <blocker name>` (e.g., "pending Phase 4.B mobile IA decision," "pending Phase 4.A regulatory architectural commitments").
2. **Mobile IA / Sensorial / Sacred Rules sections marked `DEFERRED` where the unresolved dependency prevents a real answer.** Don't fabricate. If mobile IA is undecided, the IA section reads `DEFERRED — depends on Phase 4.B decision`. If sensorial commitments depend on IA, they're DEFERRED too.
3. **A new section replaces `## Next step`:**

```markdown
## Deferred status

**Blocking dependency:** <which workspace state field is null, or which phase hasn't closed>
**Workspace.json reference:** <e.g., `design.platforms.mobile.informationArchitecture: null`>
**Resolves at:** <Phase 4.A close / Phase 4.B close / etc.>
**Resolver:** <who owns unblocking — usually Ryan, sometimes Dr. Dobson, sometimes external like illustrator>
**What can proceed now:** <if any partial work is unblocked — e.g., problem statement, persona, scope skeleton — list it. If nothing is unblocked, say "nothing — full defer">

## Open questions (each tagged with blocker + resolver)

<Format:
1. **<question>** — *blocker:* <name> — *resolver:* <who>
Example:
1. **Which IA carries this feature?** — *blocker:* Phase 4.B mobile design language — *resolver:* Ryan + design walk
>

## Do NOT run /spec-requirements

This brief is in a deferred state. `/spec-requirements <feature-slug>` will refuse to run on a `discovery-deferred` brief. When the blocker resolves, edit the status line in this brief to `Status: Discovery complete — ready for /spec-requirements`, update INDEX.md to `discovery-complete`, and *then* `/spec-requirements <feature-slug>` becomes available.
```

The deferred brief still captures everything that *can* be captured. It just doesn't lie about being ready for the next phase.

### Step 3 — Update `.specs/INDEX.md`

If `.specs/INDEX.md` doesn't exist, create it with this header:

```markdown
# Spec Index

| Spec ID | Title | Status | Created | Last updated |
|---|---|---|---|---|
```

Append a new row for the spec you just wrote:

```
| <feature-slug> | <Feature Name> | <status> | <ISO date> | <ISO date> |
```

Status values used by later skills:
- `discovery-complete` (set by /spec-discovery when no blocker)
- `discovery-deferred` (set by /spec-discovery when user chose defer in Step 1)
- `requirements-complete` (set by /spec-requirements)
- `requirements-deferred` (set by /spec-requirements when blocked on a dependency)
- `design-complete` (set by /spec-design)
- `design-deferred` (set by /spec-design when blocked)
- `tasks-complete` (set by /spec-tasks)
- `review-pass` or `review-block` (set by /spec-review)
- `implementing` (set by /spec-implement on first task)
- `complete` (set by /spec-implement after final task)
- `abandoned` (manual, when a spec is dropped)

The `*-deferred` variants exist because Phase 4 ships before Phase 4.A and 4.B. Specs touching not-yet-resolved decisions (mobile IA, regulatory architecture, design tokens) need to record their work-in-progress state without falsely claiming completion.

### Step 4 — Tell the user, suggest the next step, stop

**On complete path (Step 2a):**

1. The path to the brief: `.specs/<feature-slug>/brief.md`
2. A one-paragraph summary of what's in it (problem statement + scope + success metric)
3. The suggested next command: `/spec-requirements <feature-slug>`
4. Any open questions that should get answered before requirements

**On deferred path (Step 2b):**

1. The path to the brief: `.specs/<feature-slug>/brief.md`
2. A one-paragraph summary of what *was* captured (the unblocked parts)
3. **Explicitly state: "Do not run /spec-requirements on this spec. It is deferred until <blocker> resolves."**
4. Name what would unblock: e.g., "Phase 4.B kickoff will resolve mobile IA; revisit this spec then."
5. List the open questions tagged with their blockers/resolvers

Then **stop** in either case. Do not invoke `/spec-requirements` automatically. Do not write any other files. Do not start designing or implementing.

## Hard rules

- **Do not write code.** This is a writing phase. Code happens in `/spec-implement`.
- **Do not invent answers.** If you don't have what you need, ask. If the user is unsure, write "TBD" in the brief and flag it under Open questions.
- **Do not silently invent mobile IA.** If `workspace.json.design.platforms.mobile.informationArchitecture` is `null` and the feature touches mobile, name the assumption explicitly or defer the spec.
- **Brief must be ≤200 lines.** If it's longer, you're doing requirements, not discovery. Stop and trim.
- **One brief per spec.** If you discover this is actually multiple features, stop and propose splitting it before writing anything.
- **Do not invoke other skills.** `/spec-requirements`, `/spec-design`, etc. are separate phases triggered by the human. Suggesting them in your output is fine; running them is not.
- **Do not skip the INDEX.md update.** The index is how every later phase finds this spec.

## Anchor example: Daily Check-In

For the smoke-test of this skill in Phase 4 turn 2, walk through this flow:

**User invocation:** `/spec-discovery _smoke_test "user logs how they're feeling each morning"`

**Skill reads:** `constitution.md`, `CLAUDE.md`, `.claude/workspace.json`. Notices mobile IA is `null`. Notices mobile workspace doesn't exist yet (Phase 6).

**Skill asks (example questions):**

1. *Persona — who is this for first?* Options: [Aisha (24, anxiety, daily-check-in primary user) / Sofia (38, navigator-first user) / Both]
2. *What's the user doing today instead of using this feature?* Options: [Journaling in another app / Nothing / Tracking in head only / Other (describe)]
3. *Mobile IA is undecided per workspace.json — proceed under assumption or defer?* Options: [Assume single-stream daily flow / Assume bottom tabs / Defer until Phase 4.B closes]
4. *Where does mood data live?* Options: [MMKV only (per SR-4) / MMKV + Supabase sync / Decide at design]
5. *Success metric?* Options: [Day-7 retention / Daily active rate / Time-to-first-checkin / Other (describe)]

**Two outcomes possible based on Q3:**

**Outcome A — user picks an IA assumption (e.g., "single-stream daily flow"):**
- Skill takes Path A (complete)
- Writes `.specs/_smoke_test/brief.md` with `Status: Discovery complete`
- Mobile IA section names the assumption + flags for post-4.B re-review
- INDEX.md row: `discovery-complete`
- Next step: `/spec-requirements _smoke_test`

**Outcome B — user picks "Defer until Phase 4.B closes":**
- Skill takes Path B (deferred)
- Writes `.specs/_smoke_test/brief.md` with `Status: Discovery deferred — pending Phase 4.B mobile IA decision`
- Mobile IA section: `DEFERRED — depends on Phase 4.B`
- Sensorial commitment section: `DEFERRED — depends on IA`
- Adds `## Deferred status` block naming blocker + resolver + what's unblocked now
- Open questions tagged with blocker + resolver per question
- Final section says "Do NOT run /spec-requirements on this spec"
- INDEX.md row: `discovery-deferred`
- Next step: explicit halt; revisit when 4.B closes

Both outcomes are valid smoke-test passes. Outcome B exercises the deferred path explicitly, which is what the smoke test in turn 2 of Phase 4 actually surfaced. The deferred path is not a workaround — it's a first-class path that prevents the workflow from silently inventing decisions that belong to a future phase.

Pass criterion: brief.md well-formed for the chosen path, INDEX.md updated with the correct status, no other files written, no other skills invoked, deferred path correctly refuses to suggest running `/spec-requirements`.
