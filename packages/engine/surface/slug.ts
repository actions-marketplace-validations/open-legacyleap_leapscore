/** packages/engine/surface/slug.ts — target slug for labels/titles (plan 15 §3, §8) */

export const MAX_SLUG_LEN = 64;

/** Normalize `owner/repo` → `owner-repo` slug: lowercase, illegal→`-`, collapse, trim, cap. */
export function normalizeTargetSlug(raw: string): string {
  const dashed = raw.trim().toLowerCase().replace(/\//g, '-').replace(/[^a-z0-9-]/g, '-');
  const collapsed = dashed.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return collapsed.slice(0, MAX_SLUG_LEN);
}
