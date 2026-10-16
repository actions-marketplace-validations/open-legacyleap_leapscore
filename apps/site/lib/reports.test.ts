import { describe, it, expect } from "vitest";

import {
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  denormalizeTs,
  buildRunId,
  parseRunId,
  repoFromSlug,
  isValidRunId,
  readReportEnvelope,
  listReportMetas,
} from "@/lib/reports";
import { resolveEngineSha7 } from "@leapscore/contracts";

describe("repoSlug derivation", () => {
  it("normalizeRepoForSlug handles URL variants", () => {
    expect(normalizeRepoForSlug("https://github.com/Vercel/next.js.git")).toBe("Vercel/next.js");
    expect(normalizeRepoForSlug("github.com/vercel/next.js/tree/canary")).toBe("vercel/next.js");
    expect(normalizeRepoForSlug("vercel/next.js")).toBe("vercel/next.js");
    expect(normalizeRepoForSlug("https://github.com/vercel/next.js?tab=stars")).toBe("vercel/next.js");
    expect(normalizeRepoForSlug("https://github.com/vercel/next.js#readme")).toBe("vercel/next.js");
  });

  it("repoSlugFromNormalized lowercases and uses __ separator, preserves dots/hyphens", () => {
    expect(repoSlugFromNormalized("Vercel/next.js")).toBe("vercel__next.js");
    expect(repoSlugFromNormalized("my-org/my-repo")).toBe("my-org__my-repo");
    expect(repoSlugFromNormalized("vercel/next.js")).toBe("vercel__next.js");
  });

  it("repoSlugFromUrl is composable", () => {
    expect(repoSlugFromUrl("https://github.com/Vercel/next.js.git")).toBe("vercel__next.js");
    expect(repoSlugFromUrl("github.com/vercel/next.js/tree/canary")).toBe("vercel__next.js");
  });

  it("repoFromSlug reverses slug", () => {
    expect(repoFromSlug("vercel__next.js")).toBe("vercel/next.js");
    expect(repoFromSlug("my-org__my-repo")).toBe("my-org/my-repo");
  });

  it("__ split is reversible for GH-legal names", () => {
    const slug = repoSlugFromNormalized("owner_name/repo.name-123".toLowerCase());
    // underscore in owner is illegal, but we still test split logic
    const parts = slug.split("__");
    expect(parts.length).toBe(2);
  });
});

describe("ts normalization", () => {
  it("normalizeTs removes colons and dots", () => {
    expect(normalizeTs("2026-08-29T05:33:00.123Z")).toBe("2026-08-29T053300-123Z");
    expect(normalizeTs("2026-08-29T05:30:00.123Z")).toBe("2026-08-29T053000-123Z");
  });
  it("denormalizeTs reverses", () => {
    expect(denormalizeTs("2026-08-29T053300-123Z")).toBe("2026-08-29T05:33:00.123Z");
    expect(denormalizeTs("2026-08-29T053000-123Z")).toBe("2026-08-29T05:30:00.123Z");
  });
});

describe("runId grammar", () => {
  it("buildRunId composes correctly", () => {
    const ts = normalizeTs("2026-08-29T05:33:00.123Z");
    expect(buildRunId("vercel__next.js", "abc1234", ts)).toBe("vercel__next.js__abc1234__2026-08-29T053300-123Z");
  });

  it("unknown fallback when engineSha missing", () => {
    const ts = normalizeTs("2026-08-29T05:33:00.123Z");
    expect(buildRunId("vercel__next.js", "", ts)).toBe("vercel__next.js__unknown__2026-08-29T053300-123Z");
    expect(buildRunId("vercel__next.js", "   ", ts)).toBe("vercel__next.js__unknown__2026-08-29T053300-123Z");
  });

  it("parseRunId round-trips", () => {
    const id = "vercel__next.js__abc1234__2026-08-29T053000-123Z";
    expect(parseRunId(id)).toEqual({ repoSlug: "vercel__next.js", engineSha7: "abc1234", ts: "2026-08-29T053000-123Z" });
    expect(parseRunId("bad")).toBeNull();
  });

  it("isValidRunId rejects traversal and bad shapes", () => {
    expect(isValidRunId("vercel__next.js__abc1234__2026-08-29T053000-123Z")).toBe(true);
    expect(isValidRunId("vercel__next.js__unknown__2026-08-29T053000-123Z")).toBe(true);
    expect(isValidRunId("../etc/passwd")).toBe(false);
    expect(isValidRunId("a/b__c__2026-08-29T053000-123Z")).toBe(false);
    expect(isValidRunId("no__separator")).toBe(false);
    expect(isValidRunId("vercel__next.js__abc1234__not-a-ts")).toBe(false);
    expect(isValidRunId("vercel__next.js__abc1234__2026-08-29T053000-123Z/extra")).toBe(false);
    expect(isValidRunId("vercel__next.js__abc1234__2026-08-29T053000-123Z%2F")).toBe(false);
    expect(isValidRunId("..__next.js__abc1234__2026-08-29T053000-123Z")).toBe(false);
    expect(isValidRunId("vercel__next.js\\__abc1234__2026-08-29T053000-123Z")).toBe(false);
  });

  it("isValidRunId after decodeURIComponent rejects encoded traversal", () => {
    const encoded = encodeURIComponent("../../etc/passwd");
    expect(isValidRunId(decodeURIComponent(encoded))).toBe(false);
    const encodedSlash = encodeURIComponent("a/b__c__2026-08-29T053000-123Z");
    expect(isValidRunId(decodeURIComponent(encodedSlash))).toBe(false);
  });
});

describe("resolveEngineSha7 (shared contract)", () => {
  it("prefers LEAPSCORE_SHA", () => {
    expect(resolveEngineSha7({ env: { LEAPSCORE_SHA: "abcdef123456" } })).toBe("abcdef1");
  });
  it("explicit engineRef wins over checkout state", () => {
    expect(resolveEngineSha7({ env: {}, engineRef: "3886fde0c15", execImpl: () => "deadbee" })).toBe("3886fde");
  });
  it("falls back to git exec", () => {
    expect(resolveEngineSha7({ env: {}, execImpl: () => "deadbeef" })).toBe("deadbee");
  });
  it("returns unknown when all fail", () => {
    expect(resolveEngineSha7({ env: {}, execImpl: () => { throw new Error("no git"); } })).toBe("unknown");
  });
});

// Site-owned history: the committed sample fixture is the v1 source.
// No scanner contact, no filesystem reads — pure in-memory fixture.
describe("site-owned history (fixture)", () => {
  it("lists the sample fixture row", async () => {
    const metas = await listReportMetas();
    expect(metas.length).toBe(1);
    expect(metas[0].repo).toBe("django/django");
    expect(metas[0].runId).toBe("django__django__506fc82__2026-08-12T000000-000Z");
    expect(metas[0].score).toBe(58);
    expect(metas[0].tier).toBe("Moderate");
  });

  it("reads the sample envelope by runId", async () => {
    const env = await readReportEnvelope("django__django__506fc82__2026-08-12T000000-000Z");
    expect(env).not.toBeNull();
    expect(env!.meta.runId).toBe("django__django__506fc82__2026-08-12T000000-000Z");
    expect(env!.report.headline.score).toBe(env!.meta.score);
    expect(Array.isArray(env!.trace)).toBe(true);
  });

  it("unknown but grammatical runId resolves to nothing (no scanner fallback)", async () => {
    expect(await readReportEnvelope("vercel__next.js__abc1234__2026-08-29T053000-123Z")).toBeNull();
  });

  it("read rejects traversal runId", async () => {
    expect(await readReportEnvelope("../../etc/passwd")).toBeNull();
    expect(await readReportEnvelope("a/b__c__2026-08-29T053000-123Z")).toBeNull();
    expect(await readReportEnvelope("bad__format")).toBeNull();
  });
});
