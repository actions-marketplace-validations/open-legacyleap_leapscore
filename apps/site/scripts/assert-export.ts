/**
 * Artifact assertions for the static export (design D1/D3, static-hosting).
 *
 * A green `next build` is not enough: the 14 Nov 2026 export succeeded while
 * emitting three error pages. This script checks the bytes a host would serve:
 *
 *   (a) no exported document contains Next's `__next_error__` marker;
 *   (b) no internal root-absolute URL escapes the configured base path;
 *   (c) every forwarded path (`/methodology`, `/product`) has a document;
 *   (d) no exported byte contains a repository data host (`api.github.com`, …),
 *       so the public source link stays a static anchor with no network read;
 *   (e) no module on the served graph uses a network primitive.
 *
 * Run from `apps/site` after `next build` (the package `postbuild` script does).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { SITE_BASE_PATH } from "../lib/base-path";

const SITE = join(import.meta.dirname, "..");
const OUT = join(SITE, "out");
const FORWARDED_PATHS = ["methodology", "product"] as const;

/**
 * Repository hosts that answer with data rather than a page. The exported
 * artifact may link `github.com/open-legacyleap/leapscore`; it must never call
 * one of these, because nothing rendered here may depend on network state.
 */
const REPOSITORY_DATA_HOSTS = [
  "api.github.com",
  "raw.githubusercontent.com",
  "codeload.github.com",
  "objects.githubusercontent.com",
  "api.bitbucket.org",
  "gitlab.com/api",
] as const;

/** Network primitives that would turn a static document into a client. */
const NETWORK_PRIMITIVES =
  /\bfetch\s*\(|XMLHttpRequest|EventSource|\bWebSocket\b|from\s+['"]axios['"]/;

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

function isInsideBasePath(url: string): boolean {
  if (url.startsWith("//")) return true; // protocol-relative external
  if (!SITE_BASE_PATH) return true; // served at the origin root: nothing to escape
  return (
    url === SITE_BASE_PATH ||
    url.startsWith(`${SITE_BASE_PATH}/`) ||
    url.startsWith(`${SITE_BASE_PATH}?`) ||
    url.startsWith(`${SITE_BASE_PATH}#`)
  );
}

const violations: string[] = [];

// (e) The served graph is static: no module may open a request of any kind.
for (const root of ["app", "components", "lib"] as const) {
  if (!existsSync(join(SITE, root))) continue;
  for (const file of walk(join(SITE, root))) {
    const rel = relative(SITE, file);
    if (!/\.(ts|tsx)$/.test(file) || rel.includes(".test.")) continue;
    if (NETWORK_PRIMITIVES.test(readFileSync(file, "utf-8"))) {
      violations.push(
        `${rel}: uses a network primitive on the served graph — the export must not fetch`,
      );
    }
  }
}

if (!existsSync(OUT)) {
  violations.push("out/: no export artifact — run the site build first");
} else {
  for (const file of walk(OUT)) {
    const rel = relative(OUT, file);
    const isText = /\.(html|css|js|mjs|json|txt|xml|svg|map)$/.test(file);
    const text = isText ? readFileSync(file, "utf-8") : "";

    // (d) No repository data host anywhere in the artifact.
    for (const host of REPOSITORY_DATA_HOSTS) {
      if (text.includes(host)) {
        violations.push(
          `${rel}: references repository data host ${host} — the artifact must not read the network`,
        );
      }
    }

    // (a) No exported document is an error page.
    if (file.endsWith(".html") && text.includes("__next_error__")) {
      violations.push(`${rel}: exported an error document (__next_error__)`);
    }

    // (b) No internal root-absolute URL escapes the base path.
    if (file.endsWith(".html") || file.endsWith(".css")) {
      const urls = file.endsWith(".html")
        ? [...text.matchAll(/\b(?:href|src|action)="(\/[^"]*)"/g)]
        : [...text.matchAll(/url\((\/[^)]*)\)/g)];
      for (const match of urls) {
        const url = match[1];
        if (!isInsideBasePath(url)) {
          violations.push(
            `${rel}: root-absolute URL ${url} escapes base path ${JSON.stringify(SITE_BASE_PATH)}`,
          );
        }
      }
    }
  }

  // (c) Every forwarded path has a document.
  for (const forwarded of FORWARDED_PATHS) {
    if (!existsSync(join(OUT, forwarded, "index.html"))) {
      violations.push(
        `out/${forwarded}/index.html: forwarded path has no exported document`,
      );
    }
  }
}

if (violations.length) {
  console.error(
    "assert-export violations:\n" +
      violations.map((v) => `  - ${v}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  `assert-export: ok (no error documents; every internal URL stays under ${JSON.stringify(SITE_BASE_PATH)}; forwarded paths exported; no repository data host and no network primitive)`,
);
