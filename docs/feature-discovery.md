# Feature Discovery — porting web depth to mobile

**Status:** proposal · **Author:** discovery session (2026-06-15) · **Branch:** `feat/conditions-library`

## Why this exists

The mobile app (`psychage-master-app`) is feature-complete on its current surface but
thin on substance. The web app (`psychage-v2`) already covers condition/mental-illness
education at depth and carries a large therapist/provider stack. This document inventories
what is **real** on the web, proposes a concrete, buildable backlog grounded in that reality,
and sorts every item into one of three buckets. It does **not** invent clinical content or
decide product/clinical questions.

### The hard rule (governs every item)

No clinical or mental-illness content is written, generated, paraphrased, or summarized by
this session. Any information about mental conditions shown to users must either come from
the web's existing reviewed content **sourced verbatim**, or be **flagged for Dr. Lena
Dobson's review**. Same bar as the articles and the crisis dataset: real and reviewed, or it
does not ship. A separate in-flight session is porting the web's article *content* (see
"In-flight dependency" below) — we build on it, we do not duplicate it.

### Buckets

- **(a) Safe to build now** — pure structure on already-real, already-sourced data; no new
  clinical content; no diagnostic flow.
- **(b) Needs a content / clinical-review gate first** — the structure is fine, but it would
  surface condition copy that is not yet reviewed user-facing content.
- **(c) Product decision needed** — crosses the non-clinical / liability line (therapist
  *services*), or depends on a blocked decision (auth, offline, analytics, push).

---

## Phase 0 — Inventory (what's real on the web)

### 0.1 Condition / mental-illness coverage

| Aspect | Reality |
|---|---|
| Form | Topic **categories** (not disease entities) + ~308 articles. No `conditions` table. |
| Taxonomy | **31 categories** (`emotional-regulation` … `spirituality-meaning`). Condition-focused ones are tagged by mapping to Symptom Navigator condition IDs. |
| Where it lives — taxonomy | **Already in this repo, reviewed:** `packages/shared/peaf/content-architecture.ts` → `CONTENT_CATEGORIES` (exported from `@psychage/shared/peaf`). Header: *"Prepared for Dr. Lena Dobson."* Each category carries `name`, `slug`, `description`, `researchBasis`, `platformRole`, `navigatorConditions[]`, `relatedCategories[]`, `isGapCloser`. |
| Where it lives — article bodies | **Web repo** as JSX components (`psychage-v2/src/data/articles/category-NN/*.tsx`) **+ Supabase mirror** (`articles` / `article_categories`, metadata + HTML `content`). The JSX (interactive PEAF blocks) is repo-only; Supabase carries HTML. Mobile reads the **Supabase** copy. |
| `description` field | `ArticleRecord` uses `seo_description`, **not** `description` (Sacred Rule #7). |

**Key distinction.** The category **taxonomy** (names, slugs, which categories are
condition-focused) is reviewed structural data already in `packages/shared`. The category
`description` / `researchBasis` / `platformRole` strings are **internal architecture notes**,
not user-facing reviewed copy — treating them as on-screen condition summaries would cross the
hard rule. The article **bodies** are the real user-facing reviewed content, and they arrive
via the in-flight pipeline.

### 0.2 Therapist / provider feature set (web)

| Feature | Route(s) | Data source | Info vs Service |
|---|---|---|---|
| Directory + search (filters: specialty, language, insurance, telehealth, location) | `/providers`, `/providers` search | Supabase `providers` + lookup tables (RPC) | **Informational** |
| Provider profile (bio, specialties, insurance, languages, trust badge) | `/providers/:id` | Supabase `providers` + joins | **Informational** |
| Favorites / bookmarks | `/dashboard/bookmarks` | Supabase `bookmarks`, `provider_favorites` | Informational (read/write user data) |
| Provider apply / claim / verification (NPI, license, tier) | `/for-providers/*`, `/providers/how-we-verify` | Supabase `provider_applications`, `provider_verifications` | **Clinical service** (provider-side) |
| Provider portal (profile edit, analytics, subscription, reviews) | `/portal/*` | Supabase `providers`, analytics, trust scores | **Clinical service** |
| Messages / inquiries (patient ↔ provider) | portal | Supabase `messages` | **Clinical service** |
| Bookings / appointments (date, visit type, status) | profile link + service | Supabase `bookings` | **Clinical service** |

Mobile today WebView-wraps the **directory** + **profile** (`/find/directory`,
`/find/provider/[id]`) and has a native "My Therapist" record/share flow. Everything past
informational directory/profile is **clinical service** → bucket (c).

### 0.3 Other web features mobile lacks (or only WebView-wraps)

| Web feature | Persists user data? | Mobile status |
|---|---|---|
| Learn / articles (rich PEAF) | no | CT1 fixtures only; real content **in-flight** |
| Conditions browse (by taxonomy) | no | **absent** → built here (bucket a) |
| MindMate AI chat | yes (`ai_conversations`) | absent (separate `feat/mindmate-mobile` worktree) |
| Clarity Score, Mood Journal, Sleep Architect, Relationship Health, Med Tracker | yes | WebView wraps + some native (sleep/relationship/clarity native in-flight) |
| Bookmarks (articles/videos/providers) | yes | absent |
| Videos | no | absent |
| Dashboard / assessment history | yes | absent |

---

## Phase 1 — Backlog (prioritized, bucketed)

Size key: **S** ≈ ≤1 day, **M** ≈ 2–4 days, **L** ≈ 1–2 weeks. Review status: **real** =
already-reviewed verbatim source · **needs-review** = requires Dr. Dobson sign-off ·
**none** = no clinical content involved.

### Bucket (a) — Safe to build now

| # | Feature | Real data source | Info/Service | Review | Size | Safety flags |
|---|---|---|---|---|---|---|
| **A1** | **Conditions library** — browse condition-focused topics (names from the reviewed taxonomy), route into the real article Library + per-topic cross-links | `@psychage/shared/peaf` `CONTENT_CATEGORIES` (reviewed); links to existing `/library` WebView + `/article/[slug]` | Informational | real (names) / none (chrome) | **M** | SR-2 crisis reachable ✓ · SR-3 no diagnostic flow ✓ · names verbatim, no authored copy ✓ · **UI chrome copy pending Dr. Dobson sign-off** |
| A2 | **Per-category article list** (deepen A1): replace "Browse the library" with the actual published articles for a topic | In-flight `apps/mobile/lib/articles` `listArticlesByCategorySlugs(slug)` (Supabase, real bodies) | Informational | real | S | Blocked only by the in-flight pipeline landing on main; pure wiring, no new content |
| A3 | **Bookmarks (articles)** — save/read article bookmarks | Supabase `bookmarks` (`resource_type:'article'`) | Informational | none | M | SR-4 (write is education-only, not symptom data); needs `rules/offline.md` if offline cache wanted → keep online-only first |
| A4 | **Videos browse** — list/play reviewed videos | Supabase `videos` | Informational | real (reviewed) | M | none |

### Bucket (b) — Needs a content / clinical-review gate first

| # | Feature | Real data source | Info/Service | Review | Size | Safety flags |
|---|---|---|---|---|---|---|
| B1 | **Per-condition summaries** (a real overview paragraph on each conditions screen, not just a name + article list) | none yet — would need authored, reviewed user-facing copy (the taxonomy `description` is an *internal* note, not user-facing) | Informational | **needs-review** | M | SR-2/3; **flag for Dr. Dobson** — do not surface internal architecture text as user copy |
| B2 | **Condition → "what people often experience"** educational sections | none yet — reviewed verbatim condition content required | Informational | **needs-review** | M | **SR-3 diagnostic risk** — must be educational framing, clinically reviewed |
| B3 | **Native PEAF block rendering** (charts, callouts, comparison tables) for ported articles | In-flight HTML→AST layer (`features/content/html`) covers HTML; rich JSX blocks are repo-only on web | Informational | real (content) | L | Render fidelity only; content stays verbatim. Coordinate with article session |

### Bucket (c) — Product decision needed

| # | Feature | Real data source | Info/Service | Review | Size | Safety flags |
|---|---|---|---|---|---|---|
| C1 | **Booking / appointments** | Supabase `bookings` | **Clinical service** | n/a | L | **Liability** — brokers care; Apple 1.4.1; not non-clinical-education scope. Decision required |
| C2 | **Patient ↔ provider messaging** | Supabase `messages` | **Clinical service** | n/a | L | **Liability + PII + duty-of-care.** Decision required |
| C3 | **Telehealth / video visits** | (external) | **Clinical service** | n/a | L | **Highest liability.** Decision required |
| C4 | **Provider reviews / ratings** | Supabase (`reviews`, Pro tier) | Service-adjacent | n/a | M | Defamation / moderation policy needed. Decision required |
| C5 | **Provider portal (provider-side app)** | Supabase `providers`, analytics | Clinical service | n/a | L | Different audience (providers); separate product line |
| C6 | **MindMate AI on mobile** | Anthropic via web `api/ai/chat` | Service-adjacent | n/a | L | Safety classifier + crisis routing must port intact; separate in-flight worktree |
| C7 | **Provider favorites + account dashboard** | Supabase `provider_favorites`, `profiles` | Informational | none | M | Blocked by `rules/auth.md` (CLAUDE.md §5) |

---

## In-flight dependency (do not duplicate)

A separate session (`feat/native-article-reader` worktree) is building the article data layer
and HTML renderer — **uncommitted, not yet on main**:

- `apps/mobile/lib/articles/` — `listArticlesByCategorySlugs(slugs)`, `getArticleBySlug(slug)`
  (read-only Supabase, filtered by `article_categories.slug`, published + non-empty content)
- `apps/mobile/features/content/html/` — HTML → styled AST renderer
- adds `@tanstack/react-query`, `node-html-parser`

The conditions library (A1) deliberately **does not** touch these files and does **not**
re-implement article fetching. Its category slugs are the same `article_categories.slug` the
article repo filters on, so wiring A2 (`listArticlesByCategorySlugs(slug)` per topic) is a
small follow-up once that work lands on main.

---

## Phase 2 — What was built (bucket (a), A1 only)

**Conditions library** — a native browse layer over the reviewed taxonomy.

- `apps/mobile/features/conditions/` — `select.ts` (pure logic), `types.ts`, `copy.ts`,
  `ConditionsLibraryView.tsx`, `ConditionDetailView.tsx`
- `apps/mobile/app/conditions/index.tsx` + `app/conditions/[slug].tsx` — self-registering
  pushed routes (auto-register under the root Stack `headerShown:false`; each view renders its
  own `GlobalHeader`, so the **Help-now crisis pill is reachable** — SR-2)
- One additive entry row in the Learn tab (`/conditions`) — additive, not a nav restructure
- Tests: `conditions-select.test.ts` (vitest), `ConditionsLibraryView.test.tsx`,
  `ConditionDetailView.test.tsx` (jest)

**Why it's safe (bucket a):**

1. **No authored clinical content.** Only category **names** are surfaced, **verbatim** from
   the reviewed `CONTENT_CATEGORIES`. A test asserts `name === source.name` and that the
   view-model carries `slug + name` only (no `description`/`researchBasis` leakage).
2. **No editorial judgement about "what's a condition."** The filter is structural —
   `navigatorConditions.length > 0`, read straight from the reviewed taxonomy.
3. **No diagnostic flow (SR-3).** No symptom input, no likelihood, no scoring. Symptom
   checking stays in the existing Symptom Navigator. A test asserts no diagnostic-claim
   phrases render.
4. **Crisis reachable (SR-2)** on every screen, including the not-found fallback.
5. **Builds on real surfaces.** Articles open via the existing `/library` WebView (real web
   content) and `/article/[slug]`; deepening to per-topic article lists (A2) is wiring to the
   in-flight repo, not new content.

**Deliberately NOT built (left in the proposal):** B1/B2 (per-condition summaries —
needs Dr. Dobson review), all of bucket (c) (therapist services, MindMate, auth-gated
features — product/liability decisions).

---

## Web-access needs / open items

- The conditions UI **chrome copy** (`features/conditions/copy.ts`) is generic and
  non-diagnostic, but the surface mentions conditions → **needs Dr. Dobson sign-off** before
  ship (CLAUDE.md §7). Flagged in-file with a `FIXTURE / PENDING CLINICAL REVIEW` marker.
- A2 (real per-topic article lists) is gated on the in-flight article pipeline landing on
  `main`.
- B-bucket items need authored, reviewed user-facing condition copy — a content + clinical
  task, not an engineering one.
- C-bucket items need explicit product decisions (and several are also blocked by
  `rules/auth.md` / `rules/offline.md` per CLAUDE.md §5).
