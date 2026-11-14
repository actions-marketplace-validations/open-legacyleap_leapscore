/**
 * One build-time deployment value (design D2).
 *
 * The site is served from a GitHub Pages project path today
 * (`https://open-legacyleap.github.io/leapscore`) and from the apex domain once
 * the custom domain lands. Both states are expressed by one input:
 *
 *   SITE_BASE="https://open-legacyleap.github.io/leapscore"   (default)
 *   SITE_BASE="https://leapscore.dev"                          (custom domain)
 *   SITE_BASE=""                                               (origin root)
 *   SITE_BASE="/leapscore"                                     (path under the default host)
 *
 * This module is the only place that reads it. `next.config.ts` derives
 * `basePath`/`assetPrefix` from `SITE_BASE_PATH`; `app/layout.tsx` derives
 * `metadataBase` from `SITE_BASE_URL`. Nothing else may read the input, and no
 * document may type an origin-absolute internal URL.
 */

const DEFAULT_ORIGIN = "https://open-legacyleap.github.io";
const DEFAULT_SITE_BASE = `${DEFAULT_ORIGIN}/leapscore`;

function resolveSiteBase(raw: string): URL {
  const value = raw.trim();
  if (!value) return new URL(DEFAULT_ORIGIN);
  if (/^https?:\/\//i.test(value)) return new URL(value);
  return new URL(
    `${DEFAULT_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`,
  );
}

const siteBase = resolveSiteBase(process.env.SITE_BASE ?? DEFAULT_SITE_BASE);

/** Path prefix the site is served under; empty string at an origin root. */
export const SITE_BASE_PATH =
  siteBase.pathname === "/" ? "" : siteBase.pathname.replace(/\/+$/, "");

/** Scheme + host the artifact is published to (no path). */
export const SITE_ORIGIN = siteBase.origin;

/** Fully composed public base URL: origin plus the serving path. */
export const SITE_BASE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}`;
