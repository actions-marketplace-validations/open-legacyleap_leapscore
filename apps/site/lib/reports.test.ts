import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import os from "node:os";

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
  buildMeta,
  getReportsDir,
  readReportEnvelope,
  listReportMetas,
} from "@/lib/reports";
import { resolveEngineSha7 } from "@leapscore/contracts";
import type { Report } from "@/lib/types";

function writeEnvelopeFile(meta: { runId: string }, report: Report, trace: unknown[] = []) {
  // Test-local writer: the website has no write path; build tooling (the
  // sync step) is the only writer. Tests write fixtures directly via fs.
  const dir = getReportsDir();
  return (async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${meta.runId}.json`), JSON.stringify({ meta, report, trace, contractVersion: 1 }, null, 2), "utf8");
  })();
}

function fakeReport(score = 62.4, tier = "Moderate"): Report {
  return {
    report_schema: "1",
    id: "ls_test",
    status: "complete",
    snapshot: {
      repo: "vercel/next.js",
      scanned_at: "2026-08-29T05:33:00.123Z",
      engine_version: "unified/1.0",
      rubric_version: "docs/rubric@tranche-a",
    },
    headline: { score, tier, ci_band: "complete" },
    coverage: { measured: 5, estimated: 0, unknown: 23, not_applicable: 2, measured_pct: "50%", estimated_pct: "0%", unknown_pct: "50%" },
    gates: [],
    categories: [],
    top_blockers: [],
    deep_dive_scope: [],
    full_table: [],
    sample: true,
  };
}

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

describe("buildMeta", () => {
  it("mirrors headline and fills fields", () => {
    const report = fakeReport(48, "High Risk");
    const meta = buildMeta({
      repo: "vercel/next.js",
      repoSlug: "vercel__next.js",
      engineSha7: "abc1234",
      runId: "vercel__next.js__abc1234__2026-08-29T053000-123Z",
      ranAt: "2026-08-29T05:33:00.123Z",
      durationMs: 83000,
      budgetMs: 90000,
      repoSha: "deadbeef123456",
      report,
    });
    expect(meta.score).toBe(48);
    expect(meta.tier).toBe("High Risk");
    expect(meta.repo).toBe("vercel/next.js");
    expect(meta.repoUrl).toBe("https://github.com/vercel/next.js");
    expect(meta.filename).toBe("vercel__next.js__abc1234__2026-08-29T053000-123Z.json");
    expect(meta.repoSha).toBe("deadbeef123456");
  });
  it("unknown repoSha fallback", () => {
    const report = fakeReport();
    const meta = buildMeta({
      repo: "vercel/next.js",
      repoSlug: "vercel__next.js",
      engineSha7: "unknown",
      runId: "vercel__next.js__unknown__2026-08-29T053000-123Z",
      ranAt: "2026-08-29T05:33:00.123Z",
      durationMs: 1000,
      budgetMs: 10000,
      repoSha: "",
      report,
    });
    expect(meta.repoSha).toBe("unknown");
  });
});

// Directory helpers: use temp dir via mocking cwd
describe("reports dir helpers", () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `leapscore-reports-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
    origCwd = process.cwd();
    // chdir so getReportsDir() resolves to tmpDir/reports
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(origCwd);
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("write and read round-trip", async () => {
    const report = fakeReport();
    const runId = buildRunId("vercel__next.js", "abc1234", normalizeTs("2026-08-29T05:33:00.123Z"));
    const meta = buildMeta({
      repo: "vercel/next.js",
      repoSlug: "vercel__next.js",
      engineSha7: "abc1234",
      runId,
      ranAt: "2026-08-29T05:33:00.123Z",
      durationMs: 1000,
      budgetMs: 5000,
      repoSha: "abc123",
      report,
    });
    await writeEnvelopeFile(meta, report);
    const loaded = await readReportEnvelope(runId);
    expect(loaded).not.toBeNull();
    expect(loaded!.meta.runId).toBe(runId);
    expect(loaded!.report.headline.score).toBe(report.headline.score);
  });

  it("read rejects traversal runId", async () => {
    expect(await readReportEnvelope("../../etc/passwd")).toBeNull();
    expect(await readReportEnvelope("a/b__c__2026-08-29T053000-123Z")).toBeNull();
    expect(await readReportEnvelope("bad__format")).toBeNull();
  });

  it("read rejects unknown contract version explicitly", async () => {
    const report = fakeReport();
    const runId = buildRunId("vercel__next.js", "abc1234", normalizeTs("2026-08-29T05:33:00.123Z"));
    const meta = buildMeta({
      repo: "vercel/next.js",
      repoSlug: "vercel__next.js",
      engineSha7: "abc1234",
      runId,
      ranAt: "2026-08-29T05:33:00.123Z",
      durationMs: 1000,
      budgetMs: 5000,
      repoSha: "abc",
      report,
    });
    await mkdir(getReportsDir(), { recursive: true });
    await writeFile(path.join(getReportsDir(), `${runId}.json`), JSON.stringify({ meta, report, trace: [], contractVersion: 9999 }), "utf8");
    expect(await readReportEnvelope(runId)).toBeNull();
  });

  it("listReportMetas skips bad json and sorts by ranAt desc", async () => {
    const ts1 = normalizeTs("2026-08-28T10:00:00.000Z");
    const ts2 = normalizeTs("2026-08-29T12:00:00.000Z");
    const id1 = buildRunId("vercel__next.js", "abc1234", ts1);
    const id2 = buildRunId("vercel__next.js", "abc1234", ts2);
    const r1 = fakeReport(50, "Moderate");
    const r2 = fakeReport(60, "Moderate");
    await writeEnvelopeFile(buildMeta({ repo: "vercel/next.js", repoSlug: "vercel__next.js", engineSha7: "abc1234", runId: id1, ranAt: "2026-08-28T10:00:00.000Z", durationMs: 1000, budgetMs: 5000, repoSha: "unknown", report: r1 }), r1);
    await writeEnvelopeFile(buildMeta({ repo: "vercel/next.js", repoSlug: "vercel__next.js", engineSha7: "abc1234", runId: id2, ranAt: "2026-08-29T12:00:00.000Z", durationMs: 1000, budgetMs: 5000, repoSha: "unknown", report: r2 }), r2);
    // Add a truncated file with valid runId-like name
    const badId = buildRunId("bad__repo", "abc1234", normalizeTs("2026-08-29T13:00:00.000Z"));
    await mkdir(getReportsDir(), { recursive: true });
    await writeFile(path.join(getReportsDir(), `${badId}.json`), "{ truncated", "utf8");
    // Also add a non-json file to ensure ignored
    await writeFile(path.join(getReportsDir(), `readme.txt`), "hi", "utf8");

    const metas = await listReportMetas();
    expect(metas.length).toBe(2);
    expect(metas[0].runId).toBe(id2);
    expect(metas[1].runId).toBe(id1);
  });

  it("list returns empty when dir missing", async () => {
    // RemoveReports dir if exists, ensure missing case
    await rm(getReportsDir(), { recursive: true, force: true });
    const metas = await listReportMetas();
    expect(metas).toEqual([]);
  });
});
