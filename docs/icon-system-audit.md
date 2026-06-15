# Icon-Usage Audit — Psychage Mobile

**Status:** read-only audit (Slice 1). No icon names proposed, no component changed.
Library + §5 ambiguities **DECIDED 2026-06-15** — see §0.
**Purpose:** map every surface where an icon could appear, classify each slot
DECORATIVE vs LOAD-BEARING, and count the distinct *concepts* (library-agnostic)
that an icon must carry. This count drives the icon-library decision that follows.

---

## 0. Decisions (2026-06-15)

- **Library:** keep `lucide-react-native` (^1.16.0) for **all common-UI + decorative**
  glyphs. **No new icon library** (Phosphor/Lucide-swap rejected — an off-the-shelf set
  can't carry the clinical concepts anyway). **Custom SVG only for the clinical/emotional
  concepts**, extending the app's existing custom-SVG pattern (`FillGlyph`,
  `components/pictograms/*`, `Terrain`, `BodyScanGlyph`). No emoji.
- **§5 ambiguities resolved** (principle: route to Dr. Lena Dobson only what makes a
  mental-health claim or could mislead a non-reader; neutral wayfinding stays lucide):
  - `Moon` (Sleep tile) → **common-UI** (universal "sleep", no claim).
  - `Book` (Mood Journal tile) → **common-UI**; emotion representation *inside* reuses the
    mood-scale set, not a separate glyph.
  - Credential rows (`Hash`/`FileText`/`Building`) → **common-UI**, low priority.
  - `Search` → **common-UI**, both contexts (field affordance + empty-state; pair text on
    empty state).
  - `Compass` → **clinical / VERIFY**, but *review the existing pictogram*, do not build new.
- **Revised split: 24 common-UI (lucide) · 13 clinical/emotional (custom SVG + VERIFY).**
  Total distinct load-bearing concepts unchanged at **37**.
- **Gate:** all 13 clinical icons require Dr. Lena Dobson sign-off before any live wire-in.
  Low-literacy comprehension piloting deferred to V2 (V1 internal-only); clinical sign-off
  substitutes for now.

**Scope note:** the `app/*` route files are mostly thin Expo-Router wrappers; the
real UI (and therefore the real icon slots) lives in `features/*` and `components/*`.
Both layers were walked.

---

## 1. What exists today (step 1 — locate first)

- **Icon library in use:** `lucide-react-native` (`^1.16.0`, declared in
  `apps/mobile/package.json`). **36 distinct lucide icons** are imported across the app.
- **Custom SVG drawables** (`react-native-svg`, not lucide) — purpose-built visuals:
  - Tab pictograms: `components/pictograms/{Today,Learn,Compass,Find}.tsx` (+ `shared.ts`)
  - `components/home/Mascot.tsx`, `features/onboarding/OnboardingMascot.tsx` — clay companion
  - `components/terrain/Terrain.tsx` — check-in history dots
  - `components/check-in/StateRows.tsx` — `FillGlyph` proportional mood bar (mirrored read-only in `features/.../EntryDetailSheet`)
  - `features/compass/CompassTile.tsx` — tool-tile frame
  - `features/relationship-health/components/{RadarChart,ScoreRing}.tsx` — data viz
  - `features/sleep-architect/dashboard/Sparkline.tsx` — sleep trend line
  - `features/toolkit/components/BodyScanGlyph.tsx` — body-scan progress glyph
  - `features/content/blocks/ArticleBody.tsx` — renders clinician-authored article SVG diagrams
- **No emoji** anywhere (verified by grep; `StateRows` carries an explicit "No emoji" comment).
- **Docs convention:** `docs/` with ADRs at `docs/adr/`. This audit lands in `docs/` to match.
- **The 36 lucide icons in use:** ArrowLeft, ArrowUpDown, BadgeCheck, Book, BookOpen,
  Bookmark, BookmarkPlus, Building, CalendarCheck, Check, ChevronDown, ChevronLeft,
  ChevronRight, ExternalLink, FileText, Globe, Hash, HeartHandshake, Info, LifeBuoy,
  Mail, MapPin, MessageCircle, MessageSquare, Moon, Navigation, Phone, Search, Send,
  SlidersHorizontal, Sparkles, Stethoscope, Trash2, User, Users, Wrench, X.

**Default rule recorded against every load-bearing slot:** icon is paired with a short
text label. Icon-alone (no adjacent visible text) is the exception and is marked
**`needs validation`** below — accessibility labels exist in code but a non-reader
without a screen reader gets no fallback.

---

## 2. Surfaces inspected (coverage manifest)

Every file below was walked. Route wrappers with no icon slot are listed so coverage is auditable.

### Navigation & global chrome
- `components/AppTabBar.tsx` · `app/(tabs)/_layout.tsx` · `app/_layout.tsx`
- `components/GlobalHeader.tsx` · `components/HeaderAvatar.tsx` · `components/CrisisPill.tsx`
- `components/pictograms/{Today,Learn,Compass,Find}.tsx`
- `components/ui/{Badge,Button,Card,ScreenShell,Text}.tsx`

### Home / Daily Check-In / mood / history
- `app/(tabs)/index.tsx` (wrapper) · `components/home/{HomeView,HomeContainer,HomeCardSlot,ReflectionRow,Mascot}.tsx`
- `components/check-in/{CheckInSheet,StateRows}.tsx`
- `app/history.tsx` · `components/history/{HistoryView,HistoryContainer,EntryDetailSheet}.tsx` · `components/terrain/Terrain.tsx`
- `app/reflection.tsx` · `app/reflection-earlier.tsx`
- `app/tools/mood-journal.tsx` (wrapper) · `features/mood-journal/AddMomentSheet.tsx`

### Compass hub & tools
- `app/(tabs)/compass.tsx` · `features/compass/CompassTile.tsx`
- `app/tools/clarity.tsx` · `app/tools/clarity-history.tsx` · `features/clarity/{ClarityFlow,ClarityResultsView,ClarityHistoryView}.tsx` · `features/clarity/components/ClarityChrome.tsx`
- `app/tools/mindmate.tsx` · `features/mindmate/components/{MindMateView,ChatInput,CrisisCard}.tsx`
- `app/tools/sleep.tsx` · `features/sleep-architect/SleepArchitectView.tsx` · `features/sleep-architect/shared/SleepDisclaimer.tsx` · `features/sleep-architect/dashboard/Sparkline.tsx`
- `app/tools/relationship-health.tsx` · `features/relationship-health/components/{RelationshipChrome,SafetyAlert,HistoryView,RadarChart,ScoreRing}.tsx`
- `app/tools/med-tracker.tsx` (WebView) · `app/library/{index,search}.tsx` (WebView)
- `app/toolkit.tsx` · `features/toolkit/ExerciseFlow.tsx` · `features/toolkit/components/{ExerciseChrome,BodyScanGlyph}.tsx`

### Crisis & Navigator & conditions
- `app/crisis.tsx` · `app/crisis-region.tsx` · `features/crisis/{CrisisView,RegionPickerView}.tsx` · `features/crisis/components/EmergencyButton.tsx`
- `app/navigator.tsx` · `app/dev-navigator.tsx` · `features/navigator/{NavigatorFlow,ResultsView}.tsx` · `features/navigator/components/SymptomChip.tsx`
- `app/conditions/{index,[slug]}.tsx` · `features/.../ConditionsLibraryView.tsx` · `features/.../ConditionDetailView.tsx`

### Learn / articles
- `app/(tabs)/learn.tsx` · `app/learn/[category].tsx` · `app/article/[slug].tsx`
- `features/learn/{LearnView,CategoryArticlesView}.tsx` · `features/content/ArticleReader.tsx` · `features/content/blocks/ArticleBody.tsx`

### Find care / providers / therapist
- `app/(tabs)/find.tsx` · `app/find/{directory,compare}.tsx` · `app/find/provider/[id].tsx`
- `features/find/FindCareScreen.tsx`
- `features/directory/{DirectoryView,LocationSetup,ProviderDetailView,CompareView,SortSheet}.tsx`
- `app/(therapist)/{_layout,add-provider,preview,range,why}.tsx` · `components/therapist/{ConsentIntro,PdfPreview,ProviderForm,RangePicker,RangeRadio}.tsx`

### Bookmarks / saved
- `app/saved.tsx` · `features/bookmarks/{SaveButton,SavedRow,SavedList,SignInSheet}.tsx`

### Auth / onboarding / settings / supporter
- `app/(auth)/{sign-up,verify,why,migrate,sign-out}.tsx` · `components/auth/{AuthTextField,ConfirmSheet,MigrationProgress,SignUpForm,VerifyPanel,WhyAccount}.tsx`
- `app/onboarding/{welcome,record}.tsx` · `features/onboarding/OnboardingMascot.tsx`
- `app/settings/*.tsx` (index, _layout, about, acknowledgments, appearance, delete, delete-confirm, make-it-yours, privacy, reminders, supporter)
- `components/settings/{SettingsRow,SettingsRadioRow,SettingsToggleRow,SettingsSection,DestructivePair}.tsx` · `components/supporter/SupporterTiers.tsx`
- `components/SearchableList.tsx`

**Surfaces with no icon slot** (text/native-control only — recorded for completeness):
`ClarityResultsView` / `ClarityHistoryView` (text bands, no numbers/meters/icons by spec),
auth forms (text fields + buttons), supporter tiers (text), settings toggle rows (native switch),
all `ActivityIndicator` loaders (native spinner, not an icon), `app/library/*` and
`med-tracker` (remote WebView surfaces — icons live in web, out of native scope).

---

## 3. Icon-slot inventory (every slot tagged)

`needs validation` = icon-alone (no visible text label) → fails the default pairing rule.
`VERIFY` = clinical/emotional concept → **Dr. Lena Dobson sign-off required before any icon ships.**

### 3a. Decorative slots (a non-reader loses nothing if removed)

| Surface | Slot | Tag |
|---|---|---|
| AppTabBar / GlobalHeader | header layout glyphs | DECORATIVE |
| HeaderAvatar | `User` silhouette — anonymous/account placeholder (no initial yet) | DECORATIVE |
| SettingsRow · ReflectionRow · LocationSetup · FindCareScreen rows | `ChevronRight` / `ChevronLeft` row-disclosure & forward hint | DECORATIVE |
| HistoryView · CrisisView · RegionPickerView · NavigatorFlow · ResultsView · Clarity/Sleep/Relationship chromes · ConditionsLibrary/Detail | `ArrowLeft` / `ChevronLeft` back navigation (paired "Back") | DECORATIVE |
| CheckInSheet · EntryDetailSheet · ExerciseChrome · AddMomentSheet | `X` close/dismiss (a11y "Close") | DECORATIVE |
| SearchableList · DirectoryView · LocationSetup · FindCareScreen | `Search` glyph inside a search *field* | DECORATIVE |
| DirectoryView | `ChevronDown` scope/dropdown caret | DECORATIVE |
| ArticleBody | `ChevronDown` accordion expand/collapse | DECORATIVE |
| Mascot · OnboardingMascot | clay companion figure (eyes/mouth/shadow), breathing animation | DECORATIVE |
| Terrain | connecting polyline + baseline line (context, not data) | DECORATIVE |
| CompassTile · Card · Badge · Button frames | container/layout chrome | DECORATIVE |
| SavedList · SignInSheet | `BookmarkPlus` empty-state/sign-in hint (paired with text) | DECORATIVE |
| ReflectionRow | `ChevronRight` view-more hint | DECORATIVE |
| FindCareScreen | `X` clear-search button | DECORATIVE · `needs validation` (icon-alone) |

### 3b. Load-bearing slots — common UI (non-reader relies on it; not clinical)

| Surface | Slot → concept | Pairing | Tag |
|---|---|---|---|
| SearchableList · SettingsRadioRow · RangeRadio · StateRows · SortSheet | `Check` → **selected / chosen** | icon-alone (selection state) | LOAD-BEARING · `needs validation` |
| SaveButton · SavedRow · FindCareScreen | `Bookmark` filled / `BookmarkPlus` → **saved item (toggle)** | icon-alone | LOAD-BEARING · `needs validation` |
| DirectoryView · FindCareScreen | empty-state `Search` → **no results / nothing here** | icon-alone | LOAD-BEARING · `needs validation` |
| DirectoryView · ProviderDetailView · SavedRow · FindCareScreen | `MapPin` → **location / place / distance** | mixed | LOAD-BEARING |
| ProviderDetailView · FindCareScreen | `Phone` → **call (phone) action** | paired | LOAD-BEARING |
| ProviderDetailView | `Mail` → **email action** | paired | LOAD-BEARING |
| ProviderDetailView · SafetyAlert | `Globe` / `ExternalLink` → **website / external link** | paired | LOAD-BEARING |
| ProviderDetailView | `Navigation` → **directions / open in maps** | paired | LOAD-BEARING |
| ProviderDetailView | `CalendarCheck` → **book / schedule appointment** | paired | LOAD-BEARING |
| FindCareScreen | `BadgeCheck` → **verified / NPI-verified / trusted** | mixed | LOAD-BEARING |
| DirectoryView · FindCareScreen | `SlidersHorizontal` → **filter** | icon-alone | LOAD-BEARING · `needs validation` |
| DirectoryView · FindCareScreen | `ArrowUpDown` → **sort** | icon-alone | LOAD-BEARING · `needs validation` |
| ChatInput | `Send` → **send message** | icon-alone | LOAD-BEARING · `needs validation` |
| Relationship HistoryView | `Trash2` → **delete (destructive)** | icon-alone | LOAD-BEARING · `needs validation` |
| SleepDisclaimer | `Info` → **info / disclaimer** | paired | LOAD-BEARING |
| FindCareScreen detail rows | `Hash` → **NPI / credential number** | paired | LOAD-BEARING |
| FindCareScreen detail rows | `FileText` → **license document** | paired | LOAD-BEARING |
| FindCareScreen detail rows | `Building` → **practice / clinic location** | paired | LOAD-BEARING |
| Tab bar | `Today` pictogram → **tab: today / home** | paired (label) | LOAD-BEARING |
| Tab bar | `Learn` pictogram → **tab: learn / articles** | paired (label) | LOAD-BEARING |
| Tab bar | `Find` pictogram → **tab: find care** | paired (label) | LOAD-BEARING |
| ReflectionRow | teal dot → **new / ready status** | paired | LOAD-BEARING |
| Compass: Sleep tile | `Moon` → **sleep** (universal, no clinical claim — §0) | paired | LOAD-BEARING |
| Compass: Mood Journal tile | `Book` → **mood journal** (tile identity; emotion repr. inside reuses the mood-scale set — §0) | paired | LOAD-BEARING |
| Sparkline · RadarChart · ScoreRing | data charts → **factual data viz** (sleep trend, relationship profile) | paired | LOAD-BEARING (data, not a glyph concept) |

### 3c. Load-bearing slots — clinical / emotional (all VERIFY)

| Surface | Slot → concept | Pairing | Tag |
|---|---|---|---|
| CrisisPill (global) · GlobalHeader · Clarity/Sleep/Toolkit/Relationship chromes · LocationSetup · MindMate CrisisCard | `LifeBuoy` → **crisis help / lifeline ("Help now")** | mixed | LOAD-BEARING · **VERIFY** |
| EmergencyButton (crisis) · SafetyAlert · FindCareScreen crisis sheet | `Phone` (red) → **emergency call** (distinct from generic call) | icon-alone | LOAD-BEARING · **VERIFY** · `needs validation` |
| FindCareScreen crisis sheet · SafetyAlert | `MessageCircle`/`MessageSquare` → **crisis text line** | mixed | LOAD-BEARING · **VERIFY** |
| StateRows `FillGlyph` · Terrain dots · EntryDetailSheet | proportional bar / colored dot → **mood / feeling level (5-point: very low → very good)** | mixed; Terrain dots icon-alone | LOAD-BEARING · **VERIFY** · `needs validation` |
| SymptomChip (Navigator) | `Check` on chip → **symptom (selected)** | icon-alone | LOAD-BEARING · **VERIFY** · `needs validation` |
| ConditionsLibrary / Detail | per-condition representation slot (no icon today; slot exists) | n/a | LOAD-BEARING · **VERIFY** |
| Compass tab pictogram · Navigator tile | `Compass` → **navigator / orientation (symptom exploration)** — review existing pictogram, do not build new | paired | LOAD-BEARING · **VERIFY** |
| Compass: Relationship Health tile | `HeartHandshake` → **relationship health** | paired | LOAD-BEARING · **VERIFY** |
| Compass: MindMate tile · MindMate | `MessageCircle` → **supportive chat (must read educational, not therapy)** | paired | LOAD-BEARING · **VERIFY** |
| Compass: Clarity tile | `Sparkles` → **clarity / cognitive check (NOT a score badge)** | paired | LOAD-BEARING · **VERIFY** |
| Compass: Steadying tile · Toolkit | `LifeBuoy` hero → **grounding / steadying toolkit** (overlaps crisis) | paired | LOAD-BEARING · **VERIFY** |
| BodyScanGlyph (toolkit) | custom glyph → **body awareness / body scan** | paired | LOAD-BEARING · **VERIFY** |
| FindCareScreen provider tiles | `Stethoscope`/`BookOpen`/`MessageSquare`/`Users` → **clinician role / specialty** (psychiatrist · psychologist · therapist-counselor · social worker — 4 variants) | mixed | LOAD-BEARING · **VERIFY** |
| ArticleBody | embedded SVG → **clinician-authored educational diagram** | n/a (content) | LOAD-BEARING · **VERIFY** (content, not system icon) |

---

## 4. Distinct-concept count

Concepts are deduplicated and library-agnostic. Provider role is counted as **one**
concept-family with 4 variants (not 4 concepts). Data-viz charts and article-embedded
SVG diagrams are content/visualization, not glyph concepts, so they are excluded from
the glyph counts below (called out separately).

### Common-UI load-bearing concepts (lucide) — **24**
1. Selected / chosen
2. Saved item (toggle)
3. No results / empty state
4. Location / place / distance
5. Call (phone) action
6. Email action
7. Website / external link
8. Directions / open in maps
9. Book / schedule appointment
10. Verified / trusted
11. Filter
12. Sort
13. Send message
14. Delete (destructive)
15. Info / disclaimer
16. NPI / credential number
17. License document
18. Practice / clinic building
19. Tab: Today / home
20. Tab: Learn
21. Tab: Find care
22. New / ready status
23. Sleep (Moon — §0)
24. Mood journal tile identity (Book — §0; emotion repr. inside reuses the mood-scale set)

### Clinical / emotional load-bearing concepts (custom SVG, all VERIFY) — **13**
1. Crisis help / lifeline
2. Emergency call
3. Crisis text line
4. Mood / feeling level (5-point scale)
5. Symptom (selected)
6. Mental-health condition (per-condition slot)
7. Navigator / orientation (symptom exploration) — also the Compass tab (review existing pictogram)
8. Relationship health
9. Supportive chat (MindMate)
10. Clarity / cognitive check
11. Grounding / steadying toolkit
12. Body awareness / body scan
13. Clinician role / specialty (1 family, 4 variants: psychiatrist · psychologist · therapist-counselor · social worker)

> **TOTAL distinct load-bearing concepts: 37** — **24 common-UI** + **13 clinical/emotional**.
> Plus a "navigation/decorative" set (~9: back, forward chevron, close, dropdown caret,
> search-field glyph, mascot, terrain connector, account avatar, loading) that any general
> icon library covers trivially and that needs no clinical review.
> Excluded from the glyph count (handled by bespoke components/content, not the library):
> 3 data-viz visuals (sleep sparkline, relationship radar, score ring) + clinician-authored
> article diagrams.

**Implication for library choice:** the common-UI set (22) is standard and satisfied by
any mainstream icon set. The decisive constraint is the **15 clinical/emotional concepts** —
several (mood level, symptom, condition, grounding, body scan, navigator) have no faithful
off-the-shelf glyph and will likely need **custom drawables under clinical review**, as the
app already does for mood (`FillGlyph`/Terrain) and tab pictograms.

---

## 5. Ambiguous classifications — RESOLVED 2026-06-15 (see §0)

- **`Moon` (Sleep tile):** → **common-UI**. Universal "sleep", no mental-health claim.
- **`Book` (Mood Journal):** → **common-UI** tile identity. The emotional concept (logging
  feelings) is carried *inside* by the mood-scale set, not by this glyph.
- **Credential rows (`Hash` NPI, `FileText` license, `Building` practice):** → **common-UI**,
  low priority. Paired with text; arguably decorative row-affordances.
- **`Search` glyph:** → **common-UI** in both contexts (live-field affordance + empty-state
  "no results"; pair visible text on the empty state).
- **Tab pictogram `Compass`:** → **clinical / VERIFY**, counted once under clinical. Review the
  existing pictogram for sign-off; do not build a new glyph.
- **`User` avatar:** decorative (neutral anonymous placeholder); becomes a non-icon initial
  once a name exists.

## 6. Icon-alone slots (`needs validation` — fail the default pairing rule)
Crisis emergency `Phone`; `Check` selection marks; `Bookmark`/`BookmarkPlus` save toggle;
empty-state `Search`; `SlidersHorizontal` filter; `ArrowUpDown` sort; `Send`; `Trash2`;
`X` clear-search; Terrain mood dots; Navigator `SymptomChip` check. Each has an a11y label
in code, but a sighted non-reader gets no text fallback — validate before relying on
icon-alone for any load-bearing meaning.
