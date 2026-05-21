/**
 * Sensitivity filter tests.
 *
 * Not lifted from psychage-v2 (the upstream quality-gate.test.ts exercises
 * checkSensitivity through the full quality-gate orchestrator, not the
 * scanner directly). These tests pin the scanner contract for the
 * shared package.
 */

import { describe, it, expect } from 'vitest';
import { scanForSensitivity } from '../filter';
import { SENSITIVITY_TERMS } from '../terms';

describe('SENSITIVITY_TERMS', () => {
  it('has exactly 30 terms (recon §2.2 claim of 31 was off-by-one)', () => {
    expect(SENSITIVITY_TERMS).toHaveLength(30);
  });

  it('every term has a non-empty suggestion', () => {
    for (const entry of SENSITIVITY_TERMS) {
      expect(entry.term.length).toBeGreaterThan(0);
      expect(entry.suggestion.length).toBeGreaterThan(0);
    }
  });
});

describe('scanForSensitivity', () => {
  it('returns no flags for clean copy', () => {
    expect(scanForSensitivity('People living with depression find support helpful.')).toEqual([]);
  });

  it('flags "committed suicide" with the person-first suggestion', () => {
    const flags = scanForSensitivity('The article said he committed suicide last year.');
    expect(flags).toHaveLength(1);
    expect(flags[0].term).toBe('committed suicide');
    expect(flags[0].suggestion).toBe('died by suicide');
  });

  it('is case-insensitive on the scan but preserves original casing in context', () => {
    const flags = scanForSensitivity('The patient SUFFERS FROM anxiety.');
    expect(flags).toHaveLength(1);
    expect(flags[0].term).toBe('suffers from');
    expect(flags[0].context).toContain('SUFFERS FROM');
  });

  it('flags every occurrence and reports positional metadata', () => {
    const content = 'She is bipolar and he is bipolar.';
    const flags = scanForSensitivity(content);
    expect(flags).toHaveLength(2);
    expect(flags[0].position).toBeLessThan(flags[1].position);
  });

  it('captures up to 20 chars of context on each side', () => {
    const content = 'aaaaaaaaaaaaaaaaaaaa committed suicide bbbbbbbbbbbbbbbbbbbb';
    const flags = scanForSensitivity(content);
    expect(flags).toHaveLength(1);
    expect(flags[0].context.length).toBeLessThanOrEqual('committed suicide'.length + 40);
  });
});
