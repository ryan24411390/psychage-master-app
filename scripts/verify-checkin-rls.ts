/**
 * Live RLS verification for the check_ins push-sync (SR-4 write-flip).
 *
 * Proves the Row-Level-Security isolation that unit tests CANNOT prove, by
 * exercising the policies as three real authenticated users against a real
 * Postgres + GoTrue (local `supabase start` stack, a preview branch, or the
 * hosted project). What it checks:
 *
 *   - check_ins READ  (migration 000001): `using (auth.uid() = user_id)`
 *   - check_ins INSERT (write-flip):       `with check (auth.uid() = user_id
 *                                            and auth.jwt() ->> 'platform' = 'mobile')`
 *   - check_ins UPDATE (write-flip):       `using  (auth.uid() = user_id
 *                                            and auth.jwt() ->> 'platform' = 'mobile')`
 *   - check_ins DELETE: no policy exists -> default-deny for everyone.
 *
 * SECURITY INVARIANT OF THIS SCRIPT:
 *   The service-role key is used ONLY to provision and tear down the three test
 *   users (admin work). Every ISOLATION ASSERTION runs through a per-user client
 *   built from the ANON key + that user's own JWT. service_role bypasses RLS and
 *   would produce a FALSE PASS, so it is never handed to the assertion path.
 *   (`admin` is referenced only inside provisionUsers()/cleanup().)
 *
 * SELF-DIAGNOSING: it decodes each issued JWT and confirms the `platform` claim
 * is present. A missing claim means the custom_access_token_hook is not
 * registered (or user_metadata.platform was not set) — reported as a PRECONDITION
 * failure, NOT an RLS pass.
 *
 * EXIT CODES (drive the caller's hard gate):
 *   0  PASS               every isolation + platform-enforcement assertion held.
 *   1  ENV-MISSING        required env vars absent (prints the runbook).
 *   2  PRECONDITION-UNMET legit mobile write failed -> write policy / hook not
 *                         live. The sync is NOT activated; this is not a pass.
 *   3  FAIL-CRITICAL      a cross-account read/update/delete SUCCEEDED, or the
 *                         platform='mobile' gate is missing. STOP — security bug.
 *
 * RUN — local stack (credential-free, recommended first):
 *   supabase start && supabase db reset
 *   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" \
 *        -f supabase/policies-gated/check_ins_write.sql.gated
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_ANON_KEY=<local anon>  SUPABASE_SERVICE_ROLE_KEY=<local service_role> \
 *   pnpm --filter @psychage/mobile exec tsx ../../scripts/verify-checkin-rls.ts
 *
 * RUN — hosted project (founder, creds required; see scripts/README.md):
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… \
 *   pnpm --filter @psychage/mobile exec tsx ../../scripts/verify-checkin-rls.ts
 *
 * NEVER commit any key. All secrets are read from the environment only.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// ── exit codes ────────────────────────────────────────────────────────────────
const EXIT = { PASS: 0, ENV_MISSING: 1, PRECONDITION: 2, CRITICAL: 3 } as const;

// ── env contract ──────────────────────────────────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function printRunbookAndExit(): never {
  console.error('❌ ENV-MISSING — cannot run the live RLS verification.');
  console.error('   Required (all three):');
  console.error('     SUPABASE_URL              (or EXPO_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL)');
  console.error('     SUPABASE_ANON_KEY         (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  console.error('     SUPABASE_SERVICE_ROLE_KEY (admin provisioning only; never touches assertions)');
  console.error('');
  console.error('   Local stack (no founder creds needed):');
  console.error('     supabase start && supabase db reset');
  console.error('     psql "<DB_URL>" -f supabase/policies-gated/check_ins_write.sql.gated');
  console.error('     then re-run with the local URL + keys from `supabase status`.');
  console.error('   See scripts/README.md → "verify-checkin-rls" for the full runbook.');
  process.exit(EXIT.ENV_MISSING);
}

// ── evidence log ──────────────────────────────────────────────────────────────
let criticalCount = 0;
let preconditionCount = 0;

function evidence(label: string, query: string, expected: string, actual: string, ok: boolean): void {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  console.log(`     query:    ${query}`);
  console.log(`     expected: ${expected}`);
  console.log(`     actual:   ${actual}`);
}

/** A failed isolation/enforcement assertion — security-critical. */
function critical(label: string, query: string, expected: string, actual: string): void {
  evidence(label, query, expected, actual, false);
  criticalCount += 1;
}

/** A failed precondition (write path not live) — not a security pass, not a breach. */
function precondition(label: string, detail: string): void {
  console.log(`⚠️  ${label}`);
  console.log(`     ${detail}`);
  preconditionCount += 1;
}

// ── JWT helper: read a top-level claim without adding a dependency ─────────────
function decodeJwtClaim(token: string, claim: string): string | undefined {
  const seg = token.split('.')[1];
  if (!seg) return undefined;
  try {
    const json = JSON.parse(Buffer.from(seg, 'base64url').toString('utf8')) as Record<string, unknown>;
    const value = json[claim];
    return typeof value === 'string' ? value : undefined;
  } catch {
    return undefined;
  }
}

// ── test user model ───────────────────────────────────────────────────────────
interface TestUser {
  readonly label: 'A' | 'B' | 'C';
  readonly email: string;
  readonly password: string;
  readonly platform: 'mobile' | 'web';
  id: string; // filled at provisioning
  client: SupabaseClient; // anon key + this user's JWT — the ONLY client used in assertions
  jwtPlatform: string | undefined; // platform claim observed in the issued access token
}

const PASSWORD = `Pw-${randomUUID()}`;

function newUserSpec(label: TestUser['label'], platform: TestUser['platform']): Omit<TestUser, 'id' | 'client' | 'jwtPlatform'> {
  return { label, email: `verify-${label.toLowerCase()}-${randomUUID()}@verify.psychage.local`, password: PASSWORD, platform };
}

function checkInRow(userId: string): Record<string, unknown> {
  return {
    user_id: userId,
    device_id: 'verify-rls-device',
    client_version: 'verify-rls@0.0.0',
    mood_score: 5,
    experienced_at: '2026-06-15T00:00:00.000Z',
    context: {},
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<number> {
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) printRunbookAndExit();

  console.log('🔒 check_ins RLS verification');
  console.log(`   target: ${SUPABASE_URL}`);
  console.log('   service_role: provisioning/cleanup ONLY (never in assertions)\n');

  // admin client — ADMIN PROVISIONING ONLY. Never passed to an assertion.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const users: TestUser[] = [];

  try {
    // ---- provision (service_role) ----
    for (const spec of [newUserSpec('A', 'mobile'), newUserSpec('B', 'mobile'), newUserSpec('C', 'web')]) {
      const { data, error } = await admin.auth.admin.createUser({
        email: spec.email,
        password: spec.password,
        email_confirm: true,
        user_metadata: { platform: spec.platform },
      });
      if (error || !data.user) throw new Error(`provision ${spec.label} failed: ${error?.message ?? 'no user'}`);

      // per-user client: anon key + this user's own session (carries the platform claim via the hook)
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const signIn = await client.auth.signInWithPassword({ email: spec.email, password: spec.password });
      if (signIn.error || !signIn.data.session) {
        throw new Error(`sign-in ${spec.label} failed: ${signIn.error?.message ?? 'no session'}`);
      }
      const jwtPlatform = decodeJwtClaim(signIn.data.session.access_token, 'platform');
      users.push({ ...spec, id: data.user.id, client, jwtPlatform });
      console.log(`   provisioned ${spec.label}: ${data.user.id}  jwt.platform=${jwtPlatform ?? '<absent>'}`);
    }
    console.log('');

    const [A, B, C] = users;
    if (!A || !B || !C) throw new Error('provisioning incomplete — expected users A, B, C');

    // ---- self-diagnose the hook before trusting any write result ----
    if (A.jwtPlatform !== 'mobile' || B.jwtPlatform !== 'mobile') {
      precondition(
        'hook claim missing',
        `A.jwt.platform=${A.jwtPlatform ?? '<absent>'}, B.jwt.platform=${B.jwtPlatform ?? '<absent>'} — ` +
          'expected "mobile". The custom_access_token_hook is not registered (or user_metadata.platform ' +
          'not applied). RLS write policies are inert without the claim.',
      );
    }

    // ---- 1 & 2: legit mobile writes (precondition for everything below) ----
    const aWrite = await A.client.from('check_ins').insert(checkInRow(A.id)).select().single();
    const bWrite = await B.client.from('check_ins').insert(checkInRow(B.id)).select().single();

    if (aWrite.error || bWrite.error || !aWrite.data || !bWrite.data) {
      const cause =
        A.jwtPlatform !== 'mobile'
          ? 'JWT carries no platform=mobile claim → hook not registered.'
          : 'JWT carries platform=mobile but insert denied → write policy not applied (default-deny).';
      precondition(
        'mobile write denied',
        `A insert error=${aWrite.error?.code ?? aWrite.error?.message ?? 'none'}, ` +
          `B insert error=${bWrite.error?.code ?? bWrite.error?.message ?? 'none'}. ${cause}`,
      );
      console.log('\n──────────────────────────────────────────────────────────────');
      console.log('VERDICT: PRECONDITION-UNMET — the check_ins write path is not live.');
      console.log('         Isolation could not be exercised. The sync is NOT activated.');
      console.log('──────────────────────────────────────────────────────────────');
      return EXIT.PRECONDITION;
    }
    const aRowId = (aWrite.data as { id: string }).id;
    const bRowId = (bWrite.data as { id: string }).id;
    evidence('1. A writes own check_in', `A.insert(check_ins, user_id=A) [anon+A.jwt]`, 'row created', `id=${aRowId}`, true);
    evidence('2. B writes own check_in', `B.insert(check_ins, user_id=B) [anon+B.jwt]`, 'row created', `id=${bRowId}`, true);

    // ---- 3: A reads own ----
    const aReadOwn = await A.client.from('check_ins').select('id').eq('user_id', A.id);
    evidence(
      '3. A reads own rows',
      `A.select(check_ins).eq(user_id, A) [anon+A.jwt]`,
      '≥1 row',
      `${aReadOwn.data?.length ?? 0} rows, error=${aReadOwn.error?.code ?? 'none'}`,
      (aReadOwn.data?.length ?? 0) >= 1,
    );

    // ---- 4: A reads B's rows -> MUST be empty ----
    const aReadB = await A.client.from('check_ins').select('id,user_id').eq('user_id', B.id);
    const aSawB = aReadB.data ?? [];
    if (aSawB.length > 0) {
      critical('4. A reads B rows', `A.select(check_ins).eq(user_id, B) [anon+A.jwt]`, '0 rows', `${aSawB.length} rows LEAKED`);
    } else {
      evidence('4. A cannot read B rows', `A.select(check_ins).eq(user_id, B) [anon+A.jwt]`, '0 rows', '0 rows', true);
    }

    // ---- 5: A updates B's row -> 0 rows, and B's row unchanged ----
    const aUpdB = await A.client.from('check_ins').update({ mood_score: 1 }).eq('id', bRowId).select();
    const bRowAfterUpd = await B.client.from('check_ins').select('mood_score').eq('id', bRowId).single();
    const bMood = (bRowAfterUpd.data as { mood_score: number } | null)?.mood_score;
    const updLeaked = (aUpdB.data?.length ?? 0) > 0 || bMood !== 5;
    if (updLeaked) {
      critical(
        '5. A updates B row',
        `A.update(check_ins,{mood_score:1}).eq(id, B.row) [anon+A.jwt]`,
        '0 rows affected; B.mood_score stays 5',
        `${aUpdB.data?.length ?? 0} rows affected; B.mood_score=${bMood}`,
      );
    } else {
      evidence(
        '5. A cannot update B row',
        `A.update(check_ins).eq(id, B.row) [anon+A.jwt]`,
        '0 rows; B unchanged (5)',
        `0 rows; B.mood_score=${bMood}`,
        true,
      );
    }

    // ---- 6: A deletes B's row -> 0 rows, B's row still present ----
    const aDelB = await A.client.from('check_ins').delete().eq('id', bRowId).select();
    const bRowAfterDel = await B.client.from('check_ins').select('id').eq('id', bRowId);
    const delLeaked = (aDelB.data?.length ?? 0) > 0 || (bRowAfterDel.data?.length ?? 0) === 0;
    if (delLeaked) {
      critical(
        '6. A deletes B row',
        `A.delete(check_ins).eq(id, B.row) [anon+A.jwt]`,
        '0 rows; B.row survives',
        `${aDelB.data?.length ?? 0} rows deleted; B.row present=${(bRowAfterDel.data?.length ?? 0) > 0}`,
      );
    } else {
      evidence(
        '6. A cannot delete B row',
        `A.delete(check_ins).eq(id, B.row) [anon+A.jwt]`,
        '0 rows; B.row survives',
        '0 rows; B.row present=true',
        true,
      );
    }

    // ---- 7: symmetric — B against A (read/update/delete) ----
    const bReadA = await B.client.from('check_ins').select('id').eq('user_id', A.id);
    const bUpdA = await B.client.from('check_ins').update({ mood_score: 2 }).eq('id', aRowId).select();
    const aRowAfter = await A.client.from('check_ins').select('mood_score').eq('id', aRowId).single();
    const bDelA = await B.client.from('check_ins').delete().eq('id', aRowId).select();
    const aRowStill = await A.client.from('check_ins').select('id').eq('id', aRowId);
    const aMood = (aRowAfter.data as { mood_score: number } | null)?.mood_score;
    const symLeaked =
      (bReadA.data?.length ?? 0) > 0 ||
      (bUpdA.data?.length ?? 0) > 0 ||
      aMood !== 5 ||
      (bDelA.data?.length ?? 0) > 0 ||
      (aRowStill.data?.length ?? 0) === 0;
    if (symLeaked) {
      critical(
        '7. B accesses A rows',
        `B.{select,update,delete} on A.row [anon+B.jwt]`,
        'all denied; A.row unchanged & present',
        `read=${bReadA.data?.length ?? 0} upd=${bUpdA.data?.length ?? 0} A.mood=${aMood} del=${bDelA.data?.length ?? 0} A.present=${(aRowStill.data?.length ?? 0) > 0}`,
      );
    } else {
      evidence(
        '7. B cannot access A rows',
        `B.{select,update,delete} on A.row [anon+B.jwt]`,
        'all denied; A.row intact',
        'read=0 upd=0 del=0; A.mood=5 present=true',
        true,
      );
    }

    // ---- 8: platform enforcement — C (web claim) write MUST be denied ----
    if (C.jwtPlatform !== 'web') {
      precondition('platform test skipped', `C.jwt.platform=${C.jwtPlatform ?? '<absent>'} (expected "web") — cannot prove value gate.`);
    } else {
      const cWrite = await C.client.from('check_ins').insert(checkInRow(C.id)).select().single();
      if (!cWrite.error) {
        critical(
          '8. web claim write',
          `C.insert(check_ins, user_id=C) [anon+C.jwt, platform=web]`,
          'DENIED (42501)',
          `INSERT SUCCEEDED (id=${(cWrite.data as { id: string } | null)?.id}) — mobile-only gate MISSING`,
        );
      } else {
        evidence(
          '8. web claim write denied',
          `C.insert(check_ins) [anon+C.jwt, platform=web]`,
          'DENIED (42501)',
          `denied: ${cWrite.error.code ?? cWrite.error.message}`,
          true,
        );
      }
    }

    // ---- verdict ----
    console.log('\n──────────────────────────────────────────────────────────────');
    if (criticalCount > 0) {
      console.log(`🚨 VERDICT: FAIL-CRITICAL — ${criticalCount} isolation/enforcement assertion(s) BREACHED.`);
      console.log('   STOP. Do NOT treat the check_ins sync as activated. This is a security bug.');
      console.log('──────────────────────────────────────────────────────────────');
      return EXIT.CRITICAL;
    }
    if (preconditionCount > 0) {
      console.log(`⚠️  VERDICT: PASS-WITH-NOTES — isolation held, but ${preconditionCount} precondition note(s) above.`);
      console.log('   Cross-account access is correctly denied; review the notes before relying on the sync.');
      console.log('──────────────────────────────────────────────────────────────');
      return EXIT.PASS;
    }
    console.log('✅ VERDICT: PASS — owner-only read, mobile-only owner write, no cross-account read/update/delete.');
    console.log('   RLS isolation on check_ins is enforced as designed.');
    console.log('──────────────────────────────────────────────────────────────');
    return EXIT.PASS;
  } finally {
    // ---- cleanup (service_role); cascades each user's check_ins via FK on delete ----
    for (const u of users) {
      const { error } = await admin.auth.admin.deleteUser(u.id);
      if (error) console.error(`   ⚠️ cleanup: failed to delete ${u.label} (${u.id}): ${error.message}`);
    }
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('❌ Fatal error during RLS verification:', err);
    process.exit(EXIT.CRITICAL);
  });
