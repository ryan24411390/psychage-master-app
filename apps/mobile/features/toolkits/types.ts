// Toolkits — domain types. Mirrors the web content model (psychage-v2
// src/services/toolkitService.ts) VERBATIM so the same shared-Supabase rows
// deserialize identically and the progress upsert stays wire-compatible.
//
// A Toolkit is a curated, clinically-themed bundle of existing surfaces (tools,
// articles, glossary terms, coping strategies). It is EDUCATIONAL grouping only —
// it does not diagnose, score, or treat (SR-3). Content rows are authored +
// clinically gated server-side (`needs_clinical_review`); this layer only reads
// the published subset.

/** Editorial lifecycle. Only 'published' rows are anon-readable (RLS). */
export type ToolkitStatus = 'review' | 'published';

/** What an item points at. Mirrors the web CHECK constraint exactly. */
export type ToolkitItemKind = 'tool' | 'article' | 'term' | 'strategy';

/**
 * The "was this helpful?" answer. Deliberately NON-clinical and NON-numeric —
 * two gentle options only, mirroring the web enum so progress upserts validate
 * against the same DB CHECK constraint.
 */
export type SelfRating = 'a_little' | 'not_yet';

/** A published toolkit header (no items). */
export interface Toolkit {
  readonly id: string;
  readonly theme_title: string;
  readonly clinical_subtitle: string | null;
  readonly intro_md: string | null;
  readonly status: ToolkitStatus;
  readonly needs_clinical_review: boolean;
  readonly sort_order: number;
}

/** One item inside a toolkit — a reference to an existing surface. */
export interface ToolkitItem {
  readonly id: string;
  readonly toolkit_id: string;
  readonly kind: ToolkitItemKind;
  /** `tool:<slug>` | `article:<cat>/<slug>` | `term:<slug>` | `strategy:<slug>`. */
  readonly ref_id: string;
  readonly label: string;
  readonly sort_order: number;
}

/** A toolkit with its ordered items, as the detail screen consumes it. */
export interface ToolkitWithItems extends Toolkit {
  readonly items: ToolkitItem[];
}

/** Per-item engagement, shaped to mirror the web `ItemProgress` row. */
export interface ItemProgress {
  readonly opened_at: string | null;
  readonly completed_at: string | null;
  readonly self_rating: SelfRating | null;
}

/** Progress for a toolkit's items, keyed by `toolkit_item.id`. */
export type ProgressMap = Record<string, ItemProgress>;
