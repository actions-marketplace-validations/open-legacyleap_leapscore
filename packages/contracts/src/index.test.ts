import { describe, it, expect } from "vitest";
import {
  CONTRACT_VERSION,
  normalizeRepoForSlug,
  repoSlugFromUrl,
  normalizeTs,
  buildRunId,
  isValidRunId,
  resolveEngineSha7,
  assertContractVersion,
  UnsupportedContractVersionError,
  tierForScore,
  tierLegacyFor,
  localSlugFromPath,
  assessmentUrlForBand,
  assessmentCtaForBand,
} from "./index";

describe("runId grammar", () => {
  it("equivalent inputs produce one slug", () => {
    expect(repoSlugFromUrl("https://github.com/Vercel/next.js.git")).toBe("vercel__next.js");
    expect(repoSlugFromUrl("github.com/vercel/next.js/tree/canary")).toBe("vercel__next.js");
    expect(repoSlugFromUrl("vercel/next.js")).toBe("vercel__next.js");
  });
  it("rejects traversal", () => {
    expect(isValidRunId("../evil")).toBe(false);
    expect(isValidRunId("a/b")).toBe(false);
    expect(isValidRunId("vercel__next.js__abc1234__2026-08-29T053000-123Z")).toBe(true);
  });
  it("buildRunId falls back to unknown", () => {
    const ts = normalizeTs("2026-08-29T05:33:00.123Z");
    expect(buildRunId("vercel__next.js", "", ts)).toBe("vercel__next.js__unknown__2026-08-29T053300-123Z");
  });
  it("normalizeRepo default", () => {
    expect(normalizeRepoForSlug(null)).toBe("django/django");
  });
});

describe("provenance", () => {
  it("explicit ref wins over checkout state", () => {
    expect(
      resolveEngineSha7({ env: {}, engineRef: "3886fde0c15", execImpl: () => "deadbee" }),
    ).toBe("3886fde");
  });
  it("no ref yields unknown", () => {
    expect(resolveEngineSha7({ env: {}, execImpl: () => { throw new Error("no git"); } })).toBe("unknown");
  });
});

describe("contract version", () => {
  it("sealed envelope carries version", () => {
    expect(CONTRACT_VERSION).toBe(1);
  });
  it("bumped version throws explicitly", () => {
    expect(() => assertContractVersion({ contractVersion: CONTRACT_VERSION + 1 })).toThrow(
      UnsupportedContractVersionError,
    );
  });
  it("current version passes", () => {
    expect(() => assertContractVersion({ contractVersion: CONTRACT_VERSION })).not.toThrow();
  });
});

describe("display tiers with legacy alias (80/53/27)", () => {
  it.each([
    [95, "Low", "Healthy"],
    [80, "Low", "Healthy"],
    [79, "Moderate", "Moderate"],
    [53, "Moderate", "Moderate"],
    [52, "High", "High Risk"],
    [27, "High", "High Risk"],
    [26, "Critical", "Critical"],
    [0, "Critical", "Critical"],
  ])("score %i -> tier %s (legacy %s)", (score, tier, legacy) => {
    expect(tierForScore(score)).toBe(tier);
    expect(tierLegacyFor(tier as string)).toBe(legacy);
  });
});

describe("local path slugs", () => {
  it("derives a stable basename slug", () => {
    expect(localSlugFromPath("./claims-core")).toBe("claims-core");
    expect(localSlugFromPath("/tmp/My App/")).toBe("my-app");
    expect(localSlugFromPath("a/b/../c")).toBe("c");
  });
  it("local runIds validate and differ only by timestamp/engine", () => {
    const ts1 = normalizeTs("2026-10-16T10:00:00.000Z");
    const ts2 = normalizeTs("2026-10-16T10:00:01.000Z");
    const a = buildRunId(localSlugFromPath("./claims-core"), "abc1234", ts1);
    const b = buildRunId(localSlugFromPath("./claims-core"), "abc1234", ts2);
    expect(isValidRunId(a)).toBe(true);
    expect(isValidRunId(b)).toBe(true);
    expect(a).not.toBe(b);
    expect(a.split("__")[0]).toBe(b.split("__")[0]);
  });
  it("rejects / and ..", () => {
    expect(isValidRunId("a/b__c__2026-08-29T053000-123Z")).toBe(false);
    expect(isValidRunId("..__c__2026-08-29T053000-123Z")).toBe(false);
  });
});

describe("assessment funnel link", () => {
  it("carries campaign + band and varies CTA by band", () => {
    for (const band of ["low", "moderate", "high", "critical"]) {
      const url = assessmentUrlForBand(band[0].toUpperCase() + band.slice(1));
      expect(url).toContain("utm_campaign=cli-scan-v1");
      expect(url).toContain(`band=${band}`);
    }
    expect(assessmentCtaForBand("Critical")).toMatch(/\$0 Assessment/);
    expect(assessmentCtaForBand("Low")).toMatch(/keep.*in CI/i);
  });
});
