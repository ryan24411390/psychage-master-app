# ADR 001 — SR-4 scope: on-device symptom data vs. consented check-in persistence

Status: Proposed (pending: clinical-privacy ratification evidence, security review content,
and the 7-day cooling-off — started 2026-06-13, elapses 2026-06-20)
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

## Decision (proposed)

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

## Open items (gate to Accepted)

- [ ] **Clinical-privacy ratification — pending evidence insertion.** Dr. Lena Dobson,
  Ph.D. in Clinical Neuropsychology. _To be supplied verbatim: the ratification source and
  date (e.g. "ratified via email 2026-06-XX"). Once recorded, check this box. Do not invent._
- [ ] **Security review — pending content insertion.** RLS policy, encryption at rest, and
  exactly which fields are stored: see the "Security review (gate 2)" section below.
  _Once the content is inserted there, check this box._
- [ ] **7-day cooling-off period** per constitution §Amendment (SR-4 amendment friction):
  started 2026-06-13, elapses 2026-06-20.

## Security review (gate 2)

_To be supplied: the security-review markdown (RLS policy, encryption at rest, and the exact
fields stored), inserted verbatim once available._
