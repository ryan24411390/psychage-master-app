# Psychage — Workspace CLAUDE.md

This is the project-level rulebook for the **Psychage master workspace**. Loaded in every Claude Code session opened anywhere under `/Users/raiyanabdullah/Documents/psychage-master-app/`.

Universal behavioral rules (think first, push back, surgical changes, verify before reporting, etc.) live at user level in `~/.claude/CLAUDE.md` — don't duplicate them here. This file is for **Psychage-specific** facts and invariants only.

> **Bias of this file:** safety > correctness > speed. For mental health software, "fast and almost right" is the failure mode to avoid.

---

## 1. What this repo is

**Psychage** is a global mental health **education** platform — the foundational "what is this thing I'm experiencing" layer **before** crisis intervention, **before** therapy, **before** the user knows what kind of help they need. **It does not diagnose. It does not treat. It is not therapy.** Frame everything as education.

- Operating entity: **Psychage** (Delaware Public Benefit Corporation)
- President: **Dr. Lena Dobson**
- Mobile development partner: **SyncWave** (CEO Abrar Fardin)
- This repo: the **mobile app workspace**. Will eventually become a monorepo containing mobile + shared packages. The **web app** (`psychage-v2`) lives in a separate repo at `/Users/raiyanabdullah/Desktop/psychage-v2/` and shares the same Supabase backend.

**Read first, every session:**
- `PROJECT_CONTEXT.md` — comprehensive context (decisions, history, open questions)
- `learnings.md` (when it exists) — accumulated lessons from corrections
- `rules/<topic>.md` (when they exist) — path-scoped rules

If `PROJECT_CONTEXT.md` is missing, **stop and ask** before significant work.

---

## 2. Current state vs planned state

**Today's layout** (pre-monorepo, mobile not yet scaffolded):

```
psychage-master-app/
  .claude/             tooling config
  .cursor/             Cursor IDE config
  CLAUDE.md            this file
  PROJECT_CONTEXT.md   comprehensive context
  psychage-mobile/     empty — Expo app to be scaffolded here
```

**Planned layout** (after monorepo migration — see PROJECT_CONTEXT.md §3):

```
psychage-master-app/
  apps/
    mobile/            (psychage-mobile moves here)
  packages/
    shared/            Navigator scoring + sensitivity filter + PEAF validators
                       (lifted from psychage-v2 web — see PROJECT_CONTEXT.md §6 lift plan)
    api/               Supabase client + RPC wrappers
    i18n/              EN/PT/ES/SV/FR translations
    ui-tokens/         Tailwind config, design tokens
  supabase/
    migrations/
```

The migration **has not happened yet.** When you reference paths, use today's layout, not planned. If the user asks for something that requires the planned layout (workspaces, shared packages), say so — don't fake it.

---

## 3. Stack (frozen — do not substitute without asking)

| Layer | Choice | Version |
|---|---|---|
| Runtime | Expo + React Native + React | SDK 54 / 0.81+ / 19 |
| Language | TypeScript strict (no `any`, no `@ts-ignore` without an explaining comment) | 5.7+ |
| Routing | Expo Router | v4 |
| Styling | NativeWind + Tailwind | 5 / v4 |
| Animation | Reanimated + Moti | 4 / latest |
| State | Zustand (UI/local) + TanStack Query (server) | 5 / 6 |
| Forms | react-hook-form + zod | latest |
| Lists | FlashList | v2 — required for any list >20 items |
| Backend client | @supabase/supabase-js | v3 |
| Persistence | MMKV (non-sensitive) + expo-secure-store (tokens/PII) | latest |
| Charts | Victory Native XL + Skia | latest |
| Maps | react-native-maps + super-cluster | latest |
| Icons | lucide-react-native | latest |
| i18n | i18next + expo-localization | latest |
| Errors | Sentry RN | with strict `beforeSend` PII filter |
| Build | EAS Build + EAS Update | latest |
| Testing | Vitest + RNTL + Maestro | latest |
| Package manager | Bun | 1.3+ |
| Monorepo | Turborepo + Bun workspaces | 2 / latest |
| Lint/format | Biome (replaces ESLint + Prettier) | latest |

No Redux, no Sanity, no Next.js, no styled-components, no Zustand for server state, no `useState` for server data.

---

## 4. Sacred Rules — never violate

Non-negotiable invariants. Every session honors all of these.

### Safety & content

1. **Navigator confidence cap: 0.75 absolute maximum.** Enforced in 3+ places. Never raise. Never bypass. Never expose a confidence value above 0.75 in any UI string or API response.
2. **No diagnostic language.** Forbidden: "you have", "diagnosis confirmed", "you are", "diagnosed with". Use educational framing: "people experiencing X often describe...", "what's commonly called...". Applies to article copy, UI strings, push notifications, error messages — everything.
3. **Crisis detection cannot be disabled.** CRISIS-tagged symptoms halt the Navigator at *any* severity. No flag, env var, or config toggle may turn this off.
4. **Symptom Navigator state is client-side only.** Lives in MMKV. Never serialized to Supabase. Never sent to analytics. Never logged to Sentry.
5. **Person-first language everywhere.** 26-term sensitivity filter applies to all generated text. "Person experiencing anxiety" not "anxious person". "Person with depression" not "depressed person". The filter lives in `packages/shared/sensitivity/` after Phase 5 lift; until then, hand-check all copy.

### Data architecture

6. **Sanity is dormant. Supabase is the sole article source.** Do not reintroduce Sanity. Do not add `@sanity/*` packages.
7. **`ArticleRecord` has no `description` field — use `seo_description`.** Recurring bug source on web; will recur here.

### Code style

8. **Use the `@/` path alias.** No `../../../` chains.
9. **NativeWind classes only for styling.** No inline `style={{...}}` objects (except dynamic Reanimated values, which require object literals).
10. **Articles use the 13 PEAF blocks only** (see §6). Do not create new block types.

### Mobile-specific

11. **No PII or symptom data leaves the device unsanitized.** Sentry, analytics, error messages — all filtered. The `beforeSend` filter strips PII; trust it but verify any new event you add.
12. **App Store compliance for crisis content.** Apple Guideline 1.4.1 (medical/health claims) and 5.1.1 (data collection consent) apply. Crisis-flow changes go through review before submission. Never ship UI copy that could be construed as medical advice.
13. **All persisted state needs versioned migrators.** Users may launch the app weeks after their last session with stale MMKV/secure-store data. Every persisted shape gets a `version` field and a migration function from N → N+1. Breaking changes without a migrator = silent data loss.

---

## 5. Open decisions that BLOCK implementation

Per `PROJECT_CONTEXT.md` §10. **Do not write code in these scopes** until the corresponding rule file exists:

| Scope | Blocked by missing | Don't implement until |
|---|---|---|
| Auth, account, sign-in/up, account linking | `rules/auth.md` | rules/auth.md exists with standalone↔companion model resolved |
| Offline data, sync queue, conflict resolution | `rules/offline.md` | rules/offline.md exists |
| Anything cross-app (web↔mobile data sharing) | `ARCHITECTURE.md` | ARCHITECTURE.md exists with sync strategy |
| Push notifications, background tasks | open decision §5, §7 | Decided V1-or-defer |
| Analytics events | open decision §6 | PostHog vs Amplitude picked |
| Sign in with Apple / Google | open decision §8 | Decided V1-with-or-without |

If asked to implement something in a blocked scope, **say so directly** — don't generate code with placeholders. Cite this section.

---

## 6. The 13 PEAF block components

Articles can ONLY use these. Do not create new block types.

`ArticleCallout` (20 variants) · `StatCard` · `ArticleChart` · `ComparisonTable` · `ArticleAccordion` · `ArticleTabs` · `QuoteBlock` · `HighlightBox` (no `title` prop) · `ProgressSteps` · `BeforeAfter` · `MythVsFactBlock` (single myth/fact, NOT items array) · `RelatedToolsBlock` · `DiagramBlock`

Article enrichment fields required: `summary`, `keyFacts` (5), `sparkMoment`, `practicalExercise`.

Full PEAF quality framework (11 gates, source tiers, readability) lives in `PROJECT_CONTEXT.md` §5. Reference it when validating articles.

---

## 7. Brand voice & visual

- **Primary teal:** `#1A9B8C`. The brand color. Use sparingly for emphasis, not floods.
- **Type:** Inter (sans-serif body) + Plus Jakarta Sans (display headings).
- **Voice:** warm, calm, educational, person-first. Never clinical. Never sensational. Never "your results suggest you have..." — always "based on your responses, you might find these resources helpful...".
- **Motion:** Always respect `prefers-reduced-motion`. Reanimated 4 with `useReducedMotion()` hook.
- **Dark mode:** class-based, full parity with light. No "dark mode is V2."

UI copy is clinically reviewed by Dr. Dobson before ship for any user-facing surface that mentions conditions, symptoms, or crisis. Treat her as a required reviewer.

---

## 8. Workspace commands (after Expo scaffold)

These don't work yet — `psychage-mobile/` is empty. Listed for reference; will be operational after Phase 6 (Expo scaffold).

```bash
# Mobile app (from workspace root, after monorepo migration)
bun run -F mobile start          # Expo dev server
bun run -F mobile ios            # iOS simulator
bun run -F mobile android        # Android emulator
bun run -F mobile typecheck      # tsc --noEmit
bun run -F mobile lint           # Biome check
bun run -F mobile test           # Vitest

# Workspace-wide
bun install                      # Install all workspace deps
bun run typecheck                # All apps + packages
bun run lint                     # All apps + packages
bun run build                    # Production bundle (EAS)
```

Until `package.json` exists at root, these are aspirational. Real commands appear after Phase 6.

---

## 9. Workflow expectations

- **Plan mode is the default** (per `~/.claude/settings.json`). Propose a plan, wait for approval, then implement. For trivial single-file edits, use judgment.
- **Spec-driven workflow** is the path for new features once skills are deployed (Phase 4 of foundation plan). Phases: discovery → requirements → design → tasks → review → implement.
- **Atomic commits per task.** Reference task ID. Pre-commit gates (typecheck + lint + test) are inviolable. No `--no-verify`.
- **The `@/` alias maps to `src/`.** Configure once in `tsconfig.json` and `babel.config.js`. Don't reinvent per-file.
- **Worktrees for parallel work.** Each parallel task in its own git worktree. Tasks declare file ownership; no two parallel tasks touch the same file.

---

## 10. What this file deliberately omits

If you're looking for something here and don't find it, check these instead:

- **Universal coding behaviors** (think first, push back, verify, etc.) → `~/.claude/CLAUDE.md`
- **Comprehensive history, decisions, open questions, file inventory** → `PROJECT_CONTEXT.md`
- **Auth model, offline strategy, architecture details** → `rules/<topic>.md` (when they exist)
- **Spec-driven workflow phase docs** → `.claude/skills/spec-*/SKILL.md` (after Phase 4 deploy)
- **Domain logic (Navigator scoring, PEAF validators, sensitivity filter)** → `packages/shared/` (after Phase 5 lift) or `psychage-v2/src/lib/{navigator,safety,article-framework}/` until then

When you can't find a rule and the absence matters, ask. Don't invent.

## Two procedures for development work

**Procedure A — full spec workflow.** Used for the four V1 native features only: Daily Check-In, Symptom Navigator, My Therapist + share, Crisis surface. Invoke via `/spec-discovery <slug>` and follow the chain through `/spec-implement`.

**Procedure B — direct development.** Used for everything else: scaffolding, configuration, copy fixes, dependency bumps, WebView wrappers, onboarding screens, adaptive home, settings, premium upgrade, auth flows. Open with a brief paragraph stating what's being built, why, and what files will change. Implement. Write tests where applicable. Commit with a message that names the change, the reason, and any cited rule. The four Sacred Rule hooks fire on every edit regardless of procedure.

**Security checklist for Procedure B on auth and premium PRs.** Required in PR description:
1. TLS verification — all requests use HTTPS; certificate pinning configured for production
2. Secret handling — no secrets in code or git history; production secrets via EAS Secrets only
3. Error messages — do not leak account existence (use generic "invalid credentials")
4. Session token storage — in `expo-secure-store` (Keychain/Keystore), never `AsyncStorage` or `MMKV`
5. Audit log — `audit_events` row emitted with user_id, event_type, IP, device_id, timestamp, success/failure

## PHASE_*_STAGING_* file convention

Files matching `PHASE_*_STAGING_*.md` at workspace root are gitignored scratch for in-flight phase work. Safe to delete after the phase's atomic commit lands. They are not authoritative. Always treat the committed phase deliverables as canonical.
