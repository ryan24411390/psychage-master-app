import { describe, expect, it } from 'vitest';

import { CRISIS_DATASET } from '@/features/crisis/helplines.fixtures';

// Conformance of the CT3 FIXTURE dataset to the frozen helplineRow schema. This pins
// the SHAPE, not the (dummy) content — CT3 replaces the values wholesale.
describe('crisis fixture dataset — schema conformance', () => {
  it('every helpline row carries exactly the five frozen fields, correctly typed', () => {
    for (const [bucket, rows] of Object.entries(CRISIS_DATASET.helplinesByRegion)) {
      for (const row of rows) {
        expect(typeof row.name).toBe('string');
        expect(row.name.length).toBeGreaterThan(0);
        expect(typeof row.fiveWordDesc).toBe('string');
        expect(row.fiveWordDesc.length).toBeGreaterThan(0);
        expect(typeof row.callNumber).toBe('string');
        expect(row.callNumber.length).toBeGreaterThan(0);
        expect(typeof row.textCapable).toBe('boolean');
        // The row's own region matches the bucket it is filed under.
        expect(row.region).toBe(bucket);
        // No stray fields beyond the frozen five.
        expect(Object.keys(row).sort()).toEqual(
          ['callNumber', 'fiveWordDesc', 'name', 'region', 'textCapable'].sort(),
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

  it('the region roster has unique codes and keeps the IN gap fixture intact', () => {
    const codes = CRISIS_DATASET.regions.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    // IN is rostered + has an emergency number but no helplines (the gap fixture).
    expect(codes).toContain('IN');
    expect(CRISIS_DATASET.emergencyByRegion.IN).toBeDefined();
    expect(CRISIS_DATASET.helplinesByRegion.IN).toBeUndefined();
  });
});
