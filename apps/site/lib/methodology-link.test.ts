import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { METHODOLOGY_PATH, METHODOLOGY_URL, SITE_BASE_URL } from "@leapscore/contracts";

/**
 * release-funnel: "Methodology link resolves in-repo".
 *
 * The CLI writes one methodology URL into every report.html/report.md, and the
 * site must serve that exact path. The lockstep has three links — the contract's
 * path, the CLI emitter that composes it, and the site route that serves it —
 * and each is asserted here so none can drift into a dead link.
 */
const RENDER_TS = join(process.cwd(), "../scanner/src/scan/render.ts");
const ROUTE_DIR = join(process.cwd(), "app", METHODOLOGY_PATH);

describe("methodology link resolves in-repo", () => {
  it("the contract owns the methodology path and the composed URL", () => {
    expect(METHODOLOGY_PATH).toBe("/methodology");
    expect(SITE_BASE_URL).toBe("https://leapscore.dev");
    expect(METHODOLOGY_URL).toBe(`${SITE_BASE_URL}${METHODOLOGY_PATH}`);
  });

  it("the site serves that exact path (a redirect, with no second methodology page)", () => {
    expect(existsSync(join(ROUTE_DIR, "page.tsx"))).toBe(true);
    const route = readFileSync(join(ROUTE_DIR, "page.tsx"), "utf8");
    expect(route).toMatch(/permanentRedirect\("\/method"\)/);
  });

  it("the CLI emitters consume the contract URL rather than a typed literal", () => {
    const render = readFileSync(RENDER_TS, "utf8");
    expect(render).toMatch(/import \{[^}]*\bMETHODOLOGY_URL\b[^}]*\} from '@leapscore\/contracts'/);
    // No local copy of the URL survives in the emitter.
    expect(render).not.toMatch(/const METHODOLOGY_URL\s*=/);
    expect(render).not.toMatch(/https:\/\/leapscore\.dev\/methodology/);
    // Both human-readable artifacts still close on it.
    expect(render).toMatch(/Methodology: <a href="\$\{METHODOLOGY_URL\}"/);
    expect(render).toMatch(/Methodology: \$\{METHODOLOGY_URL\}/);
  });
});
