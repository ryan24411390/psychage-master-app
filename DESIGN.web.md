# DESIGN.web.md — Psychage Web Design Contract

**Phase:** 4.A
**Slice:** 2 — canonical web design contract
**Source repo:** `/Users/raiyanabdullah/Desktop/psychage-v2/` @ commit `c3f2c06`
**Companion files:**
- [tokens/web.tokens.json](tokens/web.tokens.json) — canonical values, citation per leaf
- [audits/web-design-drift.md](audits/web-design-drift.md) — drift inventory (Slice 4 migration input)

This contract is **descriptive**, not prescriptive. It documents what the existing psychage-v2 codebase already converged on. Slice 4 (if scheduled) migrates non-conforming code to the contract — this file does not change code on its own.

---

## 0. Scope

**In scope (the main app):**
- All code under `src/` of psychage-v2
- Token sources: `src/styles/tokens.css`, `src/styles/globals.css`, `src/styles/article-prose.css`, `tailwind.config.js`, `src/lib/animations.ts`
- The 26 UI primitives at `src/components/ui/`
- The 13 PEAF block components at `src/components/article/blocks/`
- Public marketing, dashboard, portal, admin v1, admin v2, ClarityJournal surfaces

**Out of scope (deliberate exclusions):**
- **`clarity-score/`** — separate Next.js 15 sub-app with its own parallel token system (own fonts, own teal expression, own dark bg `#0F172A`). Not consumed by the mobile contract. Treated as foreign DSL.
- **Default-Tailwind utilities used in components without a Psychage token equivalent.** Slice 2 does not enumerate every Tailwind default in use; the contract names what Psychage extends or overrides.
- **The mobile app** — has its own contract `DESIGN.mobile.md` (Phase 4.B). The only cross-platform shared identity carrier is the clay-figure library.

---

## 1. Tokens (overview; values in `tokens/web.tokens.json`)

The token file is canonical. This section names the families, the schema shape, and the source-of-truth conventions. Values do not appear here — read the JSON.

### 1.1 Color schema (Option B — paired light/dark)

Every theming color leaf is `{ "light": "#hex", "dark": "#hex" }`. Non-themed brand scales (`teal.*`, `charcoal.*`, `crisis.red`, `relevance.*`) are single hex values that do not flip between modes.

Color groups:
- `background`, `surface.{default,hover,active}`, `border.{default,hover}` — themed
- `primary.{default,hover,light}` — themed; brand teal expression
- `text.{primary,secondary,tertiary}` — themed; `text.tertiary.light` floors at WCAG AA 5.2:1
- `semantic.{error,success,warning}` — themed
- `crisis.red` — single value (visual announcement regardless of mode)
- `relevance.{high,moderate,explore}` — single values (Symptom Navigator)
- `teal.{50,100,400,500,600,700,900}` — single values, sparse scale
- `charcoal.{50..950}` — single values, full neutral scale

Excluded (dead in code): `urgent.amber`, `watch.blue`, `safe.green`, `--color-background-warm`, `--color-primary-bg`. See `color._excluded` in the JSON.

**Two color systems coexist** (per §7 Q7 resolution):
- **Themed** (`color.text.*`, `color.background`, `color.surface.*`, `color.border.*`, `color.primary.*`, `color.semantic.*`): paired `{ light, dark }`. For surfaces that must flip with mode.
- **Non-themed** (`charcoal.*` 11-step neutral scale, `teal.*` sparse brand scale, `crisis.red`, `relevance.*`): single hex. For surfaces that look the same in both modes (dividers, borders, brand chrome, semantic announcement colors). `charcoal.*` is not replaced by `color.text.*` — they serve different jobs.

`color.mood.{1..5}` is a feature-scoped exception (mood feature only, paired L/D with same hex on both sides — see `_dark_origin` note in the JSON and §7 Q10).

### 1.2 Typography schema

Only `type.family.{sans,display,mono}` is a token. `sans` = Inter, `display` = Plus Jakarta Sans, `mono` = IBM Plex Mono.

`size/weight/leading/tracking` are **not** Psychage tokens — psychage-v2 has no Tailwind extension for these. Article prose (`src/styles/article-prose.css`) carries hardcoded sizes/weights; that is context-bound copy, not a token. The `fluid-3xl/4xl/5xl` extension is dead and excluded.

### 1.3 Spacing schema

8 steps: `1, 2, 3, 4, 6, 8, 12, 16` (rem). Source: `src/styles/tokens.css` CSS vars wired to Tailwind. **Value parity with Tailwind defaults today** — the extension is structural (var indirection), not value-divergent. Steps Tailwind defaults provide outside this set (5, 7, 9, 10, 11, 14, 20, 24, 32, 64...) are usable but not Psychage tokens.

### 1.4 Radius schema

5 steps: `sm, md, lg, xl, full`. `radius._canonical.surface = "xl"` — the documented card/surface radius. See §7 Q12.

**Multiple legitimate radii by element type.** `_canonical.surface` is not the universal radius — different element classes have their own established norms. Observed in `src/components/ui/` and confirmed at Q12 close:

| Element class | Radius | Examples |
|---|---|---|
| Cards / panels / modals | `xl` (1rem) | `Card`, `Modal`, dashboard surfaces |
| Inputs / smaller buttons / badges | `lg` (0.75rem) — sometimes `md` (0.5rem) | `Input`, secondary buttons, status badges |
| Emphasis surfaces / hero blocks | `2xl` (Tailwind default 1rem) — `3xl` (1.5rem) for hero / feature tiles | `PageHeader` icon container, hero callouts |
| Pills / avatars / icon buttons | `full` (9999px) | `Avatar`, pill badges, circular icon buttons |

Slice 4 does not flatten these to a single value. The token contract names canonical surface (cards = `xl`); other element classes follow the table above as documented practice, not enforced via a separate token.

### 1.5 Shadow schema

4 elevations: `sm, md, lg, glow`. Each is paired `{ light, dark }`. `shadow.glow` uses `rgba(26,155,140,*)` = brand `#1A9B8C`.

### 1.6 Motion schema

Canonical source: `src/lib/animations.ts`. JS literals in seconds (Framer Motion convention).
- `motion.duration.{micro,small,medium,large,xl}` — 0.15s / 0.2s / 0.3s / 0.5s / 0.7s
- `motion.easing.{standard,decelerate,accelerate,spring}` — cubic-bezier 4-arrays. `spring` is the Spark moment; use sparingly.

Parallel CSS-var motion system at `tokens.css:36-46` and Tailwind aliases at `tailwind.config.js:112-116` are **dead in components** and excluded. All animated UI imports from `animations.ts`.

### 1.7 Max-width schema

4 surface widths: `content` 80rem, `dashboard` 75rem, `admin` 87.5rem, `wide` 100rem. From `tailwind.config.js`. `PageLayout`'s local `wide` keyword (= 80rem) is a component-local string, **not a token**. See §7 Q4.

### 1.8 Breakpoints

One Psychage extension: `xs: 375px`. All other Tailwind defaults (sm/md/lg/xl/2xl) are unmodified and not Psychage tokens.

---

## 2. Component canon

### 2.1 UI primitives (26 PascalCase files at [src/components/ui/](../../Desktop/psychage-v2/src/components/ui/))

Bespoke library — Radix + Framer Motion + local variant maps. **Not stock shadcn** (shadcn uses lowercase). The shadcn-compat CSS-var alias layer at `src/styles/globals.css:7-48` exists but is functionally unused (2 files import `text-foreground`); not part of the live contract.

Canon (any new web work uses these — do not invent parallel primitives):

`Alert`, `Badge`, `Breadcrumbs`, `Button`, `Card`, `ConfirmDialog`, `CookieConsent`, `EmptyState`, `FeedbackWidget`, `HighlightedText`, `Input`, `InteractiveCard`, `Label`, `LanguageSwitcher`, `Logo`, `LogoIcon`, `Modal`, `NotificationPrompt`, `PageTransition`, `Pagination`, `ScrollManager`, `Skeletons`, `SkipLink`, `SocialIcons`, `ThemeToggle`, `Typography`.

Top adoption (page-level imports):
- `Button` — 45 pages — 6 variants (`primary | secondary | outline | ghost | glass | danger`), 4 sizes (`sm | md | lg | xl`)
- `Card` — 19 pages — 4 variants (`default | glass | outline | ghost`)
- `InteractiveCard` — 11
- `Input` — 10
- `Typography` (`Display`, `Text`) — 9

### 2.2 PEAF block components (13 at [src/components/article/blocks/](../../Desktop/psychage-v2/src/components/article/blocks/))

Articles **can only use these 13**. New block types are forbidden — Sacred Rule, see project CLAUDE.md §6.

`ArticleAccordion`, `ArticleCallout` (20 variants), `ArticleChart`, `ArticleTabs`, `BeforeAfter`, `ComparisonTable`, `DiagramBlock`, `HighlightBox`, `MythVsFactBlock`, `ProgressSteps`, `QuoteBlock`, `RelatedToolsBlock`, `StatCard`.

### 2.3 Layout primitives (at [src/components/layout/](../../Desktop/psychage-v2/src/components/layout/))

`Navigation`, `Footer`, `MobileMenu`, `PageLayout`, `PageHeader`, `NavMenu`, `NavHub`, `NavAssets`, `CrisisBanner`, `CrisisResources`.

**`PageLayout` adoption today is admin-v2-only (28 importers under `src/pages/admin/v2/`).** Public marketing pages each roll their own outer shell.

**Slice 4 rename** (per §7 Q4 + Q11 resolutions):
- `PageLayout` → `AdminLayout` — file + symbol rename across 28 importer sites; public pages keep bespoke shells (no rollout).
- `PageLayout`'s local `wide` prop → `content` prop — to match `maxWidth.content` (80rem) and remove the naming collision with `maxWidth.wide` (100rem).

Both items are codemod-eligible and bundled in drift §7.1 + §7.2. The `tokens/web.tokens.json` `maxWidth.*` keys are unchanged.

### 2.4 Sidebars

Three implementations, surface-specific, no unified primitive:
- [src/pages/dashboard/UserSidebar.tsx](../../Desktop/psychage-v2/src/pages/dashboard/UserSidebar.tsx)
- [src/pages/admin/AdminSidebar.tsx](../../Desktop/psychage-v2/src/pages/admin/AdminSidebar.tsx)
- [src/pages/provider/ProviderSidebar.tsx](../../Desktop/psychage-v2/src/pages/provider/ProviderSidebar.tsx)

Consolidation into one `Sidebar` primitive is a product decision, not a Slice 2 mandate.

---

## 3. Page-mirror map

Routing single source: [src/App.tsx:232-377](../../Desktop/psychage-v2/src/App.tsx#L232-L377). React Router v7 lazy routes. Global wrappers: `<Navigation>` always, `<Footer>` always, `<PageTransition>` per-route, `<RouteErrorBoundary>` for sensitive pages.

| Surface | Shell pattern | Layout primitive | Sidebar | Token compliance |
|---|---|---|---|---|
| **Public marketing** ([home/HomePage.tsx](../../Desktop/psychage-v2/src/pages/home/HomePage.tsx), [providers/ProvidersLandingPage.tsx](../../Desktop/psychage-v2/src/pages/providers/ProvidersLandingPage.tsx), [learn/ArticlePage.tsx](../../Desktop/psychage-v2/src/pages/learn/ArticlePage.tsx), [auth/LoginPage.tsx](../../Desktop/psychage-v2/src/pages/auth/LoginPage.tsx), [tools/ToolsLandingPage.tsx](../../Desktop/psychage-v2/src/pages/tools/ToolsLandingPage.tsx)) | Per-page bespoke shell | — | — | Mixed — uses `--color-homepage-*`, `bg-background`, arbitrary hex. See §7 Q1, drift. |
| **Patient dashboard** ([dashboard/UserDashboard.tsx](../../Desktop/psychage-v2/src/pages/dashboard/UserDashboard.tsx) + siblings) | `<UserSidebar>` + ad-hoc content | — | UserSidebar | Mostly `--color-*` tokens; some default-Tailwind grays. |
| **Provider portal** ([portal/](../../Desktop/psychage-v2/src/pages/portal/) — `PortalDashboard`, `PortalProfile`, `PortalReviews`, `PortalVerification`, `PortalSubscription`, `PortalAnalytics`, `PortalSettings`) | Portal-level wrapper (not audited per-file) | — | Portal-internal | Token compliance not measured Slice 2. |
| **Admin v1** ([admin/](../../Desktop/psychage-v2/src/pages/admin/)) | Direct routes, sidebar layout | — | AdminSidebar | Pre-canon; legacy. |
| **Admin v2** ([admin/v2/](../../Desktop/psychage-v2/src/pages/admin/v2/) — 28 files) | `<PageLayout>` everywhere | **PageLayout** | AdminSidebar | The only surface using `PageLayout`. Highest contract compliance. |
| **ClarityJournal tool** ([components/tools/ClarityJournal/](../../Desktop/psychage-v2/src/components/tools/ClarityJournal/) — 3 entries) | Tool-local wrapper with `bg-[#F5F5F7] dark:bg-[#0a0a0a]` arbitrary | — | — | **Off-contract** — should be `color.background.{light,dark}`. See §7 Q9. |

---

## 4. Sensorial commitment (web)

The web app is **deliberately less sensorial than the mobile app**. Mobile owns haptics, audio, motion-as-emotional-vocabulary, and dimensional micro-interactions. Web restrains to:

- **Motion respects `prefers-reduced-motion` globally.** Override at `src/styles/tokens.css:167-174` caps animation/transition durations to 0.01ms and iteration-count to 1. Framer Motion components import `useReducedMotion()` where motion is non-decorative.
- **WCAG AA contrast is a floor, not a ceiling.** `color.text.tertiary.light` is already darkened to 5.2:1 — Slice 4 must not lighten without re-checking.
- **No haptics.** Web platform.
- **No audio.** Web platform.
- **One signature motion moment per surface, max.** The `motion.easing.spring` curve (overshoot) is reserved for the rare Spark moment — not default ease.
- **Keyboard accessibility is non-negotiable.** Global focus ring at `src/styles/globals.css:56-60`. `SkipLink` primitive exists; pages with persistent nav should use it.
- **Brand color is used sparingly for emphasis, not floods.** Primary teal `#1A9B8C` light / `#20B8A6` dark is a destination color, not a backdrop.

---

## 5. Anti-slop patterns

*Placeholder for Slice 3.* This section documents the patterns Slice 4 migrations must avoid (e.g., "do not introduce a new card radius", "do not duplicate the mood palette inline", "do not inline-style colors when a token exists"). Written when concrete migration scope is locked.

---

## 6. Drift acknowledged

Slice 2 captures the contract. Existing psychage-v2 code does not fully comply. The drift inventory lives at **[audits/web-design-drift.md](audits/web-design-drift.md)** — that file is the Slice 4 (if scheduled) migration input. Headlines:

- **`text-gray-900` outnumbers `text-text-primary` (374 vs 248 files).** Pattern canonicalized to `color.text.primary` in this contract; Slice 4 migrates.
- **Wrong-teal `rgba(13,148,136,*)` (= Tailwind default `#0D9488`) appears in 6+ locations mislabeled as "Primary".** Drift; correct value is `rgba(26,155,140,*)` = brand `#1A9B8C`.
- **`#15B8A6` pseudo-brand in mood palette** — close to but ≠ brand. Drift unless mood palette is promoted (see §7 Q10).
- **Two `blob` keyframes** exist (`tokens.css` uses `translate`, `globals.css` uses `translate3d`). Whichever loads later wins.
- **Three sidebar implementations**, no unified primitive.
- **Two `home/` directories** (v1 + v2). v2 is current.
- **`clarity-score/` sub-app** is a fully parallel token system, excluded from this contract by §0.

Slice 4 is **not scheduled** at Slice 2 close. Recommendation: defer pending product/eng prioritization.

---

## 7. §5 audit-question resolutions

12 questions from the audit at [audits/web-design-drift.md](audits/web-design-drift.md), resolved via heuristic ladder (token canonicalization · pattern canonicalization · dead-but-defined exclusion · motion source · schema-shape · surfacing rules). Locked decisions noted.

| # | Question | Verdict | Resolution | Evidence / rationale |
|---|---|---|---|---|
| Q1 | Primary text token canonical? (`text-text-primary` 248 vs `text-gray-900` 374 vs `text-foreground` 2) | **Auto-resolved** | `color.text.primary` (`text-text-primary`) is canonical. `text-gray-900` is drift. `text-foreground` (shadcn alias layer) is unused and not part of the contract. | Ladder: pattern canonicalization — branded Psychage token wins over Tailwind default regardless of file count. Slice 4 migrates 374 files. |
| Q2 | Brand teal "with opacity" expression | **Auto-resolved** | Canonical = `rgba(26, 155, 140, *)` = brand `#1A9B8C`. `rgba(13, 148, 136, *)` (= Tailwind default `#0D9488`) is wrong-teal drift; `#15B8A6` (mood-great) is pseudo-brand drift. | Ladder: surfacing rule — brand value wins over Tailwind default. Drift list in `tokens/web.tokens.json` → `color._excluded._note`. |
| Q3 | Primary L/D split schema shape | **Locked at kickoff** | Option B: paired `{ "light": "...", "dark": "..." }` per themed leaf. | Schema decision locked at Slice 2 start. All themed groups follow this shape. |
| Q4 | "wide" naming collision (`max-w-wide` 100rem vs `PageLayout` `wide`=80rem) | **Resolved** | `maxWidth.wide` = 100rem stays canonical. `PageLayout`'s local `wide` prop renames to `content` in Slice 4 to match `maxWidth.content` (80rem). Codemod-eligible across ~28 admin-v2 importers. See drift §7.1. | Ladder: schema-shape — token surface is `tailwind.config.js`. Component-local prop keyword realigns to token name; no token change. |
| Q5 | Three duration systems — which canonical? | **Locked at kickoff** | `src/lib/animations.ts` is canonical. CSS-var `--duration-*` and Tailwind `duration-fast/normal/slow` aliases are dead in components — excluded from contract. | Locked at Slice 2 start. Component motion already imports `animations.ts` exclusively. |
| Q6 | `urgent.amber`, `watch.blue`, `safe.green` — keep, drop, reserve? | **Auto-resolved** | Excluded from contract. Zero live references in components. Documented in `color._excluded._note`. | Ladder: dead-but-defined exclusion. Reserve-for-future is not a token contract responsibility; if a severity surface ships, define the values at that time. |
| Q7 | `charcoal.*` Tailwind scale vs `--color-text-*` CSS vars — consolidate or both? | **Resolved** | Both stay. `color.text.*` (themed L/D) handles text that must flip with mode; `charcoal.*` (non-themed 11-step scale) handles surfaces/borders/dividers that don't flip. Not subject to Slice 4 consolidation. Documented as two coexisting color systems in §1.1. | Ladder: product-shaped — two parallel neutrals serve different purposes; consolidation would force theming on surfaces that don't need it. |
| Q8 | `clarity-score/` sub-app scope | **Locked at kickoff** | Excluded from `tokens/web.tokens.json`. Parallel design system (different fonts, different teal, different dark bg). Treated as foreign DSL. | Locked at Slice 2 start. See §0. |
| Q9 | ClarityJournal off-token bg (`#F5F5F7` light / `#0a0a0a` dark) | **Auto-resolved** | Drift. Canonical resolution: `color.background.light` (`#F9F7F3`) and `color.background.dark` (`#0F0F0F`). `#F5F5F7` is not a token; `#0a0a0a` ≠ `#0F0F0F`. Slice 4 migration target. | Ladder: pattern canonicalization — `--color-background` exists for this purpose. |
| Q10 | Mood palette — tokenize or keep ad-hoc? | **Resolved** | Tokenize. Encoded as `color.mood.{1..5}` (paired L/D, mood-feature-only scope) in `tokens/web.tokens.json`. Slice 4 dedupes the 2 duplicate callsites ([QuickMoodCheckIn.tsx:12-18](../../Desktop/psychage-v2/src/components/dashboard/QuickMoodCheckIn.tsx#L12-L18), [FirstMoodStep.tsx:10-16](../../Desktop/psychage-v2/src/components/onboarding/FirstMoodStep.tsx#L10-L16)) into a single feature module consuming the token. See drift §7.3. | Ladder: product-shaped — duplication confirmed identical across dupes (5 hexes match exactly). Tokenizing under a scoped namespace prevents cross-feature reuse while removing inline drift. |
| Q11 | `PageLayout` adoption — public pages too, or admin-v2-only? | **Resolved** | Stays admin-only. Slice 4 renames `PageLayout` → `AdminLayout` so the scope is self-documenting (28 importer sites, all under `src/pages/admin/v2/`). Public pages keep bespoke shells. See drift §7.2. | Ladder: product-shaped — name should match scope; rename is cheaper than rolling the primitive out. |
| Q12 | Card / surface default radius | **Resolved** | `radius.xl` (1rem) confirmed for cards/surfaces. Card.tsx already uses `rounded-xl`. Multiple legitimate radii by element type documented in §1.4 (pills/avatars `full`, inputs `lg`/`md`, emphasis surfaces `2xl`/`3xl`) — `_canonical.surface = xl` applies to cards specifically, not all radii. | Ladder: pattern canonicalization (count-based, low-confidence flag cleared after PR review). Card surfaces lock; other element classes have their own legitimate radii. |

**Summary:** All 12 questions resolved at PR-review close. 4 auto-resolved at Slice 2 (Q1, Q2, Q6, Q9) + 3 locked at kickoff (Q3, Q5, Q8) + 5 resolved at PR-review (Q4, Q7, Q10, Q11, Q12). Slice 4 work-list lives at [audits/web-design-drift.md §7](audits/web-design-drift.md#7-slice-4-work-list-decisions-locked-by-7-of-designwebmd).
