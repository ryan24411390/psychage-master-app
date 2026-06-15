# ADR 001 — SR-4 scope: on-device symptom data vs. consented check-in persistence

Status: Accepted (2026-06-14)
Date: 2026-06-05
Amends: constitution.md — Sacred Rule SR-4

## Context

- SR-4's prose in constitution.md currently reads broadly enough to forbid writing any
  mood/check-in data to Supabase.
- ARCHITECTURE.md §3 and rules/auth.md §4 design the check_ins table to sync to Supabase
  (per-user, RLS-protected) once a user has an account.
- The SR-4 enforcement hook scans telemetry only (e.g. Sentry breadcrumbs), not Supabase
  writes — so enforcement already assumes the narrower scope.
- V1_FEATURE_SCOPE §1 sells check-in history + multi-device sync, which require persistence.
- Surfaced by the Daily Check-In discovery brief, Open Question #1.

## Decision

- SR-4 protects symptom-assessment data: Symptom Navigator selections and Navigator state
  never leave the device and never appear in telemetry. Unchanged.
- Daily check-in data (mood rating + optional notes) is a distinct category: voluntary,
  user-consented self-tracking the user opts into persisting for streaks/history/trends.
  It MAY be stored in Supabase, scoped to the user's account, under row-level security
  (a user reads only their own rows). It is NOT SR-4-protected.
- The line: SR-4 guards assessment data the user did not consent to persist; check-ins are
  self-tracking the user explicitly chose to persist.

## Consequences

- constitution.md SR-4 prose must be tightened to make this distinction explicit. That
  edit is gated on this ADR moving to Accepted and is NOT made here.
- Once Accepted, the Daily Check-In sync is unblocked for /spec-implement.
- The SR-4 telemetry hook is unchanged. Mobile↔web data models stay independent.

## Ratification (gates satisfied)

Both substantive gates confirmed satisfied on 2026-06-14 per founder decision:

- Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology — clinical-privacy ratification: **satisfied 2026-06-14**.
- Security review of the storage model (RLS policy, encryption at rest, exactly which fields are stored): **satisfied 2026-06-14**.
