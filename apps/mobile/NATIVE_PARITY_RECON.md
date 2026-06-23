# Native Parity Recon — W1–W4 baseline

> **READ-ONLY recon.** This document maps the current native baseline for four web capabilities
> being brought to the Psychage native app (Expo 54), all targeting TRUE-NATIVE (no WebView).
> Every finding is `file:line`-verified and/or probed live against Supabase `ozourhqyqtpppvpbhphw`
> via the public anon key (PostgREST count). Nothing here is fixed — gaps become later prompts.
>
> Probed: **2026-06-23**.

Workstreams:
- **W1** — full article-catalog reachability (every published article browsable + searchable)
- **W2** — Learn-tab topic-index IA (3-group switcher → ~30 category cards w/ pictogram posters)
- **W3** — conditions surface (113-entity / 20-family taxonomy + condition→article links)
- **W4** — discovery/wayfinding (interest-finder, dynamic Home rails, dynamic search, Navigator→content) over a shared signal→content map

---

## 🚨 Biggest gap (read this first)

**Native browse runs off a hardcoded 30-category constant (`CONTENT_CATEGORIES` in
`packages/shared/peaf/content-architecture.ts`) while the live catalog spans 48 categories /
1961 published articles. 270 published articles (≈14%) live in 18 categories the constant omits —
entirely unreachable by browse, findable only via a 40-result substring search.**

Heavy clinical topics are among the orphaned categories: `eating-body`, `substance-addiction`,
`ocd-related`, `neurodivergence-adhd-autism`, `trauma-ptsd`, `children-adolescents`,
`neurodevelopmental`. Compounding factors: zero pictogram posters (every card renders a gradient
fallback), and Navigator results dead-end with no content deep-links.

**Highest-leverage fix:** make the Learn taxonomy + data layer DB-driven. `listPopulatedCategories()`
already exists in `lib/articles/repo.ts`, is unused, and returns every populated category.

---

## W1 — Article catalog reachability

**Data layer:** `apps/mobile/lib/articles/repo.ts` (all article queries).
**Client:** `apps/mobile/lib/supabase.ts` — anon, read-only (`persistSession: false`, no auto-refresh),
env `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Returns `null` if env absent (graceful offline).
**Table:** `public.articles`. App-level guard (NOT a DB RLS policy) applied on every browse/search query:
`.eq('status','published')` + `.not('content','is',null)` + `.neq('content','')`.

### Query inventory (`lib/articles/repo.ts`)

| Function | Lines | Cap | Purpose |
|---|---|---|---|
| `listPopulatedCategories()` | 46–61 | — | DB-driven category list (`article_categories`, published count > 0). **EXISTS BUT UNUSED by the Learn UI** |
| `listArticlesByCategorySlug(slug, page, 20)` | 69–93 | 20/page (paginated) | category browse — reaches all in-category articles via infinite scroll |
| `listArticlesByCategorySlugs(slugs)` | 100–120 | **`.limit(1000)`** | topic rails + interest recommendations |
| `listRecentArticles(limit)` | 131–148 | caller-supplied (14 / 6 / 4) | home featured / most-read |
| `getArticleBySlug(slug)` | 151–166 | single | article detail read |
| `getFeatured(limit)` | 172–190 | 6 | featured rail |
| `searchArticles(query, 40)` | 199–222 | **`.limit(40)`**; `.or('title.ilike.%…%, seo_description.ilike.%…%')` | search |
| `getRelatedArticles(...)` | 230–274 | pool 12 → return 3 | related-articles rail |
| `listArticlesBySlugs(slugs)` | 281–296 | `.limit(1000)` | bookmark read-back |

No hardcoded/curated/seeded article subset. No status filter beyond `published`. Caps are fetch-size
limits, not corpus filters — **except** that browse is gated by the 30-category constant (below).

### Live counts (anon key, PostgREST `count=exact`)

| Metric | Count |
|---|---|
| `articles` published | **1961** (every row is published — no drafts) |
| published + content not null + not empty | 1961 |
| published in the **30 native-browsable** categories | **1691** |
| published in the **18 orphan** categories (in DB, not in constant) | **270** |
| published with null category | 0 |
| featured & published | 8 |
| `article_categories` total | **48** |
| `conditions` table rows | 5 (legacy stub — see W3) |

### Delta

**1961 published − 1691 browsable = 270 published articles (13.8%) unreachable via native Learn browse.**
They live in 18 categories the `CONTENT_CATEGORIES` constant omits:

```
children-adolescents, chronic-illness-disability, depression-mood, eating-body,
financial-wellness, global-cultural, life-transitions, neurodevelopmental,
neurodivergence-adhd-autism, ocd-related, relationships-social, self-esteem-identity,
sleep-circadian, sports-exercise-psychology, substance-addiction, therapy-treatment,
trauma-ptsd, workplace-academic
```

All 30 constant slugs DO exist in the DB's 48, so the gap is purely additive — the DB has 18 more
categories than native exposes. (Note: the DB taxonomy also has near-duplicate slugs the constant
resolves differently, e.g. `depression-mood` vs `depression-grief`, `trauma-ptsd` vs `trauma-healing`,
`sleep-circadian` vs `sleep-body-connection` — those duplicate-topic articles are split across a
browsable and an orphan slug.)

### Search reach

`searchArticles` runs a **real Supabase query over the full corpus** (not a client-side filter over a
pre-fetched list), but matches only `title` / `seo_description` substring (`ilike`), capped at **40
results**. Orphan-category articles surface ONLY when their title/seo literally contains the typed term.
No semantic, category, or condition routing. So search does not close the browse gap.

---

## W2 — Learn-tab IA matrix

| # | Surface | Status | Native / WebView | Evidence |
|---|---|---|---|---|
| 1 | 3-group topic switcher → ~30 cards w/ live count | **ABSENT** | native | `features/learn/LearnView.tsx:141–161` renders a flat 30-item list + a separate 6-tile "Browse by topic" grid. No group headers (Conditions / Wellness / Life). |
| 2 | Category landing: vertical article LIST + sort/filter sheet | **PARTIAL** | native | Vertical list ✓ `features/learn/CategoryArticlesView.tsx`. Sort/filter exist only as inline controls in `features/learn/BrowseView.tsx:100–188`, not a per-category sheet. |
| 3 | Reader breadcrumb ("Group › Category") + back w/ scroll restore | **ABSENT** | native | `features/content/ArticleReader.tsx:111–127` — back works (`router.back`/`goBackOr`), but no breadcrumb and no scroll-restore tracking. |
| 4 | Search: full-screen + chips + persistent KB + explicit submit + title/condition relevance | **PARTIAL** | native | `features/learn/SearchView.tsx` — full-screen ✓, auto-focus keyboard ✓, debounced 250ms. NO chips, NO explicit submit (live debounce), NO condition relevance (title/seo only). |
| 5 | Rich-hub Home: featured hero + curated collections + recommended + continue-reading rails | **PRESENT** | native | `components/home/HomeView.tsx` + `components/home/rails/*` (PickUpRail, SavedRail, TopicRail ×6, MostRead, CareAndLearning, ToolsBento). |
| 6 | Interest-finder sheet; Tools bento grid | **PARTIAL** | native | Interest-finder is an ONBOARDING screen (`features/onboarding/InterestPickView.tsx`), not a home sheet. Tools bento ✓ `components/home/ToolsBento.tsx`. |

### Card visuals

**No pictogram posters anywhere.** `features/learn/ArtPanel.tsx` renders a real `hero_image_url` when
present, otherwise a deterministic token gradient (hash → 6-panel palette, `art.ts`). It never loads
`article-images/category-covers/{slug}.jpeg`.

- Category tiles (`features/learn/TopicTile.tsx`) draw from a **hardcoded** `LEARN_CATEGORIES` array
  (6 curated + "More", `features/learn/categories.ts`) — gradient only, no live count in the tile.
- Article cards are adaptive (DB-driven, real hero or gradient).

Shared card primitives (W2/W4 chokepoints): `ArtPanel` (base) · `ArticleCard` (16:10) ·
`ArticleListCard` (16:9) · `FeaturedCard` (16:10, rich meta) · `ReadRow` (1:1 thumbnail) ·
`TopicTile` (4:3).

### WebView surfaces flagged

| Surface | Route | File | Verdict |
|---|---|---|---|
| **Library** (full article content) | `/library` | `app/(tabs)/(learn)/library/index.tsx` → `WebViewSurface` | **WebView — this is what native W1/W2 replaces** |
| **Library search** | `/library/search` | `app/(tabs)/(learn)/library/search.tsx` → `WebViewSurface` | **WebView** |
| Med Tracker | `/compass/tools/med-tracker` | `WebViewSurface` | WebView (out of W1–W4 scope) |

Chrome: `features/webview/WebViewSurface.tsx`. Navigator, Clarity Score, Sleep Architect, and MindMate
are all NATIVE (not WebView).

---

## W3 — Conditions

**Verdict: a native conditions surface EXISTS, but the 113-entity / 20-family taxonomy is NOT readable
from the DB and there is no condition→article deep-link.**

Two distinct features:

1. **`features/conditions/`** + routes `/conditions`, `/conditions/[slug]` — native overview.
   - `ConditionsLibraryView` lists condition-focused categories; `ConditionDetailView` shows a reviewed
     summary + sub-topics from `features/conditions/data/condition-summaries.ts` (verbatim web port).
   - Taxonomy is filtered in `features/conditions/select.ts:1–62` from `CONTENT_CATEGORIES` where
     `navigatorConditions.length > 0` (20 of the 30 categories).
2. **`features/conditions-reference/`** — the ICD-11 A–Z reference (per project memory) that reads the
   `conditions` table.

**Taxonomy data path:** the live `conditions` table holds **5 legacy stub rows** (`id` = `anxiety`,
`depression`, … each with `article_id` 1/2, `category: null`, `is_active: true`) — NOT the
113-entity/20-family taxonomy. The real taxonomy is in-memory: `CONTENT_CATEGORIES.navigatorConditions`
plus the vendored navigator knowledge base (712 maps, `features/navigator/knowledge-base.ts`).

**`linked_condition_ids` (or any article↔condition link column) is referenced NOWHERE in native code.**
Articles carry `category_id` only. Condition→article today: condition detail → "Browse articles in the
library" → `/library` (WebView), with no condition parameter passed.

---

## W4 — Discovery / wayfinding matrix

| Q | Capability | Status | Where / detail |
|---|---|---|---|
| a | Interest-finder (P18 first-run picker) | **PRESENT** (native) | `app/onboarding/interests.tsx` + `features/onboarding/InterestPickView.tsx`. Multi-select over all 30 categories. Signal stored **ON-DEVICE (MMKV)** via `lib/persistence/personalization.ts` (key `mobile:personalization`, schema v2, `interests: readonly string[]`). **NOT Supabase ✓** |
| b | Home rails — fixed or signal-driven? | **SIGNAL-DRIVEN (partial)** | `components/home/rails/MostRead.tsx` reads interests → `listArticlesByCategorySlugs`, falls back to `listRecentArticles`. `components/home/rails/TopicRail.tsx` is curated (6 `LEARN_CATEGORIES`) with a **live "N guides" count** from the catalog. Cards render gradients, not posters. |
| c | Search dynamism | **TITLE/SEO ONLY** | `features/learn/SearchView.tsx` + `repo.searchArticles` — no query→category/condition mapping, can't reach conditions, reaches all-category articles only on literal title/seo match (cap 40). |
| d | Navigator → content routing | **DEAD-END** | `features/navigator/screens/ResultsScreen.tsx` + `app/navigator.tsx:82–84`. Results offer only generic CTAs: `/learn` (Learn tab), `/find` (Find Care), `/tools/mood-journal`. No article/condition/category deep-link; no params passed. A condition→category reverse map (`navigatorConditions[]`) EXISTS but is unused for routing. |

**Shared signal→content map: ABSENT.** Each surface maps independently — interest-finder, MostRead,
Learn rail, search, and Navigator each load personalization / query articles on their own. The closest
seed is `features/learn/category-route.ts` `categoryHref()` (condition-focused → `/conditions/[slug]`,
else → `/learn/[slug]`), and it is consumed only by the "All categories" list in `LearnView`.

---

## Cross-cutting — shared read layer

`lib/supabase.ts` exposes a single anon, read-only client. Tables read by native: `articles`,
`article_categories`, `conditions`. Guard is the app-level `status = 'published'` filter (anon SELECT is
permitted by RLS). **`check_ins` / ADR-001 are out of scope and untouched by this recon.**

---

## Chokepoint map (foundation-first → parallel surfaces)

Files the eventual W1/W2/W3/W4 builds will share. Build the foundation first, then surfaces can run in
parallel (one per worktree) without colliding.

### Foundation (shared by all four workstreams)
- `apps/mobile/lib/articles/repo.ts` — the data layer. Raise/remove caps; add condition-aware and
  DB-driven category queries. `listPopulatedCategories()` is already here and unused.
- `packages/shared/peaf/content-architecture.ts` — the 30-category constant; the taxonomy
  source-of-truth. Expand, or replace with a DB-driven list.
- `apps/mobile/lib/supabase.ts` — the read client.

### Surface-owned (parallel-eligible once foundation lands)
- **Learn shell / IA:** `features/learn/LearnView.tsx` (flat list today; 3-group switcher target).
- **Category data source:** decide `CONTENT_CATEGORIES` constant vs `listPopulatedCategories()`; wire UI to one.
- **Card primitives:** `features/learn/ArtPanel.tsx` (poster slot) + `ArticleCard` / `ArticleListCard` /
  `FeaturedCard` / `ReadRow` / `TopicTile`.
- **Home:** `components/home/HomeView.tsx` (frozen shell) + `components/home/rails/*`.
- **Search:** `features/learn/SearchView.tsx` + `repo.searchArticles`.
- **Conditions:** `features/conditions/*` + `data/condition-summaries.ts` + `select.ts`.
- **Navigator routing:** `features/navigator/screens/ResultsScreen.tsx` + `app/navigator.tsx` (outbound links).
- **Signal map (W4 primitive — to create):** no file exists yet; `features/learn/category-route.ts` is the seed.

---

## Reproduce the counts

PostgREST probes against `https://ozourhqyqtpppvpbhphw.supabase.co/rest/v1` with the public anon key
(`Prefer: count=exact`, `Range: 0-0`):

```
# total published
GET /articles?select=id&status=eq.published                       → 1961

# in the 30 native-browsable categories (inner join on article_categories.slug)
GET /articles?select=id,category:article_categories!inner(slug)
    &status=eq.published&category.slug=in.(<30 constant slugs>)    → 1691

# in the 18 orphan categories
GET /articles?select=id,category:article_categories!inner(slug)
    &status=eq.published&category.slug=in.(<18 orphan slugs>)      → 270

GET /article_categories?select=id                                  → 48
GET /conditions?select=id                                          → 5
```
