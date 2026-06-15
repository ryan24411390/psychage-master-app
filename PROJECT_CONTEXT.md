# Psychage Mobile — Project Context

> **Purpose:** Comprehensive context Claude Code reads when significant work needs grounding. Not loaded every session (that's CLAUDE.md's job). Loaded when: starting a new feature, making a strategic call, onboarding a new contributor, or when CLAUDE.md says "see PROJECT_CONTEXT.md."
>
> **Last updated:** 2026-05-03
> **Last reviewed:** 2026-05-03 (rewritten in conversation that closed Phase 1.6)

---

## 1. Identity & mission

**Psychage** is a global mental health **education** platform — the foundational layer that gives users language and self-awareness about their mental health *before* they need therapy, *before* they're in crisis, *before* they know what kind of help they need.

- **Operating entity:** Psychage Inc. (Delaware Public Benefit Corporation, address Boca Raton FL)
- **President:** Dr. Lena Dobson (clinical reviewer for any user-facing content involving conditions, symptoms, or crisis)
- **Sole developer:** Ryan (Raiyan Abdullah). SyncWave is no longer involved as of May 2026.
- **Public good positioning:** core experience always free. Premium subscribes to extra features, never gates clinical safety or self-understanding. Provider monetization is a separate B2B product.

### Mission
Free, high-quality, culturally-sensitive, scientifically-backed, non-diagnostic mental health information made accessible globally. Five languages from launch (EN, PT, ES, SV, FR) with cultural sensitivity, not just translation.

### What Psychage does NOT do
Diagnose. Treat. Replace therapy. Function as a closed wellness garden. Use diagnostic language ("you have...", "diagnosis confirmed"). Sell user data. Run ads.

---

## 2. Verified state (as of 2026-05-03)

### Web app (live, separate codebase)

| Fact | Value |
|---|---|
| Repo | `/Users/raiyanabdullah/Desktop/psychage-v2/` |
| Production | psychage.com + admin.psychage.com (Vercel) |
| Framework | React 18.3.1 + Vite 5.4.21 (SPA, NOT Next.js — earlier `src/app/api/` reference was a typo) |
| Languages | TypeScript 5.5.3, EN/PT/ES/SV/FR (i18next) |
| Articles | 428 files at `src/data/articles/` across 15+ category folders. PROGRESS.md + .bak files indicate active migration. |
| Supabase migrations | 250 |
| Components | 401+ React components, 39 UI primitives |
| Providers | 423K seeded from NPPES NPI registry |
| Custom hooks | 20+ |
| Public routes | 60+ |
| Admin routes | 40+ |

### Mobile app (this repo)

> The 2026-05-03 snapshot below is superseded on scaffold/remote status — the monorepo is live (`apps/mobile` + `packages/shared`) and `main` has a private GitHub remote with branch protection (Phase 2 done).

| Fact | Value |
|---|---|
| Repo | `/Users/raiyanabdullah/Documents/psychage-master-app/` |
| Git | Initialized 2026-05-03, branch `main`, private GitHub remote with branch protection (Phase 2) |
| Mobile app | `apps/mobile/` — Expo SDK 54, scaffolded and live (Phase 6 complete). |
| `.claude/` | Project-shared `settings.json` will be added when needed; CLAUDE.md at root |
| `.gitignore` | Yes, 162 lines |
| Other tracked | CLAUDE.md, this file, PRODUCT_BRIEF.md, V1_FEATURE_SCOPE.md (when committed in Phase 2) |

### Foundation state

Foundation phases 0–8 and 10 complete and on `main`; Phase 9 (observability) partial; Phase 11 (Daily Check-In) active, gated by the SR-4 ADR cooling-off (until 2026-06-20). Universal Claude Code rules at user level. Project rules at root CLAUDE.md. Backups in `~/claude-config-backups/`. See §4 below for full foundation roadmap.

---

## 3. Web ↔ mobile relationship

**The decided relationship:** Web is the *textbook*. Mobile is the *practice journal*.

- **Web:** comprehensive reference. Full article library browsing, full provider directory search, all interactive tools (long-form sit-down ones), admin panel, content creation, deep article reading.
- **Mobile:** comprehensive practice. Daily ritual, acute moments, in-the-pocket access, native check-in, native Navigator, "this is my therapist" linking, native crisis surface. Plus access to web's heavier tools via WebView (so mobile users have the full surface area, but native effort is concentrated on what mobile uniquely does).

**Shared backend:** same Supabase database. Same Sacred Rules. Same content. Different application of that content to different moments.

**Eventual structure** (planned monorepo, NOT done yet):

```
psychage-master-app/
  apps/
    mobile/
  packages/
    shared/        Navigator scoring + sensitivity filter + PEAF validators (lifted from web)
    api/           Supabase client + RPC wrappers
    i18n/          5-language translations
    ui-tokens/     Design tokens (teal #1A9B8C, type, spacing)
  supabase/
    migrations/
```

Migration complete: `apps/mobile/` (Expo SDK 54) and `packages/shared/` are live; web remains its own repo. Lift plan in §6.

---

## 4. Foundation roadmap (the 11-phase plan we are executing)

| # | Phase | Status | Output |
|---|---|---|---|
| 0 | Workspace audit | ✅ Done | Confirmed paths, fixed home-dir rogue git, Node 22 LTS, GitKraken metadata noted |
| 1 | Apply foundation files | ✅ Done | `~/.claude/CLAUDE.md` (universal), `~/.claude/settings.json`, `psychage-master-app/CLAUDE.md` (project), `.gitignore`. Phase 1.6 (this doc + brief + scope) closes Phase 1. |
| 2 | Repo foundation | ✅ Done (commit b89ae51, 2026-05-03) | First commit, GitHub remote (private), branch protection on `main` |
| 3 | Close decision blockers | ✅ Done (commit 9c362d7, 2026-05-05) | `rules/auth.md`, `rules/offline.md`, `ARCHITECTURE.md` (see §5) |
| 4 | Spec-driven workflow | ✅ Done (commit ef6db24, 2026-05-08) | Six `.claude/skills/spec-*/SKILL.md` + `constitution.md` + 4 SR PreToolUse hooks + Stop/SessionStart hooks + `HOOKS_SMOKE_TEST_FIXTURES.md` + `docs/AUDIT_RESPONSE_FINAL.md` |
| 5 | Worktree infrastructure | ✅ Done (on main) | `scripts/worktree-{create,list,remove}.sh`, file-isolation rules in `/spec-tasks` |
| 6 | Expo scaffold | ✅ Done (on main) | `apps/mobile` (Expo SDK 54), NativeWind 4, `@/` alias, folder structure |
| 7 | Quality gates | ✅ Done (on main) | `biome.jsonc`, Husky + lint-staged, pre-commit (typecheck + lint + test) |
| 8 | CI/CD | ✅ Done (on main) | GitHub Actions (`.github/workflows/pr-checks.yml`, `eas-build.yml`), `CODEOWNERS` |
| 9 | Observability | ⏭ Partial | Sentry RN with PII-stripping `beforeSend` NOT yet wired; analytics wrapper gated on the PostHog-vs-Amplitude decision (§10) |
| 10 | Test harness | ✅ Done (on main) | Vitest + RNTL + Jest + Maestro; example tests per layer (218 Vitest + Jest component suites green) |
| 11 | First feature shipped | 🔄 Active — blocked | Daily Check-In on `feat/phase-11-daily-checkin`; blocked by SR-4 ADR cooling-off (`docs/adr/001-sr4-checkin-persistence.md`, active until 2026-06-20) |

Foundation phases 0–8 and 10 are complete and on `main`. Phase 9 (observability) is partially pending — Sentry RN is not yet wired and the analytics wrapper is gated on the PostHog-vs-Amplitude decision (§10). Phase 11 (Daily Check-In) is the active feature, currently gated by the SR-4 ADR cooling-off (expires 2026-06-20). After 11, V1 build (sprint 1-8 in V1_FEATURE_SCOPE) begins in earnest.

---

## 5. Open decisions blocking implementation

These eight decisions block specific feature scopes. Some have recommended defaults; some need user research the brief doesn't have. Status as of 2026-05-03:

| # | Decision | Status | Default if asked to ship blind | Resolves when |
|---|---|---|---|---|
| 1 | Auth model: standalone vs companion-of-web account | OPEN | **Standalone with optional web-account link.** Anonymous-first, account when needed for persistence. | `rules/auth.md` written |
| 2 | Offline strategy: full local-first with sync vs online-with-cache | OPEN | **Online-with-aggressive-cache for V1.** Crisis resources + Navigator data cached. Daily check-ins queue locally if offline. Full local-first is V2. | `rules/offline.md` written |
| 3 | Push notifications V1 yes/no | RECOMMEND YES | YES — needed for daily check-in reminders, the spine. Expo Notifications. User opts in during onboarding. | Confirmed before Sprint 1 |
| 4 | Background tasks V1 yes/no | RECOMMEND DEFER | NO — not needed for V1 features. Defer to V2. | Confirmed before Sprint 6 |
| 5 | Analytics: PostHog vs Amplitude | OPEN | **PostHog** — open-source, self-hostable, mental-health-app-friendly pricing, EU data residency option. | Picked before Sprint 1 |
| 6 | Sign in with Apple V1 yes/no | RECOMMEND YES | YES — App Store submission essentially requires it. Easy with Supabase Auth. | Sprint 4 |
| 7 | Sign in with Google V1 yes/no | RECOMMEND YES | YES — Sofia persona globally relies on Google. | Sprint 4 |
| 8 | Cross-app sync architecture | OPEN | **Read-only cross-app for V1.** Mobile reads web's articles via shared Supabase. No two-way sync of journal/check-in data until V2. | `ARCHITECTURE.md` written |

CLAUDE.md §5 lists which scopes are *blocked* by missing rule files. When a rule file exists, that scope unblocks.

### 5.1 Resolved scope decisions

- **Med Tracker (S31): WebView-first for V1 — CLOSED.** No native port in V1. Rationale (`V1_FEATURE_SCOPE.md`): the tool is a log + adherence-trend view; daily logging usually happens in third-party apps (Apple Health, etc.), so the WebView reduced-template is sufficient. The current route `apps/mobile/app/tools/med-tracker.tsx → WebViewSurface('med-tracker')` is correct. **Native-rebuild trigger:** >30% premium weekly engagement (V2 / demand-driven). When that fires, the native archetype mirrors Relationship Health (feature dir + store + types + view components + Compass tile + migrator + tests), ~70% reusable from `psychage-v2 src/components/tools/MedicationTracker` (log-only, no multi-dimensional scoring). No code change needed now.

---

## 6. Lift plan: web → shared package

Three pure modules from web get lifted into `packages/shared/` and consumed by both web and mobile. Per the user's decision (extracting eliminates drift across two codebases).

### What gets lifted

| Module | From (psychage-v2) | Why |
|---|---|---|
| Navigator scoring engine | `src/lib/navigator/{scoring.ts, engine.ts, utils.ts, safety.ts}` | 8-step algorithm, geometric mean, coverage factor, count cap, threshold gating. Pure functions. |
| Sensitivity filter | `src/lib/article-framework/{constants.ts:217, quality-gate.ts:268}` → `packages/shared/sensitivity/{terms.ts, filter.ts}` | 30-term person-first language scanner. Psychage-v2 source files remain in place until that app migrates to consume the shared package. |
| PEAF validators | `src/lib/article-framework/{quality-gate.ts, readability.ts, constants.ts, types.ts}` | 11 quality checks, source tier validation, FK readability |

### Lift method

**Decided:** git submodule for V1, monorepo workspace package after monorepo migration. Reasons: no registry account needed, both consumers explicitly bump version (no surprise breakage), plays fine with later monorepo (submodule becomes workspace package).

### Lift sequence (Phase 5 of foundation roadmap)

1. Create `psychage-shared` repo (private GitHub)
2. Copy modules from psychage-v2 → psychage-shared. Strip Vite-specific imports if any.
3. Add unit tests (port from psychage-v2 if they exist; write fresh otherwise)
4. Publish v0.1.0 with SHA pin
5. Add as git submodule in psychage-master-app: `git submodule add ... psychage-shared`
6. Add as git submodule in psychage-v2 (replacing the inline copies)
7. Both consumers import from `psychage-shared`
8. Verify both apps build and tests pass

### Estimated time

90 minutes assuming pure functions (which the survey confirmed they are). Add 30-60 min if any cross-cutting refactors needed.

---

## 7. File inventory (current + planned)

### Web (psychage-v2) — what's where

```
src/lib/
├── navigator/         scoring engine (lifts to shared package)
├── safety/            sensitivity filter (lifts to shared package)
├── article-framework/ PEAF validators (lifts to shared package)
src/components/
├── navigator/         UI for Navigator (web-specific)
├── symptom-checker/   UI variants (web-specific)
src/data/articles/     428 article files across 15+ category folders
src/services/          28 modules
supabase/migrations/   250 SQL files
```

Notable cruft to clean up later (NOT V1 work): `src/lib/highlightText 2.ts`, `src/lib/auth 2/` — Finder duplicates with spaces in names, will cause import bugs if not removed.

### Mobile (psychage-master-app) — current

```
psychage-master-app/
├── .claude/            tooling config (skills, hooks, settings)
├── apps/
│   └── mobile/         Expo SDK 54 app — scaffolded and live
├── packages/
│   └── shared/         Navigator/sensitivity/PEAF (lifted from web)
├── tokens/             design tokens (web + mobile)
├── docs/ rules/ .specs/   architecture docs, path-scoped rules, feature specs
├── pnpm-workspace.yaml workspace manifest (apps/*, packages/*)
├── CLAUDE.md           project-specific rules
├── PROJECT_CONTEXT.md  this file
├── PRODUCT_BRIEF.md    product vision
└── V1_FEATURE_SCOPE.md V1 features and prioritization
```

### Mobile — planned (after Phase 6 Expo scaffold + Phase 5 monorepo migration)

```
psychage-master-app/
├── .claude/
├── .github/workflows/
├── apps/
│   └── mobile/                Expo + React Native + NativeWind
│       ├── src/
│       │   ├── app/           Expo Router routes
│       │   ├── features/      Daily check-in, Navigator, etc.
│       │   ├── lib/           Mobile-specific utilities
│       │   └── components/    Mobile-specific components
│       ├── app.json
│       ├── eas.json
│       └── package.json
├── packages/
│   ├── shared/                git submodule — Navigator/sensitivity/PEAF
│   ├── api/                   Supabase client wrappers
│   ├── i18n/                  EN/PT/ES/SV/FR translations
│   └── ui-tokens/             Design tokens
├── supabase/                  shared with web (or symlink)
├── package.json               workspace root
├── pnpm-workspace.yaml         pnpm workspaces (apps/*, packages/*) — no Turborepo
├── CLAUDE.md
├── PROJECT_CONTEXT.md
├── PRODUCT_BRIEF.md
└── V1_FEATURE_SCOPE.md
```

---

## 8. Audit findings & resolutions

Tracked here so they don't recur. Each was discovered during foundation work.

| # | Finding | Date | Resolution |
|---|---|---|---|
| 1 | Rogue `~/.git` from old WorldUp work captured every git command run anywhere under home | 2026-05-03 | Archived to `~/claude-config-backups/home-git-archive-...` |
| 2 | Project `.claude/CLAUDE.md` and `.claude/settings.json` were drafted as global but lived at project level | 2026-05-03 | Promoted to user level (`~/.claude/`); project files rewritten as project-specific only |
| 3 | `autoMemoryEnabled` setting silently ignored when set at project level | Verified 2026-05-03 | Moved to user-level settings.json where it works |
| 4 | `.cursor/` directory contained 1.2M of vendored skill mirrors (personal IDE config) | 2026-05-03 | Added to `.gitignore` |
| 5 | GitKraken creates `gk/` directory in every git init via global template | Discovered 2026-05-03 | Added to `.gitignore`, noted as ongoing harmless artifact |
| 6 | Caveman + strategic-compact PreToolUse hook may compact context mid-session, evaporating loaded `PROJECT_CONTEXT.md` | Flagged 2026-05-03 | NOT YET RESOLVED — research showed `PostCompact` event isn't in Anthropic docs (only `PreCompact`). Workaround: SessionStart hook re-loads context on session resume. Revisit if context-evaporation actually happens during work. |
| 7 | 20 rogue git repos discovered under `~/`, several with "psychage" in the name. Confusion risk for `cd` typos. | 2026-05-03 | Audit-only finding. NOT cleaned up — separate project, hours of work. Add to `learnings.md` for later. |
| 8 | PRD says "Mobile app: companion later stage after investors and their needs" but Ryan is building it pre-funding | 2026-05-03 | Strategic shift acknowledged: mobile is now a daily-spine product targeting industry-standard positioning over years. Documented in PRODUCT_BRIEF.md. |

---

## 9. Audience research (foundation for product decisions)

From the project files (Audience Segments, Personas, Market Research, Trend Analysis):

### Five segments
1. **Information Seeker** — general public, mild-moderate concerns, overwhelmed by conflicting online info
2. **Support Connector** — looking for professional help, needs reliable directory
3. **Concerned Supporter** — family/friend of someone struggling
4. **Lifelong Learner** — proactive wellness orientation
5. **Healthcare Professional / Researcher** — clinicians, students, researchers

### Three detailed personas
1. **Aisha** — 26, anxious early-career professional, urban, university-educated, tech-savvy. Struggles with work stress, panic attacks, sleep, stigma/cost of therapy. Mobile-native.
2. **Carlos** — 48, concerned parent of a teenager, suburban, small business owner. Worried about son's withdrawal/mood/grades. Wants parent-focused resources. Web-leaning.
3. **Sofia** — 21, international university student abroad (e.g., Brazilian in Sweden), Portuguese-speaker, student budget. Cultural adjustment, loneliness, wants Portuguese-language resources. Mobile-native.

### Mobile primary personas (decided 2026-05-03)
**Aisha and Sofia, equally weighted.** Carlos and the other segments are better served by web. Mobile design and feature priorities are checked against Aisha+Sofia, not the wider audience.

### Market reality
- Mental Health Apps: 14.6% CAGR 2025-2030
- Digital Mental Health: 16-18% CAGR through 2030
- $30/month mental health subscription is at the high end (BetterHelp territory but BetterHelp is *therapy*, $260-400/mo) — Calm/Headspace are $70/year, Sanvello is $9/mo. **Free + foundation-funded + low-priced premium ($5-9/mo) is the right model for Psychage's positioning.**

---

## 10. Brand voice and visual

- **Mission tone:** evidence-based, scientifically accurate, human, warm, person-first, never clinical, never sensational
- **Visual:** hub-and-satellite metaphor (central dashboard with connected pillars). Primary teal `#1A9B8C`. Inter (sans body) + Plus Jakarta Sans (display headings). Dark mode with full parity, class-based.
- **Motion:** respect `prefers-reduced-motion`. Reanimated 4 with `useReducedMotion()` hook everywhere.
- **Copy review:** Dr. Lena Dobson reviews any user-facing surface that mentions conditions, symptoms, or crisis. Required reviewer.
- **Forbidden language:** "you have", "you are", "diagnosis confirmed", "you should", any clinical pathologizing of normal human experience. See CLAUDE.md §4 for the full sensitivity rules.

---

## 11. Working principles

1. **Foolproof comes from defining the right rules upfront, not all possible rules.** Rules earn their lines forever; bad rules cost more to maintain than they save.
2. **Don't write rules until they're needed.** Add rules when a problem actually arises, not preemptively.
3. **One file at a time.** Foundation work is incremental. Each file gets reviewed before the next is touched.
4. **Verify before declaring done.** Run the test, run the typecheck, run the build. Yourself.
5. **Push back when warranted.** When the user is wrong, say so. Politely, with reasoning. Don't just execute requests that won't work.
6. **Surgical changes.** Only what was asked. No "while I'm here, let me also..."
7. **Plan mode is the default.** Propose, wait for approval, implement.
8. **Honest about time.** "This will take 4-6 months" is more useful than "I'll have it next week."

---

## 12. Where things live (the routing index)

When you can't find something here, check these:

- **What we're building (product vision)** → `PRODUCT_BRIEF.md`
- **What V1 ships, native vs WebView, build sequence** → `V1_FEATURE_SCOPE.md`
- **Sacred rules and tech stack** → `CLAUDE.md` (root)
- **Universal coding behaviors** → `~/.claude/CLAUDE.md`
- **Auto-memory** (Claude Code's accumulated session memory) → `~/.claude/projects/<project>/memory/MEMORY.md`
- **Domain logic** (Navigator scoring, PEAF validators, sensitivity filter) → `psychage-v2/src/lib/{navigator,safety,article-framework}/` until lift, then `packages/shared/`
- **Path-scoped rules** (when they exist) → `rules/<topic>.md`
- **Spec-driven workflow phase docs** → `.claude/skills/spec-*/SKILL.md` (after Phase 4 deploy)
- **Compound learnings** → `learnings.md` (when accumulated)
- **Auth model decision** → `rules/auth.md` (when written — currently OPEN)
- **Offline strategy** → `rules/offline.md` (when written — currently OPEN)
- **Cross-app architecture** → `ARCHITECTURE.md` (when written — currently OPEN)

When in doubt, ask. Don't invent.
