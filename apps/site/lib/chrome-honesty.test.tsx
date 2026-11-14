import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import Home from "@/app/page";
import MethodPage from "@/app/method/page";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

describe("funnel-landing chrome tells the current truth", () => {
  it("footer links the site rubric route and drops the unshipped-engine disclaimer", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain('href="/rubric"');
    expect(html).not.toContain("../rubric");
    expect(html).not.toMatch(/until the live engine ships/i);
    expect(html).toMatch(/sample reports are illustrative/i);
    expect(html).toMatch(/local CLI scans and CI scans/i);
    expect(html).toMatch(/available/i);
    expect(html).not.toContain('href="/product"');
    expect(html).not.toContain('href="/report/sample"');
  });

  it("homepage rubric link targets /rubric", () => {
    const html = renderToStaticMarkup(Home());
    expect(html).toContain('href="/rubric"');
    expect(html).not.toContain("../rubric");
  });

  it("header carries exactly the samples, method, and rubric links", () => {
    const html = renderToStaticMarkup(<SiteHeader />);
    const nav = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs).toEqual(["/samples", "/method", "/rubric"]);
    expect(html).not.toContain('href="/live');
    expect(html).not.toContain('href="/reports');
    expect(html).not.toMatch(/engine:\s*coming/i);
  });

  it("method page names only the local and CI scan paths", () => {
    const html = renderToStaticMarkup(MethodPage());
    expect(html).toMatch(/local CLI scan/i);
    expect(html).toMatch(/CI scan/i);
    expect(html).not.toMatch(/live scan/i);
    expect(html).not.toContain('href="/live"');
    expect(html).not.toMatch(/in development behind the waitlist/i);
  });

  it("publishes the kill-switch cap the seal actually applies", () => {
    const html = renderToStaticMarkup(MethodPage());
    // The method page must describe the cap as enforced (band, not score) — the
    // same behavior apps/scanner/scoring/seal.ts applies and reports disclose.
    expect(html).toMatch(/Kill-switch gates/i);
    expect(html).toMatch(/caps the verdict at\s*<[^>]*>High/i);
    expect(html).toMatch(/never the score/i);
    expect(html).toMatch(/ceiling, never a floor/i);
    expect(html).toMatch(/unevaluable/i);
  });

  it("no ../rubric/README.md relative link remains anywhere in the site source", () => {
    const files = ["app", "components", "lib"].flatMap((root) =>
      readdirSync(join(process.cwd(), root), { recursive: true })
        .map((p) => join(root, String(p)))
        .filter((p) => /\.(ts|tsx)$/.test(p) && !p.includes(".test.")),
    );
    const offenders = files.filter((f) =>
      readFileSync(join(process.cwd(), f), "utf8").includes("../rubric/README.md"),
    );
    expect(offenders).toEqual([]);
  });
});
