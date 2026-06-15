# AI Mismatch Report — MindMate + Crisis Detection

**Headline: AI parity is essentially complete.** Mobile does not reimplement any prompt, RAG, model selection, or safety classifier — it POSTs to the **same** Vercel serverless endpoint the web app uses, so all of that logic is server-shared by construction and cannot drift.

---

## MindMate AI — VERDICT: MATCH

### What is shared by construction (cannot diverge)
Mobile `features/mindmate/mindmate-service.ts` POSTs `{messages, sessionId, region, stream:true}` with `Authorization: Bearer <supabase access_token>` to `https://www.psychage.com/api/ai/chat`. The web endpoint (`api/ai/chat.ts`) owns:
- `SYSTEM_PROMPT` + model selection (Sonnet chat / Haiku safety) — `src/lib/ai/llm.ts`
- RAG: topK=5, similarityThreshold=0.72, hybrid 0.7 vector + 0.3 text, dedup — `src/lib/ai/retrieval.ts`
- Input safety classify + output validation + sentence-boundary streaming validation + citation extraction — `src/lib/ai/safety.ts`, `api/ai/chat.ts`

Mobile contains **no** prompt, RAG, or LLM call. Verified.

### Wire-contract parity (verified)
- SSE events the endpoint emits (`token`/`metadata`/`safety`/`citations`/`error`/`done`) are exactly what the mobile parser handles (`mindmate-service.ts:166-194`).
- `SAFETY_VIOLATION` → `SafetyReplacementError` → consumer **replaces** accumulated text (`useMindMateChat.ts:164-172`), matching web "final replacement" semantics (`chat.ts:341`).
- Citation shape `document_id/title/url_path` matches and maps to `{id,title,url}` under a "Sources" label (`streaming.ts:28-31,54-56`).
- Crisis JSON path: web returns `{message,citations:[],sessionId,safetyLevel:'CRISIS',isCrisis:true}`; mobile surfaces `isCrisis` via `onMeta` and yields crisis copy (`mindmate-service.ts:145-155`).
- Region passed through identically for server-side crisis-resource locale.

### Findings (all low/medium, none user-visible logic gaps)

| id | sev | blocked | summary | evidence |
|---|---|---|---|---|
| `client-crisis-keywords-manual-sync` | medium | free | Mobile keeps a **client-side offline copy** of the 11 CRISIS regexes for an instant offline hard-route. Today **byte-identical** to web, but it's hand-maintained (comment-guarded, not imported) → silent drift if web edits its list. Defense-in-depth on top of the authoritative server verdict, so not a current miss — a maintenance hazard. | web `src/lib/ai/safety.ts:49-61` ↔ mobile `features/mindmate/safety/crisis-keywords.ts:18-40` |
| `done-event-tokensused-dropped` | low | free | Web `done` event carries `tokensUsed`; mobile `DoneEvent` omits it. Metrics-only, never user-visible. | `streaming.ts:46-51` ↔ mobile `streaming.ts:33-37` |
| `origin-comment-vs-constant` | low | free | Mobile docstring says `psychage.com` (apex); runtime constant is `https://www.psychage.com` (www) — correct, avoids the 307 redirect that drops the bearer. Stale comment only. | `mindmate-service.ts:1-30` |

### Cross-repo caveat
A true single-source crisis-keyword lift is limited: web lives in `psychage-v2` (separate git repo), mobile in `psychage-fresh`. `packages/shared` is mobile-repo-only, so it cannot be the shared home for *both* until web joins the monorepo. Realistic hardening: extract mobile's list into `packages/shared/safety` (one source for all mobile features) **plus a snapshot guard test** that fails if it drifts from the documented web list. See [action-plan.md](action-plan.md).

---

## Crisis Detection (non-chat surfaces)

Covered in [logic-mismatches.md](logic-mismatches.md#crisis-detection-lists--verdict-match-live-surfaces-identical). Summary: chat 11/11 + sleep 18/18 byte-identical; URGENT/HARMFUL tiers server-side by design; **no ES/FR coverage** in mobile offline pre-checks (chat mitigated by multilingual server LLM); ClarityJournal free-text scanner absent only because the surface is absent.
