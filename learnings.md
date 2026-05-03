# Psychage learnings

Persistent lessons accumulated from corrections, deferred decisions, and discovered gotchas. Read at the start of every Claude Code session per `~/.claude/CLAUDE.md` §9.

Format: *"When X, do Y, because Z."* — one sentence per lesson.

---

## Deferred decisions (revisit when conditions change)

- **2026-05-03 — Branch protection deferred.** Server-side branch protection on `main` is not active because the GitHub account is on the Free tier (HTTP 403 on `gh api PUT .../branches/main/protection`). Local protection lives in Phase 7 Husky hooks (blocks force-push, blocks `--no-verify` bypasses). Revisit and upgrade to GitHub Pro ($4/mo) when any of: (a) a `--no-verify` bypass attempt happens, (b) Phase 8 CI lands and Action minutes pressure increases, (c) project earns its first dollar of revenue.

## Repository hygiene

- **2026-05-03 — Five Psychage repos exist on this GitHub account.** `psychage-v1`, `psychage-v2`, `PsychageHome`, `psychage-ai`, `psychage-master-app`. Future cleanup task: archive the inactive ones to prevent "wait, which one is real?" confusion. Don't act on this until V1 ships — the dead repos aren't hurting anything.
- **2026-05-03 — Twenty rogue git repos exist under `~/`.** Several have "psychage" in the name. Cross-repo confusion risk. Add to long-term cleanup queue. See PROJECT_CONTEXT.md §8 finding #7.
- **2026-05-03 — Web `psychage-v2` has Finder duplicate files.** `src/lib/highlightText 2.ts` and `src/lib/auth 2/`. Will cause import-resolution bugs if not removed. Clean up during the Phase 5 lift, not before.

## Tooling gotchas

- **2026-05-03 — GitKraken auto-creates `gk/` in every `git init`.** Already in `.gitignore`. If a future fresh init shows `gk/` as untracked, the gitignore is being bypassed somehow — investigate, don't paper over.
- **2026-05-03 — `~/.git` directories are silent project killers.** Always run `git rev-parse --show-toplevel` before any git command if working in or below `~`. The CLAUDE.md §7 rule exists because of this.

## Patterns that worked

- **2026-05-03 — One file at a time deploy.** Phase 1 succeeded by producing one file, reviewing diff, saving, verifying, then moving to the next. Resist the urge to batch-deploy under foundation work.
- **2026-05-03 — `mv` instead of `rm`.** When deny rules block `rm`, `mv` to `~/claude-config-backups/` is recoverable defense-in-depth. Used multiple times in Phase 1.
