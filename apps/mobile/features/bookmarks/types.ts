/**
 * Bookmarks (Saved Items) — domain types.
 *
 * Mirrors the shared `public.bookmarks` table (web migration
 * 20250109000001_create_remaining_tables.sql). RLS scopes every row to
 * `auth.uid()`; insert/delete only (no UPDATE). See .specs/bookmarks/design.md.
 */

/** `video` is schema-supported but has no V1 save surface (see AC-1.5). */
export type ResourceType = 'article' | 'video' | 'provider' | 'tool';

export interface Bookmark {
  readonly id: string;
  readonly user_id: string;
  readonly resource_type: ResourceType;
  readonly resource_id: string;
  readonly created_at: string;
}

/** The (type, id) pair that uniquely identifies a saved resource for a user. */
export interface BookmarkRef {
  readonly resource_type: ResourceType;
  readonly resource_id: string;
}
