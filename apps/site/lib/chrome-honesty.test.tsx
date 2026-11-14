import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import Home from "@/app/page";
import MethodPage from "@/app/method/page";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { SOURCE_URL } from "@/lib/source-links";

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

describe("public source is reachable from the site", () => {
  const occurrences = (html: string) =>
    [...html.matchAll(new RegExp(`href="${SOURCE_URL}"`, "g"))].length;

  it("header keeps exactly three nav links and adds no repository link", () => {
    const html = renderToStaticMarkup(<SiteHeader />);
    const nav = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs).toEqual(["/samples", "/method", "/rubric"]);
    expect(html).not.toContain(SOURCE_URL);
  });

  it("footer links the repository URL exactly, labelled as the source", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(occurrences(html)).toBe(1);
    const anchor = html.match(
      new RegExp(`<a[^>]*href="${SOURCE_URL}"[^>]*>([^<]*)</a>`),
    );
    expect(anchor?.[1]).toBe("Source");
  });

  it("the home licence badge is the repository link", () => {
    const html = renderToStaticMarkup(Home());
    expect(occurrences(html)).toBe(1);
    const badge =
      html.match(/<span class="rounded-full[^"]*">[\s\S]*?<\/span>/)?.[0] ?? "";
    expect(badge).toContain(`href="${SOURCE_URL}"`);
    expect(badge).toMatch(/Apache-2\.0/);
  });

  it("the method page links the repository once, naming what it holds", () => {
    const html = renderToStaticMarkup(MethodPage());
    expect(occurrences(html)).toBe(1);
    expect(html).toMatch(
      /scanner,\s*the\s*canonical rubric catalog,\s*and the\s*report schema/i,
    );
  });

  it("the repository URL is declared in exactly one module", () => {
    const files = ["app", "components", "lib"].flatMap((root) =>
      readdirSync(join(process.cwd(), root), { recursive: true })
        .map((p) => join(root, String(p)))
        .filter((p) => /\.(ts|tsx)$/.test(p) && !p.includes(".test.")),
    );
    const offenders = files.filter((f) =>
      readFileSync(join(process.cwd(), f), "utf8").includes(SOURCE_URL),
    );
    expect(offenders).toEqual(["lib/source-links.ts"]);
  });
});
