# EAS Build Pipeline — Runbook

Human-only steps to finish wiring the EAS managed-workflow build pipeline. Lay-down config + workflow already shipped (see commit on `feat/phase-9-precommit-recover`). This runbook completes the account-side wiring that requires Expo authentication.

Run steps **in order**. Each step lists the command, the success signal, the failure-stop note, and whether it mutates `app.json` (⚠ commit required after).

---

## Prerequisites

- Expo account exists (you have a username + password).
- Node 22 active locally — confirm with `node --version` (must be `v22.x`). If `v25`, run `nvm use` from repo root (reads `.nvmrc`).
- Working directory for steps 2, 3, 5: `apps/mobile/` (where `app.json` + `eas.json` live).
- `eas-cli` runs via `npx eas-cli` — no global install needed.

---

## Step 1 — Authenticate to Expo locally

```bash
npx eas-cli login
```

Interactive: enter Expo username + password.

**Success signal:** `Logged in` echoed by CLI. Verify with:

```bash
npx eas-cli whoami
```

Prints your Expo username.

**Failure-stop:** if credentials rejected, reset via [expo.dev/settings/account](https://expo.dev/settings/account). Do not proceed.

---

## Step 2 — Initialize EAS project ⚠ MUTATES `app.json`

```bash
cd apps/mobile
npx eas-cli init
```

EAS prompts to create or link a project. Choose **create new project** (slug `mobile`). EAS will:

1. Replace `"owner": "OWNER_PLACEHOLDER"` in `app.json` with your real Expo username/org.
2. Add `expo.extra.eas.projectId` (a UUID).

**Success signal:** `git diff apps/mobile/app.json` shows:

- `owner` flipped from `OWNER_PLACEHOLDER` to real account
- `extra.eas.projectId` added

**Commit the mutation immediately:**

```bash
git add apps/mobile/app.json
git commit -m "chore(eas): bind project to Expo account"
```

(Pre-commit hook will fire — passes since this is config-only.)

**Failure-stop:** if `eas init` errors `Owner not found`, ensure you're logged in (step 1).

---

## Step 3 — Configure EAS Update for OTA channels ⚠ MUTATES `app.json`

```bash
cd apps/mobile
npx eas-cli update:configure
```

Adds `expo.updates.url` (form `https://u.expo.dev/<projectId>`) to `app.json`. May also adjust `expo-updates` runtime hooks under `plugins`.

**Success signal:** `git diff apps/mobile/app.json` shows `updates.url` added.

**Commit:**

```bash
git add apps/mobile/app.json
git commit -m "chore(eas): configure eas update channels"
```

**Note:** the three channels in `eas.json` (`development`, `preview`, `production`) become live OTA channels at this point. Builds still work without this step — OTA simply remains dormant.

---

## Step 4 — Create + add `EXPO_TOKEN` GitHub secret

```bash
npx eas-cli token:create --name "GitHub Actions EAS build"
```

CLI prints a token starting with something like `expo_token_...`. Copy it once (it's not retrievable again).

In a browser:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `EXPO_TOKEN`
4. Secret: paste the token from above
5. **Add secret**

**Success signal:** repo Secrets list shows `EXPO_TOKEN` with masked value.

**Failure-stop:** if you accidentally close the terminal before pasting — re-run `eas-cli token:create` with a new `--name` and revoke the lost one via [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).

**⚠ Do not commit `EXPO_TOKEN` anywhere — not in `.env`, not in a script, not in a doc.**

---

## Step 5 — First dev build (iOS simulator, no paid Apple account needed)

```bash
cd apps/mobile
npx eas-cli build --platform ios --profile development
```

EAS prompts for Apple ID on first iOS build. For the **development** profile with `ios.simulator: true` (set in `eas.json`), EAS produces a simulator-runnable `.app` artifact — does not require paid Apple Developer enrollment.

**Success signal:**

- CLI prints `✔ Build queued` + a build URL (e.g. `https://expo.dev/accounts/<owner>/projects/mobile/builds/<uuid>`).
- Open the URL — build status transitions `queued → in-progress → finished` (~15–25 min for first iOS).
- When finished: download `.app` archive, drag onto a running iOS Simulator window.

**Failure-stop:** if first iOS build fails citing `Apple credentials`, follow the CLI prompt to either log in to Apple ID interactively or supply ad-hoc credentials. Don't skip; subsequent builds reuse cached credentials.

**Optional Android dev build** (no account prompts beyond Step 1):

```bash
npx eas-cli build --platform android --profile development
```

Produces an `.apk` for sideloading onto a physical Android device or emulator.

---

## Step 6 — Trigger build via GitHub Actions

In a browser:

1. GitHub repo → **Actions** tab → **EAS Build** workflow
2. **Run workflow** → choose:
   - `profile`: `development` (or `preview` / `production`)
   - `platform`: `all` (or `ios` / `android`)
3. **Run workflow** button

**Success signal:**

- Workflow run appears in Actions list, status spinner.
- All steps green: `Checkout` → `Setup pnpm` → `Setup Node` → `Install` → `Setup EAS` → `EAS build`.
- `EAS build` step output shows the same `Build queued` + URL as Step 5.
- EAS dashboard ([expo.dev/accounts/<owner>/projects/mobile/builds](https://expo.dev)) shows the new build with `Source: GitHub Actions`.

**Failure-stop scenarios:**

- `Setup EAS` step errors `Error: No EXPO_TOKEN` → secret missing. Re-do Step 4.
- `EAS build` step errors `Authentication required` → token rejected or expired. Regenerate via Step 4 and replace the repo secret.
- `Install` step errors `frozen-lockfile` → root `pnpm-lock.yaml` and `package.json` are out of sync. Run `pnpm install` locally + commit the lockfile.

---

## What this pipeline does NOT do (yet)

| Capability | When to wire | How |
|---|---|---|
| Production submit to App Store / Play Console | When V1 ready to ship | `eas credentials` per platform + fill `submit.production` in `eas.json` + `eas submit` |
| Automatic build on push/PR | When credentials + cost-control posture decided | Add `push:` / `pull_request:` triggers to `eas-build.yml` |
| Build status check on PRs | After auto-build wired | EAS GitHub integration (`eas project:link` + repo permissions) |
| OTA publish (`eas update`) on `main` push | When OTA cadence decided | Separate workflow with `eas-cli update --branch <channel>` |

---

## Reference

- `apps/mobile/eas.json` — build profiles
- `apps/mobile/app.json` — Expo config (owner + runtimeVersion + projectId-after-step-2 + updates.url-after-step-3)
- `.github/workflows/eas-build.yml` — manual GitHub Actions trigger
- `.nvmrc` + root `package.json` `engines.node` — Node 22 pin (both workflow runner and EAS build image)
- EAS docs: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- EAS monorepo guide: [docs.expo.dev/build-reference/build-with-monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/)
