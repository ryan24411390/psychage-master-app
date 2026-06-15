# ADR 003 — Mobile article content source + the Learn read-foundation contract

Status: Accepted (2026-06-15)
Date: 2026-06-15
Scope: `apps/mobile` Learn/article read-path — the frozen contract downstream lanes consume.

## Context

A "Wave 0" task set out to stand up the mobile article read-foundation from scratch (wire Supabase,
port types/services, decide the content-source reality, freeze a renderer dependency) as a
serialization gate before four downstream Learn lanes branch.

Reconnaissance showed the prompt was **stale**: the foundation already exists and is merged to `main`
(commits `0188c5c`, `190304b`; PR #79 `feat/native-article-reader`; Learn redesign `ca1c5f6`), with
6+ live consumers and several "lanes" already partly shipped. `apps/mobile/.env` is populated; the
read-path, the HTML→native renderer, and the routes all exist.

This ADR therefore **documents the in-force architecture as the canonical contract** and records the
two decisions that were still open, rather than rebuilding anything. It also covers the only genuine
gaps closed in the same change: two read functions and a fixtures file (see Decision §4, §7).

### Evidence — the content reality (queried live, anon, 2026-06-15)

Against the shared project `ozourhqyqtpppvpbhphw`, table `public.articles`:

- **1,203** rows at `status='published'`. Sampled 1,000: **100%** have a non-empty `content`,
  **100%** have `content` length ≥ 1500 chars, **100%** `content_format='html'`.
- Body length: **min 1,590 · median ~30,032 · max 117,321** chars.
- `featured=true` published rows: **6**.
- `article_categories`: **48** rows, anon-readable.
- Representative body markup (verbatim):
  ```html
  <div id="introduction" class="scroll-mt-32"><p class="lead text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">…</p>
  <p class="mb-6">… <button type="button" id="citation-ref-1" class="… text-teal-600 …">1</button> …</p>
  ```

The web app authors rich articles as local JSX and *prefers* that JSX at render time — but the
database `content` column has been backfilled with the equivalent rich **HTML** for the entire
published corpus. That JSX preference is a **web-only authoring artifact**; mobile never had it and
reads the DB HTML directly.

## Decision

### 1. Reality A — render the DB `content` HTML directly
≥90% threshold met decisively (100% rich HTML). Mobile renders `articles.content` verbatim through a
native HTML→PEAF-block renderer. **No** JSX-mock pipeline, **no** backfill lane, **no** Sanity
(dormant per root CLAUDE.md §6).

### 2. Path manifest — the canonical layout lanes consume (do NOT duplicate)
- **Anon client:** `apps/mobile/lib/supabase.ts` → `getSupabaseClient()` (read-only; null on missing env).
- **Data layer:** `apps/mobile/lib/articles/{repo,mapper,types,ranking,index}.ts`.
- **Renderer:** `apps/mobile/features/content/{ArticleReader,ArticleListCard,ReviewedByCredit}.tsx`,
  `blocks/{ArticleBody.tsx,theme.ts}`, `html/{parse,ast,classify,tailwind}.ts`.
- **Hub / category UI:** `apps/mobile/features/learn/{LearnView,CategoryArticlesView,CategoryStillLife,categories,copy}.tsx`.
- **Routes:** `apps/mobile/app/(tabs)/learn.tsx`, `apps/mobile/app/learn/[category].tsx`,
  `apps/mobile/app/article/[slug].tsx`.
- **Fixtures:** `apps/mobile/features/learn/fixtures/sample-articles.ts`.

**Public read API** (`@/lib/articles`) — the surface lanes call:
| Function | Returns |
|---|---|
| `getArticleBySlug(slug)` | `ArticleDetail \| null` |
| `listArticlesByCategorySlugs(slugs)` | `ArticleListItem[]` |
| `getFeatured(limit = 6)` | `ArticleListItem[]` — NEW (§4) |
| `getRelatedArticles(slug, categorySlug, tags?, limit = 3)` | `ArticleListItem[]` — NEW (§4) |

plus types `ArticleListItem`, `ArticleDetail` and `ARTICLE_AUTHOR_NAME` / `ARTICLE_AUTHOR_ROLE`.
Every read swallows errors → empty/`null` (no-client / offline / query error = "no content"; never
throws, never blocks crisis).

### 3. HTML contract mobile renders
Source of truth: `features/content/html/classify.ts` + `tailwind.ts` + `blocks/ArticleBody.tsx`. The
renderer parses the verbatim HTML to a node tree and maps by tag + class/role/attr signature.
Anything unrecognized degrades to a `generic` pass-through so **prose is never dropped**.

- **Block tags:** `p`, `h1`–`h6`, `ul`, `ol`, `blockquote`, `table`(+`thead/tbody/tr/th/td`),
  `figure`/`figcaption`, `img`, `svg`, and container `div/section/aside/article/main`.
- **Container signatures:** callout = `border-l-* ` + `bg-*`; card = `rounded*` + (`border*`|`bg-*`)
  + (`p-*`|`px-*`|`py-*`); tabs = descendant `role=tablist|tabpanel`; accordion = direct child with
  `data-state="open|closed"` wrapping a trigger `button`.
- **Inline:** `strong/b`, `em/i`, `a` (opens via `Linking`), `br`, `span/sup/sub/code/mark/small/u`,
  and citation markers `<button id="citation-ref-N">` (rendered as a small teal inline marker).
  Decorative inline `svg` is dropped (prose carries meaning).
- **Tailwind subset honored:** `text-center|right|left`, `italic`, `font-bold|semibold|extrabold`,
  `lead` (intro paragraph). Colour is owned by the app palette; callout **tone** is derived from a
  colour keyword in the classes (teal/emerald/green→teal, amber/yellow/orange→amber,
  red/rose/pink→rose, purple/violet/indigo→violet, blue/sky/cyan→sky, else neutral).
- **Skipped at block level:** `input`, `nav`, `form`, `iframe`.
- **SVG** (icons, diagrams, charts authored as inline `<svg>`) renders verbatim via `react-native-svg`.

### 4. Block list — implemented vs fallback
| Prompt block | Mobile status |
|---|---|
| callout | ✅ `CalloutBlock` (tone-derived left-accent box) |
| key-facts | ⚠️ no dedicated block — arrives as a card/list in the HTML, renders as `card`/`generic` (prose preserved) |
| citations / references | ✅ inline `citation-ref` markers; an end-of-article reference list renders as a `ul`/`ol` |
| chart (static fallback) | ⚠️ inline `<svg>` charts render verbatim; web `<div data-chart-block …>` charts are NOT chart-rendered — they degrade to `generic` (caption/prose preserved, never crash) |
| tabs (stacked fallback) | ✅ `TabsBlock` — horizontal pill selector + single stacked panel |
| accordion | ✅ `AccordionBlock` — native collapsible |
| inline image | ✅ `ImageBlock`/`FigureBlock` (+caption); missing image renders nothing (a gap, never invented) |

### 5. Renderer dependency — frozen on `node-html-parser`
`node-html-parser` (already in `apps/mobile/package.json`, pure-JS, New-Architecture-clean) is the
chosen parser. The candidate `react-native-render-html` is **NOT** adopted: the bespoke
`classify → native PEAF block` renderer delivers on-brand styling and PEAF parity a generic HTML
renderer cannot. **This gate adds no dependency** — `package.json`/`pnpm-lock.yaml` are unchanged.

### 6. No paginated `getAll`
`listArticlesByCategorySlugs` fetches a single ≤1000-row page; the largest curated card spans ~600 of
the 1,203 published rows, so one page suffices. Pagination is deferred until a surface needs >1000 rows.

### 7. New read functions + fixtures (closed in this change)
- `getFeatured(limit = 6)` — published + `featured=true`, newest first (for a hub "Featured" rail).
- `getRelatedArticles(slug, categorySlug, tags?, limit = 3)` — web-parity heuristic: same-category
  pool ranked by shared tags (pure `rankBySharedTags` in `lib/articles/ranking.ts`, unit-tested),
  then a newest-first cross-category backfill so small categories still fill the rail. The
  `related_article_ids` column exists and is a **deferred** future precision upgrade (needs
  id→slug resolution).
- Fixtures `features/learn/fixtures/sample-articles.ts` (`sampleArticleDetail`, `sampleArticleDetails`,
  `sampleArticleList`) — three real published bodies, verbatim, so hub/reader lanes and their tests
  build without live data.

### 8. Deferred (do not build until a surface needs it)
- **`categoryService`** (live `article_categories` fetch) — categories are curated client-side in
  `features/learn/categories.ts` by design; the 48 DB categories are intentionally not all surfaced.
- **Structured `Category` / `Citation` types** — citations live inline in the HTML and render from it;
  no structured arrays on mobile.

## Consequences

- Downstream lanes import `@/lib/articles` (read fns + types) and `@/features/content` (`ArticleReader`,
  `ArticleListCard`, `ArticleBody`). They MUST NOT create a parallel `features/learn/services` stack —
  that would duplicate the shipped foundation and fork the read-path.
- No user-facing copy is introduced here; article bodies render verbatim and were clinician-reviewed at
  the source, so the Dr. Dobson copy gate is N/A for this data-layer ADR. Any new UI copy a lane adds
  carries its own review.
- Sacred Rules honored: anon read-only of public education content (no PII, no symptom data); Rule #7
  (`seo_description`, never `description`) is enforced in `mapper.ts`.
