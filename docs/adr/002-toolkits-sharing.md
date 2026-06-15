# ADR 002 — Toolkits sharing: shareable allow-list, SR-4 exclusion, and the therapist view

Status: Accepted — ratified 2026-06-15
Date: 2026-06-15
Amends: ARCHITECTURE.md §3 (therapist_links / share_history); informs Toolkits Slices 4–5

## Context

- V1 ships "My Therapist + share": a user may share self-tracking with a therapist they name.
  The Toolkits feature (Slices 4–5) adds a share path beyond PDF/email — a revocable
  share-token therapist view (share_history.format='link').
- This raises three gates that must be settled before the share path ships: clinical-privacy
  (what is safe to expose to a third party), security (the token + access-control properties),
  and legal (the regulatory posture under which user-directed sharing is lawful).
- SR-4 (constitution.md) forbids symptom-assessment data — Symptom Navigator selections/state —
  and Clarity Score from leaving the device. The share path must not become an SR-4 bypass.
- Surfaced by the Toolkits sharing design; gates Slices 4–5.

## Decision

- **Shareable allow-list.** Only three categories may flow through the share path: engagement
  (which toolkits/exercises were used, when), self-ratings, and opt-in mood check-ins. Nothing
  else is shareable.
- **Categorical SR-4 exclusion at the data layer.** Clarity Score and Symptom Navigator data are
  unreachable from the share path — excluded at the data layer, not merely hidden in UI. The
  share path cannot select, join to, or serialize SR-4-protected data.
- **Therapist view is a revocable share-token, not an account.** Access is via a hashed token,
  validated server-side; the anonymous role gets no table grant. Revocation is immediate. An
  invalid or revoked token resolves to a neutral state that does not confirm a share ever existed.
- **Therapist-view disclaimer (clinically ratified wording):**
  "Educational — not a clinical record, and not a substitute for the clinician's own assessment."

## Consequences

- Toolkits Slices 4–5 are unblocked for implementation once this ADR is Accepted on main.
- Slice 4's acceptance checks own enforcement and self-verification of the security properties
  (hashed token, server-side validation, no anon grant, SR-4 unreachable, immediate revocation,
  neutral invalid-token state). No separate formal security review was conducted.
- HIPAA-posture counsel confirmation is a tracked fast-follow; the educational /
  not-a-clinical-record disclaimer is already in the design.
- Any therapist-view copy mentioning conditions/symptoms remains subject to Dr. Dobson review.

## Ratification (gates)

- **Clinical-privacy — Ratified.** Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology, 2026-06-15:
  confirmed the shareable allow-list (engagement, self-ratings, opt-in mood check-ins), the
  categorical exclusion of SR-4 data (Clarity Score, Symptom Navigator) at the data layer, and the
  therapist-view disclaimer wording ("Educational — not a clinical record, and not a substitute for
  the clinician's own assessment").
- **Security — Founder-accepted, 2026-06-15.** The critical properties (hashed token, server-side
  validation, no anon table grant, SR-4 unreachable from the share path, immediate revocation,
  neutral invalid-token state) are enforced and verified within Slice 4's acceptance checks. No
  separate formal review was conducted.
- **Legal — Founder-accepted, 2026-06-15**, on the stated user-directed-sharing / non-covered-entity
  posture. Counsel confirmation of the HIPAA posture is tracked as a fast-follow; the educational /
  not-a-clinical-record disclaimer is already in the design.

## Changelog

- 2026-06-15 — Authored and accepted in one step (no prior Proposed commit existed). Clinical-privacy
  gate ratified by Dr. Dobson; security and legal gates founder-accepted.
