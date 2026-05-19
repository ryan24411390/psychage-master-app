# Web Design Drift — psychage-v2

**Branch:** feat/phase-4a-web-design-contract (originated as `recon/web-design`)
**Source:** /Users/raiyanabdullah/Desktop/psychage-v2/
**Source commit (psychage-v2 HEAD at audit time):** c3f2c06cd7cb5922aa5f8438ba8a9b6852366fb1
**Audited at:** 2026-05-17T12:09:14Z
**Scope:** Slice 4 migration input. Drift (§4) and meta (§6) only — token/component/page inventories migrated to [DESIGN.web.md](../DESIGN.web.md) and [tokens/web.tokens.json](../tokens/web.tokens.json) in Slice 2.
**Stack confirmed:** Vite + React 18 + TypeScript + Tailwind 3 + custom Radix-based UI primitives (PascalCase, not stock shadcn). Package manager pnpm (not bun). Tailwind config in `tailwind.config.js` (not .ts).

> **§5 audit-question resolutions migrated to [DESIGN.web.md §7](../DESIGN.web.md#7-5-audit-question-resolutions).** 8 auto-resolved or locked at kickoff; 4 surfaced for Ryan PR review.

---

## 4. Drift and tribal items

### 4.1 Dead tokens (defined but ≤1 reference, i.e. only the definition itself)

| Token | Defined at | Live references |
|---|---|---|
| `urgent.amber` | [tailwind.config.js:69-71](../../../Desktop/psychage-v2/tailwind.config.js#L69-L71) | 0 |
| `watch.blue` | [tailwind.config.js:72-74](../../../Desktop/psychage-v2/tailwind.config.js#L72-L74) | 0 |
| `safe.green` | [tailwind.config.js:75-77](../../../Desktop/psychage-v2/tailwind.config.js#L75-L77) | 0 |
| `fluid-3xl`, `fluid-4xl`, `fluid-5xl` | [tailwind.config.js:132-136](../../../Desktop/psychage-v2/tailwind.config.js#L132-L136) | 0 |
| Tailwind `transitionDuration: { fast, normal, slow }` | [tailwind.config.js:112-116](../../../Desktop/psychage-v2/tailwind.config.js#L112-L116) | 0 in components; 3 in [src/styles/__tests__/tokens.test.ts:61-63](../../../Desktop/psychage-v2/src/styles/__tests__/tokens.test.ts#L61-L63) |
| `--duration-micro`, `-small`, `-medium`, `-large`, `-xl` | [tokens.css:36-41](../../../Desktop/psychage-v2/src/styles/tokens.css#L36-L41) | 0 (sub'd by JS constants in [src/lib/animations.ts:8-22](../../../Desktop/psychage-v2/src/lib/animations.ts#L8-L22)) |
| `--ease-standard`, `-decelerate`, `-accelerate` | [tokens.css:44-46](../../../Desktop/psychage-v2/src/styles/tokens.css#L44-L46) | 0 (also duplicated in `animations.ts`) |
| `--color-background-warm` | [tokens.css:98](../../../Desktop/psychage-v2/src/styles/tokens.css#L98) | 0 |
| `--color-primary-bg` | [tokens.css:99](../../../Desktop/psychage-v2/src/styles/tokens.css#L99) | 0 |

### 4.2 Hardcoded drift (sample, ~15 examples)

Arbitrary hex Tailwind classes (`text-[#...]`, `bg-[#...]`):
- [src/components/ui/Logo.tsx:7](../../../Desktop/psychage-v2/src/components/ui/Logo.tsx#L7) — `text-[#1A1A1A] dark:text-white`. Logo color is not a token.
- [src/components/layout/Navigation.tsx:160](../../../Desktop/psychage-v2/src/components/layout/Navigation.tsx#L160), [src/components/layout/MobileMenu.tsx:81](../../../Desktop/psychage-v2/src/components/layout/MobileMenu.tsx#L81), [src/components/auth/AuthModal.tsx:182](../../../Desktop/psychage-v2/src/components/auth/AuthModal.tsx#L182) — same `text-[#1A1A1A]` repeated
- [src/components/tools/ClarityJournal/index.tsx:103](../../../Desktop/psychage-v2/src/components/tools/ClarityJournal/index.tsx#L103), [src/components/tools/ClarityJournal/v2-report/ReportConfigScreen.tsx:98](../../../Desktop/psychage-v2/src/components/tools/ClarityJournal/v2-report/ReportConfigScreen.tsx#L98), [src/components/tools/ClarityJournal/v2-sections/DailyEntryV2.tsx:104](../../../Desktop/psychage-v2/src/components/tools/ClarityJournal/v2-sections/DailyEntryV2.tsx#L104) — `bg-[#F5F5F7] dark:bg-[#0a0a0a]` (off-spec backgrounds)
- [src/components/dashboard/QuickMoodCheckIn.tsx:13-17](../../../Desktop/psychage-v2/src/components/dashboard/QuickMoodCheckIn.tsx#L13-L17) — mood palette `#8B7FA8`, `#D4A060`, `#8FAE8B`, `#1A9B8C`, `#15B8A6` as raw hex + Tailwind arbitrary classes. **`#15B8A6` is close to but not equal to brand `teal-500` `#20B8A6`.**
- [src/components/onboarding/FirstMoodStep.tsx:11-15](../../../Desktop/psychage-v2/src/components/onboarding/FirstMoodStep.tsx#L11-L15) — same mood palette duplicated

Inline `style={{...}}` colors (49 hits total):
- [src/components/home/v2/ToolsEcosystem.tsx:192](../../../Desktop/psychage-v2/src/components/home/v2/ToolsEcosystem.tsx#L192) — `color: 'color-mix(in srgb, var(--color-primary) 75%, var(--color-text-secondary))'`
- [src/components/home/v2/ToolsEcosystem.tsx:242](../../../Desktop/psychage-v2/src/components/home/v2/ToolsEcosystem.tsx#L242) — `color: 'var(--color-primary)'`

Default-Tailwind grays/stones used in place of `text-text-primary`/`text-text-secondary`:
- **374 files use `text-gray-900`** vs **248 files use `text-text-primary`** (canonical). Heavy overlap; both styles are pervasive. Same drift applies to `text-gray-{500-800}`, `bg-gray-{50-100}`, `bg-stone-*`. Cannot enumerate per-line — drift count is at structural scale, not isolated.

Article-prose `clamp()` typography is hardcoded in CSS ([article-prose.css:24-50](../../../Desktop/psychage-v2/src/styles/article-prose.css#L24-L50)) and bypasses the Tailwind `fluid-*` scale entirely.

### 4.3 Token conflicts

1. **Brand teal expressed three ways, two of them wrong**:
   - Canonical: `--color-primary` (CSS var) and `theme.colors.teal[600]` both `#1A9B8C`. `--shadow-glow` and `gradient` keyframe correctly use `rgba(26, 155, 140, ...)`.
   - **Wrong teal used as "brand-with-opacity"**: `rgba(13, 148, 136, ...)` = `#0D9488` (Tailwind default `teal-600`, NOT brand). Found at:
     - [src/styles/globals.css:63](../../../Desktop/psychage-v2/src/styles/globals.css#L63) — `::selection` background. Comment at line 64 says "Primary with opacity" — **stale/wrong**.
     - [src/styles/article-prose.css:78](../../../Desktop/psychage-v2/src/styles/article-prose.css#L78), [:89](../../../Desktop/psychage-v2/src/styles/article-prose.css#L89), [:291](../../../Desktop/psychage-v2/src/styles/article-prose.css#L291), [:298](../../../Desktop/psychage-v2/src/styles/article-prose.css#L298) — blockquote bg, citation flash
     - [src/components/admin/editor/tiptap-styles.css:92,103](../../../Desktop/psychage-v2/src/components/admin/editor/tiptap-styles.css#L92) — admin editor
     - [src/config/categoryThemes.ts:81](../../../Desktop/psychage-v2/src/config/categoryThemes.ts#L81) — `spotlight: 'rgba(13, 148, 136, 0.15)'`
   - **Pseudo-brand**: `#15B8A6` mood-great at [QuickMoodCheckIn.tsx:17](../../../Desktop/psychage-v2/src/components/dashboard/QuickMoodCheckIn.tsx#L17), [FirstMoodStep.tsx:15](../../../Desktop/psychage-v2/src/components/onboarding/FirstMoodStep.tsx#L15) — close to but ≠ brand `#20B8A6`.

2. **Primary text color: three competing tokens in production**:
   - `text-text-primary` (Psychage canonical) — 248 files
   - `text-foreground` (shadcn-compat alias) — **2 files**. Shadcn layer effectively unused.
   - `text-gray-900` (Tailwind default) — 374 files

3. **`charcoal.*` Tailwind scale vs `--color-text-*` CSS vars** — `charcoal` is a hardcoded 11-step neutral scale at [tailwind.config.js:53-65](../../../Desktop/psychage-v2/tailwind.config.js#L53-L65). `--color-text-primary/secondary/tertiary` use stone/zinc hex values that don't map cleanly to any `charcoal.*` stop. Two parallel neutral scales.

4. **Tailwind `transitionDuration` aliases (`duration-fast/normal/slow`) vs JS module constants** ([src/lib/animations.ts](../../../Desktop/psychage-v2/src/lib/animations.ts)). Components import from `animations.ts`; the Tailwind aliases are dead in components but referenced in `tokens.test.ts`. CSS vars `--duration-*` and `--ease-*` are dead in CSS. **Three sources of truth for one set of durations.**

5. **Two `blob` keyframes** with different implementations: [tokens.css:176-189](../../../Desktop/psychage-v2/src/styles/tokens.css#L176-L189) uses `translate`; [globals.css:216-232](../../../Desktop/psychage-v2/src/styles/globals.css#L216-L232) uses `translate3d` + slightly different scale curve. Whichever loads later wins — `globals.css:1` imports `tokens.css`, so the `translate3d` variant wins.

6. **clarity-score sub-app is an entirely parallel design system.** [clarity-score/app/globals.css](../../../Desktop/psychage-v2/clarity-score/app/globals.css) defines its own `--color-teal`, `--color-emotional`, `--color-vitality`, `--color-social`, `--color-cognitive`, `--color-functioning`, `--color-flag-high/moderate/positive`, `--space-xs/sm/md/lg/xl/2xl` (px-based, not rem), `--font-playfair` / `--font-dm-sans`. **Default dark bg `#0F172A`** (deep navy) — does not match Psychage's `#0F0F0F`. Excluded from Slice 2 scope per [DESIGN.web.md §0](../DESIGN.web.md#0-scope).

### 4.4 Inconsistent patterns

1. **No canonical public-page layout.** `PageLayout` is admin-v2-only (28 importers, all under `src/pages/admin/v2/`). Public pages each invent their own outer shell.

2. **`max-w-*` defined twice with different values:**
   - Tailwind: `max-w-content` 80rem, `max-w-dashboard` 75rem, `max-w-admin` 87.5rem, `max-w-wide` 100rem ([tailwind.config.js:117-122](../../../Desktop/psychage-v2/tailwind.config.js#L117-L122))
   - `PageLayout` local map: `wide: 'max-w-7xl'` (80rem), `xl: 'max-w-6xl'` (72rem) ([PageLayout.tsx:5-12](../../../Desktop/psychage-v2/src/components/layout/PageLayout.tsx#L5-L12)) — "wide" means 80rem in one place and 100rem in the other.

3. **Border-radius spread.** Card and surface radii in active use across components: `rounded-sm` 8, `rounded-md` 50, `rounded-lg` 431, `rounded-xl` 523, `rounded-2xl` 402, `rounded-3xl` 70, `rounded-full` 604. No documented "card radius" — different components pick different values. PageHeader icon container uses `rounded-2xl` ([PageHeader.tsx:49](../../../Desktop/psychage-v2/src/components/layout/PageHeader.tsx#L49)), Card uses `rounded-xl` ([Card.tsx:25](../../../Desktop/psychage-v2/src/components/ui/Card.tsx#L25)), Button defaults look md-ish in [Button.tsx](../../../Desktop/psychage-v2/src/components/ui/Button.tsx).

4. **Hover paradigms differ between primitives.**
   - Button: color shift only (`hover:bg-primary-hover`) — [Button.tsx:21-26](../../../Desktop/psychage-v2/src/components/ui/Button.tsx#L21-L26)
   - Card with `hoverEffect=true`: Framer Motion `glassCardHover` variant from `lib/animations` — [Card.tsx:1-13](../../../Desktop/psychage-v2/src/components/ui/Card.tsx#L1-L13)
   - `.glass-hover` utility: `hover:-translate-y-0.5` + bg + shadow — [globals.css:122-131](../../../Desktop/psychage-v2/src/styles/globals.css#L122-L131)

5. **Primary color shifts between light and dark modes** (`#1A9B8C` light → `#20B8A6` dark, [tokens.css:59-63](../../../Desktop/psychage-v2/src/styles/tokens.css#L59-L63), [:118-123](../../../Desktop/psychage-v2/src/styles/tokens.css#L118-L123)). Slice 2 encodes Option B paired L/D in [tokens/web.tokens.json](../tokens/web.tokens.json).

6. **Two `home/` directories**: `src/components/home/` (older — `hero/`, `ToolsSection.tsx`) and `src/components/home/v2/` (current — wired into `HomePage.tsx`). Pattern-version drift; `v1` may still be referenced elsewhere.

7. **Three sidebar implementations** ([UserSidebar.tsx](../../../Desktop/psychage-v2/src/pages/dashboard/UserSidebar.tsx), [AdminSidebar.tsx](../../../Desktop/psychage-v2/src/pages/admin/AdminSidebar.tsx), [ProviderSidebar.tsx](../../../Desktop/psychage-v2/src/pages/provider/ProviderSidebar.tsx)). No unified `<Sidebar>` primitive in `components/ui/`.

8. **Mood color palette is duplicated** between [QuickMoodCheckIn.tsx:13-17](../../../Desktop/psychage-v2/src/components/dashboard/QuickMoodCheckIn.tsx#L13-L17) and [FirstMoodStep.tsx:11-15](../../../Desktop/psychage-v2/src/components/onboarding/FirstMoodStep.tsx#L11-L15) — same five hexes, no shared source.

### 4.5 Deferred decisions found in comments

- [tokens.css:36](../../../Desktop/psychage-v2/src/styles/tokens.css#L36): `/* Animation Timing (sync with src/lib/animations.ts) */` — explicit duplication marker. Sync is manual.
- [tokens.css:71](../../../Desktop/psychage-v2/src/styles/tokens.css#L71): `/* Stone-500 darkened for WCAG AA (5.2:1 on #F9F7F3) */` — accessibility floor documented. Slice 4 cannot lighten `--color-text-tertiary` without re-checking AA.
- [globals.css:63-65](../../../Desktop/psychage-v2/src/styles/globals.css#L63-L65): comment says "Primary with opacity" — value is `rgba(13, 148, 136, 0.2)` ≠ brand primary. Stale.
- [src/pages/tools/ToolsLandingPage.tsx:18](../../../Desktop/psychage-v2/src/pages/tools/ToolsLandingPage.tsx#L18): `// Color mapping for Tailwind classes (can't use dynamic classes due to purging)` — workaround for Tailwind safelist limitation. Affects how color tokens can be consumed dynamically.

---

## 5. §5 audit-question resolutions

> Resolutions migrated to [DESIGN.web.md §7](../DESIGN.web.md#7-5-audit-question-resolutions). 8 auto-resolved or locked at kickoff (Q1, Q2, Q3, Q5, Q6, Q8, Q9, Q12); 4 surfaced for Ryan PR review (Q4, Q7, Q10, Q11). Q12 carries a low-confidence flag (margin 17.6%).

---

## 6. Recon meta

- **Files read (full):** 7 — tokens.css, globals.css, article-prose.css, tailwind.config.js, PageLayout.tsx, PageHeader.tsx, plus the clarity-score `globals.css` head.
- **Files sampled (head only):** ~15 — Button/Card/Modal heads, HomePage/ArticlePage/LoginPage/ProvidersLandingPage/UserDashboard/ToolsLandingPage/Navigation/Footer/animations.ts heads.
- **Files counted via grep without opening:** ~600 (component + page tree).
- **Files skipped:** all of `node_modules/`, `dist/`, `playwright-report/`, `test-results/`, `archive-manifests/`, all `.json` audit reports, all session-* HTMLs, `e2e/`, `data-pipeline/`. Out of scope for a design audit.
- **Time taken:** ~30 minutes of recon, ~25 minutes of writeup.
- **Anything that surprised me:**
  - The shadcn-compat layer at [globals.css:7-48](../../../Desktop/psychage-v2/src/styles/globals.css#L7-L48) is functionally unused in components (2 files use `text-foreground`). It's set up but nobody adopted it.
  - Default Tailwind grays (`text-gray-900`, `bg-gray-*`) win on file count over the Psychage tokens. Slice 2 designed the contract; compliance is a separate, larger story (Slice 4 if scheduled).
  - The `clarity-score/` Next.js sub-app — pre-loaded with an entire second design language. Easy to miss; lives outside `src/`.
  - `--duration-*` and `--ease-*` CSS vars are completely dead. The "sync" comment in tokens.css is aspirational; `animations.ts` is the real source.
  - Two `blob` keyframes with different `translate` vs `translate3d` implementations, and the later-loaded one silently wins.
- **Slice 2 scope-change outcomes (what was actually done):**
  - Slice 2 explicitly excluded the `clarity-score/` sub-app — see [DESIGN.web.md §0](../DESIGN.web.md#0-scope).
  - Slice 2's `tokens.web.json` encodes Option B paired L/D for themed colors; motion canonicalized to `src/lib/animations.ts` only. Both are schema-shape decisions made at kickoff.
  - The "drift" tier of findings (§§4.2, 4.4) was confirmed **larger than the token tier**. Slice 4 (compliance pass) is **not scheduled** at Slice 2 close. Recommendation in PR description: defer.

---

## 7. Slice 4 work-list (decisions locked by §7 of DESIGN.web.md)

Resolved §7 items from `DESIGN.web.md` that translate into Slice 4 (compliance pass) work. Codemod targets and touch-counts noted. Each entry cross-links to its driving §7 row.

### 7.1 `PageLayout` `wide` prop → `content` prop rename — §7 Q4

[src/components/layout/PageLayout.tsx:5-12](../../../Desktop/psychage-v2/src/components/layout/PageLayout.tsx#L5-L12) defines a local `maxWidth` map with a `wide` keyword that resolves to `max-w-7xl` (80rem). This collides semantically with `maxWidth.wide` = 100rem in [tailwind.config.js:121](../../../Desktop/psychage-v2/tailwind.config.js#L121). Slice 4 renames the PageLayout prop keyword from `wide` → `content` so it matches `maxWidth.content` (80rem). No token change.

- **Touch count:** PageLayout.tsx (1 file, ~3 lines — map key + prop type + default) + ~28 admin-v2 importer sites passing `maxWidth="wide"` (grep `maxWidth=\"wide\"` under `src/pages/admin/v2/`).
- **Codemod eligible:** yes — single string-rename across declared `maxWidth` keyword set.
- **Bundle with:** §7.2 (same file, same author surface).

### 7.2 `PageLayout` → `AdminLayout` rename — §7 Q11

`PageLayout` is admin-v2-only today (28 importers, all under `src/pages/admin/v2/`). The name suggests universal layout primitive; reality is admin-only. Slice 4 renames the file and component to `AdminLayout` so the scope is self-documenting. Public pages keep bespoke shells — no rollout (Q11 lock).

- **Touch count:** 1 file rename ([src/components/layout/PageLayout.tsx](../../../Desktop/psychage-v2/src/components/layout/PageLayout.tsx) → `AdminLayout.tsx`) + 28 import path + symbol updates under [src/pages/admin/v2/](../../../Desktop/psychage-v2/src/pages/admin/v2/).
- **Codemod eligible:** yes — find/replace on import path and PascalCase identifier.
- **Bundle with:** §7.1 (same file, same surface).

### 7.3 Mood palette consolidation — §7 Q10

Mood palette is now tokenized as `color.mood.{1..5}` in [tokens/web.tokens.json](../tokens/web.tokens.json) (paired L/D, mood-feature-only scope). Slice 4 dedupes the two callsites and migrates them to consume the token rather than inline hex.

- **Source dupes** (5 hexes confirmed identical between the two):
  - [src/components/dashboard/QuickMoodCheckIn.tsx:12-18](../../../Desktop/psychage-v2/src/components/dashboard/QuickMoodCheckIn.tsx#L12-L18) — exports `MOOD_OPTIONS` with `color`, `bgLight`, `bgDark`
  - [src/components/onboarding/FirstMoodStep.tsx:10-16](../../../Desktop/psychage-v2/src/components/onboarding/FirstMoodStep.tsx#L10-L16) — local `MOOD_OPTIONS` with `color`, `bgClass` (light-only)
- **Migration shape:** lift palette to a shared mood-feature module (e.g. `src/features/mood/palette.ts` or alongside `services/moodService.ts`) consuming `color.mood.*`. Both consumers import from there. Alpha-shift behavior (`bg-[#HEX]/10` light vs `dark:bg-[#HEX]/15` dark) preserved at consumer site, since Tailwind arbitrary classes cannot reference a JS token directly.
- **Codemod eligible:** partial — token reference is straightforward, but Tailwind arbitrary `bg-[#HEX]/N` classes need either inline resolved hex via a helper or a CSS-var pattern. Slice 4 picks the path; not a pure find/replace.
- **Touch count:** 2 source files + 1 new shared module + any external consumer of `MOOD_OPTIONS` (grep across `src/`).
