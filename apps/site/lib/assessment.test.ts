/**
 * Assessment destination (assessment-destination): one contract base URL, a
 * real site route, and a working fallback that keeps only campaign attribution.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { ASSESSMENT_BASE_URL, ASSESSMENT_VERDICT } from "@leapscore/contracts";
import {
  assessmentAttribution,
  assessmentBookingHref,
  assessmentMailto,
} from "@/lib/assessment";

describe("5.1 the assessment destination is single-sourced", () => {
  it("keeps the placeholder base URL at the site's /assessment route", () => {
    expect(ASSESSMENT_BASE_URL).toBe("https://leapscore.dev/assessment");
    expect(new URL(ASSESSMENT_BASE_URL).pathname).toBe("/assessment");
  });

  it("ships a served page at that path", () => {
    const page = join(process.cwd(), "app", "assessment", "page.tsx");
    expect(existsSync(page)).toBe(true);
    expect(readFileSync(page, "utf8")).toMatch(/Book the \$0 Assessment/);
  });

  it("defines ASSESSMENT_BASE_URL exactly once in the repository", () => {
    const roots = ["app", "components", "lib", "../../packages/contracts/src", "../../apps/scanner/src", "../../apps/scanner/bin"];
    const offenders: string[] = [];
    for (const root of roots) {
      const dir = join(process.cwd(), root);
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { recursive: true })) {
        const path = join(dir, String(entry));
        if (!/\.(ts|tsx)$/.test(path) || path.includes(".test.")) continue;
        if (readFileSync(path, "utf8").match(/export const ASSESSMENT_BASE_URL\s*=/)) {
          offenders.push(path);
        }
      }
    }
    expect(offenders).toHaveLength(1);
    expect(offenders[0].replace(/\\/g, "/")).toContain("packages/contracts/src/index.ts");
  });
});

describe("5.2 the fallback booking path carries campaign attribution", () => {
  it("a scored report CTA reaches a mailto with the campaign and band", () => {
    const params = { utm_campaign: "cli-scan-v1", band: "moderate" };
    expect(assessmentAttribution(params)).toEqual({ campaign: "cli-scan-v1", band: "moderate" });
    const booking = assessmentBookingHref(params);
    expect(booking.kind).toBe("mailto");
    expect(decodeURIComponent(booking.href)).toContain("Campaign: cli-scan-v1");
    expect(decodeURIComponent(booking.href)).toContain("Band: moderate");
    expect(booking.href.startsWith("mailto:")).toBe(true);
  });

  it("a suppressed report CTA carries the verdict and no band", () => {
    const params = { utm_campaign: "cli-scan-v1", verdict: ASSESSMENT_VERDICT };
    const mailto = decodeURIComponent(assessmentMailto(params));
    expect(mailto).toContain(`Verdict: ${ASSESSMENT_VERDICT}`);
    expect(mailto).not.toContain("Band:");
    expect(mailto).not.toContain("band=");
  });

  it("drops anything that is not campaign attribution", () => {
    const params = {
      utm_campaign: "cli-scan-v1",
      band: "critical",
      repo: "acme/claims",
      path: "/Users/alice/claims",
      code: "secret()",
    } as Record<string, string>;
    const mailto = decodeURIComponent(assessmentMailto(params));
    expect(mailto).toContain("Band: critical");
    expect(mailto).not.toContain("acme/claims");
    expect(mailto).not.toContain("/Users/alice");
    expect(mailto).not.toContain("secret()");
    expect(mailto).not.toContain("repo=");
  });
});
