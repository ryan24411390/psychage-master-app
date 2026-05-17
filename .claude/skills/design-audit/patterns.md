# Anti-slop patterns — web

Catalog consumed by `/design-audit` Pass 2. Web-applicable subset of the 12-pattern master list maintained in `.claude/skills/spec-design/SKILL.md` and `Context 01.md`.

**Patterns 7 (generic 4-tab bottom nav) and 11 (haptics on primary CTAs) are mobile-only** and covered by `/mobile-design-audit` (Phase 4.B). They are skipped in this file but their numbers are reserved — do not renumber.

Each pattern entry: name, one-sentence description, detection rule with confidence level, passing snippet, failing snippet, and exception (where applicable).

Confidence levels:

- **deterministic** — text-scan rule with negligible false positives
- **heuristic** — text-scan rule that may produce false positives; pattern-recognition supplements
- **context-dependent** — requires reading surrounding code or filename context
- **manual review recommended** — no acceptable text-scan rule; flagged for human inspection

---

## Pattern 1 — Purple/cyan mesh gradient

**What it looks like:** Hero backgrounds, splash cards, or auth surfaces using the AI-stock purple-to-cyan radial or linear gradient.

**Detection rule (deterministic):** ripgrep for any of:

```
rg -nE 'from-purple-[0-9]+|to-cyan-[0-9]+|via-purple|via-cyan' --type tsx --type css
rg -nE 'bg-gradient.*purple|bg-gradient.*cyan' --type tsx
rg -nE 'linear-gradient\([^)]*purple|linear-gradient\([^)]*cyan' --type css
rg -nE 'radial-gradient\([^)]*purple|radial-gradient\([^)]*cyan' --type css
```

Any hit = pattern present.

**Passing snippet** — surface uses a brand-token gradient or a single brand colour:

```tsx
<div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-700">
  <Hero />
</div>
```

**Failing snippet:**

```tsx
<div className="bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400">
  <Hero />
</div>
```

**Exception:** None. Psychage brand is teal/charcoal. Purple/cyan gradients are not part of the contract.

---

## Pattern 2 — Glassmorphism without purpose

**What it looks like:** Translucent panels stacked over nothing meaningful — `backdrop-blur` on flat-colour surfaces, blurred cards on solid backgrounds.

**Detection rule (heuristic):** ripgrep for blur + translucent-surface utilities:

```
rg -nE 'backdrop-blur(-(sm|md|lg|xl))?' --type tsx --type css
rg -nE 'backdrop-filter:\s*blur' --type css
rg -nE 'bg-white/[0-9]+|bg-black/[0-9]+|bg-[a-z]+-[0-9]+/[0-9]+' --type tsx
```

A hit **passes** if the file contains a `@design-purpose:` line within 5 lines of the hit OR the component variant is named `glass` (e.g. `<Card variant="glass">`, `<Button variant="glass">`) — glass is a documented Card/Button variant in `DESIGN.web.md §2.1`.

Otherwise the hit is reported.

**Passing snippet** — glass variant is explicit (documented contract surface):

```tsx
<Card variant="glass">
  <MoodSummary />
</Card>
```

**Passing snippet** — purpose annotated next to the utility:

```tsx
{/* @design-purpose: floating action panel over scrolling article body */}
<div className="backdrop-blur-md bg-white/70 dark:bg-charcoal-900/70 sticky top-0">
  <ArticleTOC />
</div>
```

**Failing snippet:**

```tsx
<div className="backdrop-blur-lg bg-white/40 rounded-xl p-6">
  <h2>Welcome</h2>
</div>
```

**Exception:** documented Card/Button `glass` variant — already in the contract.

---

## Pattern 3 — Three-rounded-cards-in-a-row

**What it looks like:** Marketing or hero sections using three (or more) sibling `<Card>` / `rounded-*` containers in a single grid/flex row as the default "show me features" pattern.

**Detection rule (context-dependent):** AST-style heuristic via ripgrep + manual confirmation. Flag files that contain BOTH:

- `grid-cols-3` or a flex container with `gap-` and 3+ sibling cards on a top-level marketing/hero/landing surface
- Three or more sibling `<Card`, `<InteractiveCard`, or `rounded-(xl|lg|2xl)` containers

```
rg -n 'grid-cols-3' src/pages/ -g '!**/admin/**' -g '!**/dashboard/**' -g '!**/portal/**'
rg -nC2 '<Card|<InteractiveCard|rounded-(xl|lg|2xl)' <flagged-file>
```

Pass if the surface is a list/grid context that genuinely has N entities (provider directory, article list, tools hub). Fail if the surface is a top-level marketing splash with exactly three feature cards.

**Confidence note:** heuristic — full disambiguation requires reading the surrounding section purpose. Auditor must flag-then-review for marketing files.

**Passing snippet** — provider directory list (genuine grid of N):

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
</div>
```

**Failing snippet** — landing page splash:

```tsx
<section className="grid grid-cols-3 gap-8">
  <Card><h3>Learn</h3><p>Articles</p></Card>
  <Card><h3>Find care</h3><p>Providers</p></Card>
  <Card><h3>Track</h3><p>Tools</p></Card>
</section>
```

**Exception:** any non-marketing context where the cards represent real, dynamic data of N items (N=3 is incidental, not designed).

---

## Pattern 4 — Inter as default

**What it looks like:** Raw `font-family: Inter` declarations or `font-sans` Tailwind utility used without the type-token indirection.

**Detection rule (heuristic):** ripgrep:

```
rg -nE 'font-family:\s*["\']?Inter' --type css --type tsx
rg -n 'font-sans' --type tsx
rg -n 'fontFamily.*Inter' --type tsx --type ts
```

A hit **passes** if any of:

- Used via `type.family.sans` token reference / CSS var (`var(--font-sans)`, `font-family: var(--font-sans)`)
- A `@brand-font` comment within 5 lines of the hit explicitly notes Inter is the intentional brand sans
- File is `tailwind.config.js` or `src/styles/tokens.css` — the token-definition sources

Otherwise reported.

**Passing snippet:**

```tsx
{/* @brand-font: Inter is the Psychage brand sans per DESIGN.web.md §1.2 */}
<p className="font-sans text-charcoal-900">Educational content body.</p>
```

**Passing snippet** — via token var:

```css
.body {
  font-family: var(--font-sans);
}
```

**Failing snippet:**

```css
.headline {
  font-family: Inter, sans-serif;
  font-weight: 600;
}
```

**Exception:** Psychage uses Inter as the brand sans (documented in `DESIGN.web.md §1.2`). Hits with the `@brand-font` annotation or token reference are passing; raw declarations without indirection are still drift.

---

## Pattern 5 — Hardcoded shadow values

**What it looks like:** Inline `box-shadow:` declarations with raw rgb/rgba/px values; Tailwind arbitrary-shadow classes (`shadow-[...]`); inline style objects with `boxShadow` literals.

**Detection rule (deterministic):** ripgrep:

```
rg -nE 'box-shadow:\s*[0-9]' --type css --type tsx
rg -nE 'shadow-\[' --type tsx
rg -nE 'boxShadow:\s*["\']' --type tsx --type ts
```

Any hit = drift, unless the file is `src/styles/tokens.css` (definition source).

**Passing snippet:**

```tsx
<Card className="shadow-md">
  <Content />
</Card>
```

**Passing snippet** — token reference in CSS:

```css
.elevated {
  box-shadow: var(--shadow-lg);
}
```

**Failing snippet:**

```tsx
<div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
  <Card />
</div>
```

**Exception:** None. All shadows reference `shadow.{sm,md,lg,glow}` per `tokens/web.tokens.json`.

---

## Pattern 6 — Decorative spark-lines

**What it looks like:** Inline `<svg>` with a single `<polyline>` or generic `<path>` used as a decorative visual flourish in a non-chart context.

**Detection rule (heuristic):** ripgrep for inline SVG containing `<polyline>` or short single `<path>` in files that do NOT import a charting library:

```
rg -ln '<polyline' --type tsx
rg -ln '<svg[^>]*>.*<path[^>]*d="' --type tsx
# For each hit file, check it does NOT import recharts/d3/victory:
rg -L 'from ["\'](recharts|d3|victory)' <hit-files>
```

Reports files with inline polyline/path in non-charting components.

**Confidence note:** heuristic — false positives on icon components are likely; the rule recommends manual confirmation for any `<svg>` outside `src/components/ui/Logo*`, `src/components/icons/`, or a Lucide import.

**Passing snippet** — chart in context:

```tsx
import { LineChart, Line } from 'recharts';

<LineChart data={moodHistory}>
  <Line type="monotone" dataKey="score" stroke="var(--color-primary)" />
</LineChart>
```

**Passing snippet** — icon via library:

```tsx
import { Activity } from 'lucide-react';

<Activity className="text-text-secondary" aria-hidden />
```

**Failing snippet** — decorative inline spark-line in a hero:

```tsx
<svg viewBox="0 0 100 30" className="opacity-50">
  <polyline points="0,20 20,15 40,18 60,8 80,12 100,5" stroke="currentColor" fill="none" />
</svg>
```

**Exception:** `src/components/ui/Logo.tsx`, `src/components/ui/LogoIcon.tsx`, anything under `src/components/icons/`, components that import a charting library.

---

## Pattern 7 — Generic 4-tab bottom nav (mobile-only)

Covered by `/mobile-design-audit`. Skipped in this file. Pattern number reserved.

---

## Pattern 8 — Card-list-everywhere

**What it looks like:** Pages where the dominant layout pattern is a vertical stack of `<Card>` components, regardless of the underlying content type.

**Detection rule (heuristic):** count `<Card`, `<InteractiveCard` instances per file via ripgrep:

```
rg -c '<Card[^A-Za-z]|<InteractiveCard' <file>
```

Flag the file if:

- count is ≥ 3
- AND the file has no other primary content layout (no `<ArticleChart>`, no `<ComparisonTable>`, no `<ProgressSteps>`, no grid of non-Card primitives)

**Confidence note:** heuristic — false positives on legitimate card lists (dashboard widgets, provider directory). Auditor reads the surface's purpose: if the cards are wrapping heterogeneous content types rather than a list of like entities, it's drift.

**Passing snippet** — dashboard widgets, each card has a distinct content type:

```tsx
<div className="space-y-6">
  <Card><ClarityScoreSummary /></Card>
  <ProgressSteps current={2} steps={onboarding} />
  <ArticleChart data={moodHistory} />
</div>
```

**Failing snippet** — every section wrapped in a Card "just because":

```tsx
<div className="space-y-4">
  <Card><h2>Headline</h2></Card>
  <Card><p>Intro paragraph...</p></Card>
  <Card><img src="..." /></Card>
  <Card><Button>Continue</Button></Card>
</div>
```

**Exception:** dashboards or directories where each card represents a distinct entity of the same type (provider cards, article cards, widget cards).

---

## Pattern 9 — Sad-emoji empty states

**What it looks like:** Empty-state UI using sad/blank/disappointed emoji or "Nothing here yet" copy as the empty signal.

**Detection rule (deterministic):** ripgrep for the emoji set and the canonical copy pattern:

```
rg -nE '😢|😞|😔|😭|🥺|💔|🙁|☹️' --type tsx --type ts
rg -niE 'nothing here yet|no [a-z]+ found yet|oops[!.]|sad to see' --type tsx
```

Any hit = drift.

**Passing snippet** — uses `EmptyState` primitive with calm copy and recoverable action:

```tsx
<EmptyState
  illustration="clay-figure-rest"
  title="No entries this week"
  body="Your first entry will appear here."
  action={<Button onClick={openNew}>Add an entry</Button>}
/>
```

**Failing snippet:**

```tsx
<div className="text-center py-12">
  <p className="text-4xl">😢</p>
  <p>Nothing here yet</p>
</div>
```

**Exception:** None.

---

## Pattern 10 — JS-thread animations (adapted for web)

**What it looks like:** Heavy animation libraries imported for animations a CSS transition could handle.

**Detection rule (heuristic):** ripgrep for animation-library imports in files where the surrounding animation is trivial (simple opacity or transform):

```
rg -n "from ['\"]framer-motion['\"]" --type tsx
rg -n "from ['\"]gsap['\"]" --type tsx
rg -n "from ['\"]lottie-react['\"]|from ['\"]@lottiefiles" --type tsx
```

For each hit, the auditor reads the surrounding code. Flag if the animation is `opacity` or simple `transform` only — those belong in Tailwind `transition-` utilities + `animations.ts` durations rather than a library import.

**Confidence note:** heuristic, **low priority** — Framer Motion is the documented animation library for non-trivial motion in psychage-v2 (`src/lib/animations.ts` exports Framer-shaped easing arrays). Most hits are legitimate. The pattern catches the rare case where Framer is imported for a 200ms opacity fade.

**Passing snippet** — Framer used for a layout-shifting transition:

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { duration, easing } from '@/lib/animations';

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 'auto' }}
      transition={{ duration: duration.medium, ease: easing.standard }}
    >
      <Content />
    </motion.div>
  )}
</AnimatePresence>
```

**Failing snippet** — Framer imported for a fade that Tailwind handles:

```tsx
import { motion } from 'framer-motion';

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  <p>Hello.</p>
</motion.div>
```

**Exception:** any animation that crosses layout (height/width auto, FLIP, drag, gesture) legitimately needs Framer.

---

## Pattern 11 — Missing haptics on primary CTAs (mobile-only)

Covered by `/mobile-design-audit`. Skipped in this file. Pattern number reserved.

---

## Pattern 12 — Missing `prefers-reduced-motion`

**What it looks like:** Animation/transition utilities or animation-library usage in a file without any reduced-motion accommodation.

**Detection rule (context-dependent):** for each file that contains motion code, confirm a reduced-motion path exists.

Detect motion usage:

```
rg -nE 'transition[-:]|animation[-:]|animate-' --type tsx --type css
rg -n "from ['\"]framer-motion['\"]" --type tsx
```

For each hit file, confirm at least one of:

- `useReducedMotion` import from `framer-motion` or `@/hooks/useReducedMotion`
- `@media (prefers-reduced-motion: reduce)` rule (in file or imported stylesheet)
- File is covered by `src/styles/tokens.css:167-174` global override (applies to all `transition`/`animation` CSS utilities — pure-CSS motion files inherit this)
- Animation is a Tailwind `transition-*` utility only (the global CSS override at `tokens.css:167-174` already neutralises these — pass)
- File imports from `src/lib/animations.ts` (canonical motion source already opts into the global override)

Flag files using `framer-motion` / `gsap` / `lottie` with no `useReducedMotion` hook and no imported motion-aware util.

**Confidence note:** context-dependent — the global CSS override at `tokens.css:167-174` catches CSS-driven motion repo-wide, so the rule focuses on JS-library animations that bypass CSS. Auditor confirms by reading the file.

**Passing snippet:**

```tsx
import { motion, useReducedMotion } from 'framer-motion';
import { duration } from '@/lib/animations';

function Hero() {
  const reduce = useReducedMotion();
  return (
    <motion.h1
      initial={reduce ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: duration.medium }}
    >
      Welcome
    </motion.h1>
  );
}
```

**Failing snippet** — Framer-driven motion with no reduce path:

```tsx
import { motion } from 'framer-motion';

function Hero() {
  return (
    <motion.h1
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Welcome
    </motion.h1>
  );
}
```

**Exception:** files using only Tailwind `transition-*` utilities (covered by the global override) and files importing only from `src/lib/animations.ts` for static easing/duration constants.
