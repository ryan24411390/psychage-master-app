# Web Design Recon — psychage-v2

**Branch:** recon/web-design
**Source:** /Users/raiyanabdullah/Desktop/psychage-v2/
**Source commit (psychage-v2 HEAD):** c3f2c06cd7cb5922aa5f8438ba8a9b6852366fb1
**Audited at:** 2026-05-17T12:09:14Z
**Stack confirmed:** Vite + React 18 + TypeScript + Tailwind 3 + custom Radix-based UI primitives (PascalCase, not stock shadcn). Package manager pnpm (not bun). Tailwind config in `tailwind.config.js` (not .ts).

---

## 1. Token inventory

Sources, in cascade order (later overrides earlier):
- [src/styles/tokens.css](../../../Desktop/psychage-v2/src/styles/tokens.css) — primary token store (200 lines)
- [src/styles/globals.css](../../../Desktop/psychage-v2/src/styles/globals.css) — Tailwind base + shadcn-compat aliases (232 lines)
- [src/styles/article-prose.css](../../../Desktop/psychage-v2/src/styles/article-prose.css) — article-only prose typography (300 lines)
- [tailwind.config.js](../../../Desktop/psychage-v2/tailwind.config.js) — Tailwind extension + hardcoded brand scales (142 lines)
- [clarity-score/app/globals.css](../../../Desktop/psychage-v2/clarity-score/app/globals.css) — **entirely separate Next.js sub-app with its own parallel token system** (see §4.3)

### 1.1 Colors

**CSS-var theme channel** (`tokens.css:50-106` light, `tokens.css:108-164` dark, both via `html.light` / `html.dark`):
- `--color-background` `#F9F7F3` / `#0F0F0F`
- `--color-surface` `#F9F7F3` / `#171717` + `-hover` `-active`
- `--color-primary` `#1A9B8C` / `#20B8A6` + `-hover` `-light` — **shifts between modes**
- `--color-text-primary` `#0a0a0a` / `#fafaf9`
- `--color-text-secondary` `#57534e` / `#d6d3d1`
- `--color-text-tertiary` `#6d6762` / `#a8a29e` (with WCAG-AA note at `tokens.css:71`)
- `--color-border` `#e7e5e4` / `#3f3f46` + `-hover`
- `--color-error` `#dc2626` / `#f87171`, `--color-success` `#16a34a` / `#4ade80`, `--color-warning` `#ca8a04` / `#facc15`
- Navigator-only overlay/glass tokens at `tokens.css:82-89` and `tokens.css:150-157`
- Homepage-redesign tokens `--color-homepage-bg/content/closing/provider` at `tokens.css:101-105` and `tokens.css:159-163`
- `--color-background-warm` `#F5F5F0`, `--color-primary-bg` `#E6F5F3` at `tokens.css:97-99` (light only, **no dark equivalent**)

**Tailwind static brand scales** (`tailwind.config.js:43-83`), hardcoded hex, do not theme:
- `teal.50/100/400/500/600/700/900` — sparse scale (no 200/300/800)
- `charcoal.50→950` — 11 stops, full stone scale
- `crisis.red` `#DC2626`, `urgent.amber` `#D97706`, `watch.blue` `#2563EB`, `safe.green` `#059669`
- `relevance.high` `#1A9B8C`, `relevance.moderate` `#6366F1`, `relevance.explore` `#8B5CF6`

**shadcn-compat aliases** ([globals.css:7-48](../../../Desktop/psychage-v2/src/styles/globals.css#L7-L48)): `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`. Most re-alias `--color-*`. Used by 2 files only (see §4.3).

### 1.2 Typography

- Font families: `--font-sans: 'Inter', system-ui...`, `--font-display: 'Plus Jakarta Sans', system-ui...` ([tokens.css:3-4](../../../Desktop/psychage-v2/src/styles/tokens.css#L3-L4))
- Tailwind `fontFamily` ([tailwind.config.js:84-88](../../../Desktop/psychage-v2/tailwind.config.js#L84-L88)): `sans` → `var(--font-sans)`, `display` → `var(--font-display)`, `mono` → `'IBM Plex Mono'` (literal, **not via CSS var**)
- Fluid scale extension ([tailwind.config.js:132-136](../../../Desktop/psychage-v2/tailwind.config.js#L132-L136)): `fluid-3xl/4xl/5xl` using `clamp(...)`
- Hardcoded prose typography ([article-prose.css:7-50](../../../Desktop/psychage-v2/src/styles/article-prose.css#L7-L50)): h1 2.25rem/800/1.2, h2 1.75rem/700/1.3, h3 1.375rem/700/1.35, h4 1.125rem/600, body 1.125rem/1.85, letter-spacing -0.02em on headings. **Independent of the type scale used elsewhere.**
- Drop cap with Georgia serif at `article-prose.css:59-73` — only Georgia reference in the codebase

### 1.3 Spacing

Tailwind extension ([tailwind.config.js:89-98](../../../Desktop/psychage-v2/tailwind.config.js#L89-L98)) overrides default scale at steps `1, 2, 3, 4, 6, 8, 12, 16` with CSS vars. **Steps 5, 7, 9, 10, 11, 14, 20, 24, 32, 64 etc. remain Tailwind defaults**, so the same scale uses two sources depending on which step.

Underlying CSS vars ([tokens.css:6-22](../../../Desktop/psychage-v2/src/styles/tokens.css#L6-L22)): `--space-1=0.25rem` through `--space-16=4rem`. Match Tailwind defaults exactly for those steps — the var indirection adds zero customization today.

### 1.4 Border radius

CSS vars ([tokens.css:24-29](../../../Desktop/psychage-v2/src/styles/tokens.css#L24-L29)): `--radius-sm` 0.25rem, `-md` 0.5rem, `-lg` 0.75rem, `-xl` 1rem, `-full` 9999px. Wired to Tailwind at [tailwind.config.js:99-105](../../../Desktop/psychage-v2/tailwind.config.js#L99-L105).

shadcn-compat `--radius` ([globals.css:27](../../../Desktop/psychage-v2/src/styles/globals.css#L27)) sets `0.75rem` (= `--radius-lg`).

### 1.5 Shadows

CSS vars at [tokens.css:91-95](../../../Desktop/psychage-v2/src/styles/tokens.css#L91-L95) (light) and [tokens.css:144-148](../../../Desktop/psychage-v2/src/styles/tokens.css#L144-L148) (dark): `--shadow-sm`, `-md`, `-lg`, `-glow`. `-glow` uses `rgba(26, 155, 140, ...)` = brand teal. Tailwind wiring at [tailwind.config.js:106-111](../../../Desktop/psychage-v2/tailwind.config.js#L106-L111).

### 1.6 Motion

**Two parallel motion systems coexist:**

CSS vars ([tokens.css:31-46](../../../Desktop/psychage-v2/src/styles/tokens.css#L31-L46)):
- `--transition-fast/normal/slow` (150/300/500ms) wired to Tailwind as `transitionDuration: { fast, normal, slow }` at [tailwind.config.js:112-116](../../../Desktop/psychage-v2/tailwind.config.js#L112-L116)
- `--duration-micro/small/medium/large/xl` (150/200/300/500/700ms)
- `--ease-standard/decelerate/accelerate` cubic-beziers

JS module [src/lib/animations.ts:8-22](../../../Desktop/psychage-v2/src/lib/animations.ts#L8-L22) duplicates the same durations + eases in TS constants, with a header comment "(match CSS custom properties in tokens.css)" — manual sync. Components import from animations.ts; CSS vars `--duration-*` and `--ease-*` are unused in CSS (see §4.1).

Keyframes: `blob` (defined twice — [tokens.css:176-189](../../../Desktop/psychage-v2/src/styles/tokens.css#L176-L189) AND [globals.css:216-232](../../../Desktop/psychage-v2/src/styles/globals.css#L216-L232) with a `translate` → `translate3d` divergence); `gradient` at [globals.css:165-177](../../../Desktop/psychage-v2/src/styles/globals.css#L165-L177); `citation-flash` / `citation-flash-dark` at [article-prose.css:290-300](../../../Desktop/psychage-v2/src/styles/article-prose.css#L290-L300).

`prefers-reduced-motion` global override at [tokens.css:167-174](../../../Desktop/psychage-v2/src/styles/tokens.css#L167-L174).

### 1.7 Z-index

Not customized. No `zIndex` extension in [tailwind.config.js](../../../Desktop/psychage-v2/tailwind.config.js). Components use Tailwind defaults plus the literal `z-10` on `.bg-grain::before` at [globals.css:146](../../../Desktop/psychage-v2/src/styles/globals.css#L146).

### 1.8 Custom plugins

Single plugin: `@tailwindcss/typography` ([tailwind.config.js:139-141](../../../Desktop/psychage-v2/tailwind.config.js#L139-L141)) version `^0.5.19` (per [package.json](../../../Desktop/psychage-v2/package.json) dependencies). Typography theme override at [tailwind.config.js:123-131](../../../Desktop/psychage-v2/tailwind.config.js#L123-L131) sets `--tw-prose-links` and `-quotes-border` to literal `#1A9B8C`.

Also: custom `maxWidth` extension at [tailwind.config.js:117-122](../../../Desktop/psychage-v2/tailwind.config.js#L117-L122): `content` 80rem, `dashboard` 75rem, `admin` 87.5rem, `wide` 100rem. Custom `screens` override at [tailwind.config.js:10-17](../../../Desktop/psychage-v2/tailwind.config.js#L10-L17): adds `xs: 375px`.

---

## 2. Component inventory

### 2.1 UI primitives present

Lives at [src/components/ui/](../../../Desktop/psychage-v2/src/components/ui/) — 26 PascalCase files, **bespoke**, not raw shadcn (which uses lowercase). Built on Radix + Framer Motion + `class-variance-authority`-style local variant maps.

[Alert.tsx](../../../Desktop/psychage-v2/src/components/ui/Alert.tsx), [Badge.tsx](../../../Desktop/psychage-v2/src/components/ui/Badge.tsx), [Breadcrumbs.tsx](../../../Desktop/psychage-v2/src/components/ui/Breadcrumbs.tsx), [Button.tsx](../../../Desktop/psychage-v2/src/components/ui/Button.tsx), [Card.tsx](../../../Desktop/psychage-v2/src/components/ui/Card.tsx), [ConfirmDialog.tsx](../../../Desktop/psychage-v2/src/components/ui/ConfirmDialog.tsx), [CookieConsent.tsx](../../../Desktop/psychage-v2/src/components/ui/CookieConsent.tsx), [EmptyState.tsx](../../../Desktop/psychage-v2/src/components/ui/EmptyState.tsx), [FeedbackWidget.tsx](../../../Desktop/psychage-v2/src/components/ui/FeedbackWidget.tsx), [HighlightedText.tsx](../../../Desktop/psychage-v2/src/components/ui/HighlightedText.tsx), [Input.tsx](../../../Desktop/psychage-v2/src/components/ui/Input.tsx), [InteractiveCard.tsx](../../../Desktop/psychage-v2/src/components/ui/InteractiveCard.tsx), [Label.tsx](../../../Desktop/psychage-v2/src/components/ui/Label.tsx), [LanguageSwitcher.tsx](../../../Desktop/psychage-v2/src/components/ui/LanguageSwitcher.tsx), [Logo.tsx](../../../Desktop/psychage-v2/src/components/ui/Logo.tsx), [LogoIcon.tsx](../../../Desktop/psychage-v2/src/components/ui/LogoIcon.tsx), [Modal.tsx](../../../Desktop/psychage-v2/src/components/ui/Modal.tsx), [NotificationPrompt.tsx](../../../Desktop/psychage-v2/src/components/ui/NotificationPrompt.tsx), [PageTransition.tsx](../../../Desktop/psychage-v2/src/components/ui/PageTransition.tsx), [Pagination.tsx](../../../Desktop/psychage-v2/src/components/ui/Pagination.tsx), [ScrollManager.tsx](../../../Desktop/psychage-v2/src/components/ui/ScrollManager.tsx), [Skeletons.tsx](../../../Desktop/psychage-v2/src/components/ui/Skeletons.tsx), [SkipLink.tsx](../../../Desktop/psychage-v2/src/components/ui/SkipLink.tsx), [SocialIcons.tsx](../../../Desktop/psychage-v2/src/components/ui/SocialIcons.tsx), [ThemeToggle.tsx](../../../Desktop/psychage-v2/src/components/ui/ThemeToggle.tsx), [Typography.tsx](../../../Desktop/psychage-v2/src/components/ui/Typography.tsx).

Page-level import frequency from `src/pages/`:

| Primitive | Page imports | Variants |
|---|---|---|
| `Button` | 45 | 6 (`primary/secondary/outline/ghost/glass/danger`), 4 sizes (`sm/md/lg/xl`) — [Button.tsx:7-29](../../../Desktop/psychage-v2/src/components/ui/Button.tsx#L7-L29) |
| `Card` | 19 | 4 (`default/glass/outline/ghost`) — [Card.tsx:8-20](../../../Desktop/psychage-v2/src/components/ui/Card.tsx#L8-L20) |
| `InteractiveCard` | 11 | — |
| `Input` | 10 | — |
| `Typography` (`Display`, `Text`) | 9 | — |
| `Label` | 7 | — |
| `Badge` | 5 | — |
| `Alert` | 4 | — |
| `LogoIcon`, `Breadcrumbs` | 2 each | — |
| `Skeletons`, `Pagination`, `NotificationPrompt`, `Modal`, `FeedbackWidget` | 1 each | — |

### 2.2 Article block components (the PEAF set)

Lives at [src/components/article/blocks/](../../../Desktop/psychage-v2/src/components/article/blocks/) — 13 block components matching CLAUDE.md §6 exactly: [ArticleAccordion.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/ArticleAccordion.tsx), [ArticleCallout.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/ArticleCallout.tsx) (20 variants per [line 320](../../../Desktop/psychage-v2/src/components/article/blocks/ArticleCallout.tsx#L320)), [ArticleChart.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/ArticleChart.tsx), [ArticleTabs.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/ArticleTabs.tsx), [BeforeAfter.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/BeforeAfter.tsx), [ComparisonTable.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/ComparisonTable.tsx), [DiagramBlock.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/DiagramBlock.tsx), [HighlightBox.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/HighlightBox.tsx), [MythVsFactBlock.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/MythVsFactBlock.tsx), [ProgressSteps.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/ProgressSteps.tsx), [QuoteBlock.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/QuoteBlock.tsx), [RelatedToolsBlock.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/RelatedToolsBlock.tsx), [StatCard.tsx](../../../Desktop/psychage-v2/src/components/article/blocks/StatCard.tsx) + [shared/](../../../Desktop/psychage-v2/src/components/article/blocks/shared) folder + barrel [index.ts](../../../Desktop/psychage-v2/src/components/article/blocks/index.ts).

### 2.3 Notable layout / repeated composed components

[src/components/layout/](../../../Desktop/psychage-v2/src/components/layout/):
- [Navigation.tsx](../../../Desktop/psychage-v2/src/components/layout/Navigation.tsx) — global top nav, used by [App.tsx](../../../Desktop/psychage-v2/src/App.tsx)
- [Footer.tsx](../../../Desktop/psychage-v2/src/components/layout/Footer.tsx) — global footer
- [MobileMenu.tsx](../../../Desktop/psychage-v2/src/components/layout/MobileMenu.tsx)
- [PageLayout.tsx](../../../Desktop/psychage-v2/src/components/layout/PageLayout.tsx) — has its own `MAX_WIDTH_MAP` ([line 5-12](../../../Desktop/psychage-v2/src/components/layout/PageLayout.tsx#L5-L12)) that **conflicts with the Tailwind `max-w-*` extension** (see §4.4)
- [PageHeader.tsx](../../../Desktop/psychage-v2/src/components/layout/PageHeader.tsx) — title + subtitle + icon + actions
- [NavMenu.tsx](../../../Desktop/psychage-v2/src/components/layout/NavMenu.tsx), [NavHub.tsx](../../../Desktop/psychage-v2/src/components/layout/NavHub.tsx), [NavAssets.tsx](../../../Desktop/psychage-v2/src/components/layout/NavAssets.tsx)
- [CrisisBanner.tsx](../../../Desktop/psychage-v2/src/components/layout/CrisisBanner.tsx), [CrisisResources.tsx](../../../Desktop/psychage-v2/src/components/layout/CrisisResources.tsx)

Sidebars (per surface, not unified):
- [src/pages/dashboard/UserSidebar.tsx](../../../Desktop/psychage-v2/src/pages/dashboard/UserSidebar.tsx)
- [src/pages/admin/AdminSidebar.tsx](../../../Desktop/psychage-v2/src/pages/admin/AdminSidebar.tsx)
- [src/pages/provider/ProviderSidebar.tsx](../../../Desktop/psychage-v2/src/pages/provider/ProviderSidebar.tsx)

Surface-level repeated composed components: `ArticleCard`, `ProviderCard`, `ToolCard`, `MoodCard`, etc. live in `src/components/article/`, `src/components/providers/`, `src/components/tools/`. Not exhaustively enumerated — large surface area (481 component files total).

---

## 3. Page-to-pattern map

Routing single source: [src/App.tsx:232-377](../../../Desktop/psychage-v2/src/App.tsx#L232-L377). React Router v7 lazy routes. Global wrappers: `<Navigation>` (always), `<Footer>` (always), `<PageTransition>` (per-route), `<RouteErrorBoundary>` for sensitive pages. SSR-free; admin lives on separate domain via `<AdminRedirect>`.

**Public marketing surface — no shared layout primitive.** Each page rolls its own outer shell:
- `/` [HomePage.tsx:14](../../../Desktop/psychage-v2/src/pages/home/HomePage.tsx#L14): `<div className="relative bg-[var(--color-homepage-bg)] min-h-[100dvh]">`
- `/providers` [ProvidersLandingPage.tsx:48](../../../Desktop/psychage-v2/src/pages/providers/ProvidersLandingPage.tsx#L48): `<div className="min-h-screen bg-background">`
- `/learn/:cat/:slug` [ArticlePage.tsx](../../../Desktop/psychage-v2/src/pages/learn/ArticlePage.tsx) — bespoke article shell, imports `article-prose.css` directly at line 31
- `/login`, `/signup`, `/reset-password`, `/update-password` — bespoke gradient-mesh hero + `InteractiveCard` form ([LoginPage.tsx](../../../Desktop/psychage-v2/src/pages/auth/LoginPage.tsx))
- `/tools` [ToolsLandingPage.tsx](../../../Desktop/psychage-v2/src/pages/tools/ToolsLandingPage.tsx) — card grid; uses a local 9-color category lookup map (lines 17-27) **outside the token system**

**Dashboard surface — sidebar shell, ad-hoc.** [src/pages/dashboard/UserDashboard.tsx](../../../Desktop/psychage-v2/src/pages/dashboard/UserDashboard.tsx) etc.: `<UserSidebar>` + content area with custom inner layout per page. No `PageLayout` wrapper.

**Provider portal surface.** [src/pages/portal/](../../../Desktop/psychage-v2/src/pages/portal/) — `PortalDashboard`, `PortalProfile`, `PortalReviews`, `PortalVerification`, `PortalSubscription`, `PortalAnalytics`, `PortalSettings`. Pattern not audited per-file; shares its own portal-level wrapper.

**Admin v1 surface.** [src/pages/admin/](../../../Desktop/psychage-v2/src/pages/admin/) — direct routes, sidebar layout.

**Admin v2 surface — only consumer of `PageLayout`.** [src/pages/admin/v2/](../../../Desktop/psychage-v2/src/pages/admin/v2/) — **28 files** import `PageLayout` (`grep -c "PageLayout" src/pages/admin/v2/...`). Outside of admin-v2, `PageLayout` has zero adoption. Effectively an admin-only widget despite a generic name.

**Tool sub-app: ClarityJournal.** 3 entry files at [src/components/tools/ClarityJournal/](../../../Desktop/psychage-v2/src/components/tools/ClarityJournal/) wrap with `bg-[#F5F5F7] dark:bg-[#0a0a0a]` arbitrary values — divergent from `--color-background`.

**Separate Next.js sub-app: /clarity-score.** [clarity-score/](../../../Desktop/psychage-v2/clarity-score/) — full Next.js 15 app with its own [globals.css](../../../Desktop/psychage-v2/clarity-score/app/globals.css), own type scale (`--font-playfair`, `--font-dm-sans`), own color tokens (`--color-emotional/vitality/social/cognitive/functioning`, `--color-flag-*`), own dark navy bg `#0F172A`. **Parallel design system.**

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

6. **clarity-score sub-app is an entirely parallel design system.** [clarity-score/app/globals.css](../../../Desktop/psychage-v2/clarity-score/app/globals.css) defines its own `--color-teal`, `--color-emotional`, `--color-vitality`, `--color-social`, `--color-cognitive`, `--color-functioning`, `--color-flag-high/moderate/positive`, `--space-xs/sm/md/lg/xl/2xl` (px-based, not rem), `--font-playfair` / `--font-dm-sans`. **Default dark bg `#0F172A`** (deep navy) — does not match Psychage's `#0F0F0F`. Lives outside Slice 2 unless explicitly scoped in.

### 4.4 Inconsistent patterns

1. **No canonical public-page layout.** `PageLayout` is admin-v2-only (28 importers, all under `src/pages/admin/v2/`). Public pages each invent their own outer shell — see §3.

2. **`max-w-*` defined twice with different values:**
   - Tailwind: `max-w-content` 80rem, `max-w-dashboard` 75rem, `max-w-admin` 87.5rem, `max-w-wide` 100rem ([tailwind.config.js:117-122](../../../Desktop/psychage-v2/tailwind.config.js#L117-L122))
   - `PageLayout` local map: `wide: 'max-w-7xl'` (80rem), `xl: 'max-w-6xl'` (72rem) ([PageLayout.tsx:5-12](../../../Desktop/psychage-v2/src/components/layout/PageLayout.tsx#L5-L12)) — "wide" means 80rem in one place and 100rem in the other.

3. **Border-radius spread.** Card and surface radii in active use across components: `rounded-sm` 8, `rounded-md` 50, `rounded-lg` 431, `rounded-xl` 523, `rounded-2xl` 402, `rounded-3xl` 70, `rounded-full` 604. No documented "card radius" — different components pick different values. PageHeader icon container uses `rounded-2xl` ([PageHeader.tsx:49](../../../Desktop/psychage-v2/src/components/layout/PageHeader.tsx#L49)), Card uses `rounded-xl` ([Card.tsx:25](../../../Desktop/psychage-v2/src/components/ui/Card.tsx#L25)), Button defaults look md-ish in [Button.tsx](../../../Desktop/psychage-v2/src/components/ui/Button.tsx).

4. **Hover paradigms differ between primitives.**
   - Button: color shift only (`hover:bg-primary-hover`) — [Button.tsx:21-26](../../../Desktop/psychage-v2/src/components/ui/Button.tsx#L21-L26)
   - Card with `hoverEffect=true`: Framer Motion `glassCardHover` variant from `lib/animations` — [Card.tsx:1-13](../../../Desktop/psychage-v2/src/components/ui/Card.tsx#L1-L13)
   - `.glass-hover` utility: `hover:-translate-y-0.5` + bg + shadow — [globals.css:122-131](../../../Desktop/psychage-v2/src/styles/globals.css#L122-L131)

5. **Primary color shifts between light and dark modes** (`#1A9B8C` light → `#20B8A6` dark, [tokens.css:59-63](../../../Desktop/psychage-v2/src/styles/tokens.css#L59-L63), [:118-123](../../../Desktop/psychage-v2/src/styles/tokens.css#L118-L123)). Slice 2's `tokens.web.json` cannot represent a single brand value here — must encode the L/D pair or pick a canonical.

6. **Two `home/` directories**: `src/components/home/` (older — `hero/`, `ToolsSection.tsx`) and `src/components/home/v2/` (current — wired into `HomePage.tsx`). Pattern-version drift; `v1` may still be referenced elsewhere.

7. **Three sidebar implementations** ([UserSidebar.tsx](../../../Desktop/psychage-v2/src/pages/dashboard/UserSidebar.tsx), [AdminSidebar.tsx](../../../Desktop/psychage-v2/src/pages/admin/AdminSidebar.tsx), [ProviderSidebar.tsx](../../../Desktop/psychage-v2/src/pages/provider/ProviderSidebar.tsx)). No unified `<Sidebar>` primitive in `components/ui/`.

8. **Mood color palette is duplicated** between [QuickMoodCheckIn.tsx:13-17](../../../Desktop/psychage-v2/src/components/dashboard/QuickMoodCheckIn.tsx#L13-L17) and [FirstMoodStep.tsx:11-15](../../../Desktop/psychage-v2/src/components/onboarding/FirstMoodStep.tsx#L11-L15) — same five hexes, no shared source.

### 4.5 Deferred decisions found in comments

- [tokens.css:36](../../../Desktop/psychage-v2/src/styles/tokens.css#L36): `/* Animation Timing (sync with src/lib/animations.ts) */` — explicit duplication marker. Sync is manual.
- [tokens.css:71](../../../Desktop/psychage-v2/src/styles/tokens.css#L71): `/* Stone-500 darkened for WCAG AA (5.2:1 on #F9F7F3) */` — accessibility floor documented. Slice 2 cannot lighten `--color-text-tertiary` without re-checking AA.
- [globals.css:63-65](../../../Desktop/psychage-v2/src/styles/globals.css#L63-L65): comment says "Primary with opacity" — value is `rgba(13, 148, 136, 0.2)` ≠ brand primary. Stale.
- [src/pages/tools/ToolsLandingPage.tsx:18](../../../Desktop/psychage-v2/src/pages/tools/ToolsLandingPage.tsx#L18): `// Color mapping for Tailwind classes (can't use dynamic classes due to purging)` — workaround for Tailwind safelist limitation. Affects how color tokens can be consumed dynamically.

---

## 5. Questions for Ryan

Decisions Slice 2 cannot make without you.

1. **Primary text token: which of three is canonical?** `text-text-primary` (248 files), `text-gray-900` (374 files), or `text-foreground` (2 files). All three exist in production. Picking one means the others become migration targets — scope decision belongs to you.

2. **Brand teal: standardize the "with opacity" expression.** Three coexist: `rgba(26, 155, 140, ...)` = brand `#1A9B8C` (used in `--shadow-glow`, correct); `rgba(13, 148, 136, ...)` = Tailwind default `teal-600` `#0D9488` (used in `::selection`, blockquote bg, citation flash, admin editor, category spotlight, **mislabeled as "Primary" in globals.css:64**); `#15B8A6` (mood-great, near-brand). Should Slice 2 encode `tokens.web.json` with the canonical brand-with-opacity formula, and the wrong values become migration?

3. **Primary color L/D split:** `--color-primary` is `#1A9B8C` light, `#20B8A6` dark. `tokens.web.json` schema needs to either (a) express both as a `light`/`dark` pair, or (b) pick one as canonical and treat the other as derived. Which?

4. **"Wide" means two things.** `max-w-wide` = 100rem (Tailwind extension) vs `wide: 'max-w-7xl'` = 80rem in `PageLayout`. Same name, 20rem apart. Which is the real "wide"?

5. **Three duration systems, three sources of truth.** Tailwind aliases (`duration-fast/normal/slow`), CSS vars (`--duration-micro/small/medium/large/xl`), and JS constants in `src/lib/animations.ts` (used by everything actually moving). The first two are dead in code. Should Slice 2 (a) collapse to the JS scale only, (b) keep the CSS vars and migrate everything off `animations.ts`, or (c) preserve all three?

6. **Three never-used semantic color groups.** `urgent.amber`, `watch.blue`, `safe.green` (Tailwind config) are defined for what looks like an unbuilt severity surface. Keep, drop, or reserve for an upcoming feature?

7. **Charcoal scale vs `--color-text-*` vars.** Two parallel neutral systems with no mapping between them. Either consolidate (pick one) or document both as intentional (one for backgrounds/borders, one for text). Which?

8. **`clarity-score/` sub-app scope.** Separate Next.js 15 app with a fully parallel token system (different fonts, different teal expression, different dark bg). In or out of `tokens.web.json` Slice 2 scope?

9. **ClarityJournal off-token backgrounds.** Three files use `bg-[#F5F5F7] dark:bg-[#0a0a0a]` instead of `--color-background`. Is the lighter `#F5F5F7` a deliberate "tool surface" token that should be promoted, or drift to migrate to `--color-surface`?

10. **Mood palette: tokenize or keep ad-hoc?** Five mood colors (`#8B7FA8`, `#D4A060`, `#8FAE8B`, `#1A9B8C`, `#15B8A6`) are duplicated between two onboarding/dashboard components. Promote to a `--mood-1..5` token set or leave per-component?

11. **`PageLayout` adoption.** Today admin-v2 only. Is Slice 2 (or a later slice) responsible for making it the canonical wrapper for public pages too, or do public pages stay bespoke?

12. **Border-radius: pick a card default.** `rounded-lg` (431), `rounded-xl` (523), `rounded-2xl` (402), `rounded-full` (604) all heavily used. No documented "card radius." Should `tokens.web.json` declare one canonical surface radius, with everything else becoming an explicit override?

---

## 6. Recon meta

- **Files read (full):** 7 — tokens.css, globals.css, article-prose.css, tailwind.config.js, PageLayout.tsx, PageHeader.tsx, plus the clarity-score `globals.css` head.
- **Files sampled (head only):** ~15 — Button/Card/Modal heads, HomePage/ArticlePage/LoginPage/ProvidersLandingPage/UserDashboard/ToolsLandingPage/Navigation/Footer/animations.ts heads.
- **Files counted via grep without opening:** ~600 (component + page tree).
- **Files skipped:** all of `node_modules/`, `dist/`, `playwright-report/`, `test-results/`, `archive-manifests/`, all `.json` audit reports, all session-* HTMLs, `e2e/`, `data-pipeline/`. Out of scope for a design audit.
- **Time taken:** ~30 minutes of recon, ~25 minutes of writeup.
- **Anything that surprised me:**
  - The shadcn-compat layer at [globals.css:7-48](../../../Desktop/psychage-v2/src/styles/globals.css#L7-L48) is functionally unused in components (2 files use `text-foreground`). It's set up but nobody adopted it.
  - Default Tailwind grays (`text-gray-900`, `bg-gray-*`) win on file count over the Psychage tokens. Slice 2 will design the contract, but compliance is a separate, larger story.
  - The `clarity-score/` Next.js sub-app — pre-loaded with an entire second design language. Easy to miss; lives outside `src/`.
  - `--duration-*` and `--ease-*` CSS vars are completely dead. The "sync" comment in tokens.css is aspirational; `animations.ts` is the real source.
  - Two `blob` keyframes with different `translate` vs `translate3d` implementations, and the later-loaded one silently wins.
- **Slice 2 scope-change suggestions:**
  - **Strongly recommend Slice 2 explicitly excludes the `clarity-score/` sub-app.** Treating it in scope adds a parallel token tree without payoff for the mobile contract.
  - Slice 2's `tokens.web.json` schema needs an opinion on **L/D color pairs** (because `--color-primary` differs) and on **multi-source durations** (because three exist). Both are schema-shape decisions, not just value decisions.
  - The "drift" tier of findings (§§4.2, 4.4) is **larger than the token tier** — Slice 2 produces the contract, but a Slice 2.5 or 3 "compliance pass" will be a separate, non-trivial body of work. Worth naming explicitly so it doesn't surprise scope later.

## 7. Verification

- `psychage-v2` repo state: unchanged. Untracked scratch files (`AUDIT_REPORT_2026-05-17.md`, `cf-proxy/`) were present at audit start and not touched. No edits to any file under `/Users/raiyanabdullah/Desktop/psychage-v2/`.
- Only file created: this report.
