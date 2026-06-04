// SR-3 fixed-string seed-scan eval.
//
// Invokes the real .claude/hooks/sr3_diagnostic_language.sh against on-disk
// fixtures. Asserts exit 2 (blocked) for violating fixtures and exit 0
// (allowed) for clean fixtures.
//
// NOTE: this file is excluded from SR-3 by its *.test.* suffix, but per the
// slice's own discipline it never embeds a raw seed phrase. Fixture content
// is read from disk at runtime; the only place raw seeds live is under
// __fixtures__/ (which SR-3 also excludes).
//
// Scope: this proves the fixed-string scan only. The paraphrase / semantic
// layer is OFF (documented in the hook header) and tracked in
// docs/SR-3-paraphrase-coverage-DEFERRED.md.

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const HOOK = path.join(REPO_ROOT, '.claude/hooks/sr3_diagnostic_language.sh');
const FIXTURES_DIR = path.resolve(__dirname, '../__fixtures__');

// SR-3 in pretool mode short-circuits to exit 0 if tool_input.file_path matches
// any exclude glob (*.test.*, *.spec.*, */__tests__/*, */__fixtures__/*). The
// fixtures live under __fixtures__/ on disk so the live pre-commit hook ignores
// them, but for the eval we must hand the hook a path that IS scannable so it
// actually runs the seed scan. Hence this synthetic path.
const SCANNABLE_FAKE_PATH = 'apps/mobile/src/screens/EvalHarness.tsx';

interface HookResult {
  status: number | null;
  stderr: string;
  stdout: string;
}

function runSr3(content: string): HookResult {
  const payload = JSON.stringify({
    tool_input: { file_path: SCANNABLE_FAKE_PATH, content },
  });
  const r = spawnSync('bash', [HOOK], {
    input: payload,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
    encoding: 'utf8',
  });
  return {
    status: r.status,
    stderr: r.stderr ?? '',
    stdout: r.stdout ?? '',
  };
}

function loadFixture(name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
}

const violatingFixtures = readdirSync(FIXTURES_DIR)
  .filter((f) => f.startsWith('violating-') && f.endsWith('.tsx'))
  .sort();

const cleanFixtures = readdirSync(FIXTURES_DIR)
  .filter((f) => f.startsWith('clean-') && f.endsWith('.tsx'))
  .sort();

describe('SR-3 fixed-string seed scan', () => {
  it('discovers at least 4 violating and 3 clean fixtures', () => {
    expect(violatingFixtures.length).toBeGreaterThanOrEqual(4);
    expect(cleanFixtures.length).toBeGreaterThanOrEqual(3);
  });

  describe('violating fixtures must be blocked (exit 2)', () => {
    for (const name of violatingFixtures) {
      it(`blocks ${name}`, () => {
        const content = loadFixture(name);
        const r = runSr3(content);
        expect(
          r.status,
          `expected ${name} to be blocked; stderr=${r.stderr}`,
        ).toBe(2);
        expect(r.stderr).toMatch(/BLOCKED \(SR-3\)/);
      });
    }
  });

  describe('clean fixtures must be allowed (exit 0)', () => {
    for (const name of cleanFixtures) {
      it(`allows ${name}`, () => {
        const content = loadFixture(name);
        const r = runSr3(content);
        expect(
          r.status,
          `expected ${name} to be allowed; stderr=${r.stderr}`,
        ).toBe(0);
      });
    }
  });
});
