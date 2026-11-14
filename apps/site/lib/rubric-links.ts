/**
 * The only place that composes rubric URLs (design D8).
 *
 * The two-digit category prefix comes from `CATEGORY_ORDER` — the same generated
 * order the category route uses — so a reader can cite either the ID a report row
 * prints or the document path. Components import this instead of typing a
 * `/rubric/...` string; `next/link` applies the configured base path.
 */
import { CATEGORY_ORDER } from "./generated/rubric";

/** The route prefix (`01`…`10`) for a category code. */
export function categoryPrefix(code: string): string {
  const index = CATEGORY_ORDER.indexOf(code as (typeof CATEGORY_ORDER)[number]);
  if (index === -1) {
    throw new Error(`unknown rubric category ${code}`);
  }
  return String(index + 1).padStart(2, "0");
}

/** The category index path, e.g. `/rubric/02`. */
export function categoryHref(code: string): string {
  return `/rubric/${categoryPrefix(code)}`;
}

/** The indicator document path, e.g. `/rubric/02/ARCH-02`. */
export function indicatorHref(id: string): string {
  const code = id.split("-")[0] ?? "";
  return `/rubric/${categoryPrefix(code)}/${id.toUpperCase()}`;
}

/**
 * The indicator path, or null when the ID is not in the rubric. Report surfaces
 * render rows from sealed envelopes and must not crash on an unrecognized ID;
 * they omit the link instead.
 */
export function tryIndicatorHref(id: string): string | null {
  try {
    return indicatorHref(id);
  } catch {
    return null;
  }
}
