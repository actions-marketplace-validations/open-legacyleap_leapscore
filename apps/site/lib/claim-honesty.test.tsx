/**
 * Claim honesty (launch-surface): the public surfaces may not publish a
 * pre-launch or prohibited claim. One list, every route.
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  }),
  permanentRedirect: () => {
    const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
    error.digest = "NEXT_REDIRECT;replace;/method;308;";
    throw error;
  },
  notFound: () => {
    const error = new Error("NEXT_NOT_FOUND") as Error & { digest: string };
    error.digest = "NEXT_NOT_FOUND";
    throw error;
  },
}));

import Home from "@/app/page";
import MethodPage from "@/app/method/page";
import ReportsPage from "@/app/reports/page";
import ReportDetailPage from "@/app/reports/[runId]/page";
import ProductPage from "@/app/product/page";
import sampleEnvelope from "@/lib/fixtures/maven-multi-module__bce7fc0__2026-11-12T155107-061Z.json";

const SAMPLE_RUN_ID = "maven-multi-module__bce7fc0__2026-11-12T155107-061Z";

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
  { pattern: /past scans appear here/i, why: "the reports page stores no visitor scans" },
];

function assertClean(surface: string, text: string): void {
  for (const { pattern, why } of BANNED) {
    expect(pattern.test(text), `${surface} publishes a prohibited claim (${pattern}): ${why}`).toBe(false);
  }
}

describe("6.5 public claim register", () => {
  it("home page", async () => {
    assertClean("/", renderToStaticMarkup(await Home()));
  });

  it("method page", () => {
    assertClean("/method", renderToStaticMarkup(MethodPage()));
  });

  it("reports index", async () => {
    assertClean("/reports", renderToStaticMarkup(await ReportsPage()));
  });

  it("sample report body", async () => {
    const html = renderToStaticMarkup(
      await ReportDetailPage({ params: Promise.resolve({ runId: SAMPLE_RUN_ID }) }),
    );
    assertClean("/reports/[runId]", html);
    expect(html).toContain("Illustrative sample");
  });

  it("product page is a permanent redirect with no published copy", () => {
    expect(() => ProductPage()).toThrow(/NEXT_REDIRECT/);
    const source = readFileSync(join(process.cwd(), "app", "product", "page.tsx"), "utf8");
    expect(source).toContain('permanentRedirect("/method")');
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
