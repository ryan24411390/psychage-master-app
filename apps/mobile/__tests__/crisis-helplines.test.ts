import { describe, expect, it } from 'vitest';

import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';
import { CRISIS_SEED } from '@/features/crisis/helplines.seed';

// Conformance of the DERIVED crisis dataset to the extended helplineRow schema, plus the
// verification gating the seed mandates (only `verified` rows ship; `do_not_publish` and
// `needs_verification` never reach the UI).
describe('crisis fixture dataset — schema conformance', () => {
  it('every helpline row carries exactly the five schema fields, correctly typed', () => {
    for (const [bucket, rows] of Object.entries(CRISIS_DATASET.helplinesByRegion)) {
      for (const row of rows) {
        expect(typeof row.name).toBe('string');
        expect(row.name.length).toBeGreaterThan(0);
        expect(typeof row.fiveWordDesc).toBe('string');
        expect(row.fiveWordDesc.length).toBeGreaterThan(0);
        // callNumber / textNumber are each string | null, but never both null.
        expect(row.callNumber === null || typeof row.callNumber === 'string').toBe(true);
        expect(row.textNumber === null || typeof row.textNumber === 'string').toBe(true);
        expect(row.callNumber !== null || row.textNumber !== null).toBe(true);
        // The row's own region matches the bucket it is filed under.
        expect(row.region).toBe(bucket);
        // No stray fields beyond the five.
        expect(Object.keys(row).sort()).toEqual(
          ['callNumber', 'fiveWordDesc', 'name', 'region', 'textNumber'].sort(),
        );
      }
    }
  });

  it('every emergency number is a non-empty string and the default is present', () => {
    for (const num of Object.values(CRISIS_DATASET.emergencyByRegion)) {
      expect(typeof num).toBe('string');
      expect(num.length).toBeGreaterThan(0);
    }
    expect(CRISIS_DATASET.defaultEmergencyNumber.length).toBeGreaterThan(0);
  });

  it('the region roster has unique codes and is sorted by name for the picker', () => {
    const codes = CRISIS_DATASET.regions.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    const names = CRISIS_DATASET.regions.map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

// The single gating boundary: derivation drops every non-verified seed row.
describe('crisis dataset — verification gating', () => {
  it('ships ONLY verified helplines (no needs_verification / do_not_publish leaks)', () => {
    const verifiedNames = new Set(
      CRISIS_SEED.helplines
        .filter((h) => h.verificationStatus === 'verified')
        .map((h) => `${h.countryIso2}:${h.name}`),
    );
    for (const rows of Object.values(CRISIS_DATASET.helplinesByRegion)) {
      for (const row of rows) {
        expect(verifiedNames.has(`${row.region}:${row.name}`)).toBe(true);
      }
    }
  });

  it('never ships a do_not_publish row (e.g. the defunct Egypt / dissolved Morocco lines)', () => {
    const allShipped = Object.values(CRISIS_DATASET.helplinesByRegion).flat();
    expect(allShipped.some((r) => r.name.includes('DEFUNCT'))).toBe(false);
    expect(CRISIS_DATASET.helplinesByRegion.EG ?? []).toHaveLength(0);
    expect(CRISIS_DATASET.helplinesByRegion.MA ?? []).toHaveLength(0);
  });

  it('a has_verified_helplines=false country resolves to the gap state', () => {
    // Sweden + Norway carry only needs_verification rows → absent from the dataset.
    expect(CRISIS_DATASET.helplinesByRegion.SE).toBeUndefined();
    expect(CRISIS_DATASET.helplinesByRegion.NO).toBeUndefined();
    // …but their emergency numbers are still present (gap state still dials local help).
    expect(CRISIS_DATASET.emergencyByRegion.SE).toBe('112');
    expect(CRISIS_DATASET.emergencyByRegion.NO).toBe('112');
  });
});

// Spot-checks on the founder-verified shipping set. Only the allowlisted rows ship; the
// rest of the CT3 roster stays staged as needs_verification until founder promotion.
describe('crisis dataset — verified content spot-checks', () => {
  it('only the two founder-verified launch helplines ship (US 988 + BD Kaan Pete Roi)', () => {
    const shipped = Object.values(CRISIS_DATASET.helplinesByRegion)
      .flat()
      .map((r) => `${r.region}:${r.name}`)
      .sort();
    expect(shipped).toEqual(['BD:Kaan Pete Roi', 'US:988 Suicide & Crisis Lifeline']);
  });

  it('US ships 911 emergency + the verified 988 Lifeline (call + text on 988)', () => {
    expect(CRISIS_DATASET.emergencyByRegion.US).toBe('911');
    const us = CRISIS_DATASET.helplinesByRegion.US ?? [];
    expect(us).toHaveLength(1);
    const lifeline = us.find((r) => r.name === '988 Suicide & Crisis Lifeline');
    expect(lifeline?.callNumber).toBe('988');
    expect(lifeline?.textNumber).toBe('988');
    // Crisis Text Line is staged needs_verification post-gating → must not ship.
    expect(us.find((r) => r.name === 'Crisis Text Line')).toBeUndefined();
  });

  it('BD ships 999 emergency + the founder-verified Kaan Pete Roi (call-only)', () => {
    expect(CRISIS_DATASET.emergencyByRegion.BD).toBe('999');
    const bd = CRISIS_DATASET.helplinesByRegion.BD ?? [];
    expect(bd).toHaveLength(1);
    const kaan = bd.find((r) => r.name === 'Kaan Pete Roi');
    expect(kaan?.callNumber).toBe('09612119911');
    expect(kaan?.textNumber).toBeNull(); // call-only — no Text pill
  });

  it('India is a gap state — its CT3 lines are staged, not shipped, but 112 still dials', () => {
    expect(CRISIS_DATASET.helplinesByRegion.IN).toBeUndefined();
    expect(CRISIS_DATASET.emergencyByRegion.IN).toBe('112');
  });
});
