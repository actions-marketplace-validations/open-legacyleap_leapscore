/**
 * The public repository, declared once (design D1).
 *
 * This is the site's only copy of the repository URL. The footer, the home hero
 * licence badge, and the `/method` closing section import it, so the three
 * surfaces cannot drift and the chrome tests assert a single value.
 *
 * The link is a static anchor in the exported artifact: nothing here is
 * fetched, no GitHub API is called, and no rendered value depends on network
 * state. The repository holds the scanner, the canonical rubric catalog, and
 * the report schema.
 */

/** Public repository URL — the site's only copy. */
export const SOURCE_URL = "https://github.com/open-legacyleap/leapscore";

/** Display label for the source link in the footer. */
export const SOURCE_LABEL = "Source";
