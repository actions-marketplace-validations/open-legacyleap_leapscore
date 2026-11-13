import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
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
  assessmentNextStep,
  isSuppressedHeadline,
  ASSESSMENT_BASE_URL,
  ASSESSMENT_VERDICT,
  SUPPRESSED_NEXT_STEP,
  POSITIONING_LINE,
  BAND_FLOORS,
  bandThresholdFor,
  nextBandForScore,
  formatPp,
  formatBandPathClause,
  bandPathBlock,
  verifyEffortLabel,
  DELTA_DOCUMENT,
  DELTA_SCHEMA_VERSION,
  isDeltaDocument,
  resolveRequestedIndicators,
  BAND_PALETTE,
  bandColorFor,
  COVERAGE_FLOOR,
  badgeCoverage,
  badgeMonth,
  badgeViewModel,
  reportPermalinkFor,
  REPORT_BASE_URL,
  BadgeRefusalError,
  type BadgeViewModel,
  identityValueLabel,
  identityStatusLabel,
  twoSignificantFigures,
  IDENTITY_FIELD_NAMES,
  type IdentityItem,
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

describe("assessment funnel next step", () => {
  it("carries campaign + band for every public band and varies the sentence", () => {
    for (const [tier, band] of [
      ["Low", "low"],
      ["Moderate", "moderate"],
      ["High", "high"],
      ["Critical", "critical"],
    ] as const) {
      const step = assessmentNextStep({ tier });
      expect(step.url.startsWith(`${ASSESSMENT_BASE_URL}?`)).toBe(true);
      expect(step.url).toContain("utm_campaign=cli-scan-v1");
      expect(step.url).toContain(`band=${band}`);
      expect(step.url).not.toContain("verdict=");
      expect(step.sentence).toMatch(/\$0 Assessment/);
    }
    expect(new Set(["Low", "Moderate", "High", "Critical"].map((tier) => assessmentNextStep({ tier }).sentence)).size).toBeGreaterThan(1);
    expect(assessmentNextStep({ tier: "Critical" }).sentence).toMatch(/\$0 Assessment/);
    expect(assessmentNextStep({ tier: "Low" }).sentence).toMatch(/keep.*in CI/i);
  });

  it("never claims a peer benchmark in any band", () => {
    for (const tier of ["Low", "Moderate", "High", "Critical"]) {
      const { sentence } = assessmentNextStep({ tier });
      expect(sentence).not.toMatch(/benchmark/i);
      expect(sentence).not.toMatch(/peer/i);
    }
  });

  it("suppressed runs carry the verdict and no band", () => {
    const step = assessmentNextStep({ suppressed: true, verdict: ASSESSMENT_VERDICT, tier: "Critical" });
    expect(step.sentence).toBe(SUPPRESSED_NEXT_STEP);
    expect(step.sentence).toMatch(/coverage limit/i);
    expect(step.url).toContain("utm_campaign=cli-scan-v1");
    expect(step.url).toContain(`verdict=${ASSESSMENT_VERDICT}`);
    expect(step.url).not.toContain("band=");
    expect(step.url).not.toContain("critical");
  });

  it("an unknown or missing band fails loudly instead of falling back to Moderate", () => {
    expect(() => assessmentNextStep({ tier: "Healthy" })).toThrow(/unknown or missing sealed band/i);
    expect(() => assessmentNextStep({})).toThrow(/unknown or missing sealed band/i);
    expect(isSuppressedHeadline({ tier: "Moderate" })).toBe(false);
    expect(isSuppressedHeadline({ verdict: ASSESSMENT_VERDICT })).toBe(true);
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

  it("stdout clause names destination, distance, and the crossing class by tag", () => {
    expect(formatBandPathClause(path, "High")).toBe("next:Moderate +5pp via ⚡+🔶");
    const alone = { ...path, classes: [{ ...path.classes[0], pp: 6.1, cumulative_pp: 6.1, arrival: "alone" as const }] };
    expect(formatBandPathClause(alone, "High")).toBe("next:Moderate +5pp via ⚡");
    const unreachable = { ...path, classes: [path.classes[0]] };
    expect(formatBandPathClause(unreachable, "High")).toBe("next:Moderate +5pp unreachable");
    // The clause never falls back to the persisted cost-class key.
    expect(formatBandPathClause(path, "High")).not.toMatch(/sprint|quarter|structural/i);
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
    expect(block.classes[0].arrival).toBe("These rows stay short of Moderate");
  });

  it("block reports per-class cumulative arrival without smoothing", () => {
    const block = bandPathBlock(path, { tier: "High", score: 48 });
    expect(block.classes.map((c) => [c.tag, c.verify, c.total, c.cumulative, c.arrival])).toEqual([
      ["⚡", "Verify in ≤30 min", "4.2pp", "4.2pp", "These rows stay short of Moderate"],
      ["🔶", "Verify in 2–4 h", "2.6pp", "6.8pp", "These rows cross only with the classes before it"],
    ]);
    expect(block.shortfall).toBeNull();
  });

  it("no class label or arrival sentence borrows a calendar or remediation noun", () => {
    const block = bandPathBlock(path, { tier: "High", score: 48 });
    for (const c of block.classes) {
      expect(c.verify).toMatch(/^Verify in /);
      for (const s of [c.verify, c.arrival]) {
        expect(s).not.toMatch(/sprint|quarter|structural|quick win|weeks?|months?/i);
      }
    }
  });

  it("every step renders its tag as verification effort, not remediation duration", () => {
    const block = bandPathBlock(path, { tier: "High", score: 48 });
    const step = block.classes[0].steps[0];
    expect(step.verify).toBe("Verify effort: 🔶 ~2–4 h");
    expect(step.quick_win).toBe("patch today");
    expect(step).not.toHaveProperty("effort");
  });

  it("an absent effort tag renders as unknown cost, never the cheapest bracket", () => {
    expect(verifyEffortLabel("⚡ ≤30 min")).toBe("Verify effort: ⚡ ≤30 min");
    expect(verifyEffortLabel(undefined)).toBe("Verify effort: unknown");
    expect(verifyEffortLabel("  ")).toBe("Verify effort: unknown");
    expect(verifyEffortLabel(null)).toBe("Verify effort: unknown");
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

// ---------------------------------------------------------------------------
// score-badge — contract surface
// ---------------------------------------------------------------------------

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

function walkSources(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "out" || name === "dist" || name === "coverage") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkSources(p, found);
    else if (/\.(ts|tsx|js|jsx|css)$/.test(name)) found.push(p);
  }
  return found;
}

type FixtureEnvelope = {
  contractVersion: number;
  meta: { runId: string };
  report: {
    status: string;
    sample?: boolean;
    headline: { score: number; tier: string; suppressed?: boolean; verdict?: string };
    coverage: { measured: number; estimated: number; unknown: number; not_applicable?: number };
    snapshot: { scanned_at: string };
  };
  trace: unknown[];
};

function badgeEnvelope(overrides: {
  status?: string;
  sample?: boolean;
  score?: number;
  tier?: string;
  suppressed?: boolean;
  coverage?: { measured: number; estimated: number; unknown: number };
  scannedAt?: string;
} = {}): FixtureEnvelope {
  return {
    contractVersion: CONTRACT_VERSION,
    meta: { runId: "acme__api__a3f9c1__20261031T091200Z" },
    report: {
      status: overrides.status ?? "complete",
      ...(overrides.sample != null ? { sample: overrides.sample } : {}),
      headline: {
        score: overrides.score ?? 62,
        tier: overrides.tier ?? "Moderate",
        suppressed: overrides.suppressed ?? false,
        ...(overrides.suppressed ? { verdict: "insufficient-signal" } : {}),
      },
      coverage: overrides.coverage ?? { measured: 45, estimated: 20, unknown: 35 },
      snapshot: { scanned_at: overrides.scannedAt ?? "2026-10-31T09:12:00Z" },
    },
    trace: [],
  };
}

describe("band palette has one owner (score-badge D8 / 1.1)", () => {
  it("every public band resolves to the site token value", () => {
    expect(BAND_PALETTE).toEqual({
      Low: "#22c55e",
      Moderate: "#e0a00a",
      High: "#ef4444",
      Critical: "#9f1d2c",
    });
    expect(bandColorFor("Low")).toBe("#22c55e");
    expect(bandColorFor(" moderate ")).toBe("#e0a00a");
    expect(bandColorFor("HIGH")).toBe("#ef4444");
    expect(bandColorFor("Critical")).toBe("#9f1d2c");
    // An unrecognised name still tints the claim, at the most severe band.
    expect(bandColorFor("nonsense")).toBe(BAND_PALETTE.Critical);
    expect(bandColorFor(null)).toBe(BAND_PALETTE.Critical);
  });

  it("no second hex table exists in source (the CSS token file is the only other owner)", () => {
    const hexes = Object.values(BAND_PALETTE);
    const allowed = new Set([
      join(REPO_ROOT, "packages/contracts/src/index.ts"),
      // The assertions below necessarily spell the expected values out.
      join(REPO_ROOT, "packages/contracts/src/index.test.ts"),
      join(REPO_ROOT, "apps/site/app/globals.css"),
    ]);
    const offenders: string[] = [];
    for (const file of [...walkSources(join(REPO_ROOT, "packages")), ...walkSources(join(REPO_ROOT, "apps"))]) {
      if (allowed.has(file)) continue;
      const text = readFileSync(file, "utf8");
      if (hexes.some((hex) => text.includes(hex))) offenders.push(relative(REPO_ROOT, file));
    }
    expect(offenders).toEqual([]);
  });
});

describe("badge coverage is the coverage-floor quantity (score-badge D2 / 1.2)", () => {
  it("denominates over gradeable rows: (measured + estimated) / attempted", () => {
    expect(badgeCoverage({ measured: 45, estimated: 20, unknown: 35 })).toBeCloseTo(0.65, 10);
    // 28 measured + 1 estimated of 31 attempted — the 71 unimplemented rows are
    // not in the counts at all, so they cannot be the subject's deficiency.
    expect(badgeCoverage({ measured: 28, estimated: 1, unknown: 2 })).toBeCloseTo(29 / 31, 10);
    expect(Math.round(badgeCoverage({ measured: 28, estimated: 1, unknown: 2 }) * 100)).toBe(94);
  });

  it("guards a zero denominator", () => {
    expect(badgeCoverage({ measured: 0, estimated: 0, unknown: 0 })).toBe(0);
    expect(badgeCoverage(null)).toBe(0);
    expect(badgeCoverage(undefined)).toBe(0);
  });

  it("equals the suppression quantity either side of COVERAGE_FLOOR", () => {
    const above = { measured: 50, estimated: 0, unknown: 49 };
    const below = { measured: 49, estimated: 0, unknown: 51 };
    const at = { measured: 50, estimated: 0, unknown: 50 };
    expect(badgeCoverage(above)).toBeGreaterThanOrEqual(COVERAGE_FLOOR);
    expect(badgeCoverage(below)).toBeLessThan(COVERAGE_FLOOR);
    expect(badgeCoverage(at)).toBe(COVERAGE_FLOOR);
    // The suppression rule is exactly `ratio < COVERAGE_FLOOR`.
    const suppressed = (c: { measured: number; estimated: number; unknown: number }) =>
      badgeCoverage(c) < COVERAGE_FLOOR;
    expect(suppressed(above)).toBe(false);
    expect(suppressed(below)).toBe(true);
    expect(suppressed(at)).toBe(false);
  });

  it("counts estimations as gradeable (dropping them would flip the floor)", () => {
    const withEstimates = { measured: 10, estimated: 45, unknown: 45 };
    expect(badgeCoverage(withEstimates)).toBeCloseTo(0.55, 10);
    expect(badgeCoverage(withEstimates)).toBeGreaterThanOrEqual(COVERAGE_FLOOR);
    const measuredOnly = 10 / 100;
    expect(measuredOnly).toBeLessThan(COVERAGE_FLOOR);
  });
});

describe("badge view model derives four facts from the envelope (1.3)", () => {
  it("scored: score, band, coverage, and UTC month", () => {
    const vm = badgeViewModel(badgeEnvelope());
    expect(vm.state).toBe("scored");
    expect(vm.label).toBe("leapscore");
    expect(vm.claim).toBe("62 Moderate");
    expect(vm.qualifier).toBe("65% · 2026-10");
    expect(vm.value).toBe("62 Moderate · 65% · 2026-10");
    expect(vm.band).toBe("Moderate");
    expect(vm.permalink).toBe(`${REPORT_BASE_URL}/acme__api__a3f9c1__20261031T091200Z`);
    expect(vm.accessibleName).toContain("score 62");
    expect(vm.accessibleName).toContain("band Moderate");
    expect(vm.accessibleName).toContain("65% gradeable");
    expect(vm.accessibleName).toContain("October 2026");
  });

  it("suppressed: unscored replaces score and band, coverage and month remain", () => {
    const vm = badgeViewModel(
      badgeEnvelope({ suppressed: true, coverage: { measured: 20, estimated: 21, unknown: 59 } }),
    );
    expect(vm.state).toBe("suppressed");
    expect(vm.claim).toBe("unscored");
    expect(vm.band).toBeNull();
    expect(vm.value).toBe("unscored · 41% · 2026-10");
    expect(vm.accessibleName).toContain("unscored");
    expect(vm.accessibleName).toContain("insufficient signal");
  });

  it("incomplete: the four facts plus a trailing marker", () => {
    const vm = badgeViewModel(badgeEnvelope({ status: "degraded" }));
    expect(vm.state).toBe("incomplete");
    expect(vm.value).toBe("62 Moderate · 65% · 2026-10 · incomplete");
    expect(vm.accessibleName).toContain("Scan incomplete.");
  });

  it("not-scanned: nothing attempted, no coverage number", () => {
    const vm = badgeViewModel(
      badgeEnvelope({ coverage: { measured: 0, estimated: 0, unknown: 0 } }),
    );
    expect(vm.state).toBe("not-scanned");
    expect(vm.claim).toBe("not scanned");
    expect(vm.value).toBe("not scanned · 2026-10");
    expect(vm.accessibleName).toBe("LeapScore badge: not scanned, measured October 2026.");
  });

  it("absent: a fixture produces no badge (refusal, never a view model)", () => {
    expect(() => badgeViewModel(badgeEnvelope({ sample: true }))).toThrow(BadgeRefusalError);
    const states: Array<BadgeViewModel["state"]> = ["scored", "suppressed", "incomplete", "not-scanned"];
    expect(states).not.toContain("absent");
  });

  it("suppressed and incomplete together", () => {
    const vm = badgeViewModel(
      badgeEnvelope({
        suppressed: true,
        status: "degraded",
        coverage: { measured: 20, estimated: 21, unknown: 59 },
      }),
    );
    expect(vm.state).toBe("suppressed");
    expect(vm.value).toBe("unscored · 41% · 2026-10 · incomplete");
    expect(vm.accessibleName).toContain("Scan incomplete.");
  });

  it("a floored score never reads as a band the report did not seal", () => {
    for (let score = 0; score <= 100; score += 0.1) {
      const tier = tierForScore(score);
      expect(tierForScore(Math.floor(score))).toBe(tier);
    }
    const vm = badgeViewModel(badgeEnvelope({ score: 52.6, tier: "High" }));
    expect(vm.claim).toBe("52 High");
  });
});

describe("badge refuses fixtures and deltas at the entry point (1.4)", () => {
  it("names the sample marker", () => {
    expect(() => badgeViewModel(badgeEnvelope({ sample: true }))).toThrow(/sample/i);
  });

  it("names the delta document", () => {
    const delta = {
      document: DELTA_DOCUMENT,
      delta_schema: DELTA_SCHEMA_VERSION,
      baseline: { runId: "a__x__1", score: 44, tier: "High", suppressed: false },
      current: { runId: "a__x__2", score: 48, tier: "High", suppressed: false },
      verdict: { status: "comparable", inputs: [] },
      rows: [],
      transitions: [],
    };
    expect(() => badgeViewModel(delta)).toThrow(/delta/i);
  });
});


describe("identity presentation is derived from the emitted status (report-identity)", () => {
  it("a measured value prints rounded, with no approximation marker", () => {
    const item: IdentityItem = { status: "measured", value: 1247 };
    expect(identityValueLabel(item)).toBe("1.2k");
    expect(identityValueLabel(item)).not.toContain("~");
    expect(identityStatusLabel(item)).toBe("measured");
  });

  it("an estimated value prints the same magnitude behind the marker", () => {
    const item: IdentityItem = { status: "estimated", value: 420000 };
    expect(identityValueLabel(item)).toBe("~420k");
    expect(identityStatusLabel(item)).toBe("estimated");
  });

  it("an unknown value states that it was not measured and names the reason", () => {
    const item: IdentityItem = { status: "unknown", reason: "empty scope: no file matches source-v1" };
    expect(identityValueLabel(item)).toBe("not measured — empty scope: no file matches source-v1");
    expect(identityStatusLabel(item)).toBe("not measured");
  });

  it("an unknown value never degrades to a dash, a zero, or a blank", () => {
    const item: IdentityItem = { status: "unknown" };
    const label = identityValueLabel(item);
    expect(label).toBe("not measured");
    expect(label).not.toMatch(/^-$|^0$/);
  });

  it("two significant figures are the stored precision for an estimate", () => {
    expect(twoSignificantFigures(1247)).toBe(1200);
    expect(twoSignificantFigures(420000)).toBe(420000);
    expect(twoSignificantFigures(58)).toBe(58);
    expect(twoSignificantFigures(0)).toBe(0);
  });

  it("the display never claims a marker or precision the status does not carry", () => {
    for (const value of [0, 7, 58, 999, 1000, 1247, 999999, 1_500_000, 420_000_000]) {
      const measured = identityValueLabel({ status: "measured", value });
      const estimated = identityValueLabel({ status: "estimated", value });
      expect(measured.startsWith("~")).toBe(false);
      expect(estimated).toBe(`~${measured}`);
    }
  });
});

describe("identity membership rule: no identity field is a graded metric", () => {
  // Each forbidden name is an indicator's objective metric or graded surface:
  // dependency mass (ECOS-06), test surface (TEST-03), comment density (DOCS-06),
  // per-file line distribution (ARCH-01).
  const FORBIDDEN = [
    "transitive",
    "direct_deps",
    "test_files",
    "test_count",
    "comment_ratio",
    "loc_p95",
    "max_file_loc",
  ];

  it("declares no field name that an indicator row grades", () => {
    const declared = IDENTITY_FIELD_NAMES.map((name) => name.toLowerCase());
    const offenders = declared.filter((name) => FORBIDDEN.some((bad) => name.includes(bad)));
    expect(offenders).toEqual([]);
  });

  it("catches a forbidden name when one is added", () => {
    const withForbidden = [...IDENTITY_FIELD_NAMES, "transitive_deps"];
    const offenders = withForbidden
      .map((name) => name.toLowerCase())
      .filter((name) => FORBIDDEN.some((bad) => name.includes(bad)));
    expect(offenders).toEqual(["transitive_deps"]);
  });
});
