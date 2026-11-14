/**
 * Artifact assertions for the static export (design D1/D3, static-hosting).
 *
 * A green `next build` is not enough: the 14 Nov 2026 export succeeded while
 * emitting three error pages. This script checks the bytes a host would serve:
 *
 *   (a) no exported document contains Next's `__next_error__` marker;
 *   (b) no internal root-absolute URL escapes the configured base path;
 *   (c) every forwarded path (`/methodology`, `/product`) has a document.
 *
 * Run from `apps/site` after `next build` (the package `postbuild` script does).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { SITE_BASE_PATH } from "../lib/base-path";

const SITE = join(import.meta.dirname, "..");
const OUT = join(SITE, "out");
const FORWARDED_PATHS = ["methodology", "product"] as const;

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

if (!existsSync(OUT)) {
  violations.push("out/: no export artifact — run the site build first");
} else {
  for (const file of walk(OUT)) {
    const rel = relative(OUT, file);

    if (file.endsWith(".html")) {
      const html = readFileSync(file, "utf-8");
      if (html.includes("__next_error__")) {
        violations.push(`${rel}: exported an error document (__next_error__)`);
      }
    }

    if (file.endsWith(".html") || file.endsWith(".css")) {
      const text = readFileSync(file, "utf-8");
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
  `assert-export: ok (no error documents; every internal URL stays under ${JSON.stringify(SITE_BASE_PATH)}; forwarded paths exported)`,
);
