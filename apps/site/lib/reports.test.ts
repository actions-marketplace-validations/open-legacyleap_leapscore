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
  ingestReportDocuments,
} from "@/lib/reports";
import { resolveEngineSha7, CONTRACT_VERSION } from "@leapscore/contracts";
import sampleEnvelope from "@/lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json";

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

// Ingest safety: a report directory may hold a sealed envelope plus the derived
// report.delta.json. The delta never becomes a run row; unknown-version
// envelopes keep the pre-change skip, now with the reason recorded.
describe("ingest safety (report-envelope: delta document shape)", () => {
  const runRef = (score: number) => ({
    runId: "django__django__506fc82__2026-08-12T000000-000Z",
    score,
    tier: "Moderate",
    suppressed: false,
  });
  const deltaDocument = () => ({
    document: "run-delta",
    delta_schema: 1,
    baseline: runRef(58),
    current: runRef(58),
    verdict: { status: "comparable", inputs: [] },
    rows: [],
    transitions: [],
  });
  const envelopeDocument = () => JSON.parse(JSON.stringify(sampleEnvelope)) as Record<string, unknown>;

  it("7.1 skips a delta document as a non-envelope with a recorded warning and creates no run row", () => {
    const result = ingestReportDocuments([deltaDocument()]);
    expect(result.envelopes).toEqual([]);
    expect(result.metas).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].reason).toBe("delta-document");
    expect(result.warnings[0].detail).toContain("run-delta");
    expect(result.warnings[0].detail).toContain("no run row created");
  });

  it("7.2 ingests the envelope and skips only the delta when both share a directory", () => {
    const result = ingestReportDocuments([envelopeDocument(), deltaDocument()]);
    expect(result.envelopes).toHaveLength(1);
    expect(result.metas.map((m) => m.runId)).toEqual(["django__django__506fc82__2026-08-12T000000-000Z"]);
    expect(result.warnings.map((w) => w.reason)).toEqual(["delta-document"]);
  });

  it("7.3 unknown-version envelopes keep the pre-change behavior (skipped, never a row) with the reason recorded", () => {
    const future = envelopeDocument();
    (future.meta as Record<string, unknown>).contractVersion = CONTRACT_VERSION + 1;
    const result = ingestReportDocuments([future, envelopeDocument()]);
    expect(result.envelopes).toHaveLength(1);
    expect(result.metas).toHaveLength(1);
    expect(result.metas[0].runId).toBe("django__django__506fc82__2026-08-12T000000-000Z");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].reason).toBe("unknown-contract-version");
    expect(result.warnings[0].detail).toContain(String(CONTRACT_VERSION + 1));
  });
});

// The run-history list maps each row from meta alone; the report body must
// never be touched. A body that throws on any read proves the seam.
describe("run-history list reads only meta (report-envelope: list view)", () => {
  it("2.2 renders every list row field without opening the report body", () => {
    const raw = JSON.parse(JSON.stringify(sampleEnvelope)) as Record<string, unknown>;
    raw.report = new Proxy(
      {},
      {
        get: () => {
          throw new Error("report body was opened");
        },
      },
    );
    const { envelopes, metas, warnings } = ingestReportDocuments([raw]);
    expect(warnings).toEqual([]);
    expect(envelopes).toHaveLength(1);
    // The fields /reports renders per row, sourced exclusively from meta.
    const row = metas[0];
    expect({
      repo: row.repo,
      score: row.score,
      tier: row.tier,
      ranAt: row.ranAt,
      durationMs: row.durationMs,
      budgetMs: row.budgetMs,
      engineSha7: row.engineSha7,
      repoSha: row.repoSha,
      status: row.status,
      runId: row.runId,
    }).toEqual({
      repo: "django/django",
      score: 58,
      tier: "Moderate",
      ranAt: "2026-08-12T00:00:00.000Z",
      durationMs: 0,
      budgetMs: 0,
      engineSha7: "506fc82",
      repoSha: "506fc82",
      status: "complete",
      runId: "django__django__506fc82__2026-08-12T000000-000Z",
    });
  });
});
