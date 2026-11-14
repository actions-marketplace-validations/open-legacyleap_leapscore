/**
 * Claim honesty (launch-surface): the public surfaces may not publish a
 * pre-launch or prohibited claim. One list, every route.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import Home from "@/app/page";
import MethodPage from "@/app/method/page";
import ProductPage from "@/app/product/page";
import SamplesPage from "@/app/samples/page";
import SampleDetailPage from "@/app/samples/[slug]/page";
import sampleEnvelope from "@/lib/samples/maven-multi-module.json";

const SAMPLE_SLUG = "maven-multi-module";

/** Prohibited claims from the GTM claim register §5.4 and the P0 list. */
const BANNED: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /\bwaitlist\b/i, why: "there is no waitlist; the product is live" },
  { pattern: /\bcoming\b/i, why: "nothing on the public surface is 'coming'" },
  { pattern: /\bdeep scan\b/i, why: "Deep Scan is not shipped" },
  { pattern: /\bpoints gained per hour\b/i, why: "no remediation-hour model is published" },
  { pattern: /\bscore-points per hour\b/i, why: "the effort tag is verification effort" },
  { pattern: /\bbenchmarks? you against peers\b/i, why: "no peer dataset exists" },
  { pattern: /\bscores each one\b/i, why: "not all 102 indicators are scored" },
  { pattern: /\b102 inputs\b/i, why: "102 is a rubric denominator, not an input count" },
  { pattern: /live engine:\s*coming/i, why: "the engine is live" },
  { pattern: /past scans appear here/i, why: "the gallery stores no visitor scans" },
];

function assertClean(surface: string, text: string): void {
  for (const { pattern, why } of BANNED) {
    expect(pattern.test(text), `${surface} publishes a prohibited claim (${pattern}): ${why}`).toBe(false);
  }
}

describe("6.5 public claim register", () => {
  it("home page", () => {
    assertClean("/", renderToStaticMarkup(Home()));
  });

  it("home page offers no repository input or scan surface", () => {
    const html = renderToStaticMarkup(Home());
    expect(html).not.toMatch(/<input\b/i);
    expect(html).not.toMatch(/score this repo/i);
    expect(html).not.toContain('href="/live');
    expect(html).not.toContain('href="/reports');
  });

  it("method page", () => {
    assertClean("/method", renderToStaticMarkup(MethodPage()));
  });

  it("sample gallery", () => {
    assertClean("/samples", renderToStaticMarkup(SamplesPage()));
  });

  it("sample report body", async () => {
    const html = renderToStaticMarkup(
      await SampleDetailPage({ params: Promise.resolve({ slug: SAMPLE_SLUG }) }),
    );
    assertClean("/samples/[slug]", html);
    expect(html).toContain("Illustrative sample");
  });

  it("product page is a forwarding document with no published copy", () => {
    const html = renderToStaticMarkup(ProductPage());
    expect(html).toContain('href="../method/"');
    expect(html).not.toMatch(/waitlist|coming/i);
    const source = readFileSync(join(process.cwd(), "app", "product", "page.tsx"), "utf8");
    expect(source).not.toContain("permanentRedirect");
    assertClean("/product", source);
  });

  it("the waitlist component and action are gone from the served surface", () => {
    expect(existsSync(join(process.cwd(), "components", "waitlist-form.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "app", "actions.ts"))).toBe(false);
  });

  it("the sample's engine metadata is the shipped engine, not a coming-soon string", () => {
    const report = (sampleEnvelope as unknown as { report: { snapshot: { engine_version: string; rubric_version: string } } }).report;
    expect(report.snapshot.engine_version).not.toMatch(/coming|mock adapter/i);
    expect(report.snapshot.engine_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(report.snapshot.rubric_version).not.toMatch(/planning/i);
  });
});
