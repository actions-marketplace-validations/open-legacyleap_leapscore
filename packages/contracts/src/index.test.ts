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
  POSITIONING_LINE,
  BAND_FLOORS,
  bandThresholdFor,
  nextBandForScore,
  formatPp,
  formatBandPathClause,
  bandPathBlock,
  DELTA_DOCUMENT,
  DELTA_SCHEMA_VERSION,
  isDeltaDocument,
  resolveRequestedIndicators,
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

describe("positioning line", () => {
  it("holds the exact release sentence", () => {
    expect(POSITIONING_LINE).toBe(
      "LeapScore sees the structure. The assessment understands what the code does.",
    );
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

describe("band vocabulary resolves from the one threshold table (band-path D4)", () => {
  it("floors mirror 80/53/27 and accept only public band names", () => {
    expect(BAND_FLOORS).toEqual({ critical: 0, high: 27, moderate: 53, low: 80 });
    expect(bandThresholdFor("Moderate")).toBe(53);
    expect(bandThresholdFor(" critical ")).toBe(0);
    expect(bandThresholdFor("healthy")).toBeUndefined();
    expect(bandThresholdFor("")).toBeUndefined();
  });
  it("destination is the next band above the sealed score", () => {
    expect(nextBandForScore(48)).toEqual({ band: "Moderate", threshold: 53 });
    expect(nextBandForScore(26)).toEqual({ band: "High", threshold: 27 });
    expect(nextBandForScore(0)).toEqual({ band: "High", threshold: 27 });
    expect(nextBandForScore(60)).toEqual({ band: "Low", threshold: 80 });
    expect(nextBandForScore(85)).toBeNull();
    expect(nextBandForScore(80)).toBeNull();
  });
  it("band labels come from tierForScore, never a second table", () => {
    for (const { band, threshold } of [
      { band: "High", threshold: 27 },
      { band: "Moderate", threshold: 53 },
      { band: "Low", threshold: 80 },
    ]) {
      expect(tierForScore(threshold)).toBe(band);
    }
  });
});

describe("next-band path contract field (band-path)", () => {
  const path = {
    destination: "Moderate",
    threshold: 53,
    points_needed: 5,
    classes: [
      {
        class: "sprint" as const,
        pp: 4.2,
        cumulative_pp: 4.2,
        arrival: "not-reached" as const,
        steps: [
          { row: "SEC-01", name: "Unpatched Vulnerabilities", recoverable_pp: 4.2, effort: "🔶 ~2–4 h", quick_win: "patch today" },
        ],
      },
      {
        class: "quarter" as const,
        pp: 2.6,
        cumulative_pp: 6.8,
        arrival: "combined" as const,
        steps: [],
      },
    ],
    unreached_rows: 6,
    terminal: false,
  };

  it("formatPp trims to two decimals without trailing zeros", () => {
    expect(formatPp(6.1)).toBe("6.1");
    expect(formatPp(2.2222)).toBe("2.22");
    expect(formatPp(5)).toBe("5");
  });

  it("stdout clause names destination, distance, and the crossing class", () => {
    expect(formatBandPathClause(path, "High")).toBe("next:Moderate +5pp via sprint+quarter");
    const alone = { ...path, classes: [{ ...path.classes[0], pp: 6.1, cumulative_pp: 6.1, arrival: "alone" as const }] };
    expect(formatBandPathClause(alone, "High")).toBe("next:Moderate +5pp via sprint");
    const unreachable = { ...path, classes: [path.classes[0]] };
    expect(formatBandPathClause(unreachable, "High")).toBe("next:Moderate +5pp unreachable");
  });

  it("terminal clause carries no destination", () => {
    const terminal = { ...path, destination: null, threshold: null, points_needed: null, classes: [], terminal: true };
    expect(formatBandPathClause(terminal, "Low")).toBe("next:none (at Low)");
    const block = bandPathBlock(terminal, { tier: "Low", score: 85 });
    expect(block.statement).toMatch(/highest band \(Low\)/);
    expect(block.classes).toHaveLength(0);
    expect(block.shortfall).toBeNull();
  });

  it("block states the honest non-arrival and the unreached count", () => {
    const block = bandPathBlock({ ...path, classes: [path.classes[0]] }, { tier: "High", score: 48 });
    expect(block.statement).toBe("Reach Moderate — 5pp needed (band floor 53, sealed 48).");
    expect(block.shortfall).toMatch(/No combination of graded deductions reaches Moderate/);
    expect(block.shortfall).toMatch(/6 rows .* would have to be graded first/);
    expect(block.unreached).toMatch(/^6 rows could not be reached/);
    expect(block.classes[0].arrival).toBe("Sprint stays short of Moderate");
  });

  it("block reports per-class cumulative arrival without smoothing", () => {
    const block = bandPathBlock(path, { tier: "High", score: 48 });
    expect(block.classes.map((c) => [c.label, c.total, c.cumulative, c.arrival])).toEqual([
      ["Sprint", "4.2pp", "4.2pp", "Sprint stays short of Moderate"],
      ["Quarter", "2.6pp", "6.8pp", "Quarter crosses only with the classes before it"],
    ]);
    expect(block.shortfall).toBeNull();
  });

  it("an additive field keeps the contract at the current version", () => {
    const envelope = { contractVersion: CONTRACT_VERSION, meta: {}, report: { next_band_path: path } };
    expect(() => assertContractVersion(envelope)).not.toThrow();
    expect(CONTRACT_VERSION).toBe(1);
  });
});

describe("run-diff delta document (one definition, never an envelope)", () => {
  const delta = {
    document: DELTA_DOCUMENT,
    delta_schema: DELTA_SCHEMA_VERSION,
    baseline: { runId: "a__x__1", score: 44, tier: "High", suppressed: false },
    current: { runId: "a__x__2", score: 48, tier: "High", suppressed: false },
    verdict: {
      status: "comparable",
      inputs: [{ name: "subject", matched: true, detail: "a" }],
    },
    headline: {
      baseline: 44,
      current: 48,
      movement: 4,
      code_attributable: 0,
      coverage_attributable: 4,
      model_attributable: 0,
      unattributable: 0,
      policy: "frozen",
      no_code_change_measured: true,
      statement: "no code change was measured",
      attribution_notes: [],
    },
    rows: [],
    transitions: [],
  };

  it("recognises a delta and refuses an envelope", () => {
    expect(isDeltaDocument(delta)).toBe(true);
    expect(
      isDeltaDocument({ contractVersion: CONTRACT_VERSION, meta: {}, report: {}, trace: [] }),
    ).toBe(false);
    expect(isDeltaDocument(null)).toBe(false);
    expect(isDeltaDocument("run-delta")).toBe(false);
    expect(isDeltaDocument({ document: "run-delta" })).toBe(false);
  });

  it("carries no score fingerprint of its own", () => {
    expect(Object.keys(delta)).not.toContain("score_fingerprint");
    expect(JSON.stringify(delta)).not.toContain("score_fingerprint");
  });

  it("both run references name run id, fingerprint, era, score, and tier", () => {
    for (const ref of [
      { ...delta.baseline, score_fingerprint: "f".repeat(64), fingerprint_version: 2 },
      { ...delta.current, score_fingerprint: "g".repeat(64), fingerprint_version: 2 },
    ]) {
      expect(ref.runId).toBeTruthy();
      expect(ref.score_fingerprint).toHaveLength(64);
      expect(ref.fingerprint_version).toBe(2);
      expect(typeof ref.score).toBe("number");
      expect(ref.tier).toBeTruthy();
    }
  });

  it("an incomparable delta carries a named cause and no numbers", () => {
    const refused = {
      ...delta,
      verdict: {
        status: "incomparable",
        cause: "fingerprint-era-mismatch",
        inputs: [{ name: "fingerprint-era", matched: false, detail: "2 vs 1" }],
      },
      headline: undefined,
      rows: [],
      transitions: [],
    };
    expect(isDeltaDocument(refused)).toBe(true);
    expect(refused.verdict.cause).toBe("fingerprint-era-mismatch");
    expect(refused.headline).toBeUndefined();
    expect(refused.rows).toEqual([]);
    expect(refused.transitions).toEqual([]);
  });
});

describe("requested indicator set resolution (run-diff D3)", () => {
  it("prefers the recorded set, including a recorded empty set", () => {
    expect(
      resolveRequestedIndicators({ meta: { requested_indicators: ["DOCS-01", "ARCH-05", "DOCS-01"] } }),
    ).toEqual({ ok: true, indicators: ["ARCH-05", "DOCS-01"], source: "recorded" });
    expect(resolveRequestedIndicators({ meta: { requested_indicators: [] } })).toEqual({
      ok: true,
      indicators: [],
      source: "recorded",
    });
  });

  it("reconstructs from full-table statuses when the field is absent", () => {
    const report = {
      full_table: [
        { id: "DOCS-01", status: "measured" },
        { id: "ARCH-05", status: "unknown" },
        { id: "SEC-02", status: "not_applicable" },
        { id: "SEC-07", status: "not_implemented" },
      ],
    };
    expect(resolveRequestedIndicators({ meta: {}, report })).toEqual({
      ok: true,
      indicators: ["ARCH-05", "DOCS-01", "SEC-02"],
      source: "reconstructed",
    });
  });

  it("absent inputs are distinguishable from an empty set and refuse", () => {
    const absent = resolveRequestedIndicators({ meta: {} });
    expect(absent.ok).toBe(false);
    if (!absent.ok) expect(absent.reason).toBe("missing-comparability-inputs");
    expect(resolveRequestedIndicators({ meta: {}, report: { full_table: [] } }).ok).toBe(false);
    expect(resolveRequestedIndicators({ meta: { requested_indicators: undefined } }).ok).toBe(false);
  });
});
