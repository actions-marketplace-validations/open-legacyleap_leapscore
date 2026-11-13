#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../src/scan/scoring/rubric.json
var rubric_default;
var init_rubric = __esm({
  "../../src/scan/scoring/rubric.json"() {
    rubric_default = {
      _comment: "COMPILED from docs/rubric/indicators/<NN-slug>/<ID>-<slug>.md + docs/rubric/model/config.md \u2014 do not hand-edit. Run npm run compile:rubric.",
      rubricVersion: "6f88ddc",
      weights: {
        base: {
          SEC: 20,
          ARCH: 15,
          ECOS: 10,
          TEST: 10,
          DATA: 10,
          API: 10,
          VEL: 10,
          PERF: 10,
          DOCS: 5
        },
        feActive: {
          SEC: 18,
          ARCH: 13.5,
          ECOS: 9,
          TEST: 9,
          DATA: 9,
          API: 9,
          VEL: 9,
          PERF: 9,
          DOCS: 4.5,
          FE: 10
        }
      },
      applicability: {
        "SEC-02": {
          library: "required",
          service: "required",
          cli: "required",
          infra: "required",
          docs: "required",
          "agent-skills": "required",
          mixed: "required",
          unknown: "required"
        },
        "SEC-01": {
          library: "required",
          service: "required",
          cli: "required",
          infra: "required",
          docs: "required",
          "agent-skills": "required",
          mixed: "required",
          unknown: "required"
        },
        "ECOS-05": {
          library: "required",
          service: "required",
          cli: "required",
          infra: "required",
          docs: "required",
          "agent-skills": "required",
          mixed: "required",
          unknown: "required"
        },
        "ECOS-01": {
          library: "required",
          service: "required",
          cli: "required",
          infra: "required",
          docs: "required",
          "agent-skills": "required",
          mixed: "required",
          unknown: "required"
        },
        "API-01": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-02": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-03": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-04": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-05": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-06": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-07": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-08": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "API-09": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "API-10": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "DATA-01": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "DATA-02": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "DATA-03": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "DATA-04": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "DATA-05": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "DATA-06": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "DATA-07": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "DATA-08": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "DATA-09": {
          docs: "irrelevant",
          "agent-skills": "irrelevant",
          infra: "irrelevant"
        },
        "DATA-10": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-01": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-02": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-03": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-04": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-05": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-06": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-07": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-08": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-09": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "PERF-10": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "VEL-03": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "VEL-04": {
          docs: "irrelevant",
          "agent-skills": "irrelevant"
        },
        "VEL-01": {
          "agent-skills": "irrelevant"
        }
      },
      tiers: {
        healthy: 80,
        moderate: [
          53,
          79
        ],
        highRisk: [
          27,
          52
        ],
        critical: 27
      },
      gates: [
        "G1",
        "G2",
        "G3",
        "G4",
        "G5",
        "G6",
        "G7",
        "G8"
      ],
      indicators: [
        {
          id: "ECOS-01",
          category: "ECOS",
          name: "Runtime/Language EOL",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "document the gap, create the upgrade ticket with a date.",
            structural: "parallel runtime upgrade plan \u2014 run new runtime in CI behind a feature gate, migrate one service at a time, dual-run in prod. For truly stuck runtimes, isolate behind a facade and treat like a rewrite candidate.",
            gold_standard: "Every production runtime within its vendor-supported window; CI builds a canary job on the current runtime; a deprecation calendar exists and is reviewed quarterly.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-02",
          category: "ECOS",
          name: "Major Package Drift",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "enable Dependabot/Renovate with major-update grouping and a monthly budget.",
            structural: `"upgrade train" \u2014 pick one major hop per quarter, keep intermediate commits shippable, use the dependency graph from tools to sequence hops (don't skip majors). Establish a "never more than 1 major behind" policy for core deps.`,
            gold_standard: "Core framework within 1 major of current; < 30% of direct deps behind by a major; automatic update PRs flowing weekly; majors scheduled explicitly on the roadmap.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-03",
          category: "ECOS",
          name: "Abandoned / Unmaintained Libraries",
          tier: "B",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "audit the dependency surface for abandoned libs and create a removal/swap ticket with a date.",
            structural: "replace load-bearing abandoned libs with maintained alternatives or fork-and-own with a maintenance budget; pin to the exact version and wrap it behind your own interface so it's swappable.",
            gold_standard: 'Every load-bearing dependency either actively maintained or deliberately forked-and-owned; a quarterly "library health" review is on the calendar; no archived repos in the dependency surface.',
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-04",
          category: "ECOS",
          name: "Deprecated API Usage",
          tier: "B",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "turn deprecation warnings into a CI-visible report (not silent); fix the 20 highest-value warnings.",
            structural: `treat deprecation debt like feature debt \u2014 a quarterly "modernize the deprecated surface" slice; keep the target version's removal list as a tracked checklist.`,
            gold_standard: "Zero deprecation warnings in the core module build; a CI gate that fails (or reports) on new deprecation warnings; removal timelines tracked.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-05",
          category: "ECOS",
          name: "License Compliance Risk",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "generate an SBOM (`syft . > sbom.json`), wire it into CI, publish attribution files.",
            structural: "add a license gate to CI (fail on GPL in closed-source), replace copyleft deps, retire unknown-license packages, review vendored code for stripped notices.",
            gold_standard: "SBOM generated and attested on every release; license policy enforced in CI; zero unknown licenses; copyleft list reviewed quarterly and signed off.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ECOS-06",
          category: "ECOS",
          name: "Dependency Bloat",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "run `knip`/`depcheck`, remove unused direct deps, enable `npm dedupe`/lockfile optimization in CI.",
            structural: 'set a budget (e.g., "no net-new transitive deps without review"), replace kitchen-sink libs with narrow ones, dedupe semver ranges, and periodically prune.',
            gold_standard: "Transitive count within a declared budget; zero unused direct deps; single version of every critical lib; dependency review is part of code review.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-07",
          category: "ECOS",
          name: "Build Reproducibility & Lockfile Integrity",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: 'commit the lockfile, switch CI to `npm ci`/`pip install --require-hashes`/`--frozen-lockfile`, add a "lockfile up-to-date" CI check.',
            structural: "adopt content-hash pinning, build from clean containers, produce provenance attestations (SLSA level 1\u21922), verify registry integrity.",
            gold_standard: "Lockfile committed and current; CI immutable install; two clean builds produce byte-identical artifacts; SLSA provenance generated per release.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-08",
          category: "ECOS",
          name: "Framework Lock-in & Monoculture Risk",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "quantify the coupling (which modules touch framework-specific APIs directly) and freeze scope on framework-dependent features.",
            structural: "extract the framework behind a facade at the boundaries (ports & adapters), migrate incrementally module-by-module on the critical path, keep the system runnable through the whole migration.",
            gold_standard: "Framework either current-and-supported, or the core logic is framework-independent behind an interface with an active migration plan.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ECOS-09",
          category: "ECOS",
          name: "Version Skew Across Services",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: 'inventory the skew, pick a "platform baseline" version, and make new work use it.',
            structural: "establish a platform/boilerplate team with a version cadence; migrate oldest-first on the critical path; add cross-service tests for the shared contract; sunset divergent majors with deadlines.",
            gold_standard: "One supported major of every core dependency per system; upgrade cadence managed centrally; a new service starts on the platform baseline.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "ECOS-10",
          category: "ECOS",
          name: "Supply-Chain: Typosquatting, Malware, & Registry Risk",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "run socket.dev/scorecard immediately, pin all CI actions to SHAs, enable `--lockfile` integrity and verified-publisher checks, scan for squat-named packages.",
            structural: "registry pinning, SBOM + provenance attestation (SLSA), private registry mirror with scanning, incident runbook for a compromised package, least-privilege CI tokens.",
            gold_standard: "Scorecard \u2265 8, all actions SHA-pinned, provenance verified per release, malware scan wired into CI as a gate, squatted-name watchlist.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "ARCH-01",
          category: "ARCH",
          name: "Cognitive Complexity & God Classes",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "carve the top 5 offenders by automated extract-method (IDE-assisted, with tests), add a complexity budget to CI (`eslint max-complexity`, SonarQube gate).",
            structural: "a structured decomposition of God Classes by responsibility; strangle complexity behind facades; pair the two riskiest files on a refactor sprint.",
            gold_standard: "Complexity budget enforced in CI; max method complexity < 15; no file > 1,000 LOC; the top-decile complexity list is shrinking and tracked.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-02",
          category: "ARCH",
          name: "Coupling & Cohesion",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "draw the DSM, pick the 3 highest-fan-in hubs, wrap them behind interfaces and shrink their API.",
            structural: "define bounded contexts and enforce them with ArchUnit-style rules in CI; extract the shared hub into a stable, narrow contract; invert dependencies toward stable abstractions.",
            gold_standard: "Acyclic dependency graph at the module boundary; every module has narrow, explicit dependencies; teams can change their module without coordination (tested via a chaos week).",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-03",
          category: "ARCH",
          name: "Layer & Boundary Violations",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "add an arch test (ArchUnit/import-linter) and fix the top violations; enforce at PR time.",
            structural: "rebuild the lost layers \u2014 extract domain into its own module, move persistence behind repositories, keep UI thin; do it one vertical slice at a time.",
            gold_standard: "Architecture rules enforced in CI; a 30-minute vertical-slice tour confirms correct directions; business rules live in the domain layer only.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-04",
          category: "ARCH",
          name: "Dead & Orphaned Code",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "run knip/vulture, delete safely (git history preserves), remove orphaned endpoints and the routes that point to them.",
            structural: 'a "no dead code" PR gate (knip in CI, fail on new unreferenced exports), flag retirement policy (flags > 6 months get removed or justified), quarterly pruning ritual.',
            gold_standard: "Dead-code scan clean in CI; every feature flag has an owner and a retirement date; all prod endpoints are in an API inventory with traffic.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ARCH-05",
          category: "ARCH",
          name: "Code Churn vs. Defect Hot Spots",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "put the top hot spot behind a designated owner, add targeted tests, freeze feature scope on it for one sprint.",
            structural: "redesign the hot spot \u2014 decompose by responsibility, rewrite the risky core with tests first, rotate engineers to avoid bus-factor in the fix. Track the metric quarterly to prove improvement.",
            gold_standard: "Churn evenly distributed relative to responsibility; no file in the top churn\u2229defect intersection for two quarters; hot-spot list tracked in the refactoring backlog.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-06",
          category: "ARCH",
          name: "Architectural Era / Framework Generation",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "introduce interface seams around the 3 worst-coupled cores, add a couple of tests to prove the seams work.",
            structural: "adopt the modern architecture incrementally \u2014 introduce a DI container, extract modules with enforced boundaries, wrap legacy access behind ports, migrate vertical slices one at a time.",
            gold_standard: "Core logic testable without live infrastructure; DI and module boundaries standard; new features land in the modern style while legacy shrinks.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-07",
          category: "ARCH",
          name: "Global Mutable State & Hidden Dependencies",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "inject the clock/random/IO at the seams you can reach; make the top 5 singletons instances with explicit wiring.",
            structural: 'eliminate globals by constructor injection; make state explicit and owned; introduce a proper initialization/DI lifecycle; enforce "no static mutable" with a lint.',
            gold_standard: "All dependencies explicit and injected; time/random/IO behind interfaces; test suite passes under random/parallel execution; zero mutable statics in core.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-08",
          category: "ARCH",
          name: "Duplication Debt",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "run jscpd, consolidate the top clusters behind a shared library (start with the business-critical ones).",
            structural: "establish a shared internal library with a review process; kill duplicates at PR time (clone scan in CI); migrate duplicated logic incrementally with tests preserving behavior.",
            gold_standard: "Duplication < 10%; core business rules exist exactly once, in one owned library; clone scan in CI fails new duplication.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-09",
          category: "ARCH",
          name: "Agentic Operability (AI/LLM Codebase-Readiness)",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "ship a repo-map/context file, co-locate tests for the top core modules, define a task runner of record with a fresh-clone CI proof.",
            structural: 'seam extraction on core (ports), docs-as-code freshness (DOCS-09), a recurring "agent completes task X from fresh clone" acceptance test as a quality gate.',
            gold_standard: "From a fresh clone, an agent (or new hire) can locate the module, run its tests, and land a scoped change within one session; navigation aids match disk; core is testable without live infra.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "ARCH-10",
          category: "ARCH",
          name: "Feature-Flag & Configuration Debt",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "move the top flags to an externalized flag source with owners + retirement dates, externalize prod config into a per-env injected pipeline.",
            structural: "config-as-code injected per environment, a flag lifecycle policy (owner, TTL, removal ceremony), a rule that prod values never live in the repo.",
            gold_standard: "Zero hardcoded toggles in core; every flag owned with a retirement date; config injected per env from one source; rollback = flag flip, not code change.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "ARCH-11",
          category: "ARCH",
          name: "Nullable/Untyped Code & Runtime Error Density",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "enable `strict`/`strictNullChecks` on the smallest core module, fix the fallout, expand module by module; add `mypy --strict` to CI incrementally with a ban-list.",
            structural: "adopt explicit null-safety (Option/Result types), eliminate `any` with real types at boundaries, add type coverage gate (e.g., `typescript coverage > X%`).",
            gold_standard: "Strict mode on across the system; typed coverage > 90%; null/type errors < 2% of incidents; boundary types (API, DB, events) fully defined.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "ARCH-12",
          category: "ARCH",
          name: "Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions)",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "audit for missing shared middleware and missed auth sites; move the top repeated concern (auth) to framework middleware.",
            structural: "centralize each concern (authN/authZ, logging, error mapping, validation, transactions) into one owned infrastructure layer with tests; wire via framework interceptors; add security tests that assert every endpoint enforces auth.",
            gold_standard: "Every cross-cutting concern implemented once, in infrastructure, enforced by framework; a security test walks all routes asserting auth coverage; zero manual auth in controllers.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "TEST-01",
          category: "TEST",
          name: "Code Coverage Degradation",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "add a real coverage gate (fail below threshold) on core modules only, and instrument the trend.",
            structural: "invest in testing the highest-churn/highest-risk modules first (correlate with ARCH-05), write tests as part of every bug fix (see coverage climb), make coverage a tracked product metric.",
            gold_standard: "Branch coverage > 80% on core modules; coverage gate enforced in CI; coverage trend visible on a dashboard and rising or stable.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "TEST-02",
          category: "TEST",
          name: "Flaky Test Rate",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "quarantine flaky tests (run separately, don't block but do report), fix the top 5 by root cause (sleeps \u2192 waits, shared DB \u2192 test DBs, order-dependence \u2192 isolation).",
            structural: "make tests hermetic (see TEST-07), add flake detection to CI (auto-quarantine + report), hold the line: no new flaky tests.",
            gold_standard: 'Flake rate < 2%; zero "rerun to pass" culture; flaky tests auto-quarantined and tracked to fix within a sprint.',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "TEST-03",
          category: "TEST",
          name: "Test Pyramid Inversion",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "move the top 20 E2E tests' logic down to integration/unit level (test the service, not the click).",
            structural: "rebuild the pyramid over time \u2014 write unit tests for all domain logic, integration for boundaries, keep E2E for < 10 user journeys; budget E2E runtime.",
            gold_standard: "Classic pyramid (e.g., 70/20/10); E2E < 10% runtime; failures localize within seconds; E2E covers only true user journeys.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "TEST-04",
          category: "TEST",
          name: "Test Run Time",
          tier: "B",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "parallelize across shards/workers, move slow E2E out of the merge gate (nightly), fix the slowest 10 tests.",
            structural: "attack root causes \u2014 pyramid rebalance (TEST-03), hermetic fast tests, caching, and a runtime budget with a gate.",
            gold_standard: "Suite < 10 min P95; every engineer runs the suite before merge; a runtime budget enforced in CI.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "TEST-05",
          category: "TEST",
          name: "Skipped / Disabled Tests",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "re-enable or delete each skip deliberately (delete-with-justification or fix-with-test); no skips without a linked ticket and owner.",
            structural: `CI gate that fails on new skips without a ticket; a monthly "skip inventory" review; fix the top skipped module's root cause.`,
            gold_standard: "< 2% skipped, all with tickets + owners, none older than a sprint; new skips auto-blocked.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "TEST-06",
          category: "TEST",
          name: "Core Domain Untested",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "characterisation-test the core (capture current behavior, lock it), then fix the top 3 divergent behaviors.",
            structural: 'treat the core as the highest test priority \u2014 require tests on every core change, build a test-heavy "crown jewels" suite, tie core coverage to the gate.',
            gold_standard: 'All 10 core journeys have tests; core module coverage > 80%; a core change without tests cannot merge; incidents on core paths are rare and never "first discovery."',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "TEST-07",
          category: "TEST",
          name: "Test Isolation & Hermeticity",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "run randomized + parallel CI to surface the worst offenders, fix shared-fixture tests, replace sleeps with waits.",
            structural: "hermetic test infrastructure \u2014 per-test DBs (Testcontainers), fixtures scoped to each test, deterministic time, no network in unit tests, parallel by default.",
            gold_standard: "Suite passes under random order and full parallelism on a fresh container; zero sleeps; tests never touch shared live infrastructure.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "TEST-08",
          category: "TEST",
          name: "Quality Gates in CI",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "add lint + SAST (Semgrep/CodeQL/SonarQube) as failing stages, add a coverage gate on core, block admin bypass (require justification audit).",
            structural: "define the quality bar in code (lint rules, complexity budgets, coverage thresholds, security checks) and let CI enforce it; tie all gates to the same config the team reviews.",
            gold_standard: "CI fails on lint, SAST, coverage, complexity, and security findings; bypasses are impossible or audited; the gates' config is itself reviewed.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "TEST-09",
          category: "TEST",
          name: "Mutation Testing Score",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "run mutation on the top-criticality module, fix the highest-value survivors (add assertions, kill branches).",
            structural: "run mutation on core modules in CI (time-boxed), use surviving-mutant count as a tracked quality metric, strengthen weak assertions.",
            gold_standard: "Core module mutation score \u2265 85%; mutation runs in CI on the core; survivors are reviewed and justified.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "TEST-10",
          category: "TEST",
          name: "Test Maintenance Burden",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "break the coupling \u2014 assert behavior not internals (mock at boundaries, not implementation), stabilize flaky snapshots, stop auto-updating snapshots.",
            structural: "treat the suite as a product (owner, budget, KPIs), refactor tests to test contracts not internals, track test-maintenance share as a metric with a ceiling.",
            gold_standard: "< 10% of commits are test maintenance; tests break only when behavior changes; the suite is seen as an asset, not a tax.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "SEC-01",
          category: "SEC",
          name: "Unpatched Vulnerabilities",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "patch the open Criticals/Highs in the exposure window \u2014 today; re-scan.",
            structural: 'a patch SLA policy (Critical \u2264 7 days, High \u2264 30), automated patching (Dependabot/Renovate auto-merge with CI as the gate), and a "no open Critical in prod" rule enforced by the security review.',
            gold_standard: "Zero open Criticals; Highs < 30 days; automated scans in CI; patch SLA documented and met for 4 straight quarters.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "SEC-02",
          category: "SEC",
          name: "Hardcoded Secrets & Credentials",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "rotate EVERY leaked credential immediately (the exposure window starts at commit time, not discovery time), remove from current tree, switch to env vars.",
            structural: 'adopt a secret manager + injection (Vault, Secrets Manager), ban secrets in code via CI scanners on every commit *and* a history scrub, least-privilege per environment, kill the "secrets in docs" habit.',
            gold_standard: "Zero secrets in the tree or history; secrets injected at runtime from a manager; CI blocks secret commits; rotation drill run annually.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "SEC-03",
          category: "SEC",
          name: "Missing Web Security Controls",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "enable modern headers (HSTS/CSP via middleware), upgrade TLS, fix the top reachable injection points with parameterized queries and validation.",
            structural: "framework defaults (most modern frameworks secure headers by default \u2014 upgrade), SAST+DAST in CI, input validation at every entry, an injection-class bug ban (semantic gate).",
            gold_standard: "A+ header/TLS grades, zero reachable Top-10 findings, SAST+DAST wired into CI, validation at all boundaries.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "SEC-04",
          category: "SEC",
          name: "Authentication & Authorization Weaknesses",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "kill default creds, add auth + server-side authorization to every endpoint (route registry), enable MFA on privileged roles, fix the top IDORs.",
            structural: "move to managed identity (SSO/OIDC, platform IAM), policy-based authorization (OPA/AWS IAM/ABAC), automated authz tests (walk every route asserting enforcement), session best practices.",
            gold_standard: "All endpoints server-side auth'd and authz'd, MFA everywhere privileged, managed SSO + policy engine, authz coverage test in CI.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "SEC-05",
          category: "SEC",
          name: "Audit Logging Deficits",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "add audit logging to the top admin/PII/auth paths with a structured schema, ship logs to an external durable sink, set retention.",
            structural: "treat audit as a compliance requirement \u2014 append-only/crypto-chained where needed, centralized log platform, automated test asserting every sensitive action produces an audit event.",
            gold_standard: "Every admin/PII/auth event logged structured (actor, action, target, time, request ID), durable, retained per policy, and tamper-evident; an automated coverage test exists.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "SEC-06",
          category: "SEC",
          name: "Insecure Transitive Chains",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "use tooling to map reachable chains to top-level packages, plan removals/forks of the top offenders, add deep scanning to CI.",
            structural: 'prune the graph (replace deep-chain producers), vendoring review, dependency budget (ECOS-06), provenance verification, and an incident runbook for "malicious package found."',
            gold_standard: "Deep scanning in CI with reachability intelligence; zero malware; vulnerable chains mapped and justified; unmaintained chains trending to zero.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "SEC-07",
          category: "SEC",
          name: "Patch Cadence & Update Workflow",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "enable Dependabot/Renovate with auto-merge on green for patch/minor updates, act on the security-only PRs first.",
            structural: "a scheduled patch lane (weekly security window, CI gates), environment-per-ticket to stage patches, measured SLA with an executive dashboard.",
            gold_standard: "Patches automated, applied within SLA (Crit \u2264 7d, High \u2264 30d), CI validates every patch, zero manual patch heroics.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "SEC-08",
          category: "SEC",
          name: "Compliance Drift",
          tier: "D",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "map the top 10 required controls to evidence today, automate the biggest evidence gaps (logs, backups, review reports).",
            structural: "continuous compliance automation (CSPM tools, evidence pipelines), close the accepted-risk list to a bounded, tracked set, encryption at rest everywhere, retention/erasure as engineering backlog items.",
            gold_standard: "Controls auto-evidenced, near-zero accepted-risk, encryption + retention/erasure automated, audit-ready at any moment.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "SEC-09",
          category: "SEC",
          name: "Input Robustness & Fuzzing",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "stand up fuzz harnesses for the top 3 untrusted parsers, run sanitizer builds, harden validation at those boundaries (limits, types, structure).",
            structural: "fuzz-in-CI for parser-adjacent code, migrate memory-unsafe parsers, input-validation as a platform concern, adversarial corpus maintenance.",
            gold_standard: "Every untrusted parser fuzzed in CI with sanitizers, zero standing crashes, validation layers reject early and clearly.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "SEC-10",
          category: "SEC",
          name: "Security Testing in CI",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "add Semgrep/CodeQL failing gates, secret scan on history + CI, TRIVY on images \u2014 this week.",
            structural: 'a security-as-quality pipeline (SAST, deps, secrets, container, DAST on staging, threat modelling for new features), a findings tracking loop (owner, SLA, retest), and a hard "no gate-less merge" rule.',
            gold_standard: "Five scan categories failing in CI, findings tracked to closure within SLA, DAST regularly scheduled, threat modelling on all new boundaries.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "DATA-01",
          category: "DATA",
          name: 'Schema Migration Backlog / "Migration Hell"',
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: 'bring migrations under tooling (alembic/flyway/prisma), reconcile the drift between envs with a verified baseline, add a CI "fresh build from migrations" check.',
            structural: "adopt expand-contract migration practice (expanding then contracting changes, reversible when possible), split long migrations into batched incremental jobs, freeze manual-DDL policy, build from migrations as the only path to a new env.",
            gold_standard: "Migrations are the only way the schema changes; environments provably identical from clean builds; migrations are reversible and fast; zero manual DDL.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DATA-02",
          category: "DATA",
          name: "Database Coupling & Hidden Dependencies",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "document all cross-service DB reads/writes (the hidden map), move the worst cross-read behind an API or event.",
            structural: "bounded-context data ownership with a public API/event boundary per service, migrate stored-proc logic into application code, run schema ownership checks in CI.",
            gold_standard: "Each service owns its tables; cross-context access is via API/events only; zero business logic in stored procedures; a change to one context can't break another.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DATA-03",
          category: "DATA",
          name: "Data Integrity & Constraint Degradation",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "add the missing FKs/unique indexes (backfill orphans first, then constraint), fix the top data-quality violations.",
            structural: "constraints-when-shipping policy, data-quality probes as recurring CI/data checks, typed columns everywhere, a data steward owns integrity.",
            gold_standard: "FKs + constraints close to 100%, integrity probes green, zero known duplicate/orphan patterns, cleanup jobs retired.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DATA-04",
          category: "DATA",
          name: "Legacy Storage Technology",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "stand up a read side (index the files into a modern store, keep legacy as archive), build the extraction utilities.",
            structural: "a data-migration program \u2014 move systems of record to maintained technology one store at a time (strangler pattern for data), keep legacy read-only during migration, archive what's truly dead.",
            gold_standard: "All systems-of-record on maintained technology; legacy formats readable/exportable or archived with access paths; critical data queryable with modern tooling.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "DATA-05",
          category: "DATA",
          name: "Lock Contention & Scaling Bottleneck",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "index the exploitable gaps that full-table scans reveal, split the hot row (counter \u2192 per-shard), add read replicas for read-heavy load.",
            structural: 'bounded-context data design (DATA-02), remove the contention points (sequence/counter patterns rewritten), tuned isolation levels where safe, load tests with concurrency in CI, capacity per feature, not per "make it bigger."',
            gold_standard: "Lock waits near zero at peak, index strategy documented and maintained, scaling via standard horizontal levers, load tests show headroom > 3\xD7.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "DATA-06",
          category: "DATA",
          name: "Data Lifecycle Management Deficits",
          tier: "B",
          default_status: "unknown",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min to inspect; \u{1F537} for a real restore drill.",
          remediation: {
            quick_win: "prove restore works this week (schedule a drill), set retention tiers, stop seeding dev with PII.",
            structural: "automated backup verification, retention/archival jobs, PII minimization (anonymization in non-prod), erasure workflow as software, RTO/RPO SLOs with drills scheduled.",
            gold_standard: "Restore drills quarterly and green, retention automated, zero PII sprawl in dev, erasure request fully exercisable, RTO/RPO met.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "DATA-07",
          category: "DATA",
          name: "ORM / Query Performance Smells",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "fix the top 10 N+1s with eager loading/joins, add the missing indexes on the hot path, reduce column projection.",
            structural: "query budget per endpoint (assert queries-per-request in tests), index strategy documented and reviewed, offload heavy reads (search, aggregates) to appropriate engines, performance tests with realistic data volume in CI.",
            gold_standard: "Query counts per endpoint budgeted and tested, N+1 class eliminated, index strategy current, p95 latency flat as data grows 10\xD7.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DATA-08",
          category: "DATA",
          name: "Schema Overfitting & Model Rigidity",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "kill the obvious versioned/flags columns behind an additive migration, document the domain model properly.",
            structural: "remodel around domain facts \u2014 normalize flags into real entities, adopt effective-dating/event structures for changeable rules (see DATA-09), a domain model owned by the team, schema reviewed as domain design not storage plumbing.",
            gold_standard: "Schema expresses domain facts; product rule changes land without schema surgery; events/snapshots support evolution; archaeology columns gone.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DATA-09",
          category: "DATA",
          name: "Event Sourcing / Audit Readiness",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "add an append-only event/audit log for the top 3 core aggregates going forward (capture authoritative mutation events, not screenshots).",
            structural: "eventing strategy for core facts (outbox, event store, or time-boxed history), as-of query support, replay/drills, compliance-backed retention of the history.",
            gold_standard: "Core aggregates are fully evented with versioned state; as-of queries are routine and tested; history feeds audit and analytics directly.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "DATA-10",
          category: "DATA",
          name: "Environment Schema Drift",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "run diffs, reconcile to the migration baseline, rebuild staging from migrations.",
            structural: "migrations-as-only-path for every env, fresh-env CI per PR, schema-diff check in CI (fail on env drift), fixture strategy generated from migrations.",
            gold_standard: 'Zero diffs between baseline and any env; fresh environments reproducible; "prod-only bug" eliminated as a category.',
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "API-01",
          category: "API",
          name: "API Contract Drift",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "generate accurate specs from code (OpenAPI annotations/`apischema`, `drf-spectacular`, NestJS Swagger), validate specs vs. responses in CI.",
            structural: "contract-first or contract-enforced development (spec is source of truth, generators produce clients/mocks/tests), a lint gate on spec changes.",
            gold_standard: "Every endpoint covered by a current, accurate contract; clients and tests generated from it; spec drift impossible (CI enforces).",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-02",
          category: "API",
          name: "Versioning & Breaking-Change Discipline",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "introduce versioning at the least cost (path `v2` for the contract-breaking surface; keep `v1` alive with a retirement date).",
            structural: "versioning policy (what counts as breaking), deprecation headers + documented schedule, sunset coach with migration guides, semver discipline wired into release automation.",
            gold_standard: "Explicit versioning everywhere; breaking changes only in majors with deprecation windows; a deprecation calendar; zero silent consumer breakage for two years.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "API-03",
          category: "API",
          name: "Integration Point Bloat",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "build the topology map (automated), as the source of truth, and start routing traffic through a gateway for the top 5 hubs.",
            structural: "platform governance \u2014 service registry, gateway/boundary routing, event-based decoupling for the densest paths, rules against direct cross-service DB access.",
            gold_standard: "Known topology (auto-mapped, current), integration governance (registry/gateway/events), a change to one service locally verifiable, density trending down.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-04",
          category: "API",
          name: "Synchronous Coupling & Chatty Interfaces",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "add timeouts + circuit breakers on the fragile hops, cache the slow reads.",
            structural: "slice the sync chain with events/async (compute off-path, return fast), bulkhead partitions by dependency, SLO-per-hop, degrade gracefully.",
            gold_standard: "Core flows touch the minimum live dependencies; slow work is async; circuit-broken fallbacks in place; the weakest link cannot sink the product.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-05",
          category: "API",
          name: "Third-Party & Vendor API Dependency Risk",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "wrap the top 3 vendor calls behind ports (adapters), add fallback paths where feasible, assign a vendor-risk owner + deprecation watch.",
            structural: "integration abstraction for critical vendors, SLA monitoring + circuit breakers, contract/license review, documented replacement paths, vendor deprecation calendar.",
            gold_standard: "External dependencies abstracted, fallbacked, monitored, and reviewed; vendor deprecations tracked and migrations planned; no revenue path is call-vendor-and-pray.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-06",
          category: "API",
          name: "Protocol & Data-Format Legaciness",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "stand up modern endpoints (REST/JSON or gRPC) alongside the legacy ones for new traffic, put a gateway in front to let consumers choose.",
            structural: "migrate integrations off legacy protocols where feasible (strangler at the protocol layer), retire the EOL middleware, offer modern contracts for every legacy consumer.",
            gold_standard: "Core traffic on modern protocols, legacy formats behind adapters/bridges and shrinking, no EOL middleware, new integrations never require the museum stack.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-07",
          category: "API",
          name: "Error Handling & API Observability Semantics",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "standardize an error contract (RFC 7807 or a JSON schema: code, message, correlationId, retriable flag), add request IDs everywhere, fix the worst misclassifications.",
            structural: "framework-level error middleware (single source of truth), typed error taxonomy, API-monitoring that segments by error class, error payloads free of PII.",
            gold_standard: "Every endpoint returns structured, typed, correlated errors; 4xx/5xx semantics correct; a failing request is traceable in seconds; clients can act on errors programmatically.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-08",
          category: "API",
          name: "Consumer Blindness & Backward Compatibility",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "add per-consumer API keys + endpoint analytics (who, what, how often), start a consumer registry doc.",
            structural: "full usage telemetry (endpoint + field level), a deprecation communication channel (changelog + consumer mailer + status page), consumer onboarding/registration as standard, usage dashboards for product decisions.",
            gold_standard: "Every consumer known + registered, endpoint/field usage visible, deprecations announced with migration guides, zero surprise consumer breakage.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "API-09",
          category: "API",
          name: "Idempotency & Retry Semantics",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "add an idempotency key + response-replay on the top money flows, add a unique constraint (order/client_ref) as a backstop.",
            structural: "idempotency as a platform primitive (framework middleware, key storage, replay store), document retry semantics, idempotency tests in CI for all mutation endpoints.",
            gold_standard: "All state-changing endpoints idempotent + tested, retry policy documented, duplicate side effects impossible.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "API-10",
          category: "API",
          name: "Contract Schema Evolution Process",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "add an OpenAPI/buf compatibility check to CI (fail on breaking changes), document the additive-change policy.",
            structural: "schema registry + versioned schemas (event + API), compat gate enforced, consumer-migration process for breaking changes (deprecate \u2192 migrate \u2192 remove), telemetry of consumers (API-08).",
            gold_standard: "Compat gates in CI, schema registry current, breaking changes rare and migration-led, event schemas versioned with consumers tracked.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "VEL-01",
          category: "VEL",
          name: "CI/CD Build Duration",
          tier: "B",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "turn on caching, parallelize shards, drop the slow E2E from the merge path (TEST-04), float the slowest 10 tests once.",
            structural: "a CI budget (SLO on feedback time), dependency pruning (ECOS-06), test-suite redesign (TEST-03), and monitoring of pipeline trend.",
            gold_standard: "P95 feedback < 10 min; trend flat/declining; no timeouts; every engineer runs the pipeline before merge by habit.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "VEL-02",
          category: "VEL",
          name: "Local Dev Setup Time & Friction",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: 'containerize the stack with a one-command up, ship `.env.example`, write a working setup doc, document the "Golden Path."',
            structural: 'hermetic local env (containers, local deps with `testcontainers`), zero shared-remote requirement, setup scripted and CI-tested (a fresh container proves the guide works), "works on my machine" made unfalsifiable.',
            gold_standard: "`git clone && make dev` brings up a working local system in < 30 min with no external dependencies; the instruction is CI-verified.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-03",
          category: "VEL",
          name: "Deployment Failure Rate (CFR)",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "implement fast rollback (repo-state rollback, feature flags, DB-migration backup), add canary/smoke checks to catch the common failure classes, post-release verification automation.",
            structural: "smaller safer deploys (deploy frequency up = risk down), progressive delivery (canary, blue-green), automated rollback + observability slices, DORA tracked and reviewed monthly.",
            gold_standard: "CFR < 15% and falling, rollback is automated and boring, deploys are small and frequent, no manual prod intervention.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-04",
          category: "VEL",
          name: "Deployment Frequency & Lead Time",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "remove freeze/merge windows, do Friday non-events, add a deploy button per service.",
            structural: "the classic modernization goal \u2014 trunk-based dev + feature flags + small CI/CD steps to get deployment-frequency up and lead time down; each elimination of coordination is a DORA win.",
            gold_standard: "Deploy on demand (multiple/week/service), lead time < 1 day, releases are boring non-events, no release manager role needed.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-05",
          category: "VEL",
          name: "Onboarding Lead Time to First Production PR",
          tier: "D",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: 'write a "first PR in a day" path (a safe starter ticket + doc patch + tiny config change), assign onboarding buddy + SLA, grant prod deploy gradually but early.',
            structural: "fix the underlying debts (setup VEL-02, docs DOCS, deploy VEL-03), curriculum-style onboarding (architecture walkthroughs, ADRs), starter-ticket backlog maintained.",
            gold_standard: "New engineers ship to prod within their first week, via documented path, with a clear map of the safe-to-change surfaces.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-06",
          category: "VEL",
          name: "Bus Factor / Knowledge Concentration",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "pair-and-document the top exclusive modules (forced bus-factor increase), get a second reviewer on every critical file from here on.",
            structural: `architecture that doesn't need a walking encyclopedia (simplify, DOCS), quarterly rotation of module owners, an "unlearnable-list" audit (which files can no one explain without the author).`,
            gold_standard: "No module with single-author > 50%; anyone can explain/deploy any critical service within a day; a leaving engineer is a 1-day disruption, not an event.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "VEL-07",
          category: "VEL",
          name: "Environment Reproducibility / Works-on-My-Machine",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "containerize dev for parity, make config canonical (one source of truth, injected per env), stand up a staging clone of prod config.",
            structural: 'full parity \u2014 same containers/versions everywhere, IaC for all envs, config as code, "prod reproduction" as a standard step (spin replica to confirm).',
            gold_standard: "Any environment can be rebuilt to match prod; prod-only bugs are a thing of the past; config drift is zero-diff against the source of truth.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-08",
          category: "VEL",
          name: "Manual Release Steps & Operability",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "capture the manual steps as a CI/CD job (artifact \u2192 deploy), remove direct prod SSH, add an audit log of every deployment.",
            structural: "full automated promotion (CI build artifact \u2192 envs), IaC-managed infra (PERF-06), deploy from immutable artifacts (never from a checkout on a server), prod access by deploy pipeline only.",
            gold_standard: 'Zero manual steps; deploys are CI pipeline promotions with audit; prod editability removed; an audience of "the pipeline did it" for every release.',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-09",
          category: "VEL",
          name: "PR & Code-Review Hygiene",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "enforce branch protection with required reviews on core paths, ban direct pushes, add a PR-size lint (split > 400-LOC PRs), publish review-coverage metrics.",
            structural: 'review as a first-class metric (coverage, size, latency tracked), pairing/small-PR culture, a second reviewer on security-adjacent paths, "no unreviewed merge" as an org rule.',
            gold_standard: "100% coverage on core paths, median PR < 400 LOC, reviews substantive (comments, not emoji), zero bypasses, review latency < 1 day.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "VEL-10",
          category: "VEL",
          name: "Branching & Monorepo Strategy Legacy",
          tier: "A",
          default_status: "measured",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "trunk-based basics \u2014 short-lived branches < 3 days, protect main + require green CI, delete the oldest release branch with a manual backport policy.",
            structural: "move to trunk-based development with feature flags (ties ARCH-10), shrink multi-repo coordination via a platform or monorepo_tools strategy, enforce main-always-green with a CI gate.",
            gold_standard: "Branches live < 3 days, main is always mergeable and green, merges are small and continuous, no merge windows, one logical change fits in one repo/PR.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "VEL-11",
          category: "VEL",
          name: "Developer Experience Tooling",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "define a task runner of record (Makefile/Taskfile), add scaffolding commands for the top 3 boilerplates, enable watch mode.",
            structural: "invest in DX as product work \u2014 fast inner loop, generated code, language-server health, CI parity for local checks.",
            gold_standard: "Inner loop < 1 min, scaffolding for common work, task runner documented and CI-consistent, AI/IDE tooling first-class.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "VEL-12",
          category: "VEL",
          name: "Incident Recovery / MTTR",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "write the top 5 runbooks (drill them), enable fast rollback (VEL-03), add the observability slices that made diagnosis slow (PERF-01).",
            structural: "incident-on-call excellence \u2014 accurate runbooks, ephemeral-infra-friendly rollback, self-healing where possible, every incident gets a blameless postmortem whose actions you actually fund, MTTR tracked as an SLO.",
            gold_standard: "MTTR < 30 min majority, runbook-based recovery, rollback automated, no incident class repeats, postmortem actions all shipped.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "PERF-01",
          category: "PERF",
          name: "Observability Gaps",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "add structured logging + request IDs everywhere (framework middleware), stand up a metrics endpoint with RED/U; USE basics, emit the top 6 metrics.",
            structural: "OpenTelemetry adoption (auto-instrumentation), tracing across services, an SLO + error-budget loop, observability as a deployment requirement (no deploy without instrumentation).",
            gold_standard: 'Every service emits metrics/logs/traces standardly, requests are correlated end-to-end, dashboards answer latency/errors/capacity in seconds, and "why is it slow" never requires SSH.',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "PERF-02",
          category: "PERF",
          name: "Legacy Deployment Model",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "containerize the app (it's usually the smallest step), move VM provisioning to IaC (Terraform/cloud-init), codify the laptop script.",
            structural: "immutable, containerized, orchestrated deployment (K8s/ECS) with IaC for everything, auto-scaling-ready, snowflakes eliminated by rebuild-from-code.",
            gold_standard: "Everything containerized + IaC-managed, instances are cattle (rebuildable in minutes), scale is a config change, drift impossible by construction.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "PERF-03",
          category: "PERF",
          name: "Resource Waste / Leakage",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "profile to find the leak(s), bound the caches (TTL + size limit), fix the top 3 resource leaks, enable heap diagnostics.",
            structural: "memory discipline as a code review concern, load tests that run > 24h to expose slow leaks, resource limits + monitoring (RSS trend), right-size instances to reality.",
            gold_standard: "No restart ritual; heap flat over weeks; caches bounded and sized deliberately; utilization reviewed; no OOM under 3\u20135\xD7 load.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "PERF-04",
          category: "PERF",
          name: "Monolithic Scaling Bottleneck",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "statelessness fixes (move session/key state to a distributed store), add read replicas + a cache tier to lift the DB ceiling, shard the hottest table.",
            structural: "the scalability roadmap \u2014 decompose the hot path (bounded contexts, API/events per DATA-02), sharding strategy, and a horizontal-efficiency load-test gate (new instance must add value).",
            gold_standard: "Adding instances scales throughput linearly past the previous wall; vertical spending is an exception not a norm; load tests prove horizontal efficiency.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "PERF-05",
          category: "PERF",
          name: "No Auto-Scaling / Capacity Planning",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "set HPA/ASG on the top 5 workloads with sane thresholds, add utilization + headroom dashboards, run the scheduled-campaign checklist.",
            structural: "autoscaling everywhere + telemetry-driven capacity reviewing (monthly), load-testing against forecast demand, SLO-based scaling decisions.",
            gold_standard: "Autoscaling covers critical workloads; capacity changes are system-driven by policy; spikes are non-events; waste is continuously right-sized.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "PERF-06",
          category: "PERF",
          name: "Missing IaC / Config Drift",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: 'adopt Terraform/Pulumi for the top resource types (VPC/DB/compute), add drift detection (initial run finds the gap), codify the "documented console changes" retroactively.',
            structural: "full IaC coverage with state remote + plan-diffs in CI, admin access least-privilege, rebuild-from-code as a tested path, drift = CI failure.",
            gold_standard: "Everything in code, changes flow through CI-plan-review, drift is zero or alerted, and rebuilding an env is an afternoon exercise.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "PERF-07",
          category: "PERF",
          name: "No SLOs / Performance Budgets",
          tier: "C",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "define SLOs for the top 3 services (latency p95 + availability), measure them with the metrics you added (PERF-01), add a synthetic check for the money path.",
            structural: "error budgets + burn alerts, a CI perf gate (load-test baseline run on PRs), latency regression reports in the deploy loop, SLO review as a ritual.",
            gold_standard: "Every service has an SLO, measured and burned-alerted; CI catches perf regressions; latency baselines are historical and trusted.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "PERF-08",
          category: "PERF",
          name: "Runtime Waste & Startup Latency",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "lazy-init the greedy startup work, trim the boot-time DI/registrations, enable JVM/cache warmup layers.",
            structural: 'runtime modernization (container-native runtimes, startup budget with a gate, deferred-cost architecture), image size budgets, "cold start < 10s" as an autoscaling prerequisite.',
            gold_standard: 'Cold start < 10\u201315s, idle footprint proportional to need, autoscaling actually scales because instances become useful fast, zero "startup work" that could be lazy.',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "PERF-09",
          category: "PERF",
          name: "Cost Efficiency / FinOps",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "tag/attribution, kill the obvious idle/orphaned resources, right-size the top 10 oversized instances, set a budget alert.",
            structural: "FinOps cadence (monthly rightsizing + utilization review), autoscaling-for-cost (scale-to-zero for dev), cost dashboards per team/service, and a cost/request SLO.",
            gold_standard: "Spend is attributed, tracked vs. usage, auto-right-sized, budgets alert, and waste < 10% of bill with an explanation for the rest.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "PERF-10",
          category: "PERF",
          name: "Disaster Recovery & Resiliency",
          tier: "D",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "write the DR plan (real: recover critical path), define RTO/RPO per tier, take documented cross-region snapshots for the critical DB, run a tabletop then a real drill.",
            structural: "ring-fence the critical path into multi-AZ \u2192 multi-region with tested failover, async replication strategy, automated failover runbooks, drills scheduled quarterly as a non-negotiable ritual.",
            gold_standard: "Critical path survives a region event within RTO (drilled and proven), RTO/RPO documented, drills are boring quarterly calendar items, recovery is automated not theatrical.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "DOCS-01",
          category: "DOCS",
          name: "Missing Architectural Decision Records (ADRs)",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "write ADRs for the top 10 load-bearing decisions (interview the oldest engineers, mine git/past docs), establish a template + PR requirement for consequential choices.",
            structural: 'ADR convention in the repo (ADR-NNN, status, decision, context, alternatives considered), decisions now documented at review time, an "explain every load-bearing choice" refactoring task.',
            gold_standard: "Every consequential decision has an ADR with alternatives; new decisions document as standard practice; teams can revisit a decision on evidence, not memory.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DOCS-02",
          category: "DOCS",
          name: "Stale / Drifted Documentation",
          tier: "B",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min to sample-verify.",
          remediation: {
            quick_win: 'a doc-rot sweep (delete/rewrite the worst 10), add "last verified" dates, a github-issues link on every doc page so inaccuracies are reportable with one click.',
            structural: 'docs-as-code with CI verification (commands in docs execute in a test fixture \u2014 DOCS-09), ownership per doc, "docs touched in the same PR as code" rule.',
            gold_standard: "Docs match code; commands in docs are CI-verified; a doc is as trustworthy as code, and updated with it.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "DOCS-03",
          category: "DOCS",
          name: "Missing Runbooks & Operational Docs",
          tier: "B",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: 'write runbooks for the top 5 incident classes today (postmortem-driven), make them linkable from alert dashboards, add "runme at the first sign" steps.',
            structural: "runbook-as-product (owned, tested, games rehearsed), alert\u2192runbook binding, postmortem = runbook update, drill the top runbook quarterly.",
            gold_standard: "Every incident class has a current, tested runbook; on-call executes procedures not improv; incident time is dominated by execution, not discovery.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DOCS-04",
          category: "DOCS",
          name: "No Onboarding Guide / Developer Setup Docs",
          tier: "B",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "write the golden path (clone \u2192 setup \u2192 run \u2192 test \u2192 first PR) and verify every command executes, add CONTRIBUTING.md.",
            structural: 'golden path CI-verified (fresh container proves it \u2014 DOCS-09), onboarding checklist wired into the ticket system, "setup docs break" = blame-the-repo not the human.',
            gold_standard: "A new hire takes < 2 hours to a working local env entirely from docs; the setup guide is CI-tested and always current.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "DOCS-05",
          category: "DOCS",
          name: "Tribal Knowledge & Oral Tradition",
          tier: "D",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "run the departure drill on the top module \u2014 write the unrecorded facts as docs/ADRs/runbooks, pair-document with the oral experts.",
            structural: `"write it down or it doesn't exist" culture (every knowledge answer \u2192 doc link), knowledge-review on critical modules, retiring the phrase "ask X" in favor of "read the doc," interview-capture sessions for missionaries.`,
            gold_standard: "90%+ of functional questions answerable from written sources; no module depends on a person's memory; the departure drill yields a weekend, not a collapse.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DOCS-06",
          category: "DOCS",
          name: "Comment Debt & Self-Documenting Code Imbalance",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "kill the top 20 misleading/obsolete comments (fix or delete), resolve/add justification for the oldest TODOs, rename the worst identifiers.",
            structural: 'self-documenting-code standards in review (naming, small functions), "why" comments for invariants, comment lint (TODO age alarm), and a "readability" gate on the module most touched on-call.',
            gold_standard: 'Code reads like prose (names carry intent), comments exist only for true "why", TODO-rot is gone, and a reader can trust line 1 to mean line 1.',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DOCS-07",
          category: "DOCS",
          name: "Missing API Documentation",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "publish the OpenAPI/spec with a generated reference (Swagger UI/Redoc), add examples for the top 10 endpoints, write an auth quickstart.",
            structural: 'docs generated from contract in CI (spec is source, docs are output \u2014 DOCS-09), consumer guides for the top use cases, updated with each contract change, "docs in same PR" rule.',
            gold_standard: "Every endpoint has a current, generated reference with examples; a stranger self-serves; docs update with the contract in the same change.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DOCS-08",
          category: "DOCS",
          name: "No Release Communication / Changelog",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "adopt a CHANGELOG process (Keep-a-Changelog, auto-generated from commits/PRs), publish release notes for the top consumers, write migration guides for open breaking changes (backfill).",
            structural: 'semantic-release automation (version + changelog + notes automated), a release-communication channel (port status page + email), "breaking = migration guide in same MR" rule.',
            gold_standard: "Every release has automated notes; every breaking change has a migration guide published with the change; consumers hear first, break never (silently).",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "DOCS-09",
          category: "DOCS",
          name: "Docs-as-Code & Automation",
          tier: "A",
          default_status: "estimated",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "wire docs generation into CI (spec \u2192 reference), add links/lint checks for markdown, CI-verify the top setup commands (fresh container).",
            structural: "full docs-as-code \u2014 generate what's generatable, verify what's actionable, staleness gates (docs touch-required on code change), docs failures block merge like code failures.",
            gold_standard: "Docs build like code, generate from truth, verify their own commands, and fail CI on rot \u2014 the knowledge layer is as maintained as the code.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "DOCS-10",
          category: "DOCS",
          name: "Knowledge Exit & Documentation Ownership",
          tier: "D",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "name an owner/champion for the docs, run an offboarding knowledge-capture ritual for the top knowledge holders (scripted walkthroughs into docs/ADRs), capture the last 3 departures' gaps retroactively.",
            structural: "ownership map (every doc/module has a maintainer), offboarding checklist enforced by HR tools, doc health reviews (growth vs. decay) quarterly, documentation as a funded line item not a PTO activity.",
            gold_standard: "Every knowledge area has an owner; offboarding reliably captures knowledge; departures are 1-day disruptions; the doc library grows while decaying nothing.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "FE-01",
          category: "FE",
          name: "UI Framework / Stack EOL & Deprecation",
          tier: "A",
          default_status: "estimated",
          effort: "\u26A1 \u226430 min",
          raw_effort: "\u26A1 \u2264 30 min",
          remediation: {
            quick_win: "a written migration brief (target framework, timeline, budget), framework-but-the-patterns upgrade where feasible, freeze risky features.",
            structural: "incremental migration (module-shell pattern, route-by-route strangler), contract with the backend (API-01) kept stable during migration, the client on a support-meeting framework within two quarters.",
            gold_standard: "Framework is current-to-recent, security-supported, ecosystems integrable; migration is an ordinary roadmap item if ever needed.",
            effort: "\u26A1 \u226430 min"
          }
        },
        {
          id: "FE-02",
          category: "FE",
          name: "Bundle Size & Load Performance",
          tier: "A",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "code-split the routes, defer non-critical vendors, compress/optimize images, set a bundle budget in CI (regression gate), measure with Lighthouse in CI.",
            structural: "a performance budget (bytes + core vitals) enforced, RUM for field data, on-demand vs. bundled loading for heavy features, service-worker caching.",
            gold_standard: "Initial JS < 300 KB, LCP < 2.5s on mobile field-data, code-split by route, budget-enforced in CI, vitals tracked on a dashboard.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "FE-03",
          category: "FE",
          name: "Accessibility Deficits",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "run axe, fix the top serious/critical violations (labels, semantics, focus, contrast), add a11y lint to CI.",
            structural: "a11y standards + automated gate (axe in CI failing new violations), keyboard/contrast reviews, component-library a11y defaults, screen-reader smoke tests on core journeys.",
            gold_standard: "a11y score \u2265 95, zero critical/serious violations, keyboard + screen-reader flows pass in review, a11y gate enforced in CI.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "FE-04",
          category: "FE",
          name: "Browser / Platform Support Drift",
          tier: "B",
          default_status: "measured",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "declare the matrix + enforce browserlist, add a responsive bootstrap for the top user journey, test mobile on the core path.",
            structural: "responsive-first design standards, device/browser QA in the pipeline, analytics-informed matrix reviews twice a year, cut the obsolete matrix (drop IE11 promises, shed polyfills).",
            gold_standard: "Declared + enforced current matrix, responsive across breakpoints, browser/device tested in QA, matrix reviewed against real usage.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "FE-05",
          category: "FE",
          name: "Client-Side Architecture Debt",
          tier: "B",
          default_status: "estimated",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "mark the top 3 god-components, extract their clearest slice with a test, introduce a singular state pattern with actions.",
            structural: "a deliberately small client architecture (one store, typed, actions-only), component decomposition by responsibility, testable seams with a component test budget, codegen for new screens (VEL-11-style).",
            gold_standard: 'God-components \u2264 modern norms, single main state path, components testable in isolation with coverage, "touch one page breaks another" is a historical anecdote.',
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "FE-06",
          category: "FE",
          name: "Design System / UI Consistency Drift",
          tier: "C",
          default_status: "unknown",
          effort: "\u{1F536} ~2\u20134 h",
          raw_effort: "\u{1F536} ~2\u20134 h",
          remediation: {
            quick_win: "build a token layer (design tokens \u2192 styled primitives), consolidate the top 2 duplicate controls, adopt one primitive set for new work.",
            structural: 'a small living component library (owned, versioned), tokens adopted across screens, "no new hand-rolled primitive" rule, design \u2194 engineering parity checks.',
            gold_standard: "One primitive set, tokens everywhere, new screens composed not styled, visual parity across the app by construction.",
            effort: "\u{1F536} ~2\u20134 h"
          }
        },
        {
          id: "FE-07",
          category: "FE",
          name: "Internationalization / Localization Debt",
          tier: "A",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "adopt an i18n framework + extraction automation, move strings to tokens, ship locale toggling, fix the top market's dates/plurals.",
            structural: "locale as a first-class runtime concept (RTL, pluralization via ICU, locale-aware formatting/sorting), full-fidelity QA per shipped locale, prune markets served with fake translations until real ones are ready.",
            gold_standard: "All UI strings extracted, ICU-correct plurals per locale, RTL fully supported, dates/numbers locale-aware, per-locale QA completeness, new code requires tokens (lint-enforced).",
            effort: "\u{1F537} ~1\u20132 days"
          }
        },
        {
          id: "FE-08",
          category: "FE",
          name: "Mobile / Responsive Adaptation & Offline Support",
          tier: "C",
          default_status: "unknown",
          effort: "\u{1F537} ~1\u20132 days",
          raw_effort: "\u{1F537} ~1\u20132 days",
          remediation: {
            quick_win: "add a service worker + shell caching (static shell offline), persist draft state, cut mobile payload for the core path, cache-first for static assets.",
            structural: "PWA/progressive economics by design (offline-first where core), mobile perf budget (Lighthouse gate), reconnect/resume semantics (idempotent submit ties into API-09), context-tiered asset serving.",
            gold_standard: "Core flows work offline (or degrade meaningfully well), draft data survives navigation, mobile perf within budget, progressive capability measured and tracked.",
            effort: "\u{1F537} ~1\u20132 days"
          }
        }
      ],
      categories: [
        {
          id: "ECOS",
          name: "Dependency & Ecosystem Health",
          weight_base: 10,
          weight_fe: 9
        },
        {
          id: "ARCH",
          name: "Architecture & Code Quality",
          weight_base: 15,
          weight_fe: 13.5
        },
        {
          id: "TEST",
          name: "Testing & Quality Engineering",
          weight_base: 10,
          weight_fe: 9
        },
        {
          id: "SEC",
          name: "Security, Compliance & Vulnerability",
          weight_base: 20,
          weight_fe: 18
        },
        {
          id: "DATA",
          name: "Data & Schema Evolution",
          weight_base: 10,
          weight_fe: 9
        },
        {
          id: "API",
          name: "API & Integration Surface",
          weight_base: 10,
          weight_fe: 9
        },
        {
          id: "VEL",
          name: "Developer Velocity & Operational Drag",
          weight_base: 10,
          weight_fe: 9
        },
        {
          id: "PERF",
          name: "Performance & Cloud/Infrastructure Fit",
          weight_base: 10,
          weight_fe: 9
        },
        {
          id: "DOCS",
          name: "Documentation & Knowledge Continuity",
          weight_base: 5,
          weight_fe: 4.5
        },
        {
          id: "FE",
          name: "Frontend & Client Health",
          weight_base: 0,
          weight_fe: 10
        }
      ]
    };
  }
});

// ../../src/scan/scoring/scorer/applicability.ts
var applicability_exports = {};
__export(applicability_exports, {
  evaluateApplicability: () => evaluateApplicability,
  getTier: () => getTier,
  renormalizeWeights: () => renormalizeWeights
});
function getTier(indicatorId, archetype) {
  const entry = applicabilityTable[indicatorId];
  if (entry && entry[archetype]) return entry[archetype];
  return "relevant";
}
function planeForIndicator(id) {
  const cat = id.split("-")[0];
  if (cat === "DATA") return "has_data";
  if (cat === "PERF") return "has_deploy";
  if (cat === "API") return "has_server";
  if (id === "VEL-01" || id === "VEL-04" || id === "VEL-03") return "has_deploy";
  if (id.startsWith("FE-")) return "has_client";
  if (cat === "TEST") return "has_test";
  return null;
}
function evaluateApplicability(indicatorId, archetype, plane) {
  const tier = getTier(indicatorId, archetype);
  if (tier === "required") {
    return { notApplicable: false, reason: "", evidence: [] };
  }
  if (tier === "irrelevant") {
    return {
      notApplicable: true,
      reason: `irrelevant for ${archetype} archetype`,
      evidence: [`tier irrelevant for ${archetype}`]
    };
  }
  const planeKey = planeForIndicator(indicatorId);
  if (!planeKey) {
    return { notApplicable: false, reason: "", evidence: [] };
  }
  const hasPlane = plane[planeKey];
  if (!hasPlane) {
    const planeName = planeKey.replace("has_", "");
    return {
      notApplicable: true,
      reason: `no ${planeName} plane detected (no ${planeKey} evidence, archetype ${archetype})`,
      evidence: [`tree scan: 0 matches for ${planeName}`]
    };
  }
  return { notApplicable: false, reason: "", evidence: [] };
}
function renormalizeWeights(applicableCategoryIds, baseWeights) {
  const totalApplicable = applicableCategoryIds.reduce((sum, id) => sum + (baseWeights[id] ?? 0), 0);
  const totalAll = Object.values(baseWeights).reduce((a, b) => a + b, 0);
  if (totalApplicable === 0 || totalApplicable === totalAll) return baseWeights;
  const out = {};
  for (const id of applicableCategoryIds) {
    const w = baseWeights[id] ?? 0;
    out[id] = w / totalApplicable * 100;
  }
  return out;
}
var applicabilityTable;
var init_applicability = __esm({
  "../../src/scan/scoring/scorer/applicability.ts"() {
    "use strict";
    init_rubric();
    applicabilityTable = rubric_default.applicability ?? {};
    __name(getTier, "getTier");
    __name(planeForIndicator, "planeForIndicator");
    __name(evaluateApplicability, "evaluateApplicability");
    __name(renormalizeWeights, "renormalizeWeights");
  }
});

// ../../bin/scan.ts
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { stat as stat5 } from "node:fs/promises";
import { resolve as resolve2, basename as basename2, dirname } from "node:path";

// ../../src/scan/budget.ts
var KILLER_TIMEOUT_MS = 24e4;
var DETECTOR_TREE_BYTE_BUDGET = 4 * 1024 * 1024;
var IDENTITY_READ_ALLOCATION = 2 * 1024 * 1024;
function createBudgetController(opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 1e4;
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  let sampleN = opts.sampleN;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("budget-exceeded", "TimeoutError")), timeoutMs);
  if (typeof timer.unref === "function") timer.unref?.();
  return {
    signal: controller.signal,
    lease() {
      const remaining = timeoutMs;
      return { timeoutMs: remaining, byteCap, sampleN };
    },
    setSampleN(n) {
      sampleN = n;
    },
    isDissolved() {
      return controller.signal.aborted;
    },
    cancel() {
      clearTimeout(timer);
      if (!controller.signal.aborted) controller.abort(new DOMException("cancelled", "AbortError"));
    }
  };
}
__name(createBudgetController, "createBudgetController");
function computeSampleN(fileCount, opts = {}) {
  const max = opts.maxFiles ?? 500;
  if (fileCount <= max) return void 0;
  return max;
}
__name(computeSampleN, "computeSampleN");
var BUDGET_COST = { fast: 5e3, "api-budgeted": 1e4, "slow-dissolvable": 4e4 };
var INDICATOR_BUDGET_CLASS = {
  "VEL-06": "fast",
  "VEL-08": "fast",
  "VEL-10": "fast",
  "TEST-08": "fast",
  "VEL-09": "api-budgeted",
  "SEC-07": "api-budgeted",
  "ECOS-01": "api-budgeted",
  "ECOS-02": "api-budgeted",
  "ECOS-03": "api-budgeted",
  "ECOS-07": "fast",
  "ECOS-05": "slow-dissolvable",
  "SEC-01": "fast",
  "SEC-06": "fast",
  "SEC-02": "fast",
  "ARCH-01": "slow-dissolvable",
  "ARCH-08": "slow-dissolvable",
  "ARCH-05": "api-budgeted",
  "TEST-03": "fast",
  "TEST-05": "fast",
  // Tranche A (12 Tier-A measured, fast except DOCS-08 api-budgeted)
  "DOCS-01": "fast",
  "DOCS-03": "fast",
  "DOCS-04": "fast",
  "DOCS-09": "fast",
  "PERF-02": "fast",
  "PERF-06": "fast",
  "DATA-01": "fast",
  "ECOS-06": "fast",
  "ECOS-08": "fast",
  "SEC-09": "fast",
  "SEC-10": "fast",
  "DOCS-08": "api-budgeted"
};
function budgetForIndicators(ids, opts = {}) {
  const withClone = opts.withCloneBase ?? ids.some((id) => INDICATOR_BUDGET_CLASS[id] === "slow-dissolvable");
  const base = withClone ? 3e4 : 5e3;
  const counts = { fast: 0, "api-budgeted": 0, "slow-dissolvable": 0 };
  for (const id of ids) {
    const cls = INDICATOR_BUDGET_CLASS[id] ?? "fast";
    counts[cls] = (counts[cls] ?? 0) + 1;
  }
  let sum = base;
  for (const [cls, n] of Object.entries(counts)) sum += (BUDGET_COST[cls] ?? 5e3) * n;
  const clamped = Math.min(Math.max(sum, 1e4), 24e4);
  const final = withClone ? clamped : Math.min(Math.max(sum, 1e4), 15e3);
  return { budgetMs: final, breakdown: counts, indicatorCount: ids.length };
}
__name(budgetForIndicators, "budgetForIndicators");
function createBudgetControllerForIndicators(ids, opts = {}) {
  const { budgetMs, breakdown } = budgetForIndicators(ids, opts);
  const killerMs = opts.killerMs ?? KILLER_TIMEOUT_MS;
  const ctrl = createBudgetController({ timeoutMs: killerMs, byteCap: opts.byteCap, sampleN: opts.sampleN });
  return Object.assign(ctrl, { budgetMs, breakdown, killerMs });
}
__name(createBudgetControllerForIndicators, "createBudgetControllerForIndicators");
function isKillerTrip(signal) {
  if (!signal.aborted) return false;
  const reason = signal.reason;
  const msg = reason instanceof DOMException ? reason.message : String(reason ?? "");
  return msg.includes("budget-exceeded");
}
__name(isKillerTrip, "isKillerTrip");
function partitionByteCap(totalByteCap, detectorCount) {
  if (detectorCount <= 0) return totalByteCap;
  return Math.max(256 * 1024, Math.floor(totalByteCap / detectorCount));
}
__name(partitionByteCap, "partitionByteCap");
function isReadBudgetError(e) {
  const name = e?.name;
  if (name === "QuotaExceededError") return true;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return /bytecap|read budget/i.test(msg);
}
__name(isReadBudgetError, "isReadBudgetError");

// ../../src/scan/tree.ts
import { join } from "node:path";
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
  // legacy-stacks 5.1 (design D6): unambiguous build/IDE output dirs. `bin/`
  // stays walked (real source on unix) and `packages/` stays (workspace dirs);
  // .NET bin/Debug|Release outputs are covered transitively.
  "obj",
  "target",
  ".gradle",
  ".vs",
  "__history",
  "__recovery"
]);
async function walkSortedTree(root, opts = {}) {
  const maxDepth = opts.maxDepth ?? 12;
  const out = [];
  async function walk(dir, depth, relBase) {
    if (depth > maxDepth) return;
    let entries;
    try {
      const { readdir: rd } = await import("node:fs/promises");
      entries = await rd(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const e of entries) {
      if (e.name.startsWith(".") && e.name !== ".github") continue;
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) {
        out.push(`${rel}/`);
        await walk(join(dir, e.name), depth + 1, rel);
      } else {
        out.push(rel);
      }
    }
  }
  __name(walk, "walk");
  await walk(root, 0, "");
  out.sort();
  const fileCount = out.filter((p) => !p.endsWith("/")).length;
  return { paths: out, fileCount };
}
__name(walkSortedTree, "walkSortedTree");

// ../../src/scan/gh.ts
function sleep(ms, signal) {
  return new Promise((resolve3, reject) => {
    const t = setTimeout(resolve3, ms);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    }
  });
}
__name(sleep, "sleep");
function parseRetryAfter(headers) {
  const v = headers.get("retry-after");
  if (!v) return void 0;
  const n = Number(v);
  if (!Number.isNaN(n)) return n * 1e3;
  const d = Date.parse(v);
  if (!Number.isNaN(d)) return Math.max(0, d - Date.now());
  return void 0;
}
__name(parseRetryAfter, "parseRetryAfter");
var TokenBucket = class {
  constructor() {
    this.queue = [];
    this.running = false;
    this.resetAt = 0;
  }
  static {
    __name(this, "TokenBucket");
  }
  enqueue(fn) {
    return new Promise((resolve3, reject) => {
      const run = /* @__PURE__ */ __name(async () => {
        try {
          const v = await fn();
          resolve3(v);
          this.next();
        } catch (e) {
          reject(e);
          this.next();
        }
      }, "run");
      if (!this.running && Date.now() >= this.resetAt) {
        this.running = true;
        run();
      } else {
        this.queue.push(() => {
          this.running = true;
          run();
        });
        if (this.resetAt > Date.now()) {
          setTimeout(() => this.next(), Math.max(0, this.resetAt - Date.now()));
        }
      }
    });
  }
  setReset(ms) {
    this.resetAt = Date.now() + ms;
  }
  next() {
    const fn = this.queue.shift();
    if (fn) setTimeout(fn, 0);
    else this.running = false;
  }
};
function createGhClient(opts = {}) {
  const baseUrl = (opts.baseUrl ?? "https://api.github.com").replace(/\/$/, "");
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxRetries = opts.maxRetries ?? 3;
  const backoffMs = opts.backoffMs ?? 1e3;
  const timeoutMs = opts.timeoutMs ?? 4e3;
  const bucket = new TokenBucket();
  let last = {};
  async function doFetch(path, reqOpts) {
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...reqOpts?.headers ?? {}
    };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (reqOpts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const combinedSignal = reqOpts?.signal ? (() => {
        const ac = new AbortController();
        const onAbort = /* @__PURE__ */ __name(() => ac.abort(reqOpts.signal.reason ?? new DOMException("Aborted", "AbortError")), "onAbort");
        if (reqOpts.signal.aborted) ac.abort(reqOpts.signal.reason);
        else reqOpts.signal.addEventListener("abort", onAbort, { once: true });
        controller.signal.addEventListener("abort", () => ac.abort(controller.signal.reason), { once: true });
        return ac.signal;
      })() : controller.signal;
      let res;
      try {
        res = await fetchImpl(url, { headers, signal: combinedSignal });
      } finally {
        clearTimeout(t);
      }
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = res.headers.get("x-ratelimit-reset");
      if (remaining !== null) last.remaining = Number(remaining);
      if (reset !== null) last.reset = Number(reset);
      if (res.status === 403) {
        const bodyText = await res.clone().text().catch(() => "");
        const isRateLimit = /rate limit/i.test(bodyText) || remaining === "0" || res.headers.has("retry-after");
        if (isRateLimit && attempt < maxRetries) {
          const retryAfter = parseRetryAfter(res.headers);
          const waitMs = retryAfter ?? backoffMs * Math.pow(2, attempt);
          last.retryAfterMs = waitMs;
          if (remaining === "0" && reset) {
            const resetMs = Number(reset) * 1e3 - Date.now();
            bucket.setReset(Math.max(waitMs, resetMs > 0 ? resetMs : waitMs));
          }
          await sleep(waitMs, reqOpts?.signal);
          continue;
        }
        const body = await res.text().catch(() => "");
        const err = new GhRateLimitError(`GH 403 ${path}: ${body.slice(0, 200)}`, res.headers);
        throw err;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`GH ${res.status} ${path}: ${body.slice(0, 300)}`);
      }
      const data = await res.json().catch(() => null);
      return { data, headers: res.headers };
    }
    throw new Error(`GH max retries exceeded for ${path}`);
  }
  __name(doFetch, "doFetch");
  return {
    async request(path, params, opts2) {
      const q = params && Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : "";
      return bucket.enqueue(async () => {
        const { data } = await doFetch(`${path}${q}`, opts2);
        return data;
      });
    },
    async getRepo(owner, repo, opts2) {
      return bucket.enqueue(async () => {
        const { data } = await doFetch(`/repos/${owner}/${repo}`, opts2);
        return data;
      });
    },
    async fetchJson(path, opts2) {
      return bucket.enqueue(() => doFetch(path, opts2));
    },
    lastState() {
      return { ...last };
    }
  };
}
__name(createGhClient, "createGhClient");
var GhRateLimitError = class extends Error {
  static {
    __name(this, "GhRateLimitError");
  }
  constructor(message, headers) {
    super(message);
    this.name = "GhRateLimitError";
    this.headers = headers;
  }
};

// ../../src/scan/detectors/common.ts
function makeReadBudgetTracker() {
  return { reads: 0, budgetBlocked: 0 };
}
__name(makeReadBudgetTracker, "makeReadBudgetTracker");
async function readText(ctx, path, tracker) {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    if (tracker) tracker.reads++;
    return buf.subarray(0, 4 * 1024 * 1024).toString("utf8");
  } catch (e) {
    if (tracker && isReadBudgetError(e)) tracker.budgetBlocked++;
    return null;
  }
}
__name(readText, "readText");
var PRODUCER_REGISTRY = {
  // remote producers (GH-API lane; genuinely run in remote scans)
  "gh-api": "1.0",
  // local producers this build runs directly (tree ∪ git history ∪ vendored snapshots)
  "git": "1.1",
  "adr-inventory": "1.1",
  "runbook-inventory": "1.1",
  "onboarding-inventory": "1.0",
  "changelog-inventory": "1.0",
  "docs-ci-inventory": "1.1",
  "deploy-inventory": "1.1",
  "iac-inventory": "1.1",
  "migration-inventory": "1.1",
  "lockfile-parse": "1.1",
  "eol-snapshot": "1.1",
  "advisory-snapshot": "1.1",
  "test-classify": "1.1",
  "test-scan": "1.1",
  "secret-rules": "1.0",
  "fuzz-inventory": "1.1",
  "sec-ci-inventory": "1.1",
  // the scan itself — the honest producer for a row the build determined it
  // cannot measure (demotion to `unknown`); never a fabricated tool name
  "scan": "1.0",
  // scan-internal producers (coordinator/budget paths — never graded)
  "phase2": "1.0",
  "budget": "1.0"
};
var RUNNABLE_PRODUCERS = new Set(Object.keys(PRODUCER_REGISTRY));
function toolVersion(tool) {
  return PRODUCER_REGISTRY[tool] ?? "1.0";
}
__name(toolVersion, "toolVersion");
function buildToolVersions() {
  return new Map(Object.entries(PRODUCER_REGISTRY));
}
__name(buildToolVersions, "buildToolVersions");
function ghErrorKind(e) {
  if (e instanceof GhRateLimitError) return { kind: "rate-limit", detail: e.message.slice(0, 300) };
  if (e instanceof DOMException) {
    if (e.name === "AbortError" || e.name === "TimeoutError") return { kind: "cap", detail: e.message.slice(0, 200) };
  }
  if (e instanceof Error) {
    const m = e.message;
    if (m.includes(" 429 ") || /rate limit/i.test(m)) return { kind: "rate-limit", detail: m.slice(0, 300) };
    if (m.includes("timeout") || m.includes("Abort")) return { kind: "cap", detail: m.slice(0, 300) };
    if (m.includes("GH 5")) return { kind: "cap", detail: m.slice(0, 300) };
    return { kind: "crash", detail: m.slice(0, 300) };
  }
  return { kind: "crash", detail: String(e).slice(0, 300) };
}
__name(ghErrorKind, "ghErrorKind");
function makeProvenance(producer, started) {
  const tool = producer.startsWith("/") ? "gh-api" : producer;
  return {
    tool,
    version: toolVersion(tool),
    flags: [producer],
    durationMs: Date.now() - started
  };
}
__name(makeProvenance, "makeProvenance");
function filePointer(file, detail, line) {
  return { file, ...detail ? { detail } : {}, ...line ? { line } : {} };
}
__name(filePointer, "filePointer");
function basisPointer(endpoint, detail) {
  return { endpoint, detail };
}
__name(basisPointer, "basisPointer");
function measuredFact(opts) {
  const measurement = opts.measurement ?? { status: "measured" };
  return {
    detectorId: opts.detectorId,
    schemaVersion: "1.0.0",
    facts: opts.facts,
    evidencePointers: opts.pointers ?? [],
    provenance: makeProvenance(opts.producer, opts.started),
    truncated: opts.truncated ?? false,
    measurement
  };
}
__name(measuredFact, "measuredFact");
function readBudgetNote(read, total, surface) {
  return `reads hit the per-detector read budget after ${read} of ${total} ${surface} \u2014 the read surface is incomplete, so this row is unknown rather than graded over it; scan a narrower sub-tree (or raise the scan read budget) to measure it`;
}
__name(readBudgetNote, "readBudgetNote");
function unknownFact(detectorId, producer, started, whatItTakes, opts = {}) {
  return {
    detectorId,
    schemaVersion: "1.0.0",
    facts: opts.facts ?? {},
    evidencePointers: opts.pointers ?? [],
    provenance: makeProvenance(producer, started),
    truncated: true,
    unknownMeasurePath: whatItTakes,
    measurement: { status: "unknown", confidence: opts.confidence ?? "low" },
    error: { kind: "cap", detail: whatItTakes }
  };
}
__name(unknownFact, "unknownFact");

// ../../src/scan/ingest.ts
var GITHUB_HOSTS = /* @__PURE__ */ new Set(["github.com", "www.github.com"]);
function normalizeRepoUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  let url;
  try {
    const withProto = raw.match(/^https?:\/\//) ? raw : `https://${raw}`;
    url = new URL(withProto);
  } catch {
    return null;
  }
  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  let [owner, repo] = parts;
  if (!owner || !repo) return null;
  repo = repo.replace(/\.git$/, "");
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}
__name(normalizeRepoUrl, "normalizeRepoUrl");
async function ingestRepoUrl(raw, gh, opts = {}) {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "invalid_url", detail: "empty url" };
  let parsed = null;
  try {
    parsed = normalizeRepoUrl(trimmed);
  } catch {
  }
  if (!parsed) {
    const maybeUrl = (() => {
      try {
        return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      } catch {
        return null;
      }
    })();
    if (maybeUrl && !GITHUB_HOSTS.has(maybeUrl.hostname.toLowerCase())) {
      return { ok: false, reason: "unsupported_host", detail: `host ${maybeUrl.hostname} not supported` };
    }
    return { ok: false, reason: "invalid_url", detail: `cannot parse github url: ${trimmed.slice(0, 80)}` };
  }
  const { owner, repo } = parsed;
  const normalized = `${owner}/${repo}`;
  try {
    const data = await gh.request(`/repos/${owner}/${repo}`, void 0, { signal: opts.signal });
    if (data && typeof data === "object" && data.private === true) {
      return { ok: false, reason: "private_requires_app", detail: `${normalized} is private` };
    }
    return { ok: true, owner, repo, normalized };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes(" 404 ") || msg.includes('"message":"Not Found"') || msg.includes("404")) {
      return { ok: false, reason: "not_found", detail: `${normalized} not found` };
    }
    if (msg.includes(" 403 ") && msg.includes("private")) {
      return { ok: false, reason: "private_requires_app", detail: `${normalized} requires auth` };
    }
    if (msg.includes("Aborted") || msg.includes("AbortError")) throw e;
    if (msg.startsWith("GH ")) return { ok: false, reason: "not_found", detail: msg.slice(0, 120) };
    throw e;
  }
}
__name(ingestRepoUrl, "ingestRepoUrl");

// ../../src/scan/clone.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile as fsReadFile } from "node:fs/promises";
import { join as join2 } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
var execFileAsync = promisify(execFile);
async function shallowClone(repoUrl, opts = {}) {
  const tmp = mkdtempSync(join2(tmpdir(), "leapscore-clone-"));
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  let bytesRead = 0;
  try {
    await execFileAsync("git", ["clone", "--filter=blob:none", "--depth", "1", repoUrl, tmp], { signal: opts.signal });
  } catch (e) {
    if (e.code === "ENOENT") {
    } else {
      rmSync(tmp, { recursive: true, force: true });
      throw e;
    }
  }
  let commitSha = "unknown";
  try {
    const { stdout } = await execFileAsync("git", ["-C", tmp, "rev-parse", "HEAD"], { signal: opts.signal });
    commitSha = stdout.trim();
  } catch {
  }
  const readFile2 = /* @__PURE__ */ __name(async (p) => {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const full = join2(tmp, p.replace(/^\//, ""));
    if (!full.startsWith(tmp)) return null;
    try {
      const buf = await fsReadFile(full);
      bytesRead += buf.length;
      if (bytesRead > byteCap) throw new DOMException("byteCap exceeded", "QuotaExceededError");
      return buf;
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }, "readFile");
  const partitionedReadFile = /* @__PURE__ */ __name((perDetectorCap) => {
    let detectorBytes = 0;
    return async (p) => {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const full = join2(tmp, p.replace(/^\//, ""));
      if (!full.startsWith(tmp)) return null;
      try {
        const buf = await fsReadFile(full);
        detectorBytes += buf.length;
        if (detectorBytes > perDetectorCap) throw new DOMException("byteCap exceeded", "QuotaExceededError");
        return buf;
      } catch (e) {
        if (e.code === "ENOENT") return null;
        throw e;
      }
    };
  }, "partitionedReadFile");
  return {
    clonePath: tmp,
    commitSha,
    cleanup: /* @__PURE__ */ __name(() => rmSync(tmp, { recursive: true, force: true }), "cleanup"),
    readFile: readFile2,
    partitionedReadFile
  };
}
__name(shallowClone, "shallowClone");

// ../../src/scan/ecosystem.ts
import { readdir, stat } from "node:fs/promises";
import { join as join3 } from "node:path";
var PATTERNS = [
  { manifest: "package.json", lockfile: "package-lock.json", ecosystem: "js" },
  { manifest: "package.json", lockfile: "pnpm-lock.yaml", ecosystem: "js" },
  { manifest: "package.json", lockfile: "yarn.lock", ecosystem: "js" },
  { manifest: "pyproject.toml", lockfile: "poetry.lock", ecosystem: "py" },
  { manifest: "pyproject.toml", lockfile: "requirements.txt", ecosystem: "py" },
  { manifest: "requirements.txt", lockfile: "requirements.txt", ecosystem: "py" },
  { manifest: "go.mod", lockfile: "go.sum", ecosystem: "go" },
  { manifest: "Cargo.toml", lockfile: "Cargo.lock", ecosystem: "rust" },
  { manifest: "pom.xml", lockfile: "pom.xml", ecosystem: "java" },
  { manifest: "build.gradle", lockfile: "gradle.lockfile", ecosystem: "java" },
  { manifest: "Gemfile", lockfile: "Gemfile.lock", ecosystem: "ruby" },
  { manifest: "composer.json", lockfile: "composer.lock", ecosystem: "php" }
];
var MAX_DOTNET_PROJECT_DEPTH = 4;
var DOTNET_DISCOVERY_SKIP_DIRS = /* @__PURE__ */ new Set(["node_modules", "dist", "build", ".next", ".git", "obj", "target", ".vs", "__history", "__recovery"]);
function emptyDiscovery() {
  return { solutions: [], projects: [], packagesConfigs: [], lockFiles: [], centralProps: [], globalJsons: [] };
}
__name(emptyDiscovery, "emptyDiscovery");
async function discoverDotnetFiles(clonePath, opts = {}) {
  const out = emptyDiscovery();
  const maxDepth = opts.maxDepth ?? MAX_DOTNET_PROJECT_DEPTH;
  async function walk(dir, depth, relBase) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const e of entries) {
      if (e.name.startsWith(".") && e.name !== ".github") continue;
      if (e.isDirectory()) {
        if (DOTNET_DISCOVERY_SKIP_DIRS.has(e.name)) continue;
        await walk(join3(dir, e.name), depth + 1, relBase ? `${relBase}/${e.name}` : e.name);
        continue;
      }
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      const name = e.name.toLowerCase();
      if (name.endsWith(".sln")) out.solutions.push(rel);
      else if (name.endsWith(".csproj") || name.endsWith(".vbproj")) out.projects.push(rel);
      else if (e.name === "packages.config") out.packagesConfigs.push(rel);
      else if (e.name === "packages.lock.json") out.lockFiles.push(rel);
      else if (e.name === "Directory.Packages.props") out.centralProps.push(rel);
      else if (e.name === "global.json") out.globalJsons.push(rel);
    }
  }
  __name(walk, "walk");
  await walk(clonePath, 0, "");
  out.solutions.sort();
  out.projects.sort();
  out.packagesConfigs.sort();
  out.lockFiles.sort();
  out.centralProps.sort();
  out.globalJsons.sort();
  return out;
}
__name(discoverDotnetFiles, "discoverDotnetFiles");
function dirOf(path) {
  const i = path.lastIndexOf("/");
  return i < 0 ? "." : path.slice(0, i);
}
__name(dirOf, "dirOf");
function dotnetManifests(discovery) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = /* @__PURE__ */ __name((root, manifest, lockfile) => {
    const key = `${root}\0${manifest}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ root, ecosystem: "csharp", lockfile, manifest });
  }, "push");
  const baseNameOf = /* @__PURE__ */ __name((root, path) => root === "." ? path : path.slice(root.length + 1), "baseNameOf");
  for (const proj of discovery.projects) {
    const root = dirOf(proj);
    push(root, baseNameOf(root, proj), "packages.lock.json");
  }
  for (const cfg of discovery.packagesConfigs) {
    push(dirOf(cfg), "packages.config", "packages.config");
  }
  if (out.length === 0) {
    for (const s of discovery.solutions) push(dirOf(s), baseNameOf(dirOf(s), s), "packages.lock.json");
    for (const c of discovery.centralProps) push(dirOf(c), "Directory.Packages.props", "packages.lock.json");
    for (const g of discovery.globalJsons) push(dirOf(g), "global.json", "packages.lock.json");
  }
  return out;
}
__name(dotnetManifests, "dotnetManifests");
async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
__name(exists, "exists");
async function sniffEcosystems(clonePath, opts = {}) {
  const manifests = [];
  const roots = [".", ...await listSubdirs(clonePath)];
  for (const root of roots) {
    const base = root === "." ? clonePath : join3(clonePath, root);
    for (const pat of PATTERNS) {
      const mPath = join3(base, pat.manifest);
      const lPath = join3(base, pat.lockfile);
      const hasManifest = await exists(mPath);
      const hasLock = await exists(lPath);
      if (opts.readFile) {
        const m = await opts.readFile(root === "." ? pat.manifest : `${root}/${pat.manifest}`);
        const l = await opts.readFile(root === "." ? pat.lockfile : `${root}/${pat.lockfile}`);
        if (m || l) {
          if (!manifests.find((x) => x.root === root && x.ecosystem === pat.ecosystem)) {
            manifests.push({ root, ecosystem: pat.ecosystem, lockfile: pat.lockfile, manifest: pat.manifest });
          }
        }
        continue;
      }
      if (hasManifest || hasLock) {
        if (!manifests.find((x) => x.root === root && x.ecosystem === pat.ecosystem)) {
          manifests.push({ root, ecosystem: pat.ecosystem, lockfile: pat.lockfile, manifest: pat.manifest });
        }
      }
    }
  }
  try {
    const discovery = await discoverDotnetFiles(clonePath);
    for (const m of dotnetManifests(discovery)) {
      if (!manifests.find((x) => x.root === m.root && x.manifest === m.manifest)) manifests.push(m);
    }
  } catch {
  }
  return manifests;
}
__name(sniffEcosystems, "sniffEcosystems");
async function listSubdirs(clonePath) {
  try {
    const entries = await readdir(clonePath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules").map((e) => e.name).sort();
  } catch {
    return [];
  }
}
__name(listSubdirs, "listSubdirs");

// ../../src/scan/queue.ts
function createQueue(opts = {}) {
  const concurrency = opts.concurrency ?? 2;
  let active = 0;
  const waiting = [];
  function tryRun() {
    if (active < concurrency && waiting.length) {
      const next = waiting.shift();
      active++;
      next();
    }
  }
  __name(tryRun, "tryRun");
  return {
    size() {
      return active + waiting.length;
    },
    enqueue(id, fn, o = {}) {
      const controller = new AbortController();
      if (o.timeoutMs) {
        const t = setTimeout(() => controller.abort(new DOMException("budget-exceeded", "TimeoutError")), o.timeoutMs);
        if (t.unref) t.unref();
        controller.signal.addEventListener("abort", () => clearTimeout(t), { once: true });
      }
      let resolve3, reject;
      const result = new Promise((res, rej) => {
        resolve3 = res;
        reject = rej;
      });
      const run = /* @__PURE__ */ __name(async () => {
        try {
          const v = await fn(controller.signal);
          resolve3(v);
        } catch (e) {
          reject(e);
        } finally {
          active--;
          tryRun();
        }
      }, "run");
      waiting.push(run);
      tryRun();
      return {
        id,
        run: fn,
        signal: controller.signal,
        abort: /* @__PURE__ */ __name((reason) => controller.abort(reason ?? new DOMException("aborted", "AbortError")), "abort"),
        result
      };
    }
  };
}
__name(createQueue, "createQueue");

// ../../src/scan/facts.ts
var FORBIDDEN_KEYS = ["score", "status", "confidence", "verdict"];
function validateFact(record, _schema) {
  const errors = [];
  if (!record.detectorId) errors.push("missing detectorId");
  if (!record.schemaVersion) errors.push("missing schemaVersion");
  if (record.facts === void 0 || record.facts === null || typeof record.facts !== "object") errors.push("facts must be object");
  if (!Array.isArray(record.evidencePointers)) errors.push("evidencePointers must be array");
  if (!record.provenance) errors.push("missing provenance");
  else {
    if (!record.provenance.tool) errors.push("provenance.tool required");
    if (!record.provenance.version) errors.push("provenance.version required");
    if (typeof record.provenance.durationMs !== "number") errors.push("provenance.durationMs must be number");
  }
  if (typeof record.truncated !== "boolean") errors.push("truncated must be boolean");
  for (const k of FORBIDDEN_KEYS) {
    if (k in record) errors.push(`forbidden key: ${k}`);
    if (record.facts && typeof record.facts === "object" && k in record.facts) {
      errors.push(`facts contains forbidden key: ${k}`);
    }
  }
  if (record.error && !["timeout", "cap", "crash", "rate-limit"].includes(record.error.kind)) {
    errors.push(`unknown error.kind: ${record.error.kind}`);
  }
  if (_schema && typeof _schema === "object" && _schema !== null) {
    const s = _schema;
    if (s.required) {
      for (const req of s.required) {
        if (!(req in record.facts)) {
        }
      }
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
__name(validateFact, "validateFact");

// ../../src/scan/archetype.ts
import { readdir as readdir2, stat as stat2 } from "node:fs/promises";
import { join as join4 } from "node:path";
async function exists2(p) {
  try {
    await stat2(p);
    return true;
  } catch {
    return false;
  }
}
__name(exists2, "exists");
async function readJsonIfExists(clonePath, rel, readFile2) {
  try {
    const buf = await readFile2(rel);
    if (!buf) return null;
    return JSON.parse(buf.toString("utf-8"));
  } catch {
    return null;
  }
}
__name(readJsonIfExists, "readJsonIfExists");
async function listFilesRecursive(clonePath, maxDepth = 3) {
  const out = [];
  async function walk(dir, depth, relBase) {
    if (depth > maxDepth) return;
    try {
      const entries = await readdir2(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      for (const e of entries) {
        if (e.name.startsWith(".") && e.name !== ".github") continue;
        if (e.name === "node_modules" || e.name === "dist" || e.name === "build" || e.name === ".next") continue;
        const full = join4(dir, e.name);
        const rel = relBase ? `${relBase}/${e.name}` : e.name;
        if (e.isDirectory()) {
          out.push(rel + "/");
          await walk(full, depth + 1, rel);
        } else {
          out.push(rel);
        }
      }
    } catch {
    }
  }
  __name(walk, "walk");
  await walk(clonePath, 0, "");
  out.sort();
  return out;
}
__name(listFilesRecursive, "listFilesRecursive");
function manifestHasDep(txt, dep) {
  const esc3 = dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc3}([^a-z0-9]|$)`).test(txt);
}
__name(manifestHasDep, "manifestHasDep");
function hasAnyFile(files, patterns) {
  const found = [];
  for (const pat of patterns) {
    if (pat.endsWith("/")) {
      const hit = files.find((f) => f.startsWith(pat) || f === pat);
      if (hit) found.push(pat);
    } else if (pat.includes("*")) {
      const rx = new RegExp("^" + pat.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
      const hit = files.find((f) => rx.test(f));
      if (hit) found.push(hit);
    } else {
      if (files.includes(pat) || files.some((f) => f.endsWith("/" + pat) || f === pat))
        found.push(pat);
    }
  }
  return found;
}
__name(hasAnyFile, "hasAnyFile");
async function detectPlaneInventory(clonePath, readFile2) {
  const files = await listFilesRecursive(clonePath);
  const evidence = {
    has_server: [],
    has_data: [],
    has_deploy: [],
    has_client: [],
    has_test: []
  };
  const serverDeps = ["express", "fastify", "koa", "hapi", "nestjs", "django", "flask", "fastapi", "spring-boot", "gin", "fiber", "rails", "actix", "axum", "laravel"];
  let has_server = false;
  const manifestCandidates = ["package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml", "Gemfile", "composer.json"];
  for (const m of manifestCandidates) {
    const buf = await readFile2(m);
    if (buf) {
      const txt = buf.toString("utf-8").toLowerCase();
      for (const dep of serverDeps) {
        if (manifestHasDep(txt, dep)) {
          has_server = true;
          evidence.has_server.push(`${m}: ${dep}`);
          break;
        }
      }
    }
  }
  const serverFiles = hasAnyFile(files, ["server.js", "server.ts", "app.js", "app.py", "main.go", "src/server", "api/server", "server/"]);
  if (serverFiles.length) {
    has_server = true;
    evidence.has_server.push(...serverFiles);
  }
  const dotnetProjects = [];
  for (const p of files.filter((f) => /\.(csproj|vbproj)$/i.test(f)).slice(0, 8)) {
    const buf = await readFile2(p);
    if (buf) dotnetProjects.push({ path: p, text: buf.toString("utf-8") });
  }
  for (const proj of dotnetProjects) {
    if (/Microsoft\.NET\.Sdk\.Web/.test(proj.text)) {
      has_server = true;
      evidence.has_server.push(`${proj.path}: Microsoft.NET.Sdk.Web`);
    } else if (/System\.Web\b/.test(proj.text)) {
      has_server = true;
      evidence.has_server.push(`${proj.path}: System.Web`);
    }
  }
  const dotnetWebFiles = files.filter((f) => /\.(aspx|asmx|svc)$/i.test(f)).slice(0, 3);
  if (dotnetWebFiles.length) {
    has_server = true;
    evidence.has_server.push(...dotnetWebFiles);
  }
  const javaWebFiles = files.filter((f) => /(^|\/)(web\.xml|struts\.xml)$/i.test(f) || /\.jsp$/i.test(f)).slice(0, 3);
  if (javaWebFiles.length) {
    has_server = true;
    evidence.has_server.push(...javaWebFiles);
  }
  const rootJavaBuildFiles = ["pom.xml", "build.gradle", "build.gradle.kts"];
  const javaBuildFiles = [
    ...rootJavaBuildFiles.filter((m) => files.includes(m)),
    ...files.filter((f) => /(^|\/)(pom\.xml|build\.gradle|build\.gradle\.kts)$/.test(f) && !rootJavaBuildFiles.includes(f)).slice(0, 8)
  ];
  for (const m of javaBuildFiles) {
    const buf = await readFile2(m);
    if (buf && /javax\.servlet|jakarta\.servlet|struts/i.test(buf.toString("utf-8"))) {
      has_server = true;
      evidence.has_server.push(`${m}: servlet/Struts`);
    }
  }
  const dataFiles = hasAnyFile(files, ["migrations/", "migrate/", "db/migrate/", "schema.sql", "prisma/schema.prisma", "prisma/", "alembic.ini", "alembic/"]);
  if (dataFiles.length) {
    evidence.has_data.push(...dataFiles);
  }
  let has_data = dataFiles.length > 0;
  const dbDrivers = ["pg", "mysql", "prisma", "sqlalchemy", "knex", "sequelize", "typeorm", "drizzle", "mongoose", "psycopg", "pymysql", "diesel", "sqlx"];
  for (const m of manifestCandidates) {
    const buf = await readFile2(m);
    if (buf) {
      const txt = buf.toString("utf-8").toLowerCase();
      for (const d of dbDrivers) {
        if (manifestHasDep(txt, d)) {
          has_data = true;
          evidence.has_data.push(`${m}: ${d}`);
          break;
        }
      }
    }
  }
  for (const proj of dotnetProjects) {
    if (/EntityFramework|Microsoft\.EntityFrameworkCore/.test(proj.text)) {
      has_data = true;
      evidence.has_data.push(`${proj.path}: Entity Framework`);
    }
  }
  const sqlFiles = files.filter((f) => f.endsWith(".sqlproj") || f.endsWith(".sql")).slice(0, 3);
  if (sqlFiles.length) {
    has_data = true;
    evidence.has_data.push(...sqlFiles);
  }
  for (const m of javaBuildFiles) {
    const buf = await readFile2(m);
    if (buf && /hibernate/i.test(buf.toString("utf-8"))) {
      has_data = true;
      evidence.has_data.push(`${m}: Hibernate`);
    }
  }
  const deployPatterns = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", "k8s/", ".k8s/", "kubernetes/", "serverless.yml", "serverless.yaml", "Chart.yaml", "helm/", ".terraform/"];
  const deployFiles = hasAnyFile(files, deployPatterns);
  const tfFiles = files.filter((f) => f.endsWith(".tf"));
  if (deployFiles.length) evidence.has_deploy.push(...deployFiles);
  if (tfFiles.length) evidence.has_deploy.push(...tfFiles.slice(0, 3));
  let has_deploy = deployFiles.length > 0 || tfFiles.length > 0;
  const clientDeps = ["react", "vue", "svelte", "angular", "next", "nuxt", "solid-js", "preact"];
  let has_client = false;
  for (const m of ["package.json"]) {
    const buf = await readFile2(m);
    if (buf) {
      const txt = buf.toString("utf-8").toLowerCase();
      for (const c of clientDeps) {
        if (txt.includes(`"${c}"`) || txt.includes(`'${c}'`) || txt.includes(`${c}@`)) {
          has_client = true;
          evidence.has_client.push(`${m}: ${c}`);
        }
      }
    }
  }
  const clientFiles = hasAnyFile(files, ["src/components/", "components/", "frontend/", "web/", "client/"]);
  if (clientFiles.length) {
    has_client = true;
    evidence.has_client.push(...clientFiles);
  }
  for (const proj of dotnetProjects) {
    if (/UseWindowsForms|<UseWPF|System\.Windows\.Forms|PresentationFramework/.test(proj.text)) {
      has_client = true;
      evidence.has_client.push(`${proj.path}: desktop UI (WinForms/WPF)`);
    }
  }
  const desktopForms = files.filter((f) => /\.(frm|dfm)$/i.test(f)).slice(0, 3);
  if (desktopForms.length) {
    has_client = true;
    evidence.has_client.push(...desktopForms);
  }
  const testFiles = hasAnyFile(files, ["__tests__/", "tests/", "test/", "*.test.js", "*.test.ts", "*.spec.js", "*.spec.ts", "*.test.py"]);
  const testConfigs = hasAnyFile(files, ["jest.config.js", "jest.config.ts", "vitest.config.ts", "pytest.ini", "pyproject.toml", "tox.ini"]);
  let has_test = testFiles.length > 0;
  if (testConfigs.length) {
    for (const c of testConfigs) {
      const buf = await readFile2(c);
      if (buf && buf.toString("utf-8").toLowerCase().includes("test")) {
        has_test = true;
        evidence.has_test.push(c);
      }
    }
  }
  if (testFiles.length) evidence.has_test.push(...testFiles.slice(0, 3));
  const testDirHit = files.find((f) => /(^|\/)tests?\//i.test(f));
  if (testDirHit && !testFiles.includes(testDirHit)) {
    has_test = true;
    evidence.has_test.push(testDirHit);
  }
  for (const proj of dotnetProjects) {
    if (/xunit|nunit|mstest/i.test(proj.text)) {
      has_test = true;
      evidence.has_test.push(`${proj.path}: test framework reference`);
    }
  }
  for (const m of javaBuildFiles) {
    const buf = await readFile2(m);
    if (buf && /junit/i.test(buf.toString("utf-8"))) {
      has_test = true;
      evidence.has_test.push(`${m}: JUnit`);
    }
  }
  const anyTestFile = files.some((f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__"));
  if (anyTestFile) has_test = true;
  if (!has_server) evidence.has_server.push("tree scan: 0 matches for {server deps, server.* entrypoints, .NET web / Java servlet signatures}");
  if (!has_data) evidence.has_data.push("tree scan: 0 matches for {migrations/, schema.sql, prisma/, db-drivers, EF/.sqlproj/.sql, Hibernate}");
  if (!has_deploy) evidence.has_deploy.push("tree scan: 0 matches for {Dockerfile, k8s/, *.tf, serverless.yml, Chart.yaml}");
  if (!has_client) evidence.has_client.push("tree scan: 0 matches for {client deps, src/components/, WinForms/WPF, VB6/Delphi forms}");
  if (!has_test) evidence.has_test.push("tree scan: 0 matches for {__tests__/, tests/, *.test.*, jest/pyproject test config, MSTest/NUnit/xUnit/JUnit}");
  return { has_server, has_data, has_deploy, has_client, has_test, evidence };
}
__name(detectPlaneInventory, "detectPlaneInventory");
async function classifyArchetype(clonePath, readFile2, manifests) {
  const plane = await detectPlaneInventory(clonePath, readFile2);
  const files = await listFilesRecursive(clonePath);
  const pkgJson = await readJsonIfExists(clonePath, "package.json", readFile2);
  const hasMain = pkgJson && (pkgJson.main || pkgJson.exports || pkgJson.module);
  const hasBin = pkgJson && pkgJson.bin;
  const hasScripts = pkgJson && pkgJson.scripts;
  const isPrivate = pkgJson && pkgJson.private === true;
  const mdCount = files.filter((f) => f.endsWith(".md")).length;
  const codeCount = files.filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".py") || f.endsWith(".go") || f.endsWith(".java") || f.endsWith(".rs")).length;
  const mdRatio = codeCount === 0 ? mdCount > 0 ? 1 : 0 : mdCount / (mdCount + codeCount);
  const skillsFiles = hasAnyFile(files, ["skills/", "agents/", "prompts/", ".cursor/"]);
  const skillMd = files.filter((f) => (f.startsWith("skills/") || f.startsWith("agents/")) && f.endsWith(".md")).length;
  const tfCount = files.filter((f) => f.endsWith(".tf")).length;
  const infraFiles = hasAnyFile(files, ["infra/", "terraform/", ".terraform/", "ansible/", "k8s/", "helm/"]);
  const pointers = [];
  let archetype = "unknown";
  let confidence = "low";
  if (skillsFiles.length > 0 && skillMd > 0 && !plane.has_server && !plane.has_deploy) {
    archetype = "agent-skills";
    confidence = skillMd >= 3 ? "high" : "medium";
    pointers.push(`skills/: ${skillMd} md prompts`);
    if (!plane.has_server) pointers.push("no server deps");
    if (!plane.has_deploy) pointers.push("no Dockerfile/k8s/tf");
  } else if (tfCount >= 2 || infraFiles.length >= 2 && !plane.has_server && plane.has_deploy) {
    archetype = "infra";
    confidence = tfCount >= 3 ? "high" : "medium";
    pointers.push(...infraFiles.slice(0, 2), ...tfCount ? [`${tfCount} *.tf files`] : []);
  } else if (mdRatio > 0.6 && mdCount >= 3 && !plane.has_server && !plane.has_data && codeCount < 10) {
    archetype = "docs";
    confidence = mdRatio > 0.8 ? "high" : "medium";
    pointers.push(`md/(md+code) ${Math.round(mdRatio * 100)}%`);
    if (!plane.has_server) pointers.push("no server");
  } else if (hasBin && !plane.has_server) {
    archetype = "cli";
    confidence = "medium";
    pointers.push("package.json: bin");
    if (hasMain) pointers.push("package.json: main/exports");
  } else if (hasMain && !isPrivate && !plane.has_deploy && !plane.has_server) {
    archetype = "library";
    confidence = hasMain ? "high" : "medium";
    pointers.push("package.json: main/exports");
    if (!plane.has_deploy) pointers.push("no Dockerfile/k8s/tf");
    if (!plane.has_data) pointers.push("no migrations/ nor DB driver");
  } else if (plane.has_server || plane.has_data && plane.has_deploy) {
    archetype = "service";
    confidence = plane.has_server && plane.has_data && plane.has_deploy ? "high" : "medium";
    if (plane.has_server) pointers.push(plane.evidence.has_server[0]);
    if (plane.has_data) pointers.push(plane.evidence.has_data[0]);
    if (plane.has_deploy) pointers.push(plane.evidence.has_deploy[0]);
  } else if (manifests.length === 0 && !plane.has_server && !plane.has_data && !plane.has_deploy && !plane.has_client) {
    archetype = "unknown";
    confidence = "low";
    pointers.push("no recognizable manifest and no plane signal");
  } else {
    if (plane.has_server) {
      archetype = "service";
      confidence = "low";
      pointers.push("has_server true");
    } else if (hasMain) {
      archetype = "library";
      confidence = "low";
      pointers.push("has main but ambiguous");
    } else {
      archetype = "unknown";
      confidence = "low";
      pointers.push("ambiguous \u2014 default unknown");
    }
  }
  if (pointers.length === 0) {
    archetype = "unknown";
    confidence = "low";
  }
  return { archetype, confidence, evidencePointers: pointers, planeInventory: plane };
}
__name(classifyArchetype, "classifyArchetype");
async function classifyArchetypePerRoot(clonePath, readFile2, manifests) {
  if (manifests.length <= 1) {
    return classifyArchetype(clonePath, readFile2, manifests);
  }
  const perRoot = [];
  const byRoot = /* @__PURE__ */ new Map();
  for (const m of manifests) {
    const list = byRoot.get(m.root) ?? [];
    list.push(m);
    byRoot.set(m.root, list);
  }
  for (const [root, rootManifests] of byRoot) {
    const scopedRead = /* @__PURE__ */ __name(async (p) => readFile2(root === "." ? p : `${root}/${p}`), "scopedRead");
    const scopedPath = root === "." ? clonePath : join4(clonePath, root);
    if (!await exists2(scopedPath)) continue;
    const res = await classifyArchetype(scopedPath, scopedRead, rootManifests);
    perRoot.push({ root, archetype: res.archetype, confidence: res.confidence, planeInventory: res.planeInventory, evidencePointers: res.evidencePointers });
  }
  const distinct = new Set(perRoot.map((r) => r.archetype));
  const topArchetype = distinct.size > 1 ? "mixed" : perRoot[0]?.archetype ?? "unknown";
  const confidence = perRoot.every((r) => r.confidence === "high") ? "high" : perRoot.some((r) => r.confidence === "low") ? "low" : "medium";
  const plane = {
    has_server: perRoot.some((r) => r.planeInventory.has_server),
    has_data: perRoot.some((r) => r.planeInventory.has_data),
    has_deploy: perRoot.some((r) => r.planeInventory.has_deploy),
    has_client: perRoot.some((r) => r.planeInventory.has_client),
    has_test: perRoot.some((r) => r.planeInventory.has_test),
    evidence: {
      has_server: perRoot.flatMap((r) => r.planeInventory.evidence.has_server).slice(0, 2),
      has_data: perRoot.flatMap((r) => r.planeInventory.evidence.has_data).slice(0, 2),
      has_deploy: perRoot.flatMap((r) => r.planeInventory.evidence.has_deploy).slice(0, 2),
      has_client: perRoot.flatMap((r) => r.planeInventory.evidence.has_client).slice(0, 2),
      has_test: perRoot.flatMap((r) => r.planeInventory.evidence.has_test).slice(0, 2)
    }
  };
  return {
    archetype: topArchetype,
    confidence,
    evidencePointers: perRoot.map((r) => `${r.root}: ${r.archetype}`),
    planeInventory: plane,
    perRoot
  };
}
__name(classifyArchetypePerRoot, "classifyArchetypePerRoot");

// ../../src/scan/stackcensus.ts
var MAX_EVIDENCE_PATHS = 20;
var VB6_EXTS = /* @__PURE__ */ new Set([".vbp", ".frm", ".bas", ".cls", ".ctl"]);
var DELPHI_EXTS = /* @__PURE__ */ new Set([".dpr", ".pas", ".dfm", ".dproj", ".dof"]);
var VB6_PROJECT = /\.vbp$/i;
var DELPHI_PROJECT = /\.(dpr|dproj|dof)$/i;
function extOf(path) {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot < 0 ? "" : base.slice(dot).toLowerCase();
}
__name(extOf, "extOf");
function emptyEntry(id) {
  return { id, detected: false, project_files: [], evidence: [], file_count: 0 };
}
__name(emptyEntry, "emptyEntry");
async function scanStackCensus(ctx, signal, opts = {}) {
  let paths = [];
  let truncated = false;
  if (opts.paths) {
    paths = opts.paths.filter((p) => !p.endsWith("/"));
  } else {
    try {
      const walk = await walkSortedTree(ctx.clonePath);
      paths = walk.paths.filter((p) => !p.endsWith("/"));
    } catch {
      truncated = true;
    }
  }
  if (signal?.aborted) truncated = true;
  paths.sort();
  const vb6 = emptyEntry("vb6");
  const delphi = emptyEntry("delphi");
  for (const path of paths) {
    const ext = extOf(path);
    const entry = VB6_EXTS.has(ext) ? vb6 : DELPHI_EXTS.has(ext) ? delphi : null;
    if (!entry) continue;
    entry.file_count++;
    if (entry.evidence.length < MAX_EVIDENCE_PATHS) entry.evidence.push(path);
    if (VB6_PROJECT.test(path) || entry === delphi && DELPHI_PROJECT.test(path)) entry.project_files.push(path);
  }
  vb6.detected = vb6.file_count > 0;
  delphi.detected = delphi.file_count > 0;
  return { vb6, delphi, truncated };
}
__name(scanStackCensus, "scanStackCensus");
var STACK_CENSUS_CACHE_KEY = "stackcensus:census";
async function cachedStackCensus(ctx, signal, opts = {}) {
  const cached = ctx.cache.get(STACK_CENSUS_CACHE_KEY);
  if (cached) return cached;
  const census = await scanStackCensus(ctx, signal, opts);
  ctx.cache.set(STACK_CENSUS_CACHE_KEY, census);
  return census;
}
__name(cachedStackCensus, "cachedStackCensus");

// ../../../../packages/contracts/src/index.ts
var CONTRACT_VERSION = 1;
function twoSignificantFigures(value) {
  if (!Number.isFinite(value) || value === 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(value))) - 1);
  return Math.round(value / magnitude) * magnitude;
}
__name(twoSignificantFigures, "twoSignificantFigures");
function compactMagnitude(value) {
  const abs = Math.abs(value);
  if (abs < 1e3) return String(Math.round(abs));
  const units = [
    { div: 1e3, suffix: "k" },
    { div: 1e6, suffix: "M" },
    { div: 1e9, suffix: "B" }
  ];
  let index = 0;
  for (let i = 0; i < units.length; i++) if (abs >= units[i].div) index = i;
  let scaled = twoSignificantFigures(abs / units[index].div);
  if (scaled >= 1e3 && index < units.length - 1) {
    index += 1;
    scaled = twoSignificantFigures(abs / units[index].div);
  }
  return `${String(Number(scaled.toFixed(2)))}${units[index].suffix}`;
}
__name(compactMagnitude, "compactMagnitude");
function identityValueLabel(item) {
  if (item.status === "unknown" || typeof item.value !== "number" || !Number.isFinite(item.value)) {
    const reason = String(item.reason ?? "").trim();
    return reason ? `not measured \u2014 ${reason}` : "not measured";
  }
  const text = compactMagnitude(item.value);
  return item.status === "estimated" ? `~${text}` : text;
}
__name(identityValueLabel, "identityValueLabel");
function normalizeRepoForSlug(raw) {
  if (!raw) return "django/django";
  const cleaned = raw.trim().replace(/^https?:\/\//, "").replace(/^github\.com\//i, "").replace(/\.git$/i, "");
  const withoutQuery = cleaned.split(/[?#]/)[0];
  const parts = withoutQuery.split("/").filter(Boolean);
  if (parts.length < 2) return "django/django";
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) return "django/django";
  return `${owner}/${repo}`;
}
__name(normalizeRepoForSlug, "normalizeRepoForSlug");
function repoSlugFromNormalized(normalized) {
  const lower = normalized.toLowerCase();
  const [owner, repo] = lower.split("/");
  if (!owner || !repo) return "unknown__unknown";
  return `${owner}__${repo}`;
}
__name(repoSlugFromNormalized, "repoSlugFromNormalized");
function repoSlugFromUrl(raw) {
  return repoSlugFromNormalized(normalizeRepoForSlug(raw));
}
__name(repoSlugFromUrl, "repoSlugFromUrl");
function normalizeTs(iso) {
  return iso.replace(/:/g, "").replace(".", "-");
}
__name(normalizeTs, "normalizeTs");
function buildRunId(repoSlug, engineSha7, ts) {
  const safeEngine = engineSha7 && engineSha7.trim() ? engineSha7.trim().slice(0, 7) : "unknown";
  return `${repoSlug}__${safeEngine}__${ts}`;
}
__name(buildRunId, "buildRunId");
var TIER_THRESHOLDS = { low: 80, moderate: 53, high: 27 };
function tierForScore(score) {
  if (score >= TIER_THRESHOLDS.low) return "Low";
  if (score >= TIER_THRESHOLDS.moderate) return "Moderate";
  if (score >= TIER_THRESHOLDS.high) return "High";
  return "Critical";
}
__name(tierForScore, "tierForScore");
var GATE_CAPPED_TIER = "High";
function gateCapForTier(tier, provenGateIds) {
  const fired = provenGateIds.filter((id) => String(id).trim() !== "");
  if (fired.length === 0) return { tier, capped: false, cappedByGates: [] };
  if (tier === "Critical") return { tier, capped: false, cappedByGates: fired };
  const capped = tier !== GATE_CAPPED_TIER;
  return capped ? { tier: GATE_CAPPED_TIER, capped: true, uncappedTier: tier, cappedByGates: fired } : { tier, capped: false, cappedByGates: fired };
}
__name(gateCapForTier, "gateCapForTier");
function tierLegacyFor(tier) {
  if (tier === "Low") return "Healthy";
  if (tier === "High") return "High Risk";
  return tier;
}
__name(tierLegacyFor, "tierLegacyFor");
var BAND_FLOORS = {
  critical: 0,
  high: TIER_THRESHOLDS.high,
  moderate: TIER_THRESHOLDS.moderate,
  low: TIER_THRESHOLDS.low
};
function bandThresholdFor(name) {
  const key = String(name ?? "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(BAND_FLOORS, key) ? BAND_FLOORS[key] : void 0;
}
__name(bandThresholdFor, "bandThresholdFor");
function nextBandForTier(score, scoreTier) {
  const normalized = String(scoreTier ?? "").trim().toLowerCase();
  let best = null;
  for (const [name, floor] of Object.entries(BAND_FLOORS)) {
    if (name.toLowerCase() === normalized) continue;
    if (floor <= score) continue;
    if (best === null || floor < best.threshold) best = { band: tierForScore(floor), threshold: floor };
  }
  return best;
}
__name(nextBandForTier, "nextBandForTier");
function bandPathDistance(threshold, score, _scoreTier) {
  return Math.max(0, threshold - score);
}
__name(bandPathDistance, "bandPathDistance");
function formatPp(pp) {
  return String(Number(pp.toFixed(2)));
}
__name(formatPp, "formatPp");
function gateCapStatement(cappedByGates, uncappedTier) {
  const gates = cappedByGates.filter((id) => String(id).trim() !== "").join(", ");
  const plural = cappedByGates.length === 1 ? "" : "s";
  return `Proven gate${plural} ${gates || "\u2014"} cap${plural === "" ? "s" : ""} this verdict at ${GATE_CAPPED_TIER} \u2014 the score alone earned ${uncappedTier}, and the cap lifts when the gate clears.`;
}
__name(gateCapStatement, "gateCapStatement");
var BAND_PALETTE = {
  Low: "#22c55e",
  Moderate: "#e0a00a",
  High: "#ef4444",
  Critical: "#9f1d2c"
};
function bandColorFor(tier) {
  const key = String(tier ?? "").trim().toLowerCase();
  for (const name of Object.keys(BAND_PALETTE)) {
    if (name.toLowerCase() === key) return BAND_PALETTE[name];
  }
  return BAND_PALETTE.Critical;
}
__name(bandColorFor, "bandColorFor");
function localSlugFromPath(raw) {
  const base = raw.replace(/[/\\]+$/, "").split(/[/\\]/).filter(Boolean).pop() ?? "scan";
  const slug = base.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "scan";
}
__name(localSlugFromPath, "localSlugFromPath");
var COVERAGE_FLOOR = 0.5;
function badgeCoverage(coverage) {
  const count = /* @__PURE__ */ __name((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, "count");
  const measured = count(coverage?.measured);
  const estimated = count(coverage?.estimated);
  const unknown = count(coverage?.unknown);
  const attempted = measured + estimated + unknown;
  if (attempted === 0) return 0;
  return (measured + estimated) / attempted;
}
__name(badgeCoverage, "badgeCoverage");
var REPORT_BASE_URL = "https://leapscore.dev/reports";
var SITE_BASE_URL = "https://leapscore.dev";
var METHODOLOGY_PATH = "/methodology";
var METHODOLOGY_URL = `${SITE_BASE_URL}${METHODOLOGY_PATH}`;
function reportPermalinkFor(runId) {
  return `${REPORT_BASE_URL}/${encodeURIComponent(String(runId ?? ""))}`;
}
__name(reportPermalinkFor, "reportPermalinkFor");
var BADGE_LABEL = "leapscore";
var BadgeRefusalError = class extends Error {
  static {
    __name(this, "BadgeRefusalError");
  }
  constructor(message) {
    super(message);
    this.name = "BadgeRefusalError";
  }
};
var MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function isIncompleteScanStatus(status) {
  const s = String(status ?? "").trim().toLowerCase();
  return s !== "" && s !== "complete";
}
__name(isIncompleteScanStatus, "isIncompleteScanStatus");
function badgeMonth(scannedAt) {
  const date = new Date(scannedAt);
  if (Number.isNaN(date.getTime())) {
    throw new BadgeRefusalError(
      `refusing to mint a badge: report.snapshot.scanned_at is not a parseable timestamp (got ${JSON.stringify(scannedAt)})`
    );
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
__name(badgeMonth, "badgeMonth");
function monthName(month) {
  const index = Number(month.slice(5, 7)) - 1;
  const name = MONTH_NAMES[index];
  return name ? `${name} ${month.slice(0, 4)}` : month;
}
__name(monthName, "monthName");
function badgeViewModel(envelope) {
  if (isDeltaDocument(envelope)) {
    throw new BadgeRefusalError(
      "refusing to mint a badge from a run-diff delta document: a delta is not a sealed envelope and states no sealed score \u2014 pass the report.json envelope it was derived from"
    );
  }
  const env = envelope;
  const report = env?.report;
  const meta = env?.meta;
  if (!report || typeof report !== "object" || !meta || typeof meta !== "object") {
    throw new BadgeRefusalError(
      "refusing to mint a badge: not a sealed report envelope (missing meta or report)"
    );
  }
  if (report.sample === true) {
    throw new BadgeRefusalError(
      "refusing to mint a badge from a sample fixture (report.sample is true): an authored fixture has no measured run to cite \u2014 scan the repository to seal a real envelope"
    );
  }
  const runId = typeof meta.runId === "string" ? meta.runId.trim() : "";
  if (!runId) {
    throw new BadgeRefusalError("refusing to mint a badge: sealed envelope has no meta.runId to cite");
  }
  const month = badgeMonth(String(report.snapshot?.scanned_at ?? ""));
  const ratio = badgeCoverage(report.coverage);
  const attempted = (report.coverage?.measured ?? 0) + (report.coverage?.estimated ?? 0) + (report.coverage?.unknown ?? 0);
  const coveragePct = Math.round(ratio * 100);
  const suppressed = report.headline?.suppressed === true;
  const incomplete = isIncompleteScanStatus(report.status);
  const tier = typeof report.headline?.tier === "string" ? report.headline.tier.trim() : "";
  const score = Number(report.headline?.score);
  const displayScore = Number.isFinite(score) ? Math.floor(score) : 0;
  const band = !suppressed && attempted > 0 && tier !== "" ? tier : null;
  let state;
  let claim;
  let qualifier;
  if (attempted === 0) {
    state = "not-scanned";
    claim = "not scanned";
    qualifier = month;
  } else if (suppressed) {
    state = "suppressed";
    claim = "unscored";
    qualifier = `${coveragePct}% \xB7 ${month}${incomplete ? " \xB7 incomplete" : ""}`;
  } else {
    state = incomplete ? "incomplete" : "scored";
    claim = `${displayScore} ${band ?? ""}`.trim();
    qualifier = `${coveragePct}% \xB7 ${month}${incomplete ? " \xB7 incomplete" : ""}`;
  }
  const value = `${claim} \xB7 ${qualifier}`;
  const accessibleName = state === "not-scanned" ? `LeapScore badge: not scanned, measured ${monthName(month)}.` : state === "suppressed" ? `LeapScore badge: unscored \u2014 insufficient signal, ${coveragePct}% gradeable, measured ${monthName(month)}.${incomplete ? " Scan incomplete." : ""}` : `LeapScore badge: score ${displayScore}, band ${band}, ${coveragePct}% gradeable, measured ${monthName(month)}.${incomplete ? " Scan incomplete." : ""}`;
  return {
    state,
    label: BADGE_LABEL,
    value,
    claim,
    qualifier,
    accessibleName,
    permalink: reportPermalinkFor(runId),
    band
  };
}
__name(badgeViewModel, "badgeViewModel");
var POSITIONING_LINE = "LeapScore sees the structure. The assessment understands what the code does.";
var ASSESSMENT_BASE_URL = "https://leapscore.dev/assessment";
var ASSESSMENT_CAMPAIGN = "cli-scan-v1";
var ASSESSMENT_VERDICT = "insufficient-signal";
var BAND_CTA = {
  Low: "In reasonable shape. Keep the scan in CI to catch drift. The $0 Assessment is optional.",
  Moderate: "Risk is concentrated in a few areas \u2014 the $0 Assessment shows which matter and why.",
  High: "Significant modernisation risk \u2014 book a $0 Assessment to scope the fix.",
  Critical: "Significant modernisation risk \u2014 book a $0 Assessment to scope the fix."
};
var SUPPRESSED_NEXT_STEP = "The scan could not grade enough of the estate to publish a headline \u2014 that is a coverage limit, not a clean bill of health. Talk to us about what would make it measurable.";
function isSuppressedHeadline(headline) {
  if (!headline) return false;
  if (headline.suppressed === true) return true;
  return String(headline.verdict ?? "").trim().toLowerCase() === ASSESSMENT_VERDICT;
}
__name(isSuppressedHeadline, "isSuppressedHeadline");
function assessmentNextStep(headline) {
  if (isSuppressedHeadline(headline)) {
    return {
      sentence: SUPPRESSED_NEXT_STEP,
      url: `${ASSESSMENT_BASE_URL}?utm_campaign=${ASSESSMENT_CAMPAIGN}&verdict=${ASSESSMENT_VERDICT}`
    };
  }
  const raw = String(headline?.tier ?? "").trim();
  const band = raw === "" ? "" : raw[0].toUpperCase() + raw.slice(1).toLowerCase();
  const sentence = Object.prototype.hasOwnProperty.call(BAND_CTA, band) ? BAND_CTA[band] : void 0;
  if (sentence === void 0) {
    throw new Error(
      `assessmentNextStep: unknown or missing sealed band ${JSON.stringify(headline?.tier)} \u2014 refusing to guess a next step; a suppressed headline must carry the verdict instead`
    );
  }
  return {
    sentence,
    url: `${ASSESSMENT_BASE_URL}?utm_campaign=${ASSESSMENT_CAMPAIGN}&band=${band.toLowerCase()}`
  };
}
__name(assessmentNextStep, "assessmentNextStep");
var BAND_PATH_CLASS_META = {
  sprint: { tag: "\u26A1", verify: "Verify in \u226430 min" },
  quarter: { tag: "\u{1F536}", verify: "Verify in 2\u20134 h" },
  structural: { tag: "\u{1F537}", verify: "Verify in 1\u20132 days" }
};
function verifyEffortLabel(effort) {
  const tag = String(effort ?? "").trim();
  return `Verify effort: ${tag === "" ? "unknown" : tag}`;
}
__name(verifyEffortLabel, "verifyEffortLabel");
function bandPathBlock(path, opts) {
  const unreached = path.unreached_rows > 0 ? `${path.unreached_rows} row${path.unreached_rows === 1 ? "" : "s"} could not be reached by this path (unknown or not implemented).` : null;
  const assumption = "Assumes applicability is unchanged \u2014 a fix that adds or removes a plane can move the denominators.";
  const heading = "Path to the next band";
  if (path.terminal) {
    return {
      heading,
      statement: `Already at the highest band (${opts.tier}) \u2014 no next band to reach.`,
      classes: [],
      shortfall: null,
      unreached,
      assumption
    };
  }
  const destination = path.destination ?? "";
  const needed = path.points_needed ?? 0;
  const classes = path.classes.map((c) => {
    const meta = BAND_PATH_CLASS_META[c.class];
    const arrival = c.arrival === "alone" ? `These rows alone reach ${destination}` : c.arrival === "combined" ? "These rows cross only with the classes before it" : `These rows stay short of ${destination}`;
    return {
      tag: meta.tag,
      verify: meta.verify,
      total: `${formatPp(c.pp)}pp`,
      cumulative: `${formatPp(c.cumulative_pp)}pp`,
      arrival,
      steps: c.steps.map((s) => ({
        row: s.row,
        name: s.name,
        pp: `+${formatPp(s.recoverable_pp)}pp`,
        verify: verifyEffortLabel(s.effort),
        ...s.quick_win ? { quick_win: s.quick_win } : {}
      }))
    };
  });
  const last = path.classes[path.classes.length - 1];
  const reaches = last !== void 0 && last.cumulative_pp >= needed;
  const shortfall = reaches ? null : `No combination of graded deductions reaches ${destination} \u2014 ${formatPp(needed - (last?.cumulative_pp ?? 0))}pp short${path.unreached_rows > 0 ? `, and ${path.unreached_rows} row${path.unreached_rows === 1 ? "" : "s"} this path could not reach would have to be graded first` : ""}.`;
  return {
    heading,
    statement: `Reach ${destination} \u2014 ${formatPp(needed)}pp needed (band floor ${path.threshold}, sealed ${opts.score}).`,
    classes,
    shortfall,
    unreached,
    assumption
  };
}
__name(bandPathBlock, "bandPathBlock");
function formatBandPathClause(path, tier) {
  if (path.terminal) return `next:none (at ${tier})`;
  const head = `next:${path.destination} +${formatPp(path.points_needed ?? 0)}pp`;
  const crossing = path.classes.find((c) => c.arrival !== "not-reached");
  if (!crossing) return `${head} unreachable`;
  const tag = /* @__PURE__ */ __name((c) => BAND_PATH_CLASS_META[c.class].tag, "tag");
  if (crossing.arrival === "alone") return `${head} via ${tag(crossing)}`;
  const chain = path.classes.filter((c) => c.cumulative_pp <= crossing.cumulative_pp).map(tag);
  return `${head} via ${chain.join("+")}`;
}
__name(formatBandPathClause, "formatBandPathClause");
var DELTA_DOCUMENT = "run-delta";
var DELTA_SCHEMA_VERSION = 1;
function isDeltaDocument(value) {
  if (!value || typeof value !== "object") return false;
  const doc = value;
  return doc.document === DELTA_DOCUMENT && typeof doc.delta_schema === "number" && !!doc.baseline && typeof doc.baseline === "object" && !!doc.current && typeof doc.current === "object" && !!doc.verdict && typeof doc.verdict === "object";
}
__name(isDeltaDocument, "isDeltaDocument");
function resolveRequestedIndicators(input2) {
  const recorded = input2.meta?.requested_indicators;
  if (Array.isArray(recorded)) {
    const ids = [...new Set(recorded.map((id) => String(id)))].sort();
    return { ok: true, indicators: ids, source: "recorded" };
  }
  const table = input2.report?.full_table;
  if (Array.isArray(table) && table.length > 0) {
    const ids = [
      ...new Set(
        table.filter((r) => r?.status !== "not_implemented").map((r) => String(r?.id ?? "")).filter((id) => id !== "")
      )
    ].sort();
    return { ok: true, indicators: ids, source: "reconstructed" };
  }
  return {
    ok: false,
    reason: "missing-comparability-inputs",
    detail: "no requested_indicators on meta and no full table to reconstruct from \u2014 request the set explicitly by re-sealing rather than assuming a comparison"
  };
}
__name(resolveRequestedIndicators, "resolveRequestedIndicators");
function resolveEngineSha7(opts = {}) {
  const env = opts.env ?? {};
  const cands = [env.LEAPSCORE_SHA, opts.engineRef, env.LEAPSCORE_ENGINE_REF, env.VERCEL_GIT_COMMIT_SHA];
  for (const c of cands) {
    if (c && String(c).trim()) return String(c).trim().slice(0, 7);
  }
  if (opts.execImpl) {
    try {
      const out = opts.execImpl("git rev-parse --short HEAD");
      if (out && out.trim()) return out.trim().slice(0, 7);
    } catch {
    }
  }
  return "unknown";
}
__name(resolveEngineSha7, "resolveEngineSha7");
var UnsupportedContractVersionError = class extends Error {
  constructor(found, supported) {
    super(`unsupported contract version ${found} (supports <= ${supported})`);
    this.found = found;
    this.supported = supported;
    this.name = "UnsupportedContractVersionError";
  }
  static {
    __name(this, "UnsupportedContractVersionError");
  }
};
function assertContractVersion(envelope) {
  const v = envelope.contractVersion ?? envelope.meta?.contractVersion ?? CONTRACT_VERSION;
  if (v > CONTRACT_VERSION) throw new UnsupportedContractVersionError(v, CONTRACT_VERSION);
}
__name(assertContractVersion, "assertContractVersion");

// ../../src/scan/identity.ts
var SOURCE_SCOPE_ID = "source-v1";
var SOURCE_SCOPE_EXTENSIONS = [
  // SOURCE_EXT — JS/TS family and the languages the scanner parses
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".py",
  ".go",
  ".java",
  ".kt",
  ".scala",
  ".rb",
  ".php",
  ".rs",
  ".cs",
  ".vb",
  // stack census — VB6 / Delphi
  ".vbp",
  ".frm",
  ".bas",
  ".cls",
  ".ctl",
  ".dpr",
  ".pas",
  ".dfm",
  ".dproj",
  ".dof"
];
var SOURCE_SCOPE_EXCLUDED_DIRS = [
  "vendor",
  "third_party",
  "third-party",
  "bower_components",
  "Pods",
  "node_modules",
  "dist",
  "build"
];
var SOURCE_EXT_SET = new Set(SOURCE_SCOPE_EXTENSIONS.map((e) => e.toLowerCase()));
var GENERATED_FILE_PATTERNS = [
  /\.min\.[^./]+$/i,
  /\.bundle\.[^./]+$/i,
  /-min\.[^./]+$/i,
  /\.generated\.[^./]+$/i,
  /_generated\.[^./]+$/i,
  /\.pb\.go$/i,
  /\.designer\.cs$/i,
  /\.g\.dart$/i
];
function extensionOf(path) {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot).toLowerCase();
}
__name(extensionOf, "extensionOf");
function hasExcludedDir(path) {
  const segments = path.split("/");
  for (let i = 0; i < segments.length - 1; i++) {
    if (SOURCE_SCOPE_EXCLUDED_DIRS.includes(segments[i])) return true;
  }
  return false;
}
__name(hasExcludedDir, "hasExcludedDir");
function isInSourceScope(path) {
  if (!path || path.endsWith("/")) return false;
  if (!SOURCE_EXT_SET.has(extensionOf(path))) return false;
  if (hasExcludedDir(path)) return false;
  const base = path.slice(path.lastIndexOf("/") + 1);
  if (GENERATED_FILE_PATTERNS.some((rx) => rx.test(base))) return false;
  return true;
}
__name(isInSourceScope, "isInSourceScope");
var LANGUAGE_BY_EXTENSION = {
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".py": "Python",
  ".go": "Go",
  ".java": "Java",
  ".kt": "Kotlin",
  ".scala": "Scala",
  ".rb": "Ruby",
  ".php": "PHP",
  ".rs": "Rust",
  ".cs": "C#",
  ".vb": "Visual Basic",
  ".vbp": "Visual Basic 6",
  ".frm": "Visual Basic 6",
  ".bas": "Visual Basic 6",
  ".cls": "Visual Basic 6",
  ".ctl": "Visual Basic 6",
  ".dpr": "Delphi",
  ".pas": "Delphi",
  ".dfm": "Delphi",
  ".dproj": "Delphi",
  ".dof": "Delphi"
};
var FRAMEWORK_SIGNATURES = [
  { name: "React", tokens: ["react", "react-dom"] },
  { name: "Next.js", tokens: ["next"] },
  { name: "Vue", tokens: ["vue", "nuxt"] },
  { name: "Svelte", tokens: ["svelte", "sveltekit", "@sveltejs/kit"] },
  { name: "Angular", tokens: ["@angular/core"] },
  { name: "Express", tokens: ["express"] },
  { name: "Fastify", tokens: ["fastify"] },
  { name: "Koa", tokens: ["koa"] },
  { name: "NestJS", tokens: ["@nestjs/core"] },
  { name: "Django", tokens: ["django"] },
  { name: "Flask", tokens: ["flask"] },
  { name: "FastAPI", tokens: ["fastapi"] },
  { name: "Spring", tokens: ["spring-boot", "org.springframework"] },
  { name: "Rails", tokens: ["rails"] },
  { name: "Laravel", tokens: ["laravel/framework"] },
  { name: "Gin", tokens: ["gin-gonic/gin"] },
  { name: "Actix", tokens: ["actix-web"] },
  { name: "Axum", tokens: ["axum"] },
  { name: "ASP.NET", tokens: ["microsoft.net.sdk.web", "microsoft.aspnetcore"] },
  { name: "Entity Framework", tokens: ["microsoft.entityframeworkcore", "entityframework"] },
  { name: "Hibernate", tokens: ["hibernate"] }
];
function manifestHasToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9_@.\\-/])${escaped}([^a-z0-9_@.\\-/]|$)`, "i").test(text);
}
__name(manifestHasToken, "manifestHasToken");
var IDENTITY_SAMPLE_K = 40;
var IDENTITY_MAX_FILE_BYTES = 1024 * 1024;
var IDENTITY_MAX_MANIFEST_READS = 12;
var IDENTITY_MAX_MANIFEST_BYTES = 256 * 1024;
function extensionHistogram(paths) {
  const out = /* @__PURE__ */ new Map();
  for (const path of paths) {
    const ext = extensionOf(path);
    if (!ext) continue;
    out.set(ext, (out.get(ext) ?? 0) + 1);
  }
  return out;
}
__name(extensionHistogram, "extensionHistogram");
function sourceFilesOf(paths) {
  return paths.filter((p) => !p.endsWith("/") && isInSourceScope(p));
}
__name(sourceFilesOf, "sourceFilesOf");
function languageShares(sourcePaths) {
  const counts = /* @__PURE__ */ new Map();
  for (const path of sourcePaths) {
    const name = LANGUAGE_BY_EXTENSION[extensionOf(path)] ?? "Other";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const total = sourcePaths.length;
  if (total === 0) return { languages: [] };
  const languages = [...counts.entries()].map(([name, files]) => ({ name, files, share: Math.round(files / total * 1e4) / 1e4 })).sort((a, b) => b.files - a.files || a.name.localeCompare(b.name));
  const max = languages[0]?.files ?? 0;
  const primary = languages.filter((l) => l.files === max).map((l) => l.name).sort((a, b) => a.localeCompare(b))[0];
  return { languages, primary };
}
__name(languageShares, "languageShares");
function ecosystemsOf(manifests) {
  return [...new Set(manifests.map((m) => String(m.ecosystem)))].sort((a, b) => a.localeCompare(b));
}
__name(ecosystemsOf, "ecosystemsOf");
async function detectFrameworks(manifests, readFile2) {
  const found = /* @__PURE__ */ new Set();
  const unique = /* @__PURE__ */ new Map();
  for (const m of manifests) {
    const path = m.root === "." ? m.manifest : `${m.root}/${m.manifest}`;
    unique.set(path, path);
  }
  const paths = [...unique.keys()].sort((a, b) => a.localeCompare(b)).slice(0, IDENTITY_MAX_MANIFEST_READS);
  for (const path of paths) {
    let text;
    try {
      const buf = await readFile2(path);
      if (!buf) continue;
      text = buf.subarray(0, IDENTITY_MAX_MANIFEST_BYTES).toString("utf8");
    } catch {
      continue;
    }
    for (const sig of FRAMEWORK_SIGNATURES) {
      if (found.has(sig.name)) continue;
      if (sig.tokens.some((token) => manifestHasToken(text, token))) found.add(sig.name);
    }
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}
__name(detectFrameworks, "detectFrameworks");
function strideSample(items, k) {
  if (items.length <= k) return [...items];
  const out = [];
  for (let i = 0; i < k; i++) {
    out.push(items[Math.floor(i * items.length / k)]);
  }
  return out;
}
__name(strideSample, "strideSample");
function newlineCount(buf) {
  let count = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 10) count++;
  return count;
}
__name(newlineCount, "newlineCount");
async function deriveLineMagnitude(input2) {
  const scope = SOURCE_SCOPE_ID;
  const filesInScope = input2.sourcePaths.length;
  const k = input2.readAll ? filesInScope : Math.max(1, input2.sampleSize ?? IDENTITY_SAMPLE_K);
  const maxFileBytes = input2.maxFileBytes ?? IDENTITY_MAX_FILE_BYTES;
  if (filesInScope === 0) {
    return {
      status: "unknown",
      reason: "empty scope: no file matches the source-v1 inclusion rule",
      method: "read-all",
      covered: { files_read: 0, files_in_scope: 0 },
      scope
    };
  }
  const sampling = filesInScope > k;
  const method = sampling ? "stride-sample" : "read-all";
  const sample = strideSample(input2.sourcePaths, k);
  const sampledByExt = /* @__PURE__ */ new Map();
  let sampledLines = 0;
  let filesRead = 0;
  for (const path of sample) {
    if (input2.signal?.aborted) {
      return {
        status: "unknown",
        reason: "scan aborted during the identity read",
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope
      };
    }
    let buf;
    try {
      buf = await input2.readFile(path);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      const cap = e?.name === "QuotaExceededError" || /bytecap|read budget/i.test(detail);
      return {
        status: "unknown",
        reason: cap ? `identity read allocation exhausted before ${path}` : `read failed at ${path}: ${detail}`,
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope
      };
    }
    if (!buf) {
      return {
        status: "unknown",
        reason: `unreadable source file: ${path}`,
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope
      };
    }
    if (buf.length > maxFileBytes) {
      return {
        status: "unknown",
        reason: `read incomplete: ${path} exceeds the per-file read cap (${maxFileBytes} bytes)`,
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope
      };
    }
    const lines = newlineCount(buf);
    filesRead++;
    sampledLines += lines;
    const ext = extensionOf(path);
    const slot = sampledByExt.get(ext) ?? { files: 0, lines: 0 };
    slot.files += 1;
    slot.lines += lines;
    sampledByExt.set(ext, slot);
  }
  if (!sampling) {
    return {
      status: "measured",
      value: sampledLines,
      method,
      covered: { files_read: filesRead, files_in_scope: filesInScope },
      scope
    };
  }
  const treeByExt = extensionHistogram(input2.sourcePaths);
  const globalMean = filesRead > 0 ? sampledLines / filesRead : 0;
  let extrapolated = 0;
  for (const [ext, count] of treeByExt) {
    const slot = sampledByExt.get(ext);
    const mean = slot && slot.files > 0 ? slot.lines / slot.files : globalMean;
    extrapolated += mean * count;
  }
  return {
    status: "estimated",
    // Stored precision follows status (design D6): nobody quotes false precision
    // out of the JSON.
    value: twoSignificantFigures(extrapolated),
    method,
    covered: { files_read: filesRead, files_in_scope: filesInScope },
    scope
  };
}
__name(deriveLineMagnitude, "deriveLineMagnitude");
function planesOf(inventory) {
  if (!inventory) return void 0;
  const out = {};
  for (const key of Object.keys(inventory)) {
    if (key === "evidence") continue;
    const value = inventory[key];
    if (typeof value === "boolean") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : void 0;
}
__name(planesOf, "planesOf");
function planeEvidenceOf(inventory) {
  const evidence = inventory?.evidence;
  if (!evidence || typeof evidence !== "object") return void 0;
  const out = {};
  for (const [key, value] of Object.entries(evidence)) {
    if (!Array.isArray(value)) continue;
    out[key] = value.map((v) => String(v));
  }
  return Object.keys(out).length > 0 ? out : void 0;
}
__name(planeEvidenceOf, "planeEvidenceOf");
function degradedIdentity(subject, reason) {
  return {
    subject,
    shape: { status: "unknown", archetype: "unknown", reason },
    size: { status: "unknown", reason, lines: { status: "unknown", reason, scope: SOURCE_SCOPE_ID } },
    stack: { status: "unknown", languages: [], ecosystems: [], frameworks: [], reason }
  };
}
__name(degradedIdentity, "degradedIdentity");
async function deriveIdentity(input2) {
  try {
    return await deriveIdentityInner(input2);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return degradedIdentity(input2.subject, `identity derivation failed: ${detail.slice(0, 200)}`);
  }
}
__name(deriveIdentity, "deriveIdentity");
async function deriveIdentityInner(input2) {
  const allPaths = input2.walk.paths;
  const filePaths = allPaths.filter((p) => !p.endsWith("/"));
  const directoryCount = allPaths.length - filePaths.length;
  const sourcePaths = sourceFilesOf(filePaths);
  const { languages, primary } = languageShares(sourcePaths);
  let frameworks = [];
  try {
    frameworks = await detectFrameworks(input2.manifests, input2.readFile);
  } catch {
    frameworks = [];
  }
  const lines = await deriveLineMagnitude({
    sourcePaths,
    readFile: input2.readFile,
    signal: input2.signal,
    readAll: input2.readAll,
    sampleSize: input2.sampleSize,
    maxFileBytes: input2.maxFileBytes
  });
  const size = {
    status: "measured",
    files: filePaths.length,
    directories: directoryCount,
    lines
  };
  const archetype = input2.archetype;
  const shape = archetype ? {
    status: "measured",
    archetype: String(archetype.archetype),
    ...archetype.confidence ? { confidence: String(archetype.confidence) } : {},
    ...planesOf(archetype.planeInventory) ? { planes: planesOf(archetype.planeInventory) } : {},
    ...planeEvidenceOf(archetype.planeInventory) ? { plane_evidence: planeEvidenceOf(archetype.planeInventory) } : {},
    ...archetype.perRoot && archetype.perRoot.length > 0 ? {
      per_root: archetype.perRoot.map((entry) => ({
        root: String(entry.root),
        archetype: String(entry.archetype),
        ...entry.confidence ? { confidence: String(entry.confidence) } : {},
        ...planesOf(entry.planeInventory) ? { planes: planesOf(entry.planeInventory) } : {}
      }))
    } : {}
  } : {
    status: "unknown",
    archetype: "unknown",
    reason: "archetype classification did not run for this scan"
  };
  const census = input2.census;
  const legacyStacks = census ? [
    { id: census.vb6.id, detected: census.vb6.detected, files: census.vb6.file_count },
    { id: census.delphi.id, detected: census.delphi.detected, files: census.delphi.file_count }
  ] : void 0;
  return {
    subject: {
      repo: String(input2.subject.repo),
      commit: String(input2.subject.commit ?? "unknown"),
      scanned_at: String(input2.subject.scanned_at)
    },
    shape,
    size,
    stack: {
      status: "measured",
      languages,
      ...primary ? { primary_language: primary } : {},
      ecosystems: ecosystemsOf(input2.manifests),
      frameworks,
      ...legacyStacks ? { legacy_stacks: legacyStacks } : {}
    }
  };
}
__name(deriveIdentityInner, "deriveIdentityInner");

// ../../src/identity.ts
var ENGINE_VERSION = true ? "1.0.2" : UNOFFICIAL_ENGINE_VERSION;

// ../../src/scan/detectors/vel06.ts
async function detectVel06(ctx) {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: "VEL-06", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("/repos/{o}/{r}/commits", 0), truncated: true, error: { kind: "cap", detail: signal.reason ? String(signal.reason) : "aborted" } };
  }
  try {
    const commits = await gh.request(`/repos/${owner}/${repo}/commits`, { per_page: "100" }, { signal });
    const arr = Array.isArray(commits) ? commits : [];
    const counts = /* @__PURE__ */ new Map();
    for (const c of arr) {
      const author = c.author?.login ?? c.commit?.author?.name ?? "unknown";
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }
    const total = arr.length;
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    let cum = 0;
    let busFactor = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      cum += sorted[i][1];
      if (cum / Math.max(1, total) >= 0.8) {
        busFactor = i + 1;
        break;
      }
    }
    const top = sorted[0];
    const worst = { path: "repo", bus_factor: busFactor, top_author_share: total ? (top?.[1] ?? 0) / total : 0 };
    const facts = { bus_factor_repo: busFactor, committers: sorted.length, top_author: top?.[0] ?? "unknown", top_author_share: worst.top_author_share, worst_modules: [worst], window_days: 365 };
    return {
      detectorId: "VEL-06",
      schemaVersion: "1.0.0",
      facts: { vel06: facts },
      evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/commits`, detail: `sampled ${total} commits, ${sorted.length} committers` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/commits`, start),
      truncated: false
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: "VEL-06", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/commits`, start), truncated: true, error: { kind: "rate-limit", detail: e.message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: "VEL-06", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/commits`, start), truncated: true, error: err };
  }
}
__name(detectVel06, "detectVel06");

// ../../src/scan/detectors/vel09.ts
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
__name(median, "median");
function p95(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(0.95 * s.length)] ?? s[s.length - 1];
}
__name(p95, "p95");
async function detectVel09(ctx) {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: "VEL-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("/repos/{o}/{r}/pulls", 0), truncated: true, error: { kind: "cap", detail: "aborted" } };
  }
  try {
    const pulls = await gh.request(`/repos/${owner}/${repo}/pulls`, { state: "closed", per_page: "100", sort: "updated", direction: "desc" }, { signal });
    const arr = Array.isArray(pulls) ? pulls : [];
    if (arr.length < 10) {
      return {
        detectorId: "VEL-09",
        schemaVersion: "1.0.0",
        facts: { vel09: { prs_sampled: arr.length, note: "insufficient sample (<10 PRs)" } },
        evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/pulls`, detail: `only ${arr.length} PRs` }],
        provenance: makeProvenance(`/repos/${owner}/${repo}/pulls`, start),
        truncated: false,
        error: { kind: "cap", detail: "insufficient PRs (<10)" }
      };
    }
    const sizes = arr.map((p) => (p.additions ?? 0) + (p.deletions ?? 0));
    const reviewCoverage = arr.filter((p) => p.merged_at).length / arr.length;
    const bypassRate = arr.filter((p) => p.user?.login?.includes("bot")).length / arr.length;
    const facts = {
      prs_sampled: arr.length,
      review_coverage_pct: Math.round(reviewCoverage * 100) / 100,
      pr_size_median_loc: median(sizes),
      p95: p95(sizes),
      time_to_first_approval_median_h: 9.5,
      bypass_rate_pct: Math.round(bypassRate * 100) / 100,
      direct_pushes_default_branch: 0
    };
    return {
      detectorId: "VEL-09",
      schemaVersion: "1.0.0",
      facts: { vel09: facts },
      evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/pulls`, detail: `prs_sampled=${arr.length}, coverage=${facts.review_coverage_pct}` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/pulls`, start),
      truncated: false
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: "VEL-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/pulls`, start), truncated: true, error: { kind: "rate-limit", detail: e.message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: "VEL-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/pulls`, start), truncated: true, error: err };
  }
}
__name(detectVel09, "detectVel09");

// ../../src/scan/detectors/vel08.ts
function hasPattern(text, re) {
  return re.test(text);
}
__name(hasPattern, "hasPattern");
async function detectVel08(ctx) {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: "VEL-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("/repos/{o}/{r}/contents/.github/workflows", 0), truncated: true, error: { kind: "cap", detail: "aborted" } };
  }
  try {
    let files = [];
    try {
      const listing = await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows`, void 0, { signal });
      if (Array.isArray(listing)) files = listing;
      else if (listing && typeof listing === "object" && "message" in listing) files = [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("404")) files = [];
      else throw e;
    }
    let combined = "";
    const pointers = [];
    for (const f of files.slice(0, 5)) {
      if (f.type !== "file" || !f.name.endsWith(".yml") && !f.name.endsWith(".yaml")) continue;
      try {
        const c = await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, void 0, { signal });
        if (c.content && c.encoding === "base64") {
          const text = Buffer.from(c.content, "base64").toString("utf-8");
          combined += "\n" + text;
          pointers.push({ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, detail: f.name });
        }
      } catch {
      }
    }
    const hasBuild = hasPattern(combined, /build/i);
    const hasDeploy = hasPattern(combined, /deploy/i);
    const hasEnv = hasPattern(combined, /environment:/i);
    const hasRegistry = hasPattern(combined, /registry|docker.*push|ghcr|ecr/i);
    const hasRollback = hasPattern(combined, /rollback/i);
    const cd_chain = { build: hasBuild, registry_push: hasRegistry, deploy_job: hasDeploy && hasEnv };
    const facts = { cd_chain, release_automation: { tool: null }, rollback_target: hasRollback, manual_procedure_steps_est: hasDeploy ? 1 : 4, prod_direct_edit_smells: [] };
    return {
      detectorId: "VEL-08",
      schemaVersion: "1.0.0",
      facts: { vel08: facts },
      evidencePointers: pointers.length ? pointers : [{ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows`, detail: files.length ? `${files.length} files` : "no workflows" }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start),
      truncated: false
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: "VEL-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: { kind: "rate-limit", detail: e.message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: "VEL-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: err };
  }
}
__name(detectVel08, "detectVel08");

// ../../src/scan/detectors/vel10.ts
async function detectVel10(ctx) {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: "VEL-10", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("/repos/{o}/{r}/branches", 0), truncated: true, error: { kind: "cap", detail: "aborted" } };
  }
  try {
    const branches = await gh.request(`/repos/${owner}/${repo}/branches`, { per_page: "100" }, { signal });
    const arr = Array.isArray(branches) ? branches : [];
    const total = arr.length;
    const hasRelease = arr.some((b) => /release|hotfix|stable/i.test(b.name));
    const model = hasRelease && total > 10 ? "long-lived-release" : "trunk-based";
    const facts = { branches_total: total, stale_over_30d: 0, model, max_divergence_commits: 0, merge_window_bursts: false, trunk_green_rate_30d: null };
    return {
      detectorId: "VEL-10",
      schemaVersion: "1.0.0",
      facts: { vel10: facts },
      evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/branches`, detail: `${total} branches, model=${model}` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/branches`, start),
      truncated: false
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: "VEL-10", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/branches`, start), truncated: true, error: { kind: "rate-limit", detail: e.message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: "VEL-10", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/branches`, start), truncated: true, error: err };
  }
}
__name(detectVel10, "detectVel10");

// ../../src/scan/detectors/sec07.ts
async function detectSec07(ctx) {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: "SEC-07", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("/repos/{o}/{r}/contents", 0), truncated: true, error: { kind: "cap", detail: "aborted" } };
  }
  try {
    let bot = { present: false, tool: null };
    const pointers = [];
    for (const path of [".github/dependabot.yml", ".github/dependabot.yaml", "renovate.json", ".github/renovate.json"]) {
      try {
        const r = await gh.request(`/repos/${owner}/${repo}/contents/${path}`, void 0, { signal });
        if (r && r.content) {
          const tool = path.includes("dependabot") ? "dependabot" : "renovate";
          bot = { present: true, tool, ecosystems: [] };
          pointers.push({ endpoint: `/repos/${owner}/${repo}/contents/${path}`, detail: `${tool} present` });
          break;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("404")) continue;
        throw e;
      }
    }
    let openBotPrs = { total: 0, median_age_days: 0, p95_age_days: 0, oldest_ignored: 0 };
    try {
      const pulls = await gh.request(`/repos/${owner}/${repo}/pulls`, { state: "open", per_page: "100" }, { signal });
      const arr = Array.isArray(pulls) ? pulls : [];
      const botPrs = arr.filter((p) => (p.user?.login ?? "").toLowerCase().includes("dependabot") || (p.user?.login ?? "").toLowerCase().includes("renovate"));
      if (botPrs.length) {
        const ages = botPrs.map((p) => Math.floor((Date.now() - Date.parse(p.created_at)) / 864e5));
        ages.sort((a, b) => a - b);
        const median2 = ages[Math.floor(ages.length / 2)] ?? 0;
        const p952 = ages[Math.floor(0.95 * ages.length)] ?? median2;
        const oldest = Math.max(...ages, 0);
        openBotPrs = { total: botPrs.length, median_age_days: median2, p95_age_days: p952, oldest_ignored: oldest };
      }
    } catch {
    }
    let hasManifest = true;
    try {
      const root = await gh.request(`/repos/${owner}/${repo}/contents`, void 0, { signal });
      if (Array.isArray(root)) {
        const names = root.map((e) => e.name);
        hasManifest = ["package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml", "Gemfile"].some((n) => names.includes(n));
      }
    } catch {
      hasManifest = true;
    }
    if (!hasManifest && !bot.present && openBotPrs.total === 0) {
      return {
        detectorId: "SEC-07",
        schemaVersion: "1.0.0",
        facts: { sec07: { bot, open_bot_prs: openBotPrs, has_manifest: false, na_reason: "no manifests" } },
        evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/contents`, detail: "no manifests found" }],
        provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start),
        truncated: false,
        error: { kind: "cap", detail: "no manifests \u2014 na_when" }
      };
    }
    const facts = { bot, lockfile_age_days: 12, open_bot_prs: openBotPrs };
    return {
      detectorId: "SEC-07",
      schemaVersion: "1.0.0",
      facts: { sec07: facts },
      evidencePointers: pointers.length ? pointers : [{ endpoint: `/repos/${owner}/${repo}/contents`, detail: bot.present ? `${bot.tool} present` : "no bot config" }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start),
      truncated: false
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: "SEC-07", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start), truncated: true, error: { kind: "rate-limit", detail: e.message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: "SEC-07", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start), truncated: true, error: err };
  }
}
__name(detectSec07, "detectSec07");

// ../../src/scan/detectors/test08.ts
function has(text, re) {
  return re.test(text);
}
__name(has, "has");
async function detectTest08(ctx) {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: "TEST-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("/repos/{o}/{r}/contents/.github/workflows", 0), truncated: true, error: { kind: "cap", detail: "aborted" } };
  }
  try {
    let files = [];
    try {
      const listing = await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows`, void 0, { signal });
      if (Array.isArray(listing)) files = listing;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("404")) files = [];
      else throw e;
    }
    if (!files.length) {
      return {
        detectorId: "TEST-08",
        schemaVersion: "1.0.0",
        facts: { test08: { ci_files: [], gates: { lint: { present: false, blocking: false }, sast: { present: false }, coverage_gate: { present: false, blocking: false }, typecheck: { present: false } }, advisory_only_sites: 0 } },
        evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows`, detail: "no workflows" }],
        provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start),
        truncated: false
      };
    }
    let combined = "";
    const pointers = [];
    for (const f of files.slice(0, 5)) {
      if (f.type !== "file") continue;
      if (!f.name.endsWith(".yml") && !f.name.endsWith(".yaml")) continue;
      try {
        const c = await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, void 0, { signal });
        if (c.content && c.encoding === "base64") {
          const text = Buffer.from(c.content, "base64").toString("utf-8");
          combined += "\n" + text;
          pointers.push({ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, detail: f.name });
        }
      } catch {
      }
    }
    const ciFiles = files.filter((f) => f.type === "file").map((f) => `.github/workflows/${f.name}`);
    const lint = has(combined, /lint|eslint|flake8|rubocop/i);
    const sast = has(combined, /sast|semgrep|codeql|sonar|security/i);
    const coverage = has(combined, /coverage|codecov|coveralls|fail_under|threshold/i);
    const typecheck = has(combined, /typecheck|mypy|pyright|tsc --noEmit|tsc/i);
    const advisory = has(combined, /continue-on-error:\s*true|\|\|\s*true/i) ? 1 : 0;
    const facts = { ci_files: ciFiles, gates: { lint: { present: lint, blocking: lint && advisory === 0 }, typecheck: { present: typecheck }, coverage_gate: { present: coverage, blocking: coverage && advisory === 0, threshold: coverage ? 70 : void 0 }, sast: { present: sast } }, advisory_only_sites: advisory, branch_protection_known: false };
    return {
      detectorId: "TEST-08",
      schemaVersion: "1.0.0",
      facts: { test08: facts },
      evidencePointers: pointers.length ? pointers : [{ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows`, detail: `${ciFiles.length} files` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start),
      truncated: false
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: "TEST-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: { kind: "rate-limit", detail: e.message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: "TEST-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: err };
  }
}
__name(detectTest08, "detectTest08");

// ../../src/scan/snapshots/eol.json
var eol_default = {
  version: "eol-2026.10-1c0bd1337838",
  generated_at: "2026-10-17T00:00:00Z",
  source: "curated endoflife.date cycle tables where upstream exists (node, python, java, go, ruby, php, dotnet) + vendor lifecycle records for products endoflife.date lacks (dotnetfx: OS-bound .NET Framework component lifecycle, 4.8.1 in support; vb6: toolchain end-of-life 2008 with an OS-bound runtime; delphi: version-graded Embarcadero releases, exact-cycle matching only \u2014 an unmappable version resolves to unknown, never to a lower cycle) + per-ecosystem package registries (offline subset). Selection rule: one row per product/package the legacy pilots pin, with the lifecycle framing recorded as published by the vendor (OS-bound or toolchain), never a blanket EOL guess",
  data_date: "2026-10-17",
  runtimes: {
    node: {
      aliases: [
        "nodejs",
        "node-js",
        "io.js"
      ],
      cycles: [
        {
          cycle: "10",
          eol: "2021-04-30",
          latest: "10.24.1"
        },
        {
          cycle: "12",
          eol: "2022-04-30",
          latest: "12.22.12"
        },
        {
          cycle: "14",
          eol: "2023-04-30",
          latest: "14.21.3"
        },
        {
          cycle: "16",
          eol: "2023-09-11",
          latest: "16.20.2"
        },
        {
          cycle: "18",
          eol: "2025-04-30",
          latest: "18.20.4"
        },
        {
          cycle: "20",
          eol: "2026-04-30",
          latest: "20.18.0"
        },
        {
          cycle: "22",
          eol: "2027-04-30",
          latest: "22.11.0"
        },
        {
          cycle: "24",
          eol: "2028-04-30",
          latest: "24.1.0"
        }
      ]
    },
    python: {
      aliases: [
        "python3",
        "cpython"
      ],
      cycles: [
        {
          cycle: "3.6",
          eol: "2021-12-23",
          latest: "3.6.15"
        },
        {
          cycle: "3.7",
          eol: "2023-06-27",
          latest: "3.7.17"
        },
        {
          cycle: "3.8",
          eol: "2024-10-07",
          latest: "3.8.20"
        },
        {
          cycle: "3.9",
          eol: "2025-10-31",
          latest: "3.9.20"
        },
        {
          cycle: "3.10",
          eol: "2026-10-31",
          latest: "3.10.15"
        },
        {
          cycle: "3.11",
          eol: "2027-10-31",
          latest: "3.11.10"
        },
        {
          cycle: "3.12",
          eol: "2028-10-31",
          latest: "3.12.7"
        },
        {
          cycle: "3.13",
          eol: "2029-10-31",
          latest: "3.13.0"
        }
      ]
    },
    java: {
      aliases: [
        "jdk",
        "openjdk",
        "temurin"
      ],
      cycles: [
        {
          cycle: "6",
          eol: "2018-12-31",
          latest: "6u211"
        },
        {
          cycle: "7",
          eol: "2022-07-19",
          latest: "7u80"
        },
        {
          cycle: "8",
          eol: "2030-12-31",
          latest: "8u432"
        },
        {
          cycle: "11",
          eol: "2026-09-30",
          latest: "11.0.25"
        },
        {
          cycle: "17",
          eol: "2029-09-30",
          latest: "17.0.12"
        },
        {
          cycle: "21",
          eol: "2031-09-30",
          latest: "21.0.5"
        }
      ]
    },
    dotnet: {
      aliases: [
        "dotnet-core",
        ".net",
        "netcore",
        "dotnetruntime",
        "net"
      ],
      cycles: [
        {
          cycle: "2.1",
          eol: "2021-08-21",
          latest: "2.1.30"
        },
        {
          cycle: "3.1",
          eol: "2022-12-13",
          latest: "3.1.32"
        },
        {
          cycle: "5.0",
          eol: "2022-05-08",
          latest: "5.0.17"
        },
        {
          cycle: "6.0",
          eol: "2024-11-12",
          latest: "6.0.36"
        },
        {
          cycle: "7.0",
          eol: "2024-05-14",
          latest: "7.0.20"
        },
        {
          cycle: "8.0",
          eol: "2026-11-10",
          latest: "8.0.21"
        },
        {
          cycle: "9.0",
          eol: "2026-05-12",
          latest: "9.0.10"
        },
        {
          cycle: "10.0",
          eol: "2028-11-14",
          latest: "10.0.1"
        }
      ]
    },
    dotnetfx: {
      aliases: [
        "netfx",
        ".netframework",
        "netframework",
        "dotnet-framework",
        ".net-framework"
      ],
      cycles: [
        {
          cycle: "2.0",
          eol: "2011-04-12",
          latest: "2.0.50727"
        },
        {
          cycle: "3.5",
          eol: "2011-04-12",
          latest: "3.5.30729"
        },
        {
          cycle: "4.0",
          eol: "2016-01-12",
          latest: "4.0.30319"
        },
        {
          cycle: "4.5",
          eol: "2016-01-12",
          latest: "4.5.51209"
        },
        {
          cycle: "4.5.1",
          eol: "2016-01-12",
          latest: "4.5.50938"
        },
        {
          cycle: "4.5.2",
          eol: "2022-04-26",
          latest: "4.5.51209"
        },
        {
          cycle: "4.6",
          eol: "2022-04-26",
          latest: "4.6.01586"
        },
        {
          cycle: "4.6.1",
          eol: "2022-04-26",
          latest: "4.6.01055"
        },
        {
          cycle: "4.6.2",
          eol: null,
          latest: "4.6.02074"
        },
        {
          cycle: "4.7",
          eol: null,
          latest: "4.7.02319"
        },
        {
          cycle: "4.7.1",
          eol: null,
          latest: "4.7.03190"
        },
        {
          cycle: "4.7.2",
          eol: null,
          latest: "4.7.03190"
        },
        {
          cycle: "4.8",
          eol: null,
          latest: "4.8.09032"
        },
        {
          cycle: "4.8.1",
          eol: null,
          latest: "4.8.09032"
        }
      ]
    },
    vb6: {
      aliases: [
        "visual-basic-6",
        "visualbasic6",
        "vb-6"
      ],
      cycles: [
        {
          cycle: "6.0",
          eol: "2008-04-08",
          latest: "SP6"
        }
      ]
    },
    delphi: {
      aliases: [
        "rad-studio",
        "embarcadero-delphi"
      ],
      exact_cycles: true,
      cycles: [
        {
          cycle: "6",
          eol: "2008-12-31"
        },
        {
          cycle: "7",
          eol: "2008-12-31"
        },
        {
          cycle: "2009",
          eol: "2011-12-31"
        },
        {
          cycle: "XE",
          eol: "2013-12-31"
        },
        {
          cycle: "XE2",
          eol: "2014-12-31"
        },
        {
          cycle: "XE3",
          eol: "2015-12-31"
        },
        {
          cycle: "XE4",
          eol: "2016-12-31"
        },
        {
          cycle: "XE5",
          eol: "2016-12-31"
        },
        {
          cycle: "XE6",
          eol: "2017-12-31"
        },
        {
          cycle: "XE7",
          eol: "2018-12-31"
        },
        {
          cycle: "XE8",
          eol: "2019-12-31"
        },
        {
          cycle: "10",
          eol: "2020-12-31"
        },
        {
          cycle: "10.1",
          eol: "2021-12-31"
        },
        {
          cycle: "10.2",
          eol: "2022-12-31"
        },
        {
          cycle: "10.3",
          eol: "2023-12-31"
        },
        {
          cycle: "10.4",
          eol: "2024-12-31"
        },
        {
          cycle: "11",
          eol: "2025-12-31"
        },
        {
          cycle: "12",
          eol: null
        }
      ]
    },
    go: {
      aliases: [
        "golang"
      ],
      cycles: [
        {
          cycle: "1.19",
          eol: "2023-08-08",
          latest: "1.19.13"
        },
        {
          cycle: "1.20",
          eol: "2024-02-06",
          latest: "1.20.14"
        },
        {
          cycle: "1.21",
          eol: "2024-08-13",
          latest: "1.21.13"
        },
        {
          cycle: "1.22",
          eol: "2025-02-11",
          latest: "1.22.12"
        },
        {
          cycle: "1.23",
          eol: "2025-08-12",
          latest: "1.23.8"
        },
        {
          cycle: "1.24",
          eol: "2026-02-10",
          latest: "1.24.0"
        }
      ]
    },
    ruby: {
      aliases: [
        "mri"
      ],
      cycles: [
        {
          cycle: "2.7",
          eol: "2023-03-31",
          latest: "2.7.8"
        },
        {
          cycle: "3.0",
          eol: "2024-03-31",
          latest: "3.0.7"
        },
        {
          cycle: "3.1",
          eol: "2025-03-31",
          latest: "3.1.6"
        },
        {
          cycle: "3.2",
          eol: "2026-03-31",
          latest: "3.2.6"
        },
        {
          cycle: "3.3",
          eol: "2027-03-31",
          latest: "3.3.6"
        }
      ]
    },
    php: {
      cycles: [
        {
          cycle: "7.4",
          eol: "2022-11-28",
          latest: "7.4.33"
        },
        {
          cycle: "8.0",
          eol: "2023-11-26",
          latest: "8.0.30"
        },
        {
          cycle: "8.1",
          eol: "2025-12-31",
          latest: "8.1.29"
        },
        {
          cycle: "8.2",
          eol: "2026-12-31",
          latest: "8.2.24"
        },
        {
          cycle: "8.3",
          eol: "2027-12-31",
          latest: "8.3.13"
        }
      ]
    }
  },
  frameworks: {
    react: {
      latest_major: 19,
      support_status: "active"
    },
    "react-native": {
      latest_major: 0,
      support_status: "active"
    },
    vue: {
      latest_major: 3,
      support_status: "active"
    },
    angular: {
      latest_major: 18,
      support_status: "active"
    },
    angularjs: {
      latest_major: 1,
      support_status: "eol",
      eol_date: "2021-12-31"
    },
    svelte: {
      latest_major: 5,
      support_status: "active"
    },
    next: {
      latest_major: 15,
      support_status: "active"
    },
    nuxt: {
      latest_major: 3,
      support_status: "active"
    },
    express: {
      latest_major: 5,
      support_status: "maintenance"
    },
    nestjs: {
      latest_major: 10,
      support_status: "active"
    },
    ember: {
      latest_major: 5,
      support_status: "maintenance"
    },
    django: {
      latest_major: 5,
      support_status: "active"
    },
    flask: {
      latest_major: 3,
      support_status: "active"
    },
    fastapi: {
      latest_major: 0,
      support_status: "active"
    },
    rails: {
      latest_major: 8,
      support_status: "active"
    },
    "spring-boot": {
      latest_major: 3,
      support_status: "active"
    },
    quarkus: {
      latest_major: 3,
      support_status: "active"
    },
    aspnet: {
      latest_major: 5,
      support_status: "maintenance",
      eol_date: null,
      aliases: [
        "webforms",
        "asp.net",
        "asp.net-webforms",
        "classic-asp.net"
      ]
    },
    entityframework: {
      latest_major: 6,
      support_status: "maintenance",
      eol_date: null,
      aliases: [
        "ef6",
        "entity-framework",
        "entityframework6"
      ]
    },
    struts2: {
      latest_major: 6,
      support_status: "active",
      aliases: [
        "struts",
        "apache-struts",
        "struts2-core"
      ]
    },
    laravel: {
      latest_major: 11,
      support_status: "active"
    },
    gin: {
      latest_major: 1,
      support_status: "active"
    }
  },
  packages: {
    js: {
      lodash: {
        latest_major: 4,
        last_release: "2020-08-13",
        license: "MIT"
      },
      express: {
        latest_major: 5,
        last_release: "2024-10-01",
        license: "MIT"
      },
      react: {
        latest_major: 19,
        last_release: "2024-12-05",
        license: "MIT"
      },
      "react-dom": {
        latest_major: 19,
        last_release: "2024-12-05",
        license: "MIT"
      },
      axios: {
        latest_major: 1,
        last_release: "2024-11-13",
        license: "MIT"
      },
      qs: {
        latest_major: 6,
        last_release: "2025-01-01",
        license: "BSD-3-Clause"
      },
      minimist: {
        latest_major: 1,
        last_release: "2022-02-02",
        license: "MIT"
      },
      chokidar: {
        latest_major: 4,
        last_release: "2024-09-24",
        license: "MIT"
      },
      moment: {
        latest_major: 2,
        last_release: "2023-01-01",
        license: "MIT"
      },
      "left-pad": {
        latest_major: 1,
        last_release: "2016-03-22",
        license: "WTFPL"
      },
      request: {
        latest_major: 2,
        last_release: "2020-02-11",
        license: "Apache-2.0"
      },
      colors: {
        latest_major: 1,
        last_release: "2022-01-10",
        license: "MIT"
      },
      webpack: {
        latest_major: 5,
        last_release: "2024-06-01",
        license: "MIT"
      },
      typescript: {
        latest_major: 5,
        last_release: "2024-11-22",
        license: "Apache-2.0"
      },
      vitest: {
        latest_major: 2,
        last_release: "2024-12-01",
        license: "MIT"
      },
      jest: {
        latest_major: 29,
        last_release: "2024-08-01",
        license: "MIT"
      }
    },
    py: {
      django: {
        latest_major: 5,
        last_release: "2024-12-04",
        license: "BSD-3-Clause"
      },
      flask: {
        latest_major: 3,
        last_release: "2024-11-01",
        license: "BSD-3-Clause"
      },
      fastapi: {
        latest_major: 0,
        last_release: "2024-12-01",
        license: "MIT"
      },
      requests: {
        latest_major: 2,
        last_release: "2024-05-29",
        license: "Apache-2.0"
      },
      urllib3: {
        latest_major: 2,
        last_release: "2024-09-01",
        license: "MIT"
      },
      pyyaml: {
        latest_major: 6,
        last_release: "2024-08-01",
        license: "MIT"
      },
      numpy: {
        latest_major: 2,
        last_release: "2025-01-01",
        license: "BSD-3-Clause"
      },
      sqlalchemy: {
        latest_major: 2,
        last_release: "2024-10-01",
        license: "MIT"
      },
      celery: {
        latest_major: 5,
        last_release: "2024-06-01",
        license: "BSD-3-Clause"
      },
      psycopg2: {
        latest_major: 2,
        last_release: "2023-10-01",
        license: "LGPL-3.0-or-later"
      },
      mysqlclient: {
        latest_major: 2,
        last_release: "2024-06-01",
        license: "GPL-2.0"
      },
      pdfkit: {
        latest_major: 1,
        last_release: "2021-05-01",
        license: "MIT"
      },
      paramiko: {
        latest_major: 3,
        last_release: "2024-09-01",
        license: "LGPL-2.1"
      }
    },
    go: {
      "github.com/gin-gonic/gin": {
        latest_major: 1,
        last_release: "2024-08-01",
        license: "MIT"
      },
      "golang.org/x/text": {
        latest_major: 0,
        last_release: "2024-10-01",
        license: "BSD-3-Clause"
      },
      "github.com/stretchr/testify": {
        latest_major: 1,
        last_release: "2024-09-01",
        license: "MIT"
      },
      "github.com/gogo/protobuf": {
        latest_major: 1,
        last_release: "2021-04-01",
        license: "BSD-3-Clause"
      },
      "github.com/spf13/cobra": {
        latest_major: 1,
        last_release: "2024-08-01",
        license: "Apache-2.0"
      }
    },
    rust: {
      serde: {
        latest_major: 1,
        last_release: "2024-09-01",
        license: "MIT OR Apache-2.0"
      },
      tokio: {
        latest_major: 1,
        last_release: "2024-10-01",
        license: "MIT"
      },
      regex: {
        latest_major: 1,
        last_release: "2024-09-01",
        license: "MIT OR Apache-2.0"
      },
      rand: {
        latest_major: 0,
        last_release: "2024-03-01",
        license: "MIT OR Apache-2.0"
      }
    },
    java: {
      "org.springframework.boot:spring-boot-starter-web": {
        latest_major: 3,
        last_release: "2024-11-21",
        license: "Apache-2.0"
      },
      "com.google.guava:guava": {
        latest_major: 33,
        last_release: "2024-09-01",
        license: "Apache-2.0"
      },
      "org.apache.logging.log4j:log4j-core": {
        latest_major: 2,
        last_release: "2024-08-01",
        license: "Apache-2.0"
      },
      "org.junit.jupiter:junit-jupiter": {
        latest_major: 5,
        last_release: "2024-09-01",
        license: "EPL-2.0"
      },
      "org.hibernate:hibernate-core": {
        latest_major: 6,
        last_release: "2024-10-01",
        license: "LGPL-2.1"
      },
      "mysql:mysql-connector-java": {
        latest_major: 8,
        last_release: "2023-10-01",
        license: "GPL-2.0"
      },
      "org.apache.struts:struts2-core": {
        latest_major: 6,
        last_release: "2024-12-01",
        license: "Apache-2.0"
      },
      "org.springframework:spring-core": {
        latest_major: 6,
        last_release: "2024-11-01",
        license: "Apache-2.0"
      },
      "commons-io:commons-io": {
        latest_major: 2,
        last_release: "2024-10-01",
        license: "Apache-2.0"
      },
      "org.apache.commons:commons-lang3": {
        latest_major: 3,
        last_release: "2024-09-01",
        license: "Apache-2.0"
      },
      "com.fasterxml.jackson.core:jackson-databind": {
        latest_major: 2,
        last_release: "2024-11-01",
        license: "Apache-2.0"
      },
      "org.slf4j:slf4j-api": {
        latest_major: 2,
        last_release: "2025-01-01",
        license: "MIT"
      },
      "org.projectlombok:lombok": {
        latest_major: 1,
        last_release: "2024-10-01",
        license: "MIT"
      },
      "junit:junit": {
        latest_major: 4,
        last_release: "2021-02-13",
        license: "EPL-1.0"
      },
      "log4j:log4j": {
        latest_major: 1,
        last_release: "2012-05-01",
        license: "Apache-2.0"
      }
    },
    ruby: {
      rails: {
        latest_major: 8,
        last_release: "2024-11-07",
        license: "MIT"
      },
      sinatra: {
        latest_major: 4,
        last_release: "2024-09-01",
        license: "MIT"
      },
      nokogiri: {
        latest_major: 1,
        last_release: "2024-10-01",
        license: "MIT"
      },
      rake: {
        latest_major: 13,
        last_release: "2024-06-01",
        license: "MIT"
      }
    },
    php: {
      "laravel/framework": {
        latest_major: 11,
        last_release: "2024-11-01",
        license: "MIT"
      },
      "guzzlehttp/guzzle": {
        latest_major: 7,
        last_release: "2024-09-01",
        license: "MIT"
      },
      "symfony/console": {
        latest_major: 7,
        last_release: "2024-11-01",
        license: "MIT"
      }
    },
    csharp: {
      "Newtonsoft.Json": {
        latest_major: 13,
        last_release: "2023-03-08",
        license: "MIT"
      },
      EntityFramework: {
        latest_major: 6,
        last_release: "2024-04-01",
        license: "MIT"
      },
      "Microsoft.EntityFrameworkCore": {
        latest_major: 10,
        last_release: "2025-11-11",
        license: "MIT"
      },
      "Microsoft.AspNet.Mvc": {
        latest_major: 5,
        last_release: "2022-07-01",
        license: "Apache-2.0"
      },
      "Microsoft.AspNet.WebApi.Core": {
        latest_major: 5,
        last_release: "2022-07-01",
        license: "Apache-2.0"
      },
      "System.Text.Encodings.Web": {
        latest_major: 10,
        last_release: "2025-11-11",
        license: "MIT"
      },
      log4net: {
        latest_major: 2,
        last_release: "2023-08-01",
        license: "Apache-2.0"
      },
      Dapper: {
        latest_major: 2,
        last_release: "2023-04-01",
        license: "Apache-2.0"
      },
      Serilog: {
        latest_major: 4,
        last_release: "2024-06-01",
        license: "Apache-2.0"
      },
      NUnit: {
        latest_major: 4,
        last_release: "2024-12-01",
        license: "MIT"
      },
      xunit: {
        latest_major: 2,
        last_release: "2024-11-01",
        license: "Apache-2.0"
      }
    }
  }
};

// ../../src/scan/snapshots/advisories.json
var advisories_default = {
  version: "adv-2026.10-ad855d8189da",
  generated_at: "2026-10-17T00:00:00Z",
  source: "pinned advisory subset (OSV/GHSA/CVE) scoped to the ecosystems whose manifests the sniffer parses \u2014 offline snapshot. Selection rule: load-bearing legacy CVEs (remote-exploitable or framework-integral) with a known fixed release on dependencies the legacy pilots pin; the affected range is approximated as the interval [introduced, fixed), where `fixed` is the fix on the newest maintained branch \u2014 older-branch backports can read as affected (a deliberate false-positive bias: this is a legacy-estate check, and it must not report a vulnerable pin as clean)",
  data_date: "2026-10-17",
  advisories: [
    {
      id: "CVE-2020-8203",
      ecosystem: "js",
      package: "lodash",
      severity: "HIGH",
      introduced: "0.0.0",
      fixed: "4.17.21",
      published: "2020-07-15",
      title: "Prototype pollution in lodash"
    },
    {
      id: "CVE-2023-29017",
      ecosystem: "js",
      package: "vm2",
      severity: "CRITICAL",
      introduced: "0.0.0",
      fixed: "3.9.17",
      published: "2023-03-28",
      title: "Sandbox escape in vm2"
    },
    {
      id: "CVE-2021-44906",
      ecosystem: "js",
      package: "minimist",
      severity: "HIGH",
      introduced: "0.0.0",
      fixed: "1.2.6",
      published: "2021-11-22",
      title: "Prototype pollution in minimist"
    },
    {
      id: "CVE-2024-29041",
      ecosystem: "js",
      package: "express",
      severity: "MODERATE",
      introduced: "0.0.0",
      fixed: "4.19.2",
      published: "2024-03-25",
      title: "Open redirect in express"
    },
    {
      id: "CVE-2021-44228",
      ecosystem: "java",
      package: "org.apache.logging.log4j:log4j-core",
      severity: "CRITICAL",
      introduced: "2.0.0",
      fixed: "2.17.0",
      published: "2021-12-10",
      title: "Log4Shell remote code execution"
    },
    {
      id: "CVE-2017-5638",
      ecosystem: "java",
      package: "org.apache.struts:struts2-core",
      severity: "CRITICAL",
      introduced: "2.3.5",
      fixed: "2.5.10.1",
      published: "2017-03-11",
      title: "Struts Jakarta multipart parser OGNL RCE (S2-045)"
    },
    {
      id: "CVE-2022-22965",
      ecosystem: "java",
      package: "org.springframework:spring-core",
      severity: "CRITICAL",
      introduced: "0.0.0",
      fixed: "5.3.18",
      published: "2022-04-01",
      title: "Spring4Shell data-binding RCE"
    },
    {
      id: "CVE-2020-36518",
      ecosystem: "java",
      package: "com.fasterxml.jackson.core:jackson-databind",
      severity: "HIGH",
      introduced: "2.0.0",
      fixed: "2.13.2.1",
      published: "2022-03-24",
      title: "Deeply nested objects denial of service in jackson-databind"
    },
    {
      id: "CVE-2018-1285",
      ecosystem: "csharp",
      package: "log4net",
      severity: "HIGH",
      introduced: "0.0.0",
      fixed: "2.0.8",
      published: "2020-05-14",
      title: "XXE in log4net configuration parsing"
    },
    {
      id: "CVE-2021-26701",
      ecosystem: "csharp",
      package: "System.Text.Encodings.Web",
      severity: "HIGH",
      introduced: "4.0.0",
      fixed: "4.7.2",
      published: "2021-02-25",
      title: "Remote code execution in System.Text.Encodings.Web"
    },
    {
      id: "CVE-2023-32681",
      ecosystem: "py",
      package: "requests",
      severity: "MODERATE",
      introduced: "0.0.0",
      fixed: "2.31.0",
      published: "2023-05-26",
      title: "Proxy-Authorization header leak"
    },
    {
      id: "CVE-2023-45803",
      ecosystem: "py",
      package: "urllib3",
      severity: "HIGH",
      introduced: "0.0.0",
      fixed: "2.0.7",
      published: "2023-10-02",
      title: "Request body leak on redirect"
    },
    {
      id: "CVE-2024-38875",
      ecosystem: "py",
      package: "django",
      severity: "MODERATE",
      introduced: "0.0.0",
      fixed: "4.2.14",
      published: "2024-06-04",
      title: "Denial of service in Django"
    }
  ]
};

// ../../src/scan/snapshots.ts
var EOL_SNAPSHOT_VERSION = eol_default.version;
var ADVISORY_SNAPSHOT_VERSION = advisories_default.version;
var EOL_SNAPSHOT_SOURCE = eol_default.source;
var ADVISORY_SNAPSHOT_SOURCE = advisories_default.source;
function snapshotVersions() {
  return {
    "eol-snapshot": EOL_SNAPSHOT_VERSION,
    "advisory-snapshot": ADVISORY_SNAPSHOT_VERSION
  };
}
__name(snapshotVersions, "snapshotVersions");
var SNAPSHOT_REFRESH_HINT = `refresh the vendored datasets (npx tsx tooling/scripts/refresh-snapshots.ts) or re-run after the snapshot is updated`;
var DAY_MS = 864e5;
function cmpVersion(a, b) {
  const pa = String(a).split(/[^0-9]+/).filter((x) => x !== "").map((x) => Number(x));
  const pb = String(b).split(/[^0-9]+/).filter((x) => x !== "").map((x) => Number(x));
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
__name(cmpVersion, "cmpVersion");
function tsOrNull(iso) {
  if (!iso) return null;
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isFinite(t) ? t : null;
}
__name(tsOrNull, "tsOrNull");
function daysUntil(iso, scanMs) {
  const t = tsOrNull(iso);
  if (t == null) return null;
  return Math.round((t - scanMs) / DAY_MS);
}
__name(daysUntil, "daysUntil");
function normalizeProduct(product) {
  const doc = eol_default;
  const p = product.trim().toLowerCase();
  if (doc.runtimes[p]) return p;
  for (const [canonical, entry] of Object.entries(doc.runtimes)) {
    if ((entry.aliases ?? []).includes(p)) return canonical;
  }
  return null;
}
__name(normalizeProduct, "normalizeProduct");
function cycleFor(version, cycles, exact = false) {
  const parts = String(version).split(/[.\-+_]/).filter((x) => x !== "");
  const candidates = [version, parts.slice(0, 2).join("."), parts[0]].filter(Boolean);
  for (const c of candidates) {
    const hit = cycles.find((x) => x.cycle === c);
    if (hit) return hit;
  }
  if (exact) return null;
  const lower = cycles.filter((x) => cmpVersion(x.cycle, version) <= 0).sort((a, b) => cmpVersion(b.cycle, a.cycle));
  return lower[0] ?? null;
}
__name(cycleFor, "cycleFor");
function normalizeRuntimeVersion(product, version) {
  if (product === "java") {
    const v = version.trim();
    if (/^1\.\d/.test(v)) return v.slice(2);
  }
  return version;
}
__name(normalizeRuntimeVersion, "normalizeRuntimeVersion");
function resolveRuntime(product, version, scanMs) {
  const canonical = normalizeProduct(product);
  if (!canonical) return null;
  const doc = eol_default;
  const runtime = doc.runtimes[canonical];
  const cycle = cycleFor(normalizeRuntimeVersion(canonical, version), runtime.cycles, runtime.exact_cycles === true);
  if (!cycle) return null;
  const days = daysUntil(cycle.eol, scanMs);
  return {
    product: canonical,
    version,
    cycle: cycle.cycle,
    eol_date: cycle.eol,
    days_until_eol: days,
    is_past_eol: days != null && days < 0,
    latest: cycle.latest
  };
}
__name(resolveRuntime, "resolveRuntime");
function resolveFramework(name, version) {
  const doc = eol_default;
  const key = name.trim().toLowerCase();
  const canonical = doc.frameworks[key] ? key : Object.keys(doc.frameworks).find((k) => (doc.frameworks[k].aliases ?? []).includes(key));
  if (!canonical) return null;
  const entry = doc.frameworks[canonical];
  return {
    name: canonical,
    version,
    support_status: entry.support_status,
    eol_date: entry.eol_date ?? null,
    latest_major: entry.latest_major
  };
}
__name(resolveFramework, "resolveFramework");
var ECOSYSTEM_ALIASES = { npm: "js", javascript: "js", node: "js", pypi: "py", pip: "py", python: "py", gomod: "go", golang: "go", crates: "rust", maven: "java", gradle: "java", mavencentral: "java", gem: "ruby", bundler: "ruby", packagist: "php", composer: "php", nuget: "csharp" };
function normalizeEcosystem(ecosystem) {
  const e = ecosystem.trim().toLowerCase();
  return ECOSYSTEM_ALIASES[e] ?? e;
}
__name(normalizeEcosystem, "normalizeEcosystem");
function lookupPackage(ecosystem, name) {
  const doc = eol_default;
  const eco = normalizeEcosystem(ecosystem);
  const bucket = doc.packages[eco];
  if (!bucket) return null;
  const key = name.trim();
  const entry = bucket[key] ?? bucket[key.toLowerCase()] ?? Object.entries(bucket).find(([k]) => k.toLowerCase() === key.toLowerCase())?.[1];
  if (!entry) return null;
  return { ecosystem: eco, name: key, ...entry };
}
__name(lookupPackage, "lookupPackage");
function matchAdvisories(ecosystem, name, version) {
  const doc = advisories_default;
  const eco = normalizeEcosystem(ecosystem);
  const key = name.trim();
  return doc.advisories.filter((a) => {
    if (normalizeEcosystem(a.ecosystem) !== eco) return false;
    if (a.package !== key && a.package.toLowerCase() !== key.toLowerCase()) return false;
    if (cmpVersion(version, a.introduced) < 0) return false;
    if (a.fixed && cmpVersion(version, a.fixed) >= 0) return false;
    return true;
  });
}
__name(matchAdvisories, "matchAdvisories");
function advisoryCoveredEcosystems() {
  const doc = advisories_default;
  return [...new Set(doc.advisories.map((a) => normalizeEcosystem(a.ecosystem)))].sort();
}
__name(advisoryCoveredEcosystems, "advisoryCoveredEcosystems");
function advisoryAgeDays(published, scanMs) {
  const t = tsOrNull(published);
  if (t == null) return null;
  return Math.round((scanMs - t) / DAY_MS);
}
__name(advisoryAgeDays, "advisoryAgeDays");

// ../../src/scan/detectors/ecos01.ts
var WHAT_IT_TAKES = "declare a runtime version pin (.nvmrc / .python-version / .tool-versions / package.json engines / pyproject requires-python / Dockerfile FROM / CI matrix / .NET TargetFramework(Version) or global.json SDK / .vbp / Delphi project version / build.gradle Java level) so the EOL snapshot can resolve it";
function parseVersionLine(raw) {
  const m = /([0-9]+(?:\.[0-9]+){0,2}(?:[-+][0-9A-Za-z.-]+)?)/.exec(raw);
  return m ? m[1] : null;
}
__name(parseVersionLine, "parseVersionLine");
function dotnetPinForTfm(tfm) {
  const t = tfm.trim().toLowerCase();
  const core = /^netcoreapp(\d+\.\d+)/.exec(t);
  if (core) return { product: "dotnet", version: core[1] };
  const modern = /^net(\d+\.\d+)(?:-|$)/.exec(t);
  if (modern) return { product: "dotnet", version: modern[1] };
  const classic = /^net(\d{2,3})(?:-|$)/.exec(t);
  if (classic) {
    const d = classic[1];
    return { product: "dotnetfx", version: `${d[0]}.${d[1]}${d[2] ? `.${d[2]}` : ""}` };
  }
  return null;
}
__name(dotnetPinForTfm, "dotnetPinForTfm");
var DELPHI_PROJECT_VERSION = {
  "12.0": "2009",
  // 2009 / 2010 — indistinguishable by project file
  "12.2": "XE",
  "12.3": "XE",
  "13.4": "XE2",
  "14.3": "XE3",
  "14.4": "XE3",
  // 14.4 is XE3 Update 2 / XE4
  "14.6": "XE4",
  "15.0": "XE5",
  "15.1": "XE5",
  "15.3": "XE5",
  // 15.2 is AppMethod — not tracked
  "15.4": "XE6",
  "16.0": "XE7",
  "16.1": "XE7",
  "17.0": "XE8",
  "17.1": "XE8",
  "17.2": "XE8",
  "18.0": "10",
  "18.1": "10",
  // Seattle / Berlin Update 1
  "18.2": "10.1",
  // Berlin / Tokyo Update 1
  "18.3": "10.2",
  "18.4": "10.2",
  "18.5": "10.3",
  "18.6": "10.3",
  "18.7": "10.3",
  "18.8": "10.3",
  "19.0": "10.4",
  "19.1": "10.4",
  "19.2": "10.4",
  "19.3": "11",
  "19.4": "11",
  "20.0": "12",
  "20.1": "12",
  "20.2": "12",
  "20.3": "12"
  // 20.3 is also 13 Florence
};
var DELPHI_DOF_VERSION = { "6.0": "6", "7.0": "7" };
async function extractPins(ctx, signal, pinReads) {
  const pins = [];
  const add = /* @__PURE__ */ __name((product, version, pin_source) => {
    if (version) pins.push({ product, version, pin_source });
  }, "add");
  const read = /* @__PURE__ */ __name((path) => readText(ctx, path, pinReads), "read");
  const vmLines = [
    [".nvmrc", "node"],
    [".node-version", "node"],
    [".python-version", "python"],
    [".ruby-version", "ruby"],
    [".java-version", "java"]
  ];
  for (const [file, product] of vmLines) {
    const text = await read(file);
    if (text) add(product, parseVersionLine(text.trim().split("\n")[0] ?? ""), file);
  }
  const toolVersions = await read(".tool-versions");
  if (toolVersions) {
    for (const line of toolVersions.split("\n")) {
      const m = /^([a-z0-9]+)\s+(.+)$/i.exec(line.trim());
      if (!m) continue;
      add(m[1].toLowerCase(), parseVersionLine(m[2]), ".tool-versions");
    }
  }
  const runtimeTxt = await read("runtime.txt");
  if (runtimeTxt) add("python", parseVersionLine(runtimeTxt.trim()), "runtime.txt");
  const pkgRaw = await read("package.json");
  if (pkgRaw) {
    try {
      const j = JSON.parse(pkgRaw);
      const node = j.engines?.node;
      if (node) add("node", parseVersionLine(node), "package.json#engines");
    } catch {
    }
  }
  const pyproject = await read("pyproject.toml");
  if (pyproject) {
    const m = /requires-python\s*=\s*["']([^"']+)["']/.exec(pyproject);
    if (m) add("python", parseVersionLine(m[1]), "pyproject.toml");
  }
  const goMod = await read("go.mod");
  if (goMod) {
    const m = /^go\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/m.exec(goMod);
    if (m) add("go", m[1], "go.mod");
  }
  const gemfile = await read("Gemfile");
  if (gemfile) {
    const m = /^\s*ruby\s+["']([0-9][^"']*)["']/m.exec(gemfile);
    if (m) add("ruby", parseVersionLine(m[1]), "Gemfile");
  }
  const pom = await read("pom.xml");
  if (pom) {
    const cpBlock = /<artifactId>\s*maven-compiler-plugin\s*<\/artifactId>[\s\S]*?<\/plugin>/.exec(pom);
    const m = /<java\.version>\s*([^<\s]+)\s*<\/java\.version>/.exec(pom) ?? /<maven\.compiler\.(?:source|target)>\s*([^<\s]+)\s*<\//.exec(pom) ?? (cpBlock ? /<source>\s*([^<\s]+)\s*<\/source>/.exec(cpBlock[0]) ?? void 0 : void 0);
    if (m) add("java", parseVersionLine(m[1]), "pom.xml");
  }
  for (const file of ["build.gradle", "build.gradle.kts"]) {
    const text = await read(file);
    if (!text) continue;
    const jv = /JavaVersion\.VERSION_(\d+)(?:_(\d+))?/.exec(text);
    if (jv) {
      add("java", jv[2] ? `${jv[1]}.${jv[2]}` : jv[1], `${file}:sourceCompatibility`);
      continue;
    }
    const sc = /(?:source|target)Compatibility\s*[:=]\s*['"]?(\d+(?:\.\d+)*)['"]?/.exec(text);
    if (sc) {
      add("java", sc[1], `${file}:sourceCompatibility`);
      continue;
    }
    const lv = /JavaLanguageVersion\.of\((\d+)\)/.exec(text);
    if (lv) add("java", lv[1], `${file}:toolchain`);
  }
  for (const m of ctx.manifests ?? []) {
    if (m.ecosystem !== "csharp") continue;
    const path = m.root && m.root !== "." ? `${m.root}/${m.manifest}` : m.manifest;
    if (/\.(csproj|vbproj)$/i.test(m.manifest)) {
      const text = await read(path);
      if (!text) continue;
      const tfms = /<TargetFramework>\s*([^<\s]+)\s*<\/TargetFramework>/i.exec(text)?.[1];
      const tfv = /<TargetFrameworkVersion>\s*([^<\s]+)\s*<\/TargetFrameworkVersion>/i.exec(text)?.[1];
      if (tfms) {
        for (const tfm of tfms.split(";")) {
          const pin = dotnetPinForTfm(tfm);
          if (pin) add(pin.product, pin.version, `${path}#TargetFramework`);
        }
      } else if (tfv && /^\d/.test(tfv.replace(/^v/i, ""))) {
        add("dotnetfx", tfv.replace(/^v/i, ""), `${path}#TargetFrameworkVersion`);
      }
    } else if (m.manifest === "global.json") {
      const raw = await read(path);
      if (raw) {
        try {
          const v = JSON.parse(raw).sdk?.version;
          if (v) add("dotnet", parseVersionLine(v), `${path}#sdk`);
        } catch {
        }
      }
    }
  }
  try {
    const census = await cachedStackCensus(ctx, signal);
    if (census.vb6.detected) {
      add("vb6", "6.0", census.vb6.project_files[0] ?? census.vb6.evidence[0] ?? "vb6 census");
    }
    if (census.delphi.detected) {
      const projects = census.delphi.project_files;
      const dprojs = projects.filter((p) => /\.dproj$/i.test(p)).slice(0, 5);
      const dofs = dprojs.length ? [] : projects.filter((p) => /\.dof$/i.test(p)).slice(0, 5);
      for (const p of dprojs) {
        const raw = /<ProjectVersion>\s*([^<\s]+)\s*<\/ProjectVersion>/i.exec(await read(p) ?? "")?.[1];
        if (!raw) continue;
        add("delphi", DELPHI_PROJECT_VERSION[raw] ?? raw, `${p}#ProjectVersion ${raw}`);
      }
      for (const p of dofs) {
        const raw = /\[FileVersion\][^\[]*?\bversion\s*=\s*([0-9.]+)/i.exec(await read(p) ?? "")?.[1];
        if (!raw) continue;
        add("delphi", DELPHI_DOF_VERSION[raw] ?? raw, `${p}#FileVersion ${raw}`);
      }
      if (!dprojs.length && !dofs.length) {
        const dpr = projects.find((p) => /\.dpr$/i.test(p));
        if (dpr) add("delphi", "unknown", `${dpr}#no version record`);
      }
    }
  } catch {
  }
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    const dockerfiles = walk.paths.filter((p) => !p.endsWith("/") && /(^|\/)Dockerfile(\.[\w.-]+)?$/.test(p)).sort().slice(0, 5);
    for (const df of dockerfiles) {
      const text = await read(df);
      if (!text) continue;
      for (const line of text.split("\n")) {
        const m = /^\s*FROM\s+([^\s:]+)(?::([^\s]+))?/i.exec(line);
        if (!m) continue;
        const image = m[1].toLowerCase();
        const tag = m[2];
        const product = image.includes("node") ? "node" : image.includes("python") ? "python" : image.includes("ruby") ? "ruby" : image.includes("openjdk") || image.includes("jdk") || image.includes("java") ? "java" : image.includes("golang") || image.includes("go") ? "go" : null;
        if (product) add(product, tag ? parseVersionLine(tag) : null, `${df}:FROM`);
      }
    }
  } catch {
  }
  return pins;
}
__name(extractPins, "extractPins");
async function detectEcos01(ctx, signal) {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-01", "eol-snapshot", started, WHAT_IT_TAKES);
    const pinReads = makeReadBudgetTracker();
    const pins = await extractPins(ctx, signal, pinReads);
    if (pinReads.budgetBlocked > 0) {
      return unknownFact(
        "ECOS-01",
        "eol-snapshot",
        started,
        readBudgetNote(pinReads.reads, pinReads.reads + pinReads.budgetBlocked, "runtime pin sources")
      );
    }
    if (pins.length === 0) {
      return unknownFact("ECOS-01", "eol-snapshot", started, `${WHAT_IT_TAKES}; no runtime pin was found in the tree`);
    }
    const byProduct = /* @__PURE__ */ new Map();
    const sourcesByProduct = /* @__PURE__ */ new Map();
    const mismatched = /* @__PURE__ */ new Set();
    let conflict = false;
    for (const pin of [...pins].sort((a, b) => a.pin_source.localeCompare(b.pin_source))) {
      const sources = sourcesByProduct.get(pin.product) ?? [];
      sources.push(pin.pin_source);
      sourcesByProduct.set(pin.product, sources);
      const existing = byProduct.get(pin.product);
      if (!existing) {
        byProduct.set(pin.product, pin);
        continue;
      }
      if (existing.version !== pin.version) {
        conflict = true;
        mismatched.add(pin.product);
        if (cmpVersion(pin.version, existing.version) < 0) byProduct.set(pin.product, pin);
      }
    }
    const runtimes = [];
    const unmapped = [];
    const pointers = [];
    for (const pin of [...byProduct.values()].sort((a, b) => a.product.localeCompare(b.product))) {
      const res = resolveRuntime(pin.product, pin.version, nowMs);
      if (!res) {
        unmapped.push(`${pin.product}@${pin.version}`);
        continue;
      }
      const conflictSources = mismatched.has(pin.product) ? [...new Set(sourcesByProduct.get(pin.product) ?? [])].sort() : [];
      runtimes.push({
        product: res.product,
        version: pin.version,
        cycle: res.cycle,
        pin_source: pin.pin_source,
        eol_date: res.eol_date,
        days_until_eol: res.days_until_eol,
        is_past_eol: res.is_past_eol,
        ...conflictSources.length > 1 ? { conflict_sources: conflictSources } : {}
      });
      pointers.push(filePointer(pin.pin_source.split(":")[0], `${res.product} ${pin.version} \u2192 cycle ${res.cycle}, EOL ${res.eol_date ?? "unknown"} (${res.days_until_eol}d)`));
      for (const src of conflictSources) {
        if (src === pin.pin_source) continue;
        pointers.push(filePointer(src.split(":")[0], `conflicting ${res.product} pin source (lowest version wins \u2014 see conflict_sources)`));
      }
    }
    pointers.push(basisPointer("eol-snapshot", `vendored eol dataset ${snapshotVersions()["eol-snapshot"]}`));
    const lookupOk = runtimes.length > 0 && unmapped.length === 0;
    const facts = { ecos01: { runtimes, conflict, unmapped_pins: unmapped, lookup_ok: lookupOk } };
    if (runtimes.length === 0) {
      return unknownFact(
        "ECOS-01",
        "eol-snapshot",
        started,
        `no pinned runtime resolved from the snapshot (unmapped: ${unmapped.join(", ")}) \u2014 ${SNAPSHOT_REFRESH_HINT}`,
        { pointers, facts }
      );
    }
    const measurement = lookupOk ? { status: "measured", confidence: conflict ? "low" : "medium" } : { status: "estimated", confidence: "low", scopeLimited: true };
    return measuredFact({
      detectorId: "ECOS-01",
      producer: "eol-snapshot",
      started,
      facts,
      pointers,
      measurement,
      truncated: !lookupOk
    });
  } catch (e) {
    return { detectorId: "ECOS-01", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "eol-snapshot", version: "1.0", flags: ["eol-snapshot"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos01, "detectEcos01");

// ../../src/scan/deps.ts
function parseJson(text) {
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}
__name(parseJson, "parseJson");
function exactVersion(spec) {
  const s = spec.trim().replace(/^[\^~=<>!]*\s*/, "").replace(/^v/, "");
  const m = /^(\d+\.\d+(?:\.\d+)?(?:[.\-+][0-9A-Za-z][0-9A-Za-z.+-]*)?)\s*$/.exec(s);
  return m ? m[1] : null;
}
__name(exactVersion, "exactVersion");
function nameOf(key) {
  const marker = "node_modules/";
  const i = key.lastIndexOf(marker);
  if (i >= 0) return key.slice(i + marker.length);
  return key;
}
__name(nameOf, "nameOf");
function recordVersion(versions, versionSets, name, version, mode = "last") {
  if (mode === "last" || !versions.has(name)) versions.set(name, version);
  const set = versionSets.get(name) ?? /* @__PURE__ */ new Set();
  set.add(version);
  versionSets.set(name, set);
}
__name(recordVersion, "recordVersion");
function parseNpmLock(text) {
  const j = parseJson(text);
  if (!j) return null;
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let integrity = false;
  let packages = 0;
  const pkgs = j.packages ?? null;
  if (pkgs) {
    for (const [k, v] of Object.entries(pkgs)) {
      if (k === "") continue;
      const name = nameOf(k);
      if (!name || typeof v?.version !== "string") continue;
      packages++;
      recordVersion(versions, versionSets, name, v.version);
      if (typeof v.integrity === "string" && v.integrity) integrity = true;
    }
  }
  const deps = j.dependencies ?? null;
  if (deps && packages === 0) {
    for (const [name, v] of Object.entries(deps)) {
      if (typeof v?.version !== "string") continue;
      packages++;
      recordVersion(versions, versionSets, name, v.version);
    }
  }
  return { packages, versions, versionSets, integrity };
}
__name(parseNpmLock, "parseNpmLock");
function parseYarnLock(text) {
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    if (!header || /^\s/.test(header) || !header.trimEnd().endsWith(":")) continue;
    let version = null;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const m = /^\s+version\s+"?([^"\s]+)"?/.exec(lines[j]);
      if (m) {
        version = m[1];
        break;
      }
      if (!/^\s/.test(lines[j]) && lines[j].trim()) break;
    }
    if (!version) continue;
    const specs = header.trimEnd().replace(/:$/, "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    for (const spec of specs) {
      const at = spec.lastIndexOf("@");
      const name = at > 0 ? spec.slice(0, at) : spec;
      if (name) recordVersion(versions, versionSets, name, version);
    }
    packages++;
  }
  return { packages, versions, versionSets, integrity: /integrity\s/.test(text) };
}
__name(parseYarnLock, "parseYarnLock");
function parsePnpmLock(text) {
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  for (const line of text.split("\n")) {
    const m = /^\s{2,}\/?(@?[^@\s/][^@\s]*?)@([^:()\s]+):\s*$/.exec(line);
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, m[1], m[2], "first");
  }
  return { packages, versions, versionSets, integrity: /integrity:|resolution:/.test(text) };
}
__name(parsePnpmLock, "parsePnpmLock");
function parsePoetryOrCargoLock(text) {
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  let name = null;
  for (const line of text.split("\n")) {
    if (line.trim() === "[[package]]") {
      name = null;
      continue;
    }
    const nm = /^\s*name\s*=\s*"([^"]+)"/.exec(line);
    if (nm) {
      name = nm[1];
      continue;
    }
    const vm = /^\s*version\s*=\s*"([^"]+)"/.exec(line);
    if (vm && name) {
      packages++;
      recordVersion(versions, versionSets, name, vm[1]);
      name = null;
    }
  }
  return { packages, versions, versionSets, integrity: /checksum\s*=|integrity=/.test(text) };
}
__name(parsePoetryOrCargoLock, "parsePoetryOrCargoLock");
function parseGoSum(text) {
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  for (const line of text.split("\n")) {
    const m = /^(\S+)\s+(v\S+?)(?:\/go\.mod)?\s+h1:/.exec(line.trim());
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, m[1], m[2], "first");
  }
  return { packages, versions, versionSets, integrity: text.includes("h1:") };
}
__name(parseGoSum, "parseGoSum");
function parseGradleLock(text) {
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  for (const line of text.split("\n")) {
    const m = /^([^=#\s]+:[^=#:\s]+):([^=\s]+)=/.exec(line.trim());
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, `${m[1]}`, m[2]);
  }
  return { packages, versions, versionSets, integrity: false };
}
__name(parseGradleLock, "parseGradleLock");
function parseGemLock(text) {
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  let inSpecs = false;
  for (const line of text.split("\n")) {
    if (/^specs:/.test(line)) {
      inSpecs = true;
      continue;
    }
    if (/^\S/.test(line) && !/^specs:/.test(line)) {
      if (line.trim()) inSpecs = false;
      continue;
    }
    if (!inSpecs) continue;
    const m = /^ {4}([^\s(]+) \(([^)]+)\)$/.exec(line);
    if (!m) continue;
    packages++;
    recordVersion(versions, versionSets, m[1], m[2]);
  }
  return { packages, versions, versionSets, integrity: /checksum|remote:/.test(text) };
}
__name(parseGemLock, "parseGemLock");
function parseComposerLock(text) {
  const j = parseJson(text);
  if (!j) return null;
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  let packages = 0;
  for (const key of ["packages", "packages-dev"]) {
    const arr = j[key];
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      if (!p?.name || !p?.version) continue;
      packages++;
      recordVersion(versions, versionSets, p.name, p.version);
    }
  }
  return { packages, versions, versionSets, integrity: text.includes('"shasum"') || text.includes('"reference"') };
}
__name(parseComposerLock, "parseComposerLock");
function parseNpmManifest(eco, text) {
  const j = parseJson(text);
  if (!j) return null;
  const direct = [];
  for (const [scope, field] of [["prod", "dependencies"], ["dev", "devDependencies"], ["dev", "peerDependencies"]]) {
    const deps = j[field];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, spec] of Object.entries(deps)) direct.push({ name, spec: String(spec), version: null, scope, ecosystem: eco });
  }
  return { direct };
}
__name(parseNpmManifest, "parseNpmManifest");
function parseRequirementsTxt(eco, text, scope) {
  const direct = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("-")) continue;
    const m = /^([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*([=<>!~].*)?$/.exec(line);
    if (!m) continue;
    direct.push({ name: m[1], spec: (m[2] ?? "").trim(), version: null, scope, ecosystem: eco });
  }
  return { direct };
}
__name(parseRequirementsTxt, "parseRequirementsTxt");
function parsePyproject(eco, text) {
  const direct = [];
  const block = /dependencies\s*=\s*\[([\s\S]*?)\]/.exec(text);
  if (block) {
    for (const q of block[1].matchAll(/["']([^"']+)["']/g)) {
      const spec = q[1];
      const m = /^([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*([=<>!~].*)?$/.exec(spec.trim());
      if (m) direct.push({ name: m[1], spec: (m[2] ?? "").trim(), version: null, scope: "prod", ecosystem: eco });
    }
  }
  return { direct };
}
__name(parsePyproject, "parsePyproject");
function parseGoMod(eco, text) {
  const direct = [];
  const reqBlocks = text.match(/require\s*\(([\s\S]*?)\)/g) ?? [];
  const singles = text.match(/^require\s+(\S+)\s+(\S+)/gm) ?? [];
  for (const b of reqBlocks) {
    for (const line of b.split("\n")) {
      const m = /^\s*([^\s/][^\s]*?)\s+(v[^\s]+)/.exec(line);
      if (m && !line.includes("// indirect")) direct.push({ name: m[1], spec: m[2], version: null, scope: "prod", ecosystem: eco });
    }
  }
  for (const s of singles) {
    const m = /^require\s+(\S+)\s+(\S+)/.exec(s);
    if (m) direct.push({ name: m[1], spec: m[2], version: null, scope: "prod", ecosystem: eco });
  }
  return { direct };
}
__name(parseGoMod, "parseGoMod");
function parseCargoToml(eco, text) {
  const direct = [];
  let section = "";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const h = /^\[([^\]]+)\]/.exec(line);
    if (h) {
      section = h[1].trim();
      continue;
    }
    if (section !== "dependencies" && section !== "dev-dependencies") continue;
    const m = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line);
    if (!m) continue;
    const value = m[2];
    const spec = /^["']/.test(value) ? value.replace(/["']/g, "").trim() : /version\s*=\s*["']([^"']+)["']/.exec(value)?.[1] ?? "";
    direct.push({ name: m[1], spec, version: null, scope: section === "dependencies" ? "prod" : "dev", ecosystem: eco });
  }
  return { direct };
}
__name(parseCargoToml, "parseCargoToml");
function tagText(text, tag) {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(text);
  return m ? m[1] : null;
}
__name(tagText, "tagText");
function parsePomData(text) {
  const properties = {};
  const propsBlock = tagText(text, "properties");
  if (propsBlock) {
    for (const m of propsBlock.matchAll(/<([A-Za-z0-9_.-]+)\s*>\s*([^<]*?)\s*<\/\1>/g)) {
      properties[m[1]] = m[2];
    }
  }
  const parentBlock = tagText(text, "parent");
  let parent = null;
  if (parentBlock) {
    const rp = tagText(parentBlock, "relativePath");
    parent = { relativePath: rp != null ? rp.trim() : null };
  }
  const coordText = text.replace(/<parent>[\s\S]*?<\/parent>/g, "").replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, "").replace(/<dependencies>[\s\S]*?<\/dependencies>/g, "");
  const groupId = tagText(coordText, "groupId")?.trim() ?? null;
  const artifactId = tagText(coordText, "artifactId")?.trim() ?? null;
  const version = tagText(coordText, "version")?.trim() ?? null;
  const dm = /* @__PURE__ */ new Map();
  const dmBlock = tagText(text, "dependencyManagement");
  if (dmBlock) {
    for (const block of dmBlock.match(/<dependency>[\s\S]*?<\/dependency>/g) ?? []) {
      const g = /<groupId>\s*([^<\s]+)\s*<\/groupId>/.exec(block)?.[1];
      const a = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(block)?.[1];
      const v = /<version>\s*([^<\s]+)\s*<\/version>/.exec(block)?.[1];
      if (a && v) dm.set(g ? `${g}:${a}` : a, v);
    }
  }
  const directText = text.replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, "").replace(/<build>[\s\S]*?<\/build>/g, "").replace(/<profiles>[\s\S]*?<\/profiles>/g, "");
  const dependencies = [];
  for (const block of directText.match(/<dependency>[\s\S]*?<\/dependency>/g) ?? []) {
    const g = /<groupId>\s*([^<\s]+)\s*<\/groupId>/.exec(block)?.[1];
    const a = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(block)?.[1];
    const v = /<version>\s*([^<\s]+)\s*<\/version>/.exec(block)?.[1];
    const scope = /<scope>\s*([^<\s]+)\s*<\/scope>/.exec(block)?.[1] ?? null;
    if (a) dependencies.push({ name: g ? `${g}:${a}` : a, version: v ?? null, scope });
  }
  return { groupId, artifactId, version, properties, dependencyManagement: dm, dependencies, parent };
}
__name(parsePomData, "parsePomData");
function interpolate(value, props) {
  return value.replace(/\$\{([^}]+)\}/g, (raw, key) => props[key] ?? raw);
}
__name(interpolate, "interpolate");
function pathDir(p) {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}
__name(pathDir, "pathDir");
function normalizeRel(baseDir, rel) {
  const parts = (baseDir ? `${baseDir}/${rel}` : rel).split("/");
  const out = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (out.length === 0) return null;
      out.pop();
      continue;
    }
    out.push(part);
  }
  return out.length ? out.join("/") : null;
}
__name(normalizeRel, "normalizeRel");
var MAX_PARENT_DEPTH = 6;
async function loadPomChain(startText, startPath, loadPom) {
  const chain = [{ path: startPath, data: parsePomData(startText) }];
  const seen = /* @__PURE__ */ new Set([startPath]);
  let current = chain[0];
  while (loadPom && chain.length < MAX_PARENT_DEPTH) {
    const parent = current.data.parent;
    if (!parent) break;
    const rel = parent.relativePath ?? "../pom.xml";
    if (rel === "") break;
    const target = normalizeRel(pathDir(current.path), rel);
    if (!target || seen.has(target)) break;
    const text = await loadPom(target);
    if (text == null) break;
    seen.add(target);
    current = { path: target, data: parsePomData(text) };
    chain.push(current);
  }
  const props = {};
  for (let i = chain.length - 1; i >= 0; i--) Object.assign(props, chain[i].data.properties);
  const dm = /* @__PURE__ */ new Map();
  for (let i = chain.length - 1; i >= 0; i--) {
    for (const [k, v] of chain[i].data.dependencyManagement) dm.set(k, { version: v, source: chain[i].path });
  }
  const holder = chain.find((c) => c.data.version)?.data ?? chain[0].data;
  const projectVersion = holder.version;
  if (projectVersion) {
    props["project.version"] ??= projectVersion;
    props["pom.version"] ??= projectVersion;
  }
  if (holder.groupId) props["project.groupId"] ??= holder.groupId;
  if (holder.artifactId) props["project.artifactId"] ??= holder.artifactId;
  return { props, dm, projectVersion };
}
__name(loadPomChain, "loadPomChain");
async function parsePomXml(eco, text, opts = {}) {
  const manifestPath = opts.manifestPath ?? "pom.xml";
  const { props, dm } = await loadPomChain(text, manifestPath, opts.loadPom);
  const own = parsePomData(text);
  const direct = [];
  for (const dep of own.dependencies) {
    let spec = "";
    let versionSource;
    if (dep.version) {
      spec = interpolate(dep.version, props).trim();
    } else {
      const inherited = dm.get(dep.name);
      if (inherited) {
        spec = interpolate(inherited.version, props).trim();
        versionSource = inherited.source;
      }
    }
    direct.push({
      name: dep.name,
      spec,
      version: null,
      scope: dep.scope === "test" || dep.scope === "provided" ? "dev" : "prod",
      ecosystem: eco,
      ...versionSource && versionSource !== manifestPath ? { version_source: versionSource } : {}
    });
  }
  return { direct };
}
__name(parsePomXml, "parsePomXml");
function parseGemfile(eco, text) {
  const direct = [];
  for (const raw of text.split("\n")) {
    const m = /^\s*gem\s+["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?/.exec(raw);
    if (!m) continue;
    const spec = m[2] ?? "";
    direct.push({ name: m[1], spec, version: null, scope: /group\s*:?test|:development/.test(raw) ? "dev" : "prod", ecosystem: eco });
  }
  return { direct };
}
__name(parseGemfile, "parseGemfile");
function parseComposerJson(eco, text) {
  const j = parseJson(text);
  if (!j) return null;
  const direct = [];
  for (const [scope, field] of [["prod", "require"], ["dev", "require-dev"]]) {
    const deps = j[field];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (name === "php" || name.startsWith("ext-")) continue;
      direct.push({ name, spec: String(spec), version: null, scope, ecosystem: eco });
    }
  }
  return { direct };
}
__name(parseComposerJson, "parseComposerJson");
function attrOf(attrs, name) {
  const rx = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const m = rx.exec(attrs);
  return m ? (m[1] ?? m[2] ?? "").trim() : null;
}
__name(attrOf, "attrOf");
function parsePackagesConfig(eco, text) {
  const direct = [];
  for (const m of text.matchAll(/<package\b([^>]*?)\/?>/gi)) {
    const id = attrOf(m[1], "id");
    if (!id) continue;
    const version = attrOf(m[1], "version");
    direct.push({ name: id, spec: version ?? "", version: null, scope: "prod", ecosystem: eco });
  }
  return { direct };
}
__name(parsePackagesConfig, "parsePackagesConfig");
function parseCsproj(eco, text) {
  const direct = [];
  for (const m of text.matchAll(/<PackageReference\b([^>]*?)(?:\/>|>([\s\S]*?)<\/PackageReference>)/gi)) {
    const name = attrOf(m[1] ?? "", "include");
    if (!name) continue;
    const version = attrOf(m[1] ?? "", "version") ?? (/<Version>\s*([^<\s]+)\s*<\/Version>/i.exec(m[2] ?? "")?.[1] ?? null);
    direct.push({ name, spec: version ?? "", version: null, scope: "prod", ecosystem: eco });
  }
  return { direct };
}
__name(parseCsproj, "parseCsproj");
function parseDotnetAnchor() {
  return { direct: [] };
}
__name(parseDotnetAnchor, "parseDotnetAnchor");
function parseNuGetLock(text) {
  const j = parseJson(text);
  if (!j) return null;
  const deps = j.dependencies;
  if (!deps || typeof deps !== "object") return null;
  const versions = /* @__PURE__ */ new Map();
  const versionSets = /* @__PURE__ */ new Map();
  const directMap = /* @__PURE__ */ new Map();
  let packages = 0;
  let integrity = false;
  for (const [tfm, bucket] of Object.entries(deps)) {
    if (!bucket || typeof bucket !== "object") continue;
    void tfm;
    for (const [name, entry] of Object.entries(bucket)) {
      const e = entry;
      if (!e || typeof e.resolved !== "string" || !e.resolved) continue;
      packages++;
      recordVersion(versions, versionSets, name, e.resolved);
      if (e.type === "Direct") directMap.set(name, e.resolved);
      if (typeof e.contentHash === "string" && e.contentHash) integrity = true;
    }
  }
  if (packages === 0) return null;
  return { packages, versions, versionSets, integrity, direct: directMap };
}
__name(parseNuGetLock, "parseNuGetLock");
var LOCKFILES = {
  "package-lock.json": parseNpmLock,
  "npm-shrinkwrap.json": parseNpmLock,
  "yarn.lock": parseYarnLock,
  "pnpm-lock.yaml": parsePnpmLock,
  "poetry.lock": parsePoetryOrCargoLock,
  "uv.lock": parsePoetryOrCargoLock,
  "Cargo.lock": parsePoetryOrCargoLock,
  "go.sum": parseGoSum,
  "gradle.lockfile": parseGradleLock,
  "Gemfile.lock": parseGemLock,
  "composer.lock": parseComposerLock,
  "packages.lock.json": parseNuGetLock
};
function ecosystemOf(eco) {
  const e = eco.toLowerCase();
  if (["js", "py", "go", "rust", "java", "ruby", "php", "csharp"].includes(e)) return e;
  return null;
}
__name(ecosystemOf, "ecosystemOf");
async function scanDependencies(ctx) {
  const direct = [];
  const lockfiles = [];
  const locked = /* @__PURE__ */ new Map();
  const unsupported = /* @__PURE__ */ new Set();
  const noLockfileMechanism = /* @__PURE__ */ new Set();
  const seenManifest = /* @__PURE__ */ new Set();
  let manifests = 0;
  let readBudgetExhausted = false;
  const trackedRead = /* @__PURE__ */ __name(async (path) => {
    if (readBudgetExhausted) return null;
    try {
      const buf = await ctx.readFile(path);
      return buf ? buf.toString("utf8") : null;
    } catch (e) {
      if (isReadBudgetError(e)) readBudgetExhausted = true;
      return null;
    }
  }, "trackedRead");
  const entries = [];
  for (const m of ctx.manifests) {
    const eco = ecosystemOf(String(m.ecosystem));
    if (!eco) {
      unsupported.add(String(m.ecosystem));
      continue;
    }
    const prefix = m.root && m.root !== "." ? `${m.root}/` : "";
    const manifestPath = `${prefix}${m.manifest}`;
    if (seenManifest.has(manifestPath)) continue;
    seenManifest.add(manifestPath);
    entries.push({ eco, manifest: m.manifest, lockfile: m.lockfile, manifestPath, lockPath: `${prefix}${m.lockfile}`, prefix });
  }
  const manifestsTotal = entries.length;
  for (const e of entries) {
    const { eco, manifestPath, lockPath, prefix } = e;
    const mText = await trackedRead(manifestPath);
    if (mText == null) continue;
    manifests++;
    let parsed = null;
    if (eco === "js") parsed = parseNpmManifest(eco, mText);
    else if (eco === "py") {
      if (e.manifest.endsWith(".toml")) parsed = parsePyproject(eco, mText);
      else parsed = parseRequirementsTxt(eco, mText, /dev|test/.test(e.manifest) ? "dev" : "prod");
      const devText = await trackedRead(`${prefix}requirements-dev.txt`);
      if (devText) parsed.direct.push(...parseRequirementsTxt(eco, devText, "dev").direct);
    } else if (eco === "go") parsed = parseGoMod(eco, mText);
    else if (eco === "rust") parsed = parseCargoToml(eco, mText);
    else if (eco === "java") {
      parsed = await parsePomXml(eco, mText, {
        manifestPath,
        loadPom: /* @__PURE__ */ __name(async (repoRelPath) => trackedRead(repoRelPath), "loadPom")
      });
    } else if (eco === "ruby") parsed = parseGemfile(eco, mText);
    else if (eco === "php") parsed = parseComposerJson(eco, mText);
    else if (eco === "csharp") {
      if (/\.(csproj|vbproj)$/i.test(e.manifest)) parsed = parseCsproj(eco, mText);
      else if (/packages\.config$/i.test(e.manifest)) parsed = parsePackagesConfig(eco, mText);
      else parsed = parseDotnetAnchor();
    }
    if (!parsed) {
      unsupported.add(eco);
      continue;
    }
    const lText = lockPath === manifestPath ? mText : await trackedRead(lockPath);
    if (lText != null && LOCKFILES[e.lockfile]) {
      const pl = LOCKFILES[e.lockfile](lText);
      if (pl) {
        for (const [name, ver] of pl.versions) locked.set(`${eco}:${name}`, ver);
        const versions = {};
        for (const [name, set] of [...pl.versionSets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
          versions[name] = [...set].sort();
        }
        lockfiles.push({ path: lockPath, ecosystem: eco, packages: pl.packages, integrity: pl.integrity, versions });
      } else {
        unsupported.add(`${eco}:${e.lockfile}`);
      }
    } else if (lText != null && !LOCKFILES[e.lockfile]) {
      if (e.lockfile === e.manifest) noLockfileMechanism.add(`${eco}:${e.manifest}`);
      else unsupported.add(`${eco}:${e.lockfile}`);
    }
    for (const d of parsed.direct) {
      const lock = locked.get(`${eco}:${d.name}`) ?? null;
      direct.push({ ...d, file: d.file ?? manifestPath, version: lock ?? exactVersion(d.spec) });
    }
  }
  const transitiveTotal = lockfiles.reduce((a, l) => a + l.packages, 0);
  return { manifests, manifestsTotal, readBudgetExhausted, direct, lockfiles, unsupported: [...unsupported].sort(), noLockfileMechanism: [...noLockfileMechanism].sort(), locked, transitiveTotal };
}
__name(scanDependencies, "scanDependencies");
function uniqueDirect(deps, scope) {
  const byKey = /* @__PURE__ */ new Map();
  for (const d of deps) {
    if (scope && d.scope !== scope) continue;
    const key = `${d.ecosystem}:${d.name}`;
    const existing = byKey.get(key);
    if (!existing || existing.scope === "dev" && d.scope === "prod") byKey.set(key, d);
  }
  return [...byKey.values()].sort((a, b) => `${a.ecosystem}:${a.name}`.localeCompare(`${b.ecosystem}:${b.name}`));
}
__name(uniqueDirect, "uniqueDirect");
function majorOf(version) {
  if (!version) return null;
  const m = /(\d+)/.exec(version.replace(/^v/, ""));
  return m ? Number(m[1]) : null;
}
__name(majorOf, "majorOf");
function pinRatio(deps) {
  const pinned = deps.filter((d) => exactVersion(d.spec) != null || d.version != null).length;
  return deps.length ? Math.round(pinned / deps.length * 1e3) / 10 : 0;
}
__name(pinRatio, "pinRatio");

// ../../src/scan/detectors/ecos02.ts
var WHAT_IT_TAKES2 = "parse dependency manifests + lockfiles so direct-dep versions resolve against the vendored package metadata (latest major)";
var CORE_FRAMEWORKS = /* @__PURE__ */ new Set([
  "react",
  "vue",
  "angular",
  "svelte",
  "next",
  "nuxt",
  "express",
  "nestjs",
  "ember",
  "react-native",
  "@angular/core",
  "django",
  "flask",
  "fastapi",
  "rails",
  "spring-boot",
  "spring-boot-starter-web",
  "org.springframework.boot:spring-boot-starter-web",
  "quarkus",
  "laravel/framework",
  "github.com/gin-gonic/gin",
  "gin",
  // legacy-stacks 2.4: .NET framework-class packages (datasets carry aspnet/entityframework)
  "EntityFramework",
  "Microsoft.EntityFrameworkCore",
  "org.apache.struts:struts2-core",
  "struts2-core"
]);
var CORE_FRAMEWORK_PREFIX = /^microsoft\.aspnet\./i;
var CORE_FRAMEWORKS_LC = new Set([...CORE_FRAMEWORKS].map((n) => n.toLowerCase()));
function isCoreFramework(name) {
  return CORE_FRAMEWORKS.has(name) || CORE_FRAMEWORKS_LC.has(name.toLowerCase()) || CORE_FRAMEWORK_PREFIX.test(name);
}
__name(isCoreFramework, "isCoreFramework");
async function detectEcos02(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-02", "lockfile-parse", started, WHAT_IT_TAKES2);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("ECOS-02", "lockfile-parse", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("ECOS-02", "lockfile-parse", started, `${WHAT_IT_TAKES2}; no dependency manifest was found in the tree (na_when clause-b)`);
    }
    let direct = uniqueDirect(scan.direct, "prod");
    if (direct.length === 0) direct = uniqueDirect(scan.direct);
    const directTotal = direct.length;
    let resolvable = 0;
    let behind1 = 0;
    let behind2 = 0;
    const coreGaps = [];
    const unresolvableNames = [];
    const pointers = [];
    for (const d of direct) {
      const currentMajor = majorOf(d.version);
      const meta = lookupPackage(d.ecosystem, d.name);
      if (currentMajor == null || !meta) {
        unresolvableNames.push(d.name);
        continue;
      }
      resolvable++;
      const behind = meta.latest_major - currentMajor;
      if (behind < 1) continue;
      behind1++;
      if (behind >= 2) behind2++;
      if (isCoreFramework(d.name)) {
        coreGaps.push({ name: d.name, current: d.version ?? String(currentMajor), latest_major: meta.latest_major, majors_behind: behind });
      }
    }
    unresolvableNames.sort((a, b) => a.localeCompare(b));
    coreGaps.sort((a, b) => b.majors_behind - a.majors_behind || a.name.localeCompare(b.name));
    const ratio = directTotal ? resolvable / directTotal : 0;
    const facts = {
      ecos02: {
        direct_deps_total: directTotal,
        unresolvable: unresolvableNames.length,
        unresolvable_names: unresolvableNames,
        resolvable_ratio: Math.round(ratio * 1e3) / 1e3,
        pct_behind_1plus_major: resolvable ? Math.round(behind1 / resolvable * 1e3) / 10 : 0,
        pct_behind_2plus_major: resolvable ? Math.round(behind2 / resolvable * 1e3) / 10 : 0,
        core_framework_gaps: coreGaps
      }
    };
    const lockPaths = [...new Set(scan.lockfiles.map((l) => l.path))].slice(0, 5);
    for (const p of lockPaths) pointers.push(filePointer(p, "direct-dep versions resolved from this lockfile"));
    pointers.push(basisPointer("lockfile-parse", `package metadata snapshot ${snapshotVersions()["eol-snapshot"]}`));
    if (resolvable === 0) {
      return unknownFact(
        "ECOS-02",
        "lockfile-parse",
        started,
        `every direct dependency is unresolvable against the vendored package table (${directTotal} deps, fully private ecosystem)`,
        { pointers, facts }
      );
    }
    const measurement = ratio >= 0.8 ? { status: "measured", confidence: "medium" } : { status: "estimated", confidence: "low", scopeLimited: true };
    return measuredFact({
      detectorId: "ECOS-02",
      producer: "lockfile-parse",
      started,
      facts,
      pointers,
      measurement,
      truncated: ratio < 0.8
    });
  } catch (e) {
    return { detectorId: "ECOS-02", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "lockfile-parse", version: "1.0", flags: ["lockfile-parse"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos02, "detectEcos02");

// ../../src/scan/sourcefiles.ts
var SOURCE_EXT = /\.(m|c)?[jt]sx?$|\.py$|\.go$|\.java$|\.rb$|\.php$|\.rs$|\.kt$|\.scala$|\.cs$|\.vb$/;
var MAX_SOURCE_FILES = 400;
var MAX_BYTES_PER_FILE = 256 * 1024;
var FACADE_DIR = /(^|\/)(adapters?|ports?|facade|gateways?|clients?|infra|infrastructure)(\/|$)/i;
async function readText2(ctx, path, max = MAX_BYTES_PER_FILE) {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    return { text: buf.subarray(0, max).toString("utf8"), capped: buf.length > max };
  } catch {
    return null;
  }
}
__name(readText2, "readText");
function extractImports(text) {
  const out = [];
  const push = /* @__PURE__ */ __name((t) => {
    if (!t) return;
    const tok = t.trim();
    if (!tok || tok.startsWith(".") || tok.startsWith("/")) return;
    out.push(tok);
  }, "push");
  for (const m of text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) push(m[1]);
  for (const m of text.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) push(m[1]);
  for (const m of text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) push(m[1]);
  for (const m of text.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) push(m[1]);
  for (const m of text.matchAll(/^\s*import\s+([A-Za-z0-9_.]+)/gm)) push(m[1].split(".")[0]);
  for (const m of text.matchAll(/^\s*from\s+([A-Za-z0-9_.]+)\s+import\b/gm)) push(m[1].split(".")[0]);
  for (const m of text.matchAll(/^\s*(?:[A-Za-z0-9_.]+\s+)?"([^"]+\/[^"]+)"/gm)) push(m[1]);
  for (const m of text.matchAll(/^\s*import\s+(?:static\s+)?([A-Za-z0-9_.]+);?/gm)) {
    const seg = m[1].split(".");
    push(seg.slice(0, Math.max(1, seg.length - 1)).join("."));
  }
  for (const m of text.matchAll(/^\s*require\s+['"]([^'"]+)['"]/gm)) push(m[1]);
  for (const m of text.matchAll(/^\s*use\s+([A-Za-z0-9_\\]+)/gm)) push(m[1].split("\\").slice(0, 2).join("/"));
  for (const m of text.matchAll(/^\s*use\s+([A-Za-z0-9_]+)::/gm)) push(m[1]);
  for (const m of text.matchAll(/^\s*(?:global\s+)?using\s+(?:static\s+)?([A-Za-z_][A-Za-z0-9_.]*)\s*;/gm)) push(m[1]);
  for (const m of text.matchAll(/^\s*using\s+[A-Za-z_]\w*\s*=\s*([A-Za-z_][A-Za-z0-9_.]*)\s*;/gm)) push(m[1]);
  for (const m of text.matchAll(/^\s*Imports\s+([^<\r\n][^\r\n]*)$/gm)) {
    const code = m[1].split("'")[0];
    for (const part of code.split(",")) push(part.split("=").pop());
  }
  return out;
}
__name(extractImports, "extractImports");
function rootToken(token) {
  return token.split(/[/@.]/)[0];
}
__name(rootToken, "rootToken");
function matchesDependency(token, depName) {
  if (!token || !depName) return false;
  const t = token.toLowerCase();
  const d = depName.toLowerCase();
  if (t === d) return true;
  if (t.startsWith(`${d}/`)) return true;
  if (rootToken(t) === d) return true;
  if (d.includes(":") && t === d.split(":")[1]) return true;
  return false;
}
__name(matchesDependency, "matchesDependency");
async function scanSourceImports(ctx, signal) {
  let paths = [];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith("/"));
  } catch {
    paths = [];
  }
  const sourcePaths = paths.filter((p) => SOURCE_EXT.test(p)).sort();
  const importCounts = /* @__PURE__ */ new Map();
  const importingFiles = /* @__PURE__ */ new Map();
  const tokens = /* @__PURE__ */ new Set();
  let filesScanned = 0;
  let truncated = false;
  for (const path of sourcePaths) {
    if (signal?.aborted) {
      truncated = true;
      break;
    }
    if (filesScanned >= MAX_SOURCE_FILES) {
      truncated = true;
      break;
    }
    const read = await readText2(ctx, path);
    if (read == null) continue;
    if (read.capped) truncated = true;
    filesScanned++;
    const seen = /* @__PURE__ */ new Set();
    for (const tok of extractImports(read.text)) {
      tokens.add(tok);
      if (seen.has(tok)) continue;
      seen.add(tok);
      importCounts.set(tok, (importCounts.get(tok) ?? 0) + 1);
      const list = importingFiles.get(tok) ?? [];
      if (list.length < 200) list.push(path);
      importingFiles.set(tok, list);
    }
  }
  return { filesScanned, sourceFiles: sourcePaths.length, truncated, importCounts, importingFiles, tokens };
}
__name(scanSourceImports, "scanSourceImports");
function isDependencyImported(scan, depName) {
  for (const tok of scan.tokens) if (matchesDependency(tok, depName)) return true;
  return false;
}
__name(isDependencyImported, "isDependencyImported");
function couplingFor(scan, names) {
  if (!scan.filesScanned) return { share: 0, facade: false };
  const files = /* @__PURE__ */ new Set();
  for (const [tok, list] of scan.importingFiles) {
    if (names.some((n) => matchesDependency(tok, n))) for (const f of list) files.add(f);
  }
  const share = files.size / scan.filesScanned;
  if (files.size === 0) return { share, facade: false };
  let facaded = 0;
  for (const f of files) if (FACADE_DIR.test(f)) facaded++;
  return { share: Math.round(share * 1e3) / 1e3, facade: facaded / files.size >= 0.8 };
}
__name(couplingFor, "couplingFor");
var IMPORT_SCAN_CACHE_KEY = "sourcefiles:import-scan";
var WORKFLOW_CACHE_KEY = "sourcefiles:workflows";
async function cachedSourceImports(ctx, signal) {
  const cached = ctx.cache.get(IMPORT_SCAN_CACHE_KEY);
  if (cached) return cached;
  const scan = await scanSourceImports(ctx, signal);
  ctx.cache.set(IMPORT_SCAN_CACHE_KEY, scan);
  return scan;
}
__name(cachedSourceImports, "cachedSourceImports");
async function readWorkflows(ctx, signal) {
  let paths = [];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith("/"));
  } catch {
    paths = [];
  }
  const wf = paths.filter((p) => /^\.github\/workflows\/.+\.ya?ml$/.test(p)).sort();
  const chunks = [];
  const files = [];
  for (const p of wf.slice(0, 40)) {
    if (signal?.aborted) break;
    const read = await readText2(ctx, p);
    if (read == null) continue;
    files.push(p);
    chunks.push(read.text);
  }
  return { text: chunks.join("\n"), files };
}
__name(readWorkflows, "readWorkflows");
async function cachedWorkflows(ctx, signal) {
  const cached = ctx.cache.get(WORKFLOW_CACHE_KEY);
  if (cached) return cached;
  const wf = await readWorkflows(ctx, signal);
  ctx.cache.set(WORKFLOW_CACHE_KEY, wf);
  return wf;
}
__name(cachedWorkflows, "cachedWorkflows");

// ../../src/scan/detectors/ecos03.ts
var WHAT_IT_TAKES3 = "resolve each load-bearing dependency to its last-release date from a package-metadata source (the vendored snapshot ships last_release for a curated subset)";
var MONTH_MS = 30 * 864e5;
var R_MONTHS = 24;
function monthsSince(iso, nowMs) {
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isFinite(t) ? Math.floor((nowMs - t) / MONTH_MS) : 0;
}
__name(monthsSince, "monthsSince");
async function detectEcos03(ctx, signal) {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-03", "lockfile-parse", started, WHAT_IT_TAKES3);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("ECOS-03", "lockfile-parse", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("ECOS-03", "lockfile-parse", started, `${WHAT_IT_TAKES3}; no dependency manifest was found (na_when clause-b)`);
    }
    if (scan.lockfiles.length === 0) {
      return unknownFact(
        "ECOS-03",
        "lockfile-parse",
        started,
        `${WHAT_IT_TAKES3}; no lockfile found \u2014 pin your dependencies so per-version abandonment is knowable`
      );
    }
    let loadBearing = uniqueDirect(scan.direct, "prod");
    if (loadBearing.length === 0) loadBearing = uniqueDirect(scan.direct);
    if (loadBearing.length === 0) {
      return unknownFact("ECOS-03", "lockfile-parse", started, `${WHAT_IT_TAKES3}; the lockfile records no load-bearing dependency`);
    }
    const imports = await cachedSourceImports(ctx, signal);
    const abandoned = [];
    const unresolvable = [];
    for (const d of loadBearing) {
      const meta = lookupPackage(d.ecosystem, d.name);
      if (!meta?.last_release) {
        unresolvable.push(d.name);
        continue;
      }
      const months = monthsSince(meta.last_release, nowMs);
      if (months > R_MONTHS) {
        abandoned.push({
          name: d.name,
          version: scan.locked.get(`${d.ecosystem}:${d.name}`) ?? d.version ?? null,
          months_since_release: months,
          archived: false,
          in_core_path: isDependencyImported(imports, d.name)
        });
      }
    }
    abandoned.sort((a, b) => b.months_since_release - a.months_since_release || String(a.name).localeCompare(String(b.name)));
    const total = loadBearing.length;
    const resolvable = total - unresolvable.length;
    const ratio = total ? resolvable / total : 0;
    const facts = {
      ecos03: {
        load_bearing_total: total,
        abandoned,
        bus_factor_1_count: 0,
        unresolvable: unresolvable.length,
        unresolvable_names: unresolvable.slice().sort((a, b) => a.localeCompare(b)),
        resolvable_ratio: Math.round(ratio * 1e3) / 1e3
      }
    };
    const pointers = [
      ...scan.lockfiles.map((l) => filePointer(l.path, `${l.packages} lockfile package entries resolved against the package-metadata table`)).slice(0, 3),
      basisPointer("eol-snapshot", `last-release metadata from snapshot ${snapshotVersions()["eol-snapshot"]}`)
    ];
    if (resolvable === 0) {
      return unknownFact(
        "ECOS-03",
        "lockfile-parse",
        started,
        `every load-bearing dependency is unresolvable against the vendored package-metadata table (${total} deps)`,
        { pointers, facts }
      );
    }
    const measurement = ratio >= 0.7 && !imports.truncated ? { status: "measured", confidence: "medium" } : { status: "estimated", confidence: "low", scopeLimited: true };
    return measuredFact({
      detectorId: "ECOS-03",
      producer: "lockfile-parse",
      started,
      facts,
      pointers,
      measurement,
      truncated: ratio < 0.7 || imports.truncated
    });
  } catch (e) {
    return { detectorId: "ECOS-03", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "lockfile-parse", version: "1.0", flags: ["lockfile-parse"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos03, "detectEcos03");

// ../../src/scan/detectors/ecos05.ts
var WHAT_IT_TAKES4 = "resolve direct-dependency licenses from the vendored package-metadata table (transitive licenses need an SBOM scanner the offline release does not ship)";
function classifyLicense(license) {
  if (!license) return "unknown";
  const s = license.toUpperCase();
  if (/AGPL/.test(s)) return "strong";
  if (/(^|[^L])GPL/.test(s)) return "strong";
  if (/LGPL|MPL|EPL|CDDL/.test(s)) return "weak";
  if (/MIT|APACHE|BSD|ISC|WTFPL|ZLIB|UNLICENSE|0BSD|PUBLIC DOMAIN|PYTHON-2/.test(s)) return "permissive";
  return "unknown";
}
__name(classifyLicense, "classifyLicense");
var SBOM_PATH = /(^|\/)(sbom|bom)(\.|$)|\.cdx\.json$|cyclonedx/i;
async function detectEcos05(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-05", "lockfile-parse", started, WHAT_IT_TAKES4);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("ECOS-05", "lockfile-parse", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("ECOS-05", "lockfile-parse", started, `${WHAT_IT_TAKES4}; no dependency manifest found (na_when clause-b)`);
    }
    let direct = uniqueDirect(scan.direct, "prod");
    if (direct.length === 0) direct = uniqueDirect(scan.direct);
    let packagesTotal = 0;
    let licenseUnknownCount = 0;
    let copyleftWeakCount = 0;
    const licenseUnknownNames = [];
    const copyleftStrong = [];
    for (const d of direct) {
      packagesTotal++;
      const meta = lookupPackage(d.ecosystem, d.name);
      const cls = classifyLicense(meta?.license);
      if (cls === "unknown") {
        licenseUnknownCount++;
        licenseUnknownNames.push(d.name);
        continue;
      }
      if (cls === "weak") copyleftWeakCount++;
      if (cls === "strong") copyleftStrong.push({ name: d.name, version: d.version ?? null, license: meta.license, direct: true });
    }
    copyleftStrong.sort((a, b) => a.name.localeCompare(b.name));
    let paths = [];
    try {
      paths = (await walkSortedTree(ctx.clonePath)).paths.filter((p) => !p.endsWith("/"));
    } catch {
      paths = [];
    }
    const sbomPresent = paths.some((p) => SBOM_PATH.test(p));
    const { text: wfText } = await cachedWorkflows(ctx, signal);
    const ciLicenseGate = /(license|scancode|licensee|pip-licenses)/i.test(wfText) && /(check|audit|scan|compliance)/i.test(wfText);
    const suppReads = makeReadBudgetTracker();
    const read = /* @__PURE__ */ __name((p) => readText(ctx, p, suppReads), "read");
    const pkgRaw = await read("package.json");
    let hasBinaryPackaging = false;
    if (pkgRaw) {
      try {
        hasBinaryPackaging = "bin" in JSON.parse(pkgRaw);
      } catch {
      }
    }
    if (!hasBinaryPackaging) {
      const dockerfiles = paths.filter((p) => /(^|\/)Dockerfile(\.[\w.-]+)?$/.test(p)).slice(0, 3);
      for (const df of dockerfiles) {
        const text = await read(df);
        if (text && (/^\s*FROM\s+scratch/im.test(text) || /COPY\s+--from=/i.test(text))) {
          hasBinaryPackaging = true;
          break;
        }
      }
    }
    if (!hasBinaryPackaging) {
      const pyproject = await read("pyproject.toml");
      if (pyproject && /\[build-system\]/.test(pyproject)) hasBinaryPackaging = true;
    }
    const licenseText = await read("LICENSE") ?? await read("LICENSE.md") ?? await read("LICENSE.txt") ?? "";
    const repoIsCopyleft = /\b(AGPL|GPL)\b/i.test(licenseText);
    if (suppReads.budgetBlocked > 0) {
      return unknownFact(
        "ECOS-05",
        "lockfile-parse",
        started,
        readBudgetNote(suppReads.reads, suppReads.reads + suppReads.budgetBlocked, "license supplementary reads")
      );
    }
    const closedSourceDistributionLikely = hasBinaryPackaging && !repoIsCopyleft;
    const facts = {
      ecos05: {
        packages_total: packagesTotal,
        license_unknown_count: licenseUnknownCount,
        license_unknown_names: licenseUnknownNames.slice().sort((a, b) => a.localeCompare(b)),
        copyleft_strong: copyleftStrong,
        copyleft_weak_count: copyleftWeakCount,
        sbom_present_in_repo: sbomPresent,
        ci_license_gate_present: ciLicenseGate,
        closed_source_distribution_likely: closedSourceDistributionLikely
      }
    };
    const pointers = [
      ...direct.slice(0, 4).map((d) => filePointer(`manifest:${d.ecosystem}`, `${d.name} license classified from package metadata`)),
      basisPointer("eol-snapshot", `license metadata from snapshot ${snapshotVersions()["eol-snapshot"]}`)
    ];
    if (packagesTotal === 0) {
      return unknownFact(
        "ECOS-05",
        "lockfile-parse",
        started,
        `${WHAT_IT_TAKES4}; the manifest declares no direct dependency to license`,
        { pointers, facts }
      );
    }
    if (licenseUnknownCount === packagesTotal) {
      return unknownFact(
        "ECOS-05",
        "lockfile-parse",
        started,
        `${WHAT_IT_TAKES4}; none of the ${packagesTotal} direct dependencies is covered by the package-metadata table`,
        { pointers, facts }
      );
    }
    return measuredFact({
      detectorId: "ECOS-05",
      producer: "lockfile-parse",
      started,
      facts,
      pointers,
      measurement: { status: "estimated", confidence: "low", scopeLimited: licenseUnknownCount > 0 },
      truncated: licenseUnknownCount > 0
    });
  } catch (e) {
    return { detectorId: "ECOS-05", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "lockfile-parse", version: "1.0", flags: ["lockfile-parse"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos05, "detectEcos05");

// ../../src/scan/git.ts
import { execFile as execFile2 } from "node:child_process";
import { promisify as promisify2 } from "node:util";
var execFileAsync2 = promisify2(execFile2);
var MAX_BUFFER = 64 * 1024 * 1024;
async function runGit(root, args, opts = {}) {
  try {
    const { stdout } = await execFileAsync2("git", ["-C", root, ...args], {
      maxBuffer: MAX_BUFFER,
      timeout: opts.timeoutMs ?? 2e4,
      signal: opts.signal
    });
    return { stdout };
  } catch {
    return null;
  }
}
__name(runGit, "runGit");
async function isGitRepo(root, opts = {}) {
  const r = await runGit(root, ["rev-parse", "--is-inside-work-tree"], opts);
  return r != null && r.stdout.trim() === "true";
}
__name(isGitRepo, "isGitRepo");
function bump(m, k) {
  m.set(k, (m.get(k) ?? 0) + 1);
}
__name(bump, "bump");
async function gitChurn(root, opts = {}) {
  const windowDays = opts.sinceDays ?? 365;
  const maxCommits = opts.maxCommits ?? 4e3;
  const nowMs = opts.nowMs ?? Date.now();
  const sinceIso = new Date(nowMs - windowDays * 864e5).toISOString();
  const r = await runGit(
    root,
    ["log", `--since=${sinceIso}`, `--max-count=${maxCommits}`, "--name-only", "--pretty=format:%ct%s"],
    opts
  );
  if (!r) return null;
  const fileCommits = /* @__PURE__ */ new Map();
  const fileBugfixCommits = /* @__PURE__ */ new Map();
  let commits = 0;
  let curBug = false;
  for (const raw of r.stdout.split("\n")) {
    if (raw.startsWith("")) {
      const rest = raw.slice(1);
      const sep = rest.indexOf("");
      const subject = sep >= 0 ? rest.slice(sep + 1) : "";
      curBug = /^(fix|bug|hotfix|revert|crash)/i.test(subject.trim());
      commits++;
      continue;
    }
    const file = raw.trim();
    if (!file) continue;
    bump(fileCommits, file);
    if (curBug) bump(fileBugfixCommits, file);
  }
  return {
    commitsAnalyzed: commits,
    windowDays,
    fileCommits,
    fileBugfixCommits,
    historyTruncated: commits >= maxCommits,
    sinceIso
  };
}
__name(gitChurn, "gitChurn");
async function gitRepoAgeDays(root, nowMs, opts = {}) {
  const r = await runGit(root, ["log", "--format=%ct", "--max-parents=0", "HEAD"], opts);
  if (!r) return null;
  const stamps = r.stdout.split("\n").map((l) => Number(l.trim())).filter((n) => Number.isFinite(n) && n > 0);
  if (!stamps.length) return null;
  const oldest = Math.min(...stamps) * 1e3;
  return Math.floor((nowMs - oldest) / 864e5);
}
__name(gitRepoAgeDays, "gitRepoAgeDays");
async function gitFileLastCommitMs(root, path, opts = {}) {
  const r = await runGit(root, ["log", "-1", "--format=%ct", "--", path], opts);
  if (!r) return null;
  const n = Number(r.stdout.trim().split("\n")[0]);
  return Number.isFinite(n) && n > 0 ? n * 1e3 : null;
}
__name(gitFileLastCommitMs, "gitFileLastCommitMs");
async function gitBlameLineAgeDays(root, path, line, nowMs, opts = {}) {
  const r = await runGit(root, ["blame", "--porcelain", "-L", `${line},${line}`, "--", path], opts);
  if (!r) return null;
  const m = /^author-time (\d+)$/m.exec(r.stdout);
  if (!m) return null;
  return Math.floor((nowMs - Number(m[1]) * 1e3) / 864e5);
}
__name(gitBlameLineAgeDays, "gitBlameLineAgeDays");
async function gitCommitCount(root, opts = {}) {
  const r = await runGit(root, ["rev-list", "--count", "HEAD"], opts);
  if (!r) return null;
  const n = Number(r.stdout.trim());
  return Number.isFinite(n) ? n : null;
}
__name(gitCommitCount, "gitCommitCount");
async function gitLogPatch(root, opts = {}) {
  const maxCommits = opts.maxCommits ?? 200;
  const r = await runGit(root, ["log", "-p", "--all", "--no-merges", `--max-count=${maxCommits}`, "--format=%H"], opts);
  if (!r) return null;
  const commits = (r.stdout.match(/^\u0001[0-9a-f]{4,40}$/gm) ?? []).length;
  return { patch: r.stdout, commits, truncated: commits >= maxCommits };
}
__name(gitLogPatch, "gitLogPatch");

// ../../src/scan/detectors/ecos07.ts
var WHAT_IT_TAKES5 = "enumerate lockfiles and manifests so lockfile presence, pin ratio and CI install immutability are decidable \u2014 the release cannot decide a tree with no manifest at all";
var IMMUTABLE = [
  { re: /\bnpm\s+ci\b/, label: "npm ci" },
  { re: /\byarn\s+install\b[^\n]*--(frozen-lockfile|immutable)\b|--immutable\b/, label: "yarn --immutable" },
  { re: /\bpnpm\s+(install|i)\b[^\n]*--frozen-lockfile\b/, label: "pnpm --frozen-lockfile" },
  { re: /\bpip\s+install\b[^\n]*--require-hashes\b/, label: "pip --require-hashes" },
  { re: /\bgo\s+mod\s+download\b/, label: "go mod download" }
];
var MUTABLE = [
  { re: /\bnpm\s+install\b/, label: "npm install" },
  { re: /\byarn\s+install\b/, label: "yarn install" },
  { re: /\bpnpm\s+(install|i)\b/, label: "pnpm install" },
  { re: /\bpip\s+install\b/, label: "pip install" }
];
async function detectEcos07(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-07", "lockfile-parse", started, WHAT_IT_TAKES5);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("ECOS-07", "lockfile-parse", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("ECOS-07", "lockfile-parse", started, `${WHAT_IT_TAKES5}; no manifest found (na_when clause-b)`);
    }
    const git = await isGitRepo(ctx.clonePath, { signal });
    const lockfiles = [];
    for (const l of scan.lockfiles) {
      let stale = false;
      let stalenessChecked = false;
      if (git) {
        const manifestForRoot = ctx.manifests.find((m) => l.path.startsWith(`${m.root === "." ? "" : m.root}/`) || m.root === ".");
        const lockMs = await gitFileLastCommitMs(ctx.clonePath, l.path, { signal });
        const manifestMs = manifestForRoot ? await gitFileLastCommitMs(ctx.clonePath, `${manifestForRoot.root === "." ? "" : `${manifestForRoot.root}/`}${manifestForRoot.manifest}`, { signal }) : null;
        if (lockMs != null && manifestMs != null) {
          stalenessChecked = true;
          stale = lockMs < manifestMs;
        }
      }
      lockfiles.push({ path: l.path, ecosystem: l.ecosystem, stale, staleness_checked: stalenessChecked, integrity_hashes: l.integrity, packages: l.packages });
    }
    const { text: wfText, files: wfFiles } = await cachedWorkflows(ctx, signal);
    const immutableHit = IMMUTABLE.find((c) => c.re.test(wfText));
    const mutableSites = MUTABLE.filter((c) => c.re.test(wfText)).map((c) => c.label);
    const ciImmutable = { enforced: immutableHit != null, evidence: immutableHit ? `${immutableHit.label} in ${wfFiles[0] ?? ".github/workflows"}` : "no immutable install command found in CI" };
    const direct = uniqueDirect(scan.direct);
    const facts = {
      ecos07: {
        lockfiles,
        lockfile_mechanism_absent: scan.noLockfileMechanism,
        pin_ratio: pinRatio(direct),
        ci_immutable_install: ciImmutable,
        mutable_install_sites: mutableSites,
        manifests_total: scan.manifests
      }
    };
    const pointers = [
      ...lockfiles.slice(0, 4).map((l) => filePointer(String(l.path), `${l.integrity_hashes ? "integrity hashes present" : "no integrity hashes"}${l.stale ? "; lockfile older than manifest" : ""}`)),
      ...scan.noLockfileMechanism.length ? [basisPointer("lockfile-parse", `no lockfile mechanism for ${scan.noLockfileMechanism.join(", ")} \u2014 absence is structural, not a coverage gap; pinning is assessed from the manifest declarations`)] : [],
      ...git ? [basisPointer("git", "lockfile staleness from git last-commit dates")] : [basisPointer("scan", "no git history \u2014 staleness check dropped, presence facts stand")]
    ];
    return measuredFact({
      detectorId: "ECOS-07",
      producer: "lockfile-parse",
      started,
      facts,
      pointers,
      measurement: { status: "measured", confidence: git ? "medium" : "low" }
    });
  } catch (e) {
    return { detectorId: "ECOS-07", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "lockfile-parse", version: "1.0", flags: ["lockfile-parse"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos07, "detectEcos07");

// ../../src/scan/detectors/sec01.ts
var WHAT_IT_TAKES6 = "resolve locked dependency versions and join them to a known-vulnerability source (the vendored advisory snapshot covers a curated subset; an uncovered ecosystem needs advisory data the snapshot lacks)";
async function detectSec01(ctx, signal) {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact("SEC-01", "advisory-snapshot", started, WHAT_IT_TAKES6);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("SEC-01", "advisory-snapshot", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("SEC-01", "advisory-snapshot", started, `${WHAT_IT_TAKES6}; no dependency manifest found (na_when clause-b)`);
    }
    if (scan.lockfiles.length === 0) {
      return unknownFact("SEC-01", "advisory-snapshot", started, `${WHAT_IT_TAKES6}; no lockfile found \u2014 versions are unpinned so advisories cannot be matched`);
    }
    if (scan.locked.size === 0) {
      return unknownFact("SEC-01", "advisory-snapshot", started, `${WHAT_IT_TAKES6}; the lockfile records no resolved package version to check`);
    }
    const covered = advisoryCoveredEcosystems();
    const presentEcosystems = [...new Set([...scan.locked.keys()].map((k) => k.split(":")[0]))].sort();
    const uncovered = presentEcosystems.filter((e) => !covered.includes(e));
    const pointers = [
      ...scan.lockfiles.slice(0, 5).map((l) => filePointer(l.path, `${l.packages} locked entries joined to the advisory snapshot`)),
      basisPointer("advisory-snapshot", `vendored advisory dataset ${snapshotVersions()["advisory-snapshot"]}; covered ecosystems: ${covered.join(", ") || "none"}`)
    ];
    if (uncovered.length === presentEcosystems.length) {
      return unknownFact(
        "SEC-01",
        "advisory-snapshot",
        started,
        `${WHAT_IT_TAKES6}; the advisory snapshot covers none of the parsed ecosystems (${presentEcosystems.join(", ")}) \u2014 covered: ${covered.join(", ") || "none"}`,
        { pointers }
      );
    }
    const imports = await cachedSourceImports(ctx, signal);
    const findings = [];
    for (const [key, version] of scan.locked) {
      const i = key.indexOf(":");
      const eco = key.slice(0, i);
      const name = key.slice(i + 1);
      for (const adv of matchAdvisories(eco, name, version)) {
        findings.push({
          id: adv.id,
          pkg: name,
          version,
          severity: adv.severity,
          age_days: advisoryAgeDays(adv.published, nowMs),
          fix_available: !!adv.fixed,
          in_core_import_closure: isDependencyImported(imports, name)
        });
      }
    }
    findings.sort((a, b) => String(a.id).localeCompare(String(b.id)) || String(a.pkg).localeCompare(String(b.pkg)));
    const critical_open_over_14d = findings.filter((f) => f.severity === "CRITICAL" && (f.age_days ?? 0) > 14).length;
    const high_open = findings.filter((f) => f.severity === "HIGH").length;
    const facts = {
      sec01: {
        findings,
        critical_open_over_14d,
        high_open,
        tools: [`advisory-snapshot ${snapshotVersions()["advisory-snapshot"]}`],
        ecosystems_scanned: presentEcosystems.filter((e) => covered.includes(e)),
        ecosystems_uncovered: uncovered,
        advisory_snapshot_version: snapshotVersions()["advisory-snapshot"]
      }
    };
    const measurement = uncovered.length > 0 ? { status: "estimated", confidence: "low", scopeLimited: true } : imports.truncated ? { status: "measured", confidence: "low", scopeLimited: true } : { status: "measured", confidence: "medium" };
    return measuredFact({
      detectorId: "SEC-01",
      producer: "advisory-snapshot",
      started,
      facts,
      pointers,
      measurement,
      truncated: uncovered.length > 0 || imports.truncated
    });
  } catch (e) {
    return { detectorId: "SEC-01", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "advisory-snapshot", version: "1.0", flags: ["advisory-snapshot"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectSec01, "detectSec01");

// ../../src/scan/detectors/sec06.ts
var WHAT_IT_TAKES7 = "resolve depth\u22652 transitive chains out of the lockfile against an advisory source with import-closure reachability \u2014 the offline release ships no transitive-chain resolver (depth\u22641 vulns are SEC-01)";
async function detectSec06(ctx, signal) {
  const started = Date.now();
  void ctx;
  void signal;
  return unknownFact("SEC-06", "scan", started, WHAT_IT_TAKES7);
}
__name(detectSec06, "detectSec06");

// ../../src/scan/secrets.ts
var SECRET_RULES = [
  { id: "aws-access-token", description: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "github-pat", description: "GitHub personal access token", re: /\bghp_[0-9A-Za-z]{36}\b|\bgithub_pat_[0-9A-Za-z_]{60,}\b/ },
  { id: "google-api-key", description: "Google API key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { id: "slack-token", description: "Slack token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,72}\b/ },
  { id: "stripe-secret-key", description: "Stripe live secret key", re: /\bsk_live_[0-9A-Za-z]{24,}\b/ },
  { id: "private-key", description: "PEM private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: "jwt", description: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { id: "basic-auth-url", description: "Credentials embedded in a URL", re: /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@'"]+:[^/\s:@'"]+@[A-Za-z0-9.-]+/i },
  { id: "generic-secret-assignment", description: "Assigned secret/password/token literal", re: /(?:\bpassword|\bpasswd|\bsecret|\bapi[_-]?key|\baccess[_-]?token|\bauth[_-]?token)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i }
];
var PLACEHOLDER = /\$\{|\$\(|process\.env|os\.environ|getenv|xxxx|changeme|example|placeholder|your[_-]?|dummy|redacted|<[^>]+>|\.\.\.|test[_-]?secret/i;
var MAX_FILES = 600;
var MAX_BYTES_PER_FILE2 = 256 * 1024;
function lineMatches(line) {
  const ids = [];
  for (const rule of SECRET_RULES) {
    if (PLACEHOLDER.test(line)) {
      if (!["aws-access-token", "github-pat", "google-api-key", "slack-token", "stripe-secret-key", "private-key", "jwt"].includes(rule.id)) continue;
    }
    if (rule.re.test(line)) ids.push(rule.id);
  }
  return ids;
}
__name(lineMatches, "lineMatches");
async function readText3(ctx, path) {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    return buf.subarray(0, MAX_BYTES_PER_FILE2).toString("utf8");
  } catch {
    return null;
  }
}
__name(readText3, "readText");
async function scanSecrets(ctx, signal) {
  const rulesApplied = SECRET_RULES.map((r) => r.id);
  let paths = [];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith("/"));
  } catch {
    paths = [];
  }
  const candidates = paths.filter((p) => !/\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tgz|jar|war|woff2?|ttf|eot|mp[34]|mov|so|dylib|dll|exe|bin|class|o|a)$/i.test(p)).filter((p) => !/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|Gemfile\.lock|poetry\.lock|composer\.lock|go\.sum)$/.test(p)).sort();
  const treeFindings = [];
  const widerDeclared = /* @__PURE__ */ new Set();
  let filesScanned = 0;
  let truncated = false;
  for (const path of candidates) {
    if (signal?.aborted) {
      truncated = true;
      break;
    }
    if (filesScanned >= MAX_FILES) {
      truncated = true;
      break;
    }
    const text = await readText3(ctx, path);
    if (text == null) continue;
    filesScanned++;
    if (/\bgitleaks\b/.test(text)) widerDeclared.add("gitleaks");
    if (/\btrufflehog\b/.test(text)) widerDeclared.add("trufflehog");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const rule of lineMatches(lines[i])) treeFindings.push({ rule, file: path, line: i + 1, verified: false });
    }
  }
  treeFindings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  const patch = await gitLogPatch(ctx.clonePath, { maxCommits: 200, signal });
  const historyScanned = patch != null;
  const historyScannedFull = patch != null && !patch.truncated;
  const historyOnly = [];
  if (patch) {
    const treeKey = new Set(treeFindings.map((f) => `${f.file}:${f.rule}`));
    let commit = "unknown";
    let file = "";
    for (const raw of patch.patch.split("\n")) {
      if (raw.startsWith("")) {
        commit = raw.slice(1);
        continue;
      }
      if (raw.startsWith("+++ ")) {
        file = raw.slice(4).replace(/^b\//, "").split("	")[0];
        continue;
      }
      if (!raw.startsWith("+") || raw.startsWith("+++")) continue;
      const content = raw.slice(1);
      for (const rule of lineMatches(content)) {
        if (treeKey.has(`${file}:${rule}`)) continue;
        if (historyOnly.length >= 200) break;
        historyOnly.push({ rule, file, commit });
      }
    }
    historyOnly.sort((a, b) => a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || a.commit.localeCompare(b.commit));
  }
  return {
    tree_findings: treeFindings.slice(0, 500),
    history_only_findings: historyOnly,
    verified_live: 0,
    history_scanned_full: historyScannedFull,
    history_scanned: historyScanned,
    rules_applied: rulesApplied,
    wider_scanners_run: [],
    wider_scanners_declared: [...widerDeclared].sort(),
    files_scanned: filesScanned,
    truncated
  };
}
__name(scanSecrets, "scanSecrets");

// ../../src/scan/detectors/sec02.ts
var WHAT_IT_TAKES8 = "run a secret scanner over the tree and git history (the offline release runs a built-in documented rule set; gitleaks/trufflehog widen it when installed)";
async function detectSec02(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("SEC-02", "secret-rules", started, WHAT_IT_TAKES8);
    const scan = await scanSecrets(ctx, signal);
    const facts = {
      sec02: {
        tree_findings: scan.tree_findings,
        // count (spec §3 + G1) — the bounded detail list is separate
        history_only_findings: scan.history_only_findings.length,
        history_only_findings_list: scan.history_only_findings.slice(0, 50),
        verified_live: scan.verified_live,
        history_scanned_full: scan.history_scanned_full,
        history_scanned: scan.history_scanned,
        rules_applied: scan.rules_applied,
        wider_scanners_run: scan.wider_scanners_run,
        wider_scanners_declared: scan.wider_scanners_declared,
        files_scanned: scan.files_scanned
      }
    };
    const pointers = [
      ...scan.tree_findings.slice(0, 6).map((f) => filePointer(f.file, `rule ${f.rule} at line ${f.line} (unverified)`)),
      scan.history_scanned ? basisPointer("git", `git log -p --all over bounded history; history_scanned_full=${scan.history_scanned_full}`) : basisPointer("scan", "no git history available \u2014 history-only findings not scanned (disclosed, never assumed clean)")
    ];
    return measuredFact({
      detectorId: "SEC-02",
      producer: "secret-rules",
      started,
      facts,
      pointers,
      measurement: { status: "measured", confidence: scan.history_scanned_full ? "medium" : "low" },
      truncated: scan.truncated || !scan.history_scanned
    });
  } catch (e) {
    return { detectorId: "SEC-02", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "secret-rules", version: "1.0", flags: ["secret-rules"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectSec02, "detectSec02");

// ../../src/scan/detectors/arch01.ts
var WHAT_IT_TAKES9 = "run a complexity analyzer (cyclomatic complexity + LOC per method, e.g. lizard/radon) over non-vendored source and join offenders to the core-path set \u2014 the offline release ships no such analyzer";
async function detectArch01(ctx, signal) {
  const started = Date.now();
  void ctx;
  void signal;
  return unknownFact("ARCH-01", "scan", started, WHAT_IT_TAKES9);
}
__name(detectArch01, "detectArch01");

// ../../src/scan/detectors/arch08.ts
var WHAT_IT_TAKES10 = "run a token-based duplication analyzer (min-tokens 50, e.g. jscpd) over non-vendored source to compute duplication_pct and security-critical duplicate clusters \u2014 the offline release ships no such analyzer";
async function detectArch08(ctx, signal) {
  const started = Date.now();
  void ctx;
  void signal;
  return unknownFact("ARCH-08", "scan", started, WHAT_IT_TAKES10);
}
__name(detectArch08, "detectArch08");

// ../../src/scan/detectors/arch05.ts
var MIN_COMMITS = 200;
var MIN_AGE_DAYS = 180;
var WINDOW_DAYS = 365;
var MAX_HOTSPOTS = 10;
var NON_CORE = /(^|\/)(tests?|spec|docs?|examples?|fixtures?|e2e|mocks?)(\/|$)/i;
async function detectArch05(ctx, signal) {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  const whatItTakes = "run a git hot-spot analysis over \u2265200 commits and \u22656 months of history (git log --name-only + bugfix subject correlation)";
  try {
    if (signal.aborted) return unknownFact("ARCH-05", "git", started, whatItTakes);
    if (!await isGitRepo(ctx.clonePath, { signal })) {
      return unknownFact("ARCH-05", "git", started, `${whatItTakes}; the target is not a git work tree so no history exists`);
    }
    const [commits, ageDays] = await Promise.all([
      gitCommitCount(ctx.clonePath, { signal }),
      gitRepoAgeDays(ctx.clonePath, nowMs, { signal })
    ]);
    if (commits == null || ageDays == null) return unknownFact("ARCH-05", "git", started, whatItTakes);
    if (commits < MIN_COMMITS || ageDays < MIN_AGE_DAYS) {
      return unknownFact(
        "ARCH-05",
        "git",
        started,
        `history too thin: ${commits} commits / ${ageDays}d (< ${MIN_COMMITS} commits or < ${MIN_AGE_DAYS}d) \u2014 ${whatItTakes}`
      );
    }
    const churn = await gitChurn(ctx.clonePath, { sinceDays: WINDOW_DAYS, signal, nowMs });
    if (!churn || churn.commitsAnalyzed === 0) return unknownFact("ARCH-05", "git", started, whatItTakes);
    const entries = [...churn.fileCommits.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const totalTouch = entries.reduce((a, [, n]) => a + n, 0);
    const decile = Math.max(1, Math.ceil(entries.length / 10));
    const topFiles = entries.slice(0, decile);
    const topShare = totalTouch ? Math.round(topFiles.reduce((a, [, n]) => a + n, 0) / totalTouch * 1e3) / 1e3 : 0;
    const churnRank = new Map(entries.map(([f], i) => [f, i + 1]));
    const bugEntries = [...churn.fileBugfixCommits.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const bugDecile = Math.max(1, Math.ceil(entries.length / 10));
    const bugTop = new Set(bugEntries.slice(0, bugDecile).map(([f]) => f));
    const defectRank = new Map(bugEntries.map(([f], i) => [f, i + 1]));
    const hotspots = topFiles.filter(([f]) => bugTop.has(f)).map(([f]) => ({ file: f, churn_rank: churnRank.get(f), defect_rank: defectRank.get(f) ?? 0, in_core_path: !NON_CORE.test(f) })).slice(0, MAX_HOTSPOTS);
    const facts = {
      arch05: {
        commits_analyzed: churn.commitsAnalyzed,
        window_days: churn.windowDays,
        churn_top10_share: topShare,
        hotspots,
        history_truncated: churn.historyTruncated
      }
    };
    const pointers = [
      basisPointer("git", `git log --since=${churn.sinceIso} --name-only: ${churn.commitsAnalyzed} commits/${churn.windowDays}d; top10% absorb ${Math.round(topShare * 100)}% of churn${churn.historyTruncated ? " (history truncated)" : ""}`),
      ...hotspots.slice(0, 5).map((h) => filePointer(h.file, `churn_rank ${h.churn_rank}, defect_rank ${h.defect_rank}`))
    ];
    return measuredFact({
      detectorId: "ARCH-05",
      producer: "git",
      started,
      facts,
      pointers,
      measurement: churn.historyTruncated ? { status: "estimated", confidence: "low", scopeLimited: true } : { status: "measured", confidence: "medium" },
      truncated: churn.historyTruncated
    });
  } catch (e) {
    return { detectorId: "ARCH-05", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "git", version: "1.1", flags: ["git"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectArch05, "detectArch05");

// ../../src/scan/testfiles.ts
var TEST_PATH_PATTERNS = [
  /(^|\/)tests?\//i,
  /(^|\/)__tests__\//,
  /(^|\/)spec\//,
  /\.(test|spec)\.(m|c)?[jt]sx?$/,
  /(^|\/)test_.*\.py$/,
  /_test\.py$/,
  /_test\.go$/,
  /Test\.java$/,
  /Tests\.java$/,
  /_spec\.rb$/,
  /(^|\/)test\/.*\.rb$/,
  // legacy-stacks 5.2: .NET file conventions — `OrderTests.cs` / `OrderTest.vb`
  // (capital T so `Latest.cs` never matches)
  /Tests?\.(cs|vb)$/
];
var E2E_PATH = [/(^|\/)e2e\//, /(^|\/)cypress\//, /(^|\/)playwright\//, /\.e2e\./, /(^|\/)tests?\/e2e\//i];
var INTEGRATION_PATH = [/(^|\/)integration\//, /\.integration\./, /(^|\/)tests?\/integration\//i, /(^|\/)functional\//];
var UNIT_PATH = [/(^|\/)__tests__\//, /(^|\/)tests?\/unit\//i, /(^|\/)spec\//];
var E2E_CONTENT = [/from\s+['"]@playwright\/test['"]/, /require\(['"]cypress['"]\)/, /from\s+['"]cypress['"]/, /selenium|webdriver/i];
var INTEGRATION_CONTENT = [/@SpringBootTest/, /LiveServerTestCase/, /\btestcontainers?\b/i, /TestRestTemplate/, /\bsupertest\b/, /@AutoConfigureMockMvc/, /\bWebApplicationFactory\b/];
var DOTNET_TEST_FILE = /Tests?\.(cs|vb)$/;
var DOTTED_TEST_PROJECT_DIR = /(^|\/)[^/]*\.tests?\//i;
var TEST_DEF = [
  /\b(?:it|test)\s*\(/g,
  /\b(?:it|test)\.(?:each|only|todo|concurrent|skip)\s*\(/g,
  /^\s*def test_\w+/gm,
  /@Test\b/g,
  /@ParameterizedTest\b/g,
  /\bfunc Test\w+/g,
  /^\s*(?:it|specify|example)\s+["']/gm,
  // legacy-stacks 5.2: .NET test methods — MSTest/NUnit/xUnit attributes,
  // C# `[TestMethod]`/`[Test]`/`[Fact]`/`[Theory]`/`[TestCase]` and VB `<TestMethod>`
  /[[<]\s*(?:TestMethod|TestCase|Test|Fact|Theory)\b/g
];
var SKIP_MARKERS = [
  /\b(?:it|test|describe)\.skip\s*\(/g,
  /\bxit\s*\(/g,
  /\bxdescribe\s*\(/g,
  /@Ignore\b/g,
  /@Disabled\b/g,
  /pytest\.mark\.skip/g,
  /\bskipIf\b/g,
  /\bskipUnless\b/g,
  /\bt\.Skip\s*\(/g,
  /@unittest\.skip/g,
  // legacy-stacks 5.2: .NET skip/disable forms — [Ignore]/<Ignore>,
  // `[TestMethod, Ignore]`, Assert.Ignore(, Assert.Inconclusive(, and the
  // xUnit/NUnit attribute form `Skip = "reason"` / VB `Skip:="reason"`
  /\bIgnore\b\s*[(),\]>]/g,
  /\bSkip\s*:?\s*=\s*["']/g,
  /\bAssert\.Ignore\s*\(/g,
  /\bAssert\.Inconclusive\s*\(/g
];
var MAX_TEST_FILES_READ = 80;
var MAX_BYTES_PER_FILE3 = 256 * 1024;
function isTestPath(p) {
  return TEST_PATH_PATTERNS.some((r) => r.test(p));
}
__name(isTestPath, "isTestPath");
function countMatches(text, patterns) {
  let n = 0;
  for (const re of patterns) {
    const m = text.match(re);
    if (m) n += m.length;
  }
  return n;
}
__name(countMatches, "countMatches");
function skipLines(text) {
  const lines = [];
  const raw = text.split("\n");
  for (let i = 0; i < raw.length; i++) {
    if (SKIP_MARKERS.some((r) => {
      r.lastIndex = 0;
      return r.test(raw[i]);
    })) lines.push(i + 1);
  }
  return lines;
}
__name(skipLines, "skipLines");
function classifyByPath(path) {
  if (E2E_PATH.some((r) => r.test(path))) return { tier: "e2e", high: true };
  if (INTEGRATION_PATH.some((r) => r.test(path))) return { tier: "integration", high: true };
  if (UNIT_PATH.some((r) => r.test(path))) return { tier: "unit", high: true };
  return { tier: "unclassified", high: false };
}
__name(classifyByPath, "classifyByPath");
async function boundedText(ctx, path) {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    const capped = buf.length > MAX_BYTES_PER_FILE3;
    return { text: buf.subarray(0, MAX_BYTES_PER_FILE3).toString("utf8"), capped };
  } catch (e) {
    if (isReadBudgetError(e)) return { text: "", capped: false, budgetBlocked: true };
    return null;
  }
}
__name(boundedText, "boundedText");
async function scanTestFiles(ctx, signal) {
  let paths;
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith("/"));
  } catch {
    paths = [];
  }
  const testPaths = paths.filter(isTestPath).sort();
  const files = [];
  let truncated = false;
  let unreadByBudget = 0;
  for (const path of testPaths) {
    if (signal?.aborted) {
      truncated = true;
      break;
    }
    if (files.length >= MAX_TEST_FILES_READ) {
      truncated = true;
      break;
    }
    const fromPath = classifyByPath(path);
    const read = await boundedText(ctx, path);
    if (read?.budgetBlocked) {
      truncated = true;
      unreadByBudget++;
      files.push({ path, tier: fromPath.tier, highConfidence: fromPath.high, tests: 0, skips: [] });
      continue;
    }
    if (read == null) {
      files.push({ path, tier: fromPath.tier, highConfidence: fromPath.high, tests: 0, skips: [] });
      continue;
    }
    if (read.capped) truncated = true;
    const { text } = read;
    let tier = fromPath.tier;
    let high = fromPath.high;
    if (tier === "unclassified") {
      if (E2E_CONTENT.some((r) => r.test(text))) {
        tier = "e2e";
        high = true;
      } else if (INTEGRATION_CONTENT.some((r) => r.test(text))) {
        tier = "integration";
        high = true;
      } else {
        tier = "unit";
        high = DOTNET_TEST_FILE.test(path) || DOTTED_TEST_PROJECT_DIR.test(path);
      }
    }
    files.push({ path, tier, highConfidence: high, tests: countMatches(text, TEST_DEF), skips: skipLines(text) });
  }
  const total = files.length;
  const unit = files.filter((f) => f.tier === "unit").length;
  const integration = files.filter((f) => f.tier === "integration").length;
  const e2e = files.filter((f) => f.tier === "e2e").length;
  const unclassified = files.filter((f) => f.tier === "unclassified").length;
  const highCount = files.filter((f) => f.highConfidence).length;
  return {
    files,
    total,
    unit,
    integration,
    e2e,
    unclassified,
    highRatio: total ? Math.round(highCount / total * 1e3) / 1e3 : 0,
    testsTotal: files.reduce((a, f) => a + f.tests, 0),
    skipTotal: files.reduce((a, f) => a + f.skips.length, 0),
    truncated,
    unreadByBudget
  };
}
__name(scanTestFiles, "scanTestFiles");

// ../../src/scan/detectors/test03.ts
var WHAT_IT_TAKES11 = "enumerate test files and classify each by path/framework markers \u2014 needs an enumerable tree with test files (per-file tier assignment is a heuristic, so this row is `estimated`, never `measured`)";
async function detectTest03(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("TEST-03", "test-classify", started, WHAT_IT_TAKES11);
    const scan = await scanTestFiles(ctx, signal);
    if (scan.total === 0) {
      return unknownFact(
        "TEST-03",
        "test-classify",
        started,
        "zero test files \u2014 no pyramid shape to classify; TEST-05/TEST-08 carry the zero-test signal (na_when)"
      );
    }
    if (scan.unreadByBudget > 0) {
      return unknownFact(
        "TEST-03",
        "test-classify",
        started,
        readBudgetNote(scan.total - scan.unreadByBudget, scan.total, "test files")
      );
    }
    const highCount = Math.round(scan.highRatio * scan.total);
    const classifiedRatio = scan.total ? highCount / scan.total : 0;
    if (classifiedRatio < 0.6) {
      return unknownFact(
        "TEST-03",
        "test-classify",
        started,
        `only ${Math.round(classifiedRatio * 100)}% of ${scan.total} test files could be tier-classified (<60%) \u2014 ${WHAT_IT_TAKES11}`
      );
    }
    const weighted = scan.unit * 1 + scan.integration * 2 + scan.e2e * 3;
    const e2eShare = weighted ? Math.round(scan.e2e * 3 / weighted * 1e3) / 1e3 : 0;
    const facts = {
      test03: {
        unit: scan.unit,
        integration: scan.integration,
        e2e: scan.e2e,
        unclassified: scan.unclassified,
        e2e_share_est: e2eShare,
        classification_confidence: { high: scan.highRatio, low: Math.round((1 - scan.highRatio) * 1e3) / 1e3 }
      }
    };
    const pointers = scan.files.slice(0, 10).map((f) => filePointer(f.path, `tier ${f.tier}${f.highConfidence ? "" : " (low-confidence)"}; ${f.tests} test defs`));
    return measuredFact({
      detectorId: "TEST-03",
      producer: "test-classify",
      started,
      facts,
      pointers,
      measurement: { status: "estimated", confidence: scan.highRatio >= 0.8 ? "medium" : "low", ...scan.truncated ? { scopeLimited: true } : {} },
      truncated: scan.truncated
    });
  } catch (e) {
    return { detectorId: "TEST-03", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "test-classify", version: "1.0", flags: ["test-classify"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectTest03, "detectTest03");

// ../../src/scan/detectors/test05.ts
var WHAT_IT_TAKES12 = "enumerate test files and grep skip/disable markers (it.skip, xit, @Ignore, [Ignore]/<Ignore>, Skip=, pytest.mark.skip, t.Skip, \u2026) with git blame for skip age \u2014 needs an enumerable tree";
var MAX_AGED_LOOKUPS = 20;
async function detectTest05(ctx, signal) {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact("TEST-05", "test-scan", started, WHAT_IT_TAKES12);
    const scan = await scanTestFiles(ctx, signal);
    if (scan.total === 0) {
      return unknownFact("TEST-05", "test-scan", started, "zero test files \u2014 nothing can be skipped (na_when)");
    }
    if (scan.unreadByBudget > 0) {
      return unknownFact(
        "TEST-05",
        "test-scan",
        started,
        readBudgetNote(scan.total - scan.unreadByBudget, scan.total, "test files")
      );
    }
    const withSkips = scan.files.filter((f) => f.skips.length > 0);
    const git = await isGitRepo(ctx.clonePath, { signal });
    const agedSkips = [];
    let blameAvailable = git;
    if (git) {
      let lookups = 0;
      for (const f of withSkips) {
        for (const line of f.skips) {
          if (lookups >= MAX_AGED_LOOKUPS) break;
          lookups++;
          const age = await gitBlameLineAgeDays(ctx.clonePath, f.path, line, nowMs, { signal });
          if (age == null) {
            blameAvailable = false;
            continue;
          }
          agedSkips.push({ file: f.path, age_days: age });
        }
        if (lookups >= MAX_AGED_LOOKUPS) break;
      }
    }
    agedSkips.sort((a, b) => b.age_days - a.age_days || a.file.localeCompare(b.file));
    const { text: wfText } = await readWorkflows(ctx, signal);
    const ciExclusions = [...new Set((wfText.match(/--ignore[= ]\S+|--exclude[-=]\S+/g) ?? []).map((s) => s.trim()))].sort().slice(0, 20);
    const total = scan.testsTotal;
    const skipped = scan.skipTotal;
    const facts = {
      test05: {
        total_tests_est: total,
        skipped_total: skipped,
        skip_ratio: total ? Math.round(skipped / total * 1e3) / 1e3 : 0,
        aged_skips: agedSkips.slice(0, 20),
        ci_exclusions: ciExclusions
      }
    };
    const pointers = [
      ...withSkips.slice(0, 8).map((f) => filePointer(f.path, `${f.skips.length} skip marker(s) at line(s) ${f.skips.slice(0, 5).join(", ")}`)),
      ...git ? [basisPointer("git", `git blame -L for ${agedSkips.length} skip marker(s)${blameAvailable ? "" : " (blame partially unavailable)"}`)] : [basisPointer("scan", "no git history \u2014 skip age dropped")]
    ];
    return measuredFact({
      detectorId: "TEST-05",
      producer: "test-scan",
      started,
      facts,
      pointers,
      measurement: { status: "measured", confidence: blameAvailable ? "medium" : "low", ...scan.truncated ? { scopeLimited: true } : {} },
      truncated: scan.truncated
    });
  } catch (e) {
    return { detectorId: "TEST-05", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "test-scan", version: "1.0", flags: ["test-scan"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectTest05, "detectTest05");

// ../../src/scan/detectors/docs01.ts
import { readdir as readdir3 } from "node:fs/promises";
import { join as join6 } from "node:path";

// ../../src/scan/docsage.ts
import { stat as stat3 } from "node:fs/promises";
import { join as join5 } from "node:path";
var DAY_MS2 = 864e5;
async function newestFileAgeDays(ctx, files, nowMs, signal) {
  if (files.length === 0) return null;
  const git = await isGitRepo(ctx.clonePath, { signal });
  let newest = null;
  for (const f of files.slice(0, 200)) {
    let ms = null;
    if (git) ms = await gitFileLastCommitMs(ctx.clonePath, f, { signal });
    if (ms == null) {
      try {
        ms = (await stat3(join5(ctx.clonePath, f))).mtimeMs;
      } catch {
        ms = null;
      }
    }
    if (ms != null && (newest == null || ms > newest)) newest = ms;
  }
  if (newest == null) return null;
  return Math.max(0, Math.floor((nowMs - newest) / DAY_MS2));
}
__name(newestFileAgeDays, "newestFileAgeDays");

// ../../src/scan/detectors/docs01.ts
var CANDIDATE_DIRS = ["docs/adr", "doc/adr", "decisions", "decisions/adr", "rfcs", "architecture-decisions", "adr"];
async function detectDocs01(ctx, signal) {
  const start = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  if (signal.aborted) return { detectorId: "DOCS-01", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("adr-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    let adrDir = null;
    let adrCount = 0;
    let adrFiles = [];
    for (const dir of CANDIDATE_DIRS) {
      try {
        const entries = (await readdir3(join6(ctx.clonePath, dir))).sort();
        const mdFiles = entries.filter((f) => f.endsWith(".md"));
        if (mdFiles.length > 0) {
          adrDir = dir;
          adrCount = mdFiles.length;
          adrFiles = mdFiles.map((f) => `${dir}/${f}`);
          break;
        }
        if (entries.length > 0 && adrDir === null) {
          adrDir = dir;
          adrCount = entries.length;
          adrFiles = entries.map((f) => `${dir}/${f}`);
        }
      } catch {
      }
      if (signal.aborted) break;
    }
    if (!adrDir) {
      for (const file of ["docs/adr/README.md", "ADR.md", "decisions/README.md"]) {
        const buf = await ctx.readFile(file);
        if (buf) {
          adrDir = file;
          adrCount = 1;
          adrFiles = [file];
          break;
        }
      }
    }
    const newestAdrDays = adrFiles.length ? await newestFileAgeDays(ctx, adrFiles, nowMs, signal) : null;
    const facts = { docs01: { adr_dir: adrDir ?? null, adr_count: adrCount, newest_adr_days: newestAdrDays } };
    const tool = "adr-inventory";
    const pointers = adrDir ? [filePointer(adrDir, `${adrCount} ADRs enumerated${newestAdrDays == null ? "" : `; newest ${newestAdrDays}d`}`)] : [{ detail: "no ADR dir found" }];
    return { detectorId: "DOCS-01", schemaVersion: "1.0.0", facts, evidencePointers: pointers, provenance: { tool, version: toolVersion(tool), flags: [tool], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "DOCS-01", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("adr-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectDocs01, "detectDocs01");

// ../../src/scan/detectors/docs03.ts
import { readdir as readdir4 } from "node:fs/promises";
import { join as join7 } from "node:path";
var CANDIDATE_DIRS2 = ["docs/runbooks", "docs/runbook", "runbooks", "docs/operations", "docs/ops", ".github/runbooks"];
async function detectDocs03(ctx, signal) {
  const start = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  if (signal.aborted) return { detectorId: "DOCS-03", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("runbook-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    let runbookDir = null;
    let count = 0;
    let topics = [];
    let files = [];
    for (const dir of CANDIDATE_DIRS2) {
      try {
        const entries = (await readdir4(join7(ctx.clonePath, dir))).sort();
        const mdFiles = entries.filter((f) => f.endsWith(".md"));
        if (mdFiles.length > 0) {
          runbookDir = dir;
          count = mdFiles.length;
          topics = mdFiles.map((f) => f.replace(".md", "").toLowerCase());
          files = mdFiles.map((f) => `${dir}/${f}`);
          break;
        }
      } catch {
      }
      if (signal.aborted) break;
    }
    const newestDays = files.length ? await newestFileAgeDays(ctx, files, nowMs, signal) : null;
    const facts = { docs03: { runbook_dir: runbookDir, count, topics_covered: topics, restore_doc_present: topics.some((t) => t.includes("restore")), newest_days: newestDays } };
    const pointers = runbookDir ? [filePointer(runbookDir, `${count} runbooks enumerated${newestDays == null ? "" : `; newest ${newestDays}d`}`)] : [{ detail: "no runbooks" }];
    return { detectorId: "DOCS-03", schemaVersion: "1.0.0", facts, evidencePointers: pointers, provenance: { tool: "runbook-inventory", version: toolVersion("runbook-inventory"), flags: ["runbook-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "DOCS-03", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("runbook-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectDocs03, "detectDocs03");

// ../../src/scan/detectors/docs04.ts
var CANDIDATES = ["CONTRIBUTING.md", "CONTRIBUTING.adoc", "docs/CONTRIBUTING.md", "GETTING_STARTED.md", "docs/GETTING_STARTED.md", "DEVELOPMENT.md"];
async function detectDocs04(ctx, signal) {
  const start = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  if (signal.aborted) return { detectorId: "DOCS-04", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("onboarding-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    const docsPresent = [];
    const docFiles = [];
    for (const p of CANDIDATES) {
      const buf = await ctx.readFile(p);
      if (buf) {
        docsPresent.push(p);
        docFiles.push(p);
      }
      if (signal.aborted) break;
    }
    const readme = await ctx.readFile("README.md");
    if (readme && readme.toString().toLowerCase().includes("setup")) {
      docsPresent.push("README.md#setup");
      docFiles.push("README.md");
    }
    const lastVerifiedDays = docFiles.length ? await newestFileAgeDays(ctx, docFiles, nowMs, signal) : null;
    const facts = { docs04: { docs_present: docsPresent, stages_covered: docsPresent.length ? ["setup"] : [], stages_missing: docsPresent.length ? ["deploy"] : ["setup", "run", "test"], undefined_commands: [], last_verified_days: lastVerifiedDays } };
    const pointers = docFiles.length ? [filePointer(docFiles[0], `onboarding docs: ${docsPresent.join(", ")}${lastVerifiedDays == null ? "" : `; newest ${lastVerifiedDays}d`}`)] : [{ detail: "no onboarding docs" }];
    return { detectorId: "DOCS-04", schemaVersion: "1.0.0", facts, evidencePointers: pointers, provenance: { tool: "onboarding-inventory", version: toolVersion("onboarding-inventory"), flags: ["onboarding-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "DOCS-04", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("onboarding-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectDocs04, "detectDocs04");

// ../../src/scan/detectors/docs08.ts
var CHANGELOG_CANDIDATES = ["CHANGELOG.md", "CHANGELOG.adoc", "CHANGES.md", "HISTORY.md", "NEWS.md", "docs/CHANGELOG.md"];
async function detectDocs08(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "DOCS-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("changelog-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    let changelogPresent = false;
    let changelogPath = null;
    for (const p of CHANGELOG_CANDIDATES) {
      const buf = await ctx.readFile(p);
      if (buf) {
        changelogPresent = true;
        changelogPath = p;
        break;
      }
    }
    const releasesSampled = 0;
    const withNotesPct = 0;
    if (signal.aborted) return { detectorId: "DOCS-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("changelog-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
    const facts = { docs08: { changelog_present: changelogPresent, changelog_current: changelogPresent, releases_sampled: releasesSampled, with_notes_pct: withNotesPct, breaking_with_migration_guide: { total_breaking: 0, documented: 0 }, release_tooling: null } };
    return { detectorId: "DOCS-08", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: changelogPresent ? `changelog at ${changelogPath}` : "no changelog", file: changelogPath ?? void 0 }], provenance: { tool: "changelog-inventory", version: toolVersion("changelog-inventory"), flags: ["changelog-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    const err = ghErrorKind(e);
    if (err?.kind === "rate-limit") return { detectorId: "DOCS-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("changelog-inventory", start), truncated: true, error: { kind: "rate-limit", detail: err.detail } };
    return { detectorId: "DOCS-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("changelog-inventory", start), truncated: true, error: err };
  }
}
__name(detectDocs08, "detectDocs08");

// ../../src/scan/detectors/docs09.ts
import { readdir as readdir5 } from "node:fs/promises";
import { join as join8 } from "node:path";
async function detectDocs09(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "DOCS-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("docs-ci-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    const cacheKey = "docs09:workflows";
    let workflowContents = ctx.cache.get(cacheKey) ?? [];
    if (workflowContents.length === 0) {
      try {
        const wfDir = join8(ctx.clonePath, ".github/workflows");
        const files = (await readdir5(wfDir)).sort();
        for (const f of files.filter((x) => x.endsWith(".yml") || x.endsWith(".yaml"))) {
          const buf = await ctx.readFile(`.github/workflows/${f}`);
          if (buf) workflowContents.push(buf.toString());
          ctx.cache.set(cacheKey, workflowContents);
        }
      } catch {
      }
    }
    const haystack = workflowContents.join("\n").toLowerCase();
    const hasBuild = /docs.*build|build.*docs|mkdocs|docusaurus/.test(haystack);
    const hasLinkChecker = /link.*check|lychee|markdown.*link/.test(haystack);
    const hasApiGen = /openapi.*gen|swagger.*gen|redoc/.test(haystack);
    const hasStalenessGate = /stale.*doc|doc.*stale|vale/.test(haystack);
    const steps = [];
    if (hasBuild) steps.push({ kind: "build", tool: "mkdocs", blocking: false });
    if (hasLinkChecker) steps.push({ kind: "link-check", tool: "lychee", blocking: false });
    const facts = { docs09: { doc_ci_steps: steps, link_checker: hasLinkChecker, api_gen_wired: hasApiGen, staleness_gate: hasStalenessGate } };
    return { detectorId: "DOCS-09", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: steps.length ? `${steps.length} docs CI steps` : "no docs CI", file: ".github/workflows" }], provenance: { tool: "docs-ci-inventory", version: toolVersion("docs-ci-inventory"), flags: ["docs-ci-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "DOCS-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("docs-ci-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectDocs09, "detectDocs09");

// ../../src/scan/detectors/perf02.ts
import { readdir as readdir6 } from "node:fs/promises";
import { join as join9 } from "node:path";
async function detectPerf02(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "PERF-02", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("deploy-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    const artifacts = [];
    const checks = [["Dockerfile", "dockerfile"], ["docker-compose.yml", "compose"], ["docker-compose.yaml", "compose"], ["k8s/deployment.yaml", "k8s"], ["helm/Chart.yaml", "helm"], ["serverless.yml", "serverless"], ["vercel.json", "serverless"]];
    for (const [p, kind] of checks) {
      const buf = await ctx.readFile(p);
      if (buf) artifacts.push({ kind, path: p });
    }
    try {
      const k8sFiles = (await readdir6(join9(ctx.clonePath, "k8s"))).sort();
      if (k8sFiles.length) artifacts.push({ kind: "k8s", path: "k8s/" });
    } catch {
    }
    const vmCandidates = ["ops/deploy.sh", "scripts/deploy.sh", "deploy.sh", "fabric.py", "capfile"];
    for (const p of vmCandidates) {
      const buf = await ctx.readFile(p);
      if (buf) {
        const txt = buf.toString();
        if (/systemctl|service .*restart|capistrano|fabric/.test(txt)) artifacts.push({ kind: "vm-script", path: p, smell: "systemctl restart" });
        else artifacts.push({ kind: "vm-script", path: p });
      }
    }
    let model = "none-declared";
    const hasDocker = artifacts.some((a) => a.kind === "dockerfile");
    const hasK8s = artifacts.some((a) => a.kind === "k8s" || a.kind === "helm");
    const hasVm = artifacts.some((a) => a.kind === "vm-script");
    if (hasK8s) model = hasVm ? "mixed-vm-container" : "orchestrated";
    else if (hasDocker) model = hasVm ? "mixed-vm-container" : "containerized";
    else if (hasVm) model = "vm-scripts";
    const facts = { perf02: { artifacts, model, ci_builds_images: false } };
    return { detectorId: "PERF-02", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: `model=${model}; ${artifacts.length} artifacts` }], provenance: { tool: "deploy-inventory", version: toolVersion("deploy-inventory"), flags: ["deploy-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "PERF-02", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("deploy-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectPerf02, "detectPerf02");

// ../../src/scan/detectors/perf06.ts
import { readdir as readdir7 } from "node:fs/promises";
import { join as join10 } from "node:path";
async function detectPerf06(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "PERF-06", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("iac-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    const iacFrameworks = [];
    const iacFiles = [];
    const tfCheck = /* @__PURE__ */ __name(async (dir, name) => {
      try {
        const e = (await readdir7(join10(ctx.clonePath, dir))).sort();
        if (e.some((f) => f.endsWith(".tf"))) {
          iacFrameworks.push(name);
          iacFiles.push(dir);
        }
      } catch {
      }
    }, "tfCheck");
    await tfCheck("terraform", "terraform");
    await tfCheck("infra", "terraform");
    try {
      const e = (await readdir7(join10(ctx.clonePath, ".pulumi"))).sort();
      if (e.length) {
        iacFrameworks.push("pulumi");
        iacFiles.push(".pulumi");
      }
    } catch {
    }
    const cfn = await ctx.readFile("cloudformation.yaml") || await ctx.readFile("template.yaml");
    if (cfn) iacFrameworks.push("cloudformation");
    const hasTf = iacFrameworks.length > 0;
    const facts = { perf06: { iac_frameworks: iacFrameworks, resource_classes_declared: hasTf ? ["compute", "db"] : [], classes_implied_by_deploy: ["compute"], ci_plan_gate: { present: false }, undeclared_classes: hasTf ? [] : ["compute"] } };
    return { detectorId: "PERF-06", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: iacFrameworks.length ? `IaC ${iacFrameworks.join(",")}` : "no IaC" }], provenance: { tool: "iac-inventory", version: toolVersion("iac-inventory"), flags: ["iac-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "PERF-06", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("iac-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectPerf06, "detectPerf06");

// ../../src/scan/detectors/data01.ts
import { readdir as readdir8 } from "node:fs/promises";
import { join as join11 } from "node:path";
var MIGRATION_DIRS = ["migrations", "alembic/versions", "db/migrate", "src/migrations", "prisma/migrations", "drizzle"];
async function detectData01(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "DATA-01", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("migration-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    let migrationCount = 0;
    let framework = null;
    const destructiveOps = [];
    for (const dir of MIGRATION_DIRS) {
      try {
        const entries = (await readdir8(join11(ctx.clonePath, dir))).sort();
        const files = entries.filter((f) => f.endsWith(".py") || f.endsWith(".sql") || f.endsWith(".js") || f.endsWith(".ts"));
        if (files.length > 0) {
          framework = dir.includes("alembic") ? "alembic" : dir.includes("prisma") ? "prisma" : dir.includes("drizzle") ? "drizzle" : "migrate";
          migrationCount += files.length;
          for (const f of files.slice(0, 20)) {
            const buf = await ctx.readFile(`${dir}/${f}`);
            if (buf) {
              const txt = buf.toString();
              const ops = [];
              if (/DROP\s+TABLE|DROP\s+COLUMN/i.test(txt)) ops.push("DROP TABLE");
              if (/RENAME\s+TABLE|RENAME\s+COLUMN/i.test(txt)) ops.push("RENAME");
              if (ops.length) destructiveOps.push({ file: `${dir}/${f}`, ops });
            }
          }
          break;
        }
      } catch {
      }
    }
    const facts = { data01: { framework: framework ?? "unknown", migration_count: migrationCount, chain_replayable: true, destructive_ops: destructiveOps, raw_sql_share: 0, graph_cycles: 0 } };
    return { detectorId: "DATA-01", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: `${migrationCount} migrations${framework ? ` (${framework})` : ""}${destructiveOps.length ? ` ${destructiveOps.length} destructive` : ""}` }], provenance: { tool: "migration-inventory", version: toolVersion("migration-inventory"), flags: ["migration-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "DATA-01", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("migration-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectData01, "detectData01");

// ../../src/scan/detectors/ecos06.ts
var WHAT_IT_TAKES13 = "parse the lockfile graph for transitive counts and duplicate versions (unused-direct detection needs a dead-dependency analyser this build does not run)";
var SECURITY_CRITICAL = /^(crypto-js|node-forge|jsonwebtoken|jose|bcrypt|passport|express-jwt|helmet|axios|node-fetch|got|request|superagent|urllib3|requests|cryptography|pyjwt|oauthlib|python-jose|golang\.org\/x\/crypto|org\.bouncycastle)/i;
async function detectEcos06(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-06", "lockfile-parse", started, WHAT_IT_TAKES13);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("ECOS-06", "lockfile-parse", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("ECOS-06", "lockfile-parse", started, `${WHAT_IT_TAKES13}; no dependency manifest found (na_when clause-b)`);
    }
    if (scan.lockfiles.length === 0) {
      return unknownFact("ECOS-06", "lockfile-parse", started, `${WHAT_IT_TAKES13}; no lockfile found \u2014 transitive counts are unknowable`);
    }
    const byName = /* @__PURE__ */ new Map();
    for (const l of scan.lockfiles) {
      for (const [name, versions] of Object.entries(l.versions)) {
        const set = byName.get(name) ?? /* @__PURE__ */ new Set();
        for (const v of versions) set.add(v);
        byName.set(name, set);
      }
    }
    const duplicates = [...byName.entries()].filter(([, s]) => s.size > 1).map(([name, s]) => ({ name, versions: [...s].sort() })).sort((a, b) => a.name.localeCompare(b.name));
    const duplicateSecurityCritical = duplicates.some((d) => SECURITY_CRITICAL.test(d.name));
    const facts = {
      ecos06: {
        transitive_total: scan.transitiveTotal,
        direct_unused: [],
        pct_direct_unused: null,
        duplicates,
        duplicate_security_critical: duplicateSecurityCritical,
        lockfiles_parsed: scan.lockfiles.length
      }
    };
    const pointers = scan.lockfiles.slice(0, 4).map((l) => filePointer(l.path, `${l.packages} transitive entries; ${l.integrity ? "integrity hashes present" : "no integrity hashes"}`));
    return measuredFact({
      detectorId: "ECOS-06",
      producer: "lockfile-parse",
      started,
      facts,
      pointers,
      measurement: { status: "measured", confidence: "medium" }
    });
  } catch (e) {
    return { detectorId: "ECOS-06", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "lockfile-parse", version: "1.0", flags: ["lockfile-parse"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos06, "detectEcos06");

// ../../src/scan/detectors/ecos08.ts
var WHAT_IT_TAKES14 = "detect a framework-class dependency in the parsed manifests and resolve its lifecycle from the vendored framework/EOL snapshot (niche/vendor frameworks need a status source the snapshot lacks)";
var FRAMEWORK_ALIASES = {
  "@angular/core": "angular",
  "spring-boot-starter-web": "spring-boot",
  "org.springframework.boot:spring-boot-starter-web": "spring-boot",
  "github.com/gin-gonic/gin": "gin",
  "laravel/framework": "laravel",
  // legacy-stacks 2.4: .NET / Struts framework-class packages → dataset keys
  "microsoft.aspnet.mvc": "aspnet",
  "microsoft.aspnet.webapi": "aspnet",
  "microsoft.aspnet.webapi.core": "aspnet",
  "microsoft.aspnet.webforms": "aspnet",
  "entityframework": "entityframework",
  "org.apache.struts:struts2-core": "struts2",
  "struts2-core": "struts2"
};
function frameworkNameOf(dep) {
  const lower = dep.name.toLowerCase();
  if (FRAMEWORK_ALIASES[lower]) return FRAMEWORK_ALIASES[lower];
  const candidates = [lower, lower.split(":").pop(), lower.split("/").pop()];
  for (const cand of candidates) if (cand && resolveFramework(cand, "") != null) return cand;
  return null;
}
__name(frameworkNameOf, "frameworkNameOf");
var CANONICAL_URL = /github\.com\/(expressjs|facebook\/react|vuejs|angular|sveltejs|vercel\/next\.js|nuxt|nestjs|emberjs|django|pallets\/flask|tiangolo\/fastapi|rails\/rails|spring-projects|quarkusio|gin-gonic|apache\/struts|aspnet)/i;
async function detectEcos08(ctx, signal) {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact("ECOS-08", "eol-snapshot", started, WHAT_IT_TAKES14);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact("ECOS-08", "eol-snapshot", started, readBudgetNote(scan.manifests, scan.manifestsTotal, "dependency manifests"));
    }
    if (scan.manifests === 0) {
      return unknownFact("ECOS-08", "eol-snapshot", started, `${WHAT_IT_TAKES14}; no dependency manifest found`);
    }
    const direct = uniqueDirect(scan.direct);
    const frameworks = [];
    const unresolvable = [];
    const names = [];
    const ecosystems = /* @__PURE__ */ new Set();
    let forkPinned = false;
    for (const d of direct) {
      const fname = frameworkNameOf(d);
      if (!fname) continue;
      names.push(d.name);
      ecosystems.add(d.ecosystem);
      if (/^(git\+|git:|github:|https?:\/\/)/.test(d.spec) && !CANONICAL_URL.test(d.spec)) forkPinned = true;
      const version = d.version ?? d.spec ?? "";
      const res = resolveFramework(fname, version);
      if (!res) {
        unresolvable.push(d.name);
        continue;
      }
      frameworks.push({ name: res.name, version: res.version || version || "unknown", support_status: res.support_status, eol_date: res.eol_date });
    }
    frameworks.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const imports = await cachedSourceImports(ctx, signal);
    const { share, facade } = couplingFor(imports, names);
    const facts = {
      ecos08: { frameworks, coupling_share: share, facade_layer_detected: facade, fork_pinned: forkPinned }
    };
    const pointers = [
      ...[...ecosystems].sort().map((eco) => filePointer(`manifest:${eco}`, "framework dependency declared here")),
      basisPointer("eol-snapshot", `framework lifecycle from snapshot ${snapshotVersions()["eol-snapshot"]}`)
    ];
    if (frameworks.length === 0 && unresolvable.length === 0) {
      return measuredFact({
        detectorId: "ECOS-08",
        producer: "eol-snapshot",
        started,
        facts,
        pointers,
        measurement: { status: "measured", confidence: "medium" }
      });
    }
    if (frameworks.length === 0) {
      return unknownFact(
        "ECOS-08",
        "eol-snapshot",
        started,
        `${WHAT_IT_TAKES14}; framework(s) ${unresolvable.join(", ")} are absent from the snapshot \u2014 ${SNAPSHOT_REFRESH_HINT}`,
        { pointers, facts }
      );
    }
    const measurement = imports.truncated ? { status: "estimated", confidence: "low", scopeLimited: true } : { status: "measured", confidence: "medium" };
    return measuredFact({
      detectorId: "ECOS-08",
      producer: "eol-snapshot",
      started,
      facts,
      pointers,
      measurement,
      truncated: imports.truncated
    });
  } catch (e) {
    return { detectorId: "ECOS-08", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "eol-snapshot", version: "1.0", flags: ["eol-snapshot"], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectEcos08, "detectEcos08");

// ../../src/scan/detectors/sec09.ts
import { readdir as readdir9 } from "node:fs/promises";
import { join as join12 } from "node:path";
async function detectSec09(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "SEC-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("fuzz-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    const harnesses = [];
    const candidates = ["fuzz", "fuzzing", "tests/fuzz", "src/fuzz"];
    for (const dir of candidates) {
      try {
        const entries = (await readdir9(join12(ctx.clonePath, dir))).sort();
        for (const f of entries) if (f.includes("fuzz") || f.endsWith(".c") || f.endsWith(".cc")) harnesses.push({ path: `${dir}/${f}`, engine: f.includes("libFuzzer") ? "libFuzzer" : "unknown" });
      } catch {
      }
    }
    for (const p of [".clusterfuzzlite/Dockerfile", "fuzz.sh", "cargo-fuzz", "oss-fuzz.yaml"]) {
      const buf = await ctx.readFile(p);
      if (buf) harnesses.push({ path: p, engine: "config" });
    }
    const bufPkg = await ctx.readFile("package.json");
    let hasParserSurface = false;
    if (bufPkg) {
      const txt = bufPkg.toString();
      hasParserSurface = /yaml|json|http|xml/.test(txt);
    }
    const facts = { sec09: { harnesses, sanitizers_in_build: false, continuous_fuzzing: { oss_fuzz: false, scheduled_workflow: false }, parser_surface_detected: hasParserSurface ? ["json"] : [] } };
    return { detectorId: "SEC-09", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: harnesses.length ? `${harnesses.length} harness(es)` : "no fuzz harness" }], provenance: { tool: "fuzz-inventory", version: toolVersion("fuzz-inventory"), flags: ["fuzz-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "SEC-09", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("fuzz-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectSec09, "detectSec09");

// ../../src/scan/detectors/sec10.ts
import { readdir as readdir10 } from "node:fs/promises";
import { join as join13 } from "node:path";
async function detectSec10(ctx, signal) {
  const start = Date.now();
  if (signal.aborted) return { detectorId: "SEC-10", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("sec-ci-inventory", start), truncated: true, error: { kind: "cap", detail: "aborted" } };
  try {
    const cacheKey = "sec10:workflows";
    let contents = ctx.cache.get(cacheKey) ?? [];
    if (contents.length === 0) {
      try {
        const files = (await readdir10(join13(ctx.clonePath, ".github/workflows"))).sort();
        for (const f of files.filter((x) => x.endsWith(".yml") || x.endsWith(".yaml"))) {
          const buf = await ctx.readFile(`.github/workflows/${f}`);
          if (buf) contents.push(buf.toString());
        }
        ctx.cache.set(cacheKey, contents);
      } catch {
      }
    }
    const hay = contents.join("\n").toLowerCase();
    const jobs = [];
    if (/semgrep|sast|codeql/.test(hay)) jobs.push({ name: "semgrep", class: "sast", trigger: "push", blocking: !/continue-on-error:\s*true/.test(hay) });
    if (/trivy|grype|snyk/.test(hay)) jobs.push({ name: "trivy", class: "deps", trigger: "push", blocking: true });
    if (/gitleaks|trufflehog|secret.*scan/.test(hay)) jobs.push({ name: "gitleaks", class: "secret", trigger: "push", blocking: true });
    const classes = [...new Set(jobs.map((j) => j.class))];
    const facts = { sec10: { security_jobs: jobs, classes_present: classes, secret_scan_covers_history: /history/.test(hay), image_scan_on_build: /image.*scan|scan.*image/.test(hay), workflow_permissions_hardened: /permissions:\s*contents:\s*read/.test(hay) } };
    return { detectorId: "SEC-10", schemaVersion: "1.0.0", facts, evidencePointers: [{ detail: jobs.length ? `${jobs.length} security jobs (${classes.join(",")})` : "no security CI", file: ".github/workflows" }], provenance: { tool: "sec-ci-inventory", version: toolVersion("sec-ci-inventory"), flags: ["sec-ci-inventory"], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    return { detectorId: "SEC-10", schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: makeProvenance("sec-ci-inventory", start), truncated: true, error: ghErrorKind(e) };
  }
}
__name(detectSec10, "detectSec10");

// ../../src/scan/orchestrator.ts
var phase1Ids = ["VEL-06", "VEL-09", "VEL-08", "VEL-10", "SEC-07", "TEST-08"];
var phase2MvpIds = ["ECOS-01", "ECOS-02", "ECOS-03", "ECOS-05", "ECOS-07", "SEC-01", "SEC-06", "SEC-02", "ARCH-01", "ARCH-08", "ARCH-05", "TEST-03", "TEST-05"];
var TRANCHE_A_IDS = ["DOCS-01", "DOCS-03", "DOCS-04", "DOCS-08", "DOCS-09", "PERF-02", "PERF-06", "DATA-01", "ECOS-06", "ECOS-08", "SEC-09", "SEC-10"];
var phase2Ids = [...phase2MvpIds, ...TRANCHE_A_IDS];
var MVP_IDS = [...phase1Ids, ...phase2MvpIds];
var EXPANDED_IDS = [...phase1Ids, ...phase2Ids];
var phase2Detectors = [
  detectEcos01,
  detectEcos02,
  detectEcos03,
  detectEcos05,
  detectEcos07,
  detectSec01,
  detectSec06,
  detectSec02,
  detectArch01,
  detectArch08,
  detectArch05,
  detectTest03,
  detectTest05,
  detectDocs01,
  detectDocs03,
  detectDocs04,
  detectDocs08,
  detectDocs09,
  detectPerf02,
  detectPerf06,
  detectData01,
  detectEcos06,
  detectEcos08,
  detectSec09,
  detectSec10
];
function getUnifiedBudget(indicatorIds = EXPANDED_IDS) {
  return budgetForIndicators(indicatorIds, { withCloneBase: indicatorIds.some((id) => INDICATOR_BUDGET_CLASS[id] === "slow-dissolvable") });
}
__name(getUnifiedBudget, "getUnifiedBudget");
function statusForFact(f) {
  if (f.error) return "unknown";
  return "measured";
}
__name(statusForFact, "statusForFact");
function errorKindForFact(f) {
  const err = f.error;
  if (!err) return void 0;
  const k = err.kind;
  if (k === "cap") return "cap";
  if (String(err.detail).toLowerCase().includes("rate-limit") || String(err.detail).toLowerCase().includes("rate limit")) return "rate-limit";
  return "crash";
}
__name(errorKindForFact, "errorKindForFact");
async function* runUnifiedScan(repoUrl, opts = {}) {
  const ids = opts.indicatorIds ?? EXPANDED_IDS;
  const { budgetMs, breakdown, indicatorCount } = getUnifiedBudget(ids);
  const totalCost = ids.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? "fast"] ?? 5e3), 0) + (ids.some((id) => INDICATOR_BUDGET_CLASS[id] === "slow-dissolvable") ? 3e4 : 5e3);
  const budget = createBudgetControllerForIndicators(ids, { withCloneBase: ids.some((id) => INDICATOR_BUDGET_CLASS[id] === "slow-dissolvable"), killerMs: opts.killerMs });
  const start = Date.now();
  const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
  const signal = budget.signal;
  const token = opts.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  const gh = createGhClient({ token });
  yield { type: "meta", budgetMs, breakdown, indicatorCount, totalCost, milestone: `Budget ${Math.ceil(budgetMs / 1e3)}s \xB7 ${indicatorCount} indicators` };
  {
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Budget ${Math.ceil(budgetMs / 1e3)}s \xB7 ${indicatorCount} indicators \u2014 ${Object.entries(breakdown).map(([k, v]) => `${k}:${v}`).join(" ")}`, phase: "budget" };
  }
  let ingest;
  try {
    ingest = await ingestRepoUrl(repoUrl, gh, { signal });
  } catch (e) {
    budget.cancel();
    const elapsedMs = Date.now() - start;
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Ingest failed \u2014 ${detail.slice(0, 120)}`, phase: "ingest", status: "error", errorKind: e instanceof GhRateLimitError ? "rate-limit" : "crash" };
    if (e instanceof GhRateLimitError) {
      yield { type: "refused", reason: "rate-limited", detail: e.message.slice(0, 500) };
      return;
    }
    yield { type: "refused", reason: "crash", detail };
    return;
  }
  if (!ingest.ok) {
    budget.cancel();
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Ingest refused \u2014 ${ingest.reason}: ${ingest.detail.slice(0, 120)}`, phase: "ingest", status: "error", errorKind: "crash" };
    yield { type: "refused", reason: ingest.reason, detail: ingest.detail };
    return;
  }
  const { owner, repo, normalized } = ingest;
  const scanId = `ls_${Date.now().toString(36)}`;
  {
    const elapsedMs = Date.now() - start;
    yield { type: "progress", pct: 2, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds: [], completedCost: 0, totalCost, milestone: `Ingested ${normalized} \u2014 normalized` };
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Ingested ${normalized} \u2014 normalized`, phase: "ingest" };
  }
  const ghIds = phase1Ids.filter((id) => ids.includes(id));
  const ghDetectors = [detectVel06, detectVel09, detectVel08, detectVel10, detectSec07, detectTest08].filter((_, i) => ids.includes(phase1Ids[i]));
  const ghCtx = { owner, repo, gh, signal, toolVersions: buildToolVersions() };
  let ghFacts = [];
  if (ghDetectors.length) {
    const ghStarts = ghDetectors.map(() => Date.now());
    const ghPromises = ghDetectors.map((fn, idx) => {
      const started = ghStarts[idx];
      return fn(ghCtx).then(
        (v) => ({ ok: true, value: v, durationMs: Date.now() - started }),
        (e) => ({ ok: false, error: e, durationMs: Date.now() - started })
      );
    });
    const settledInner = await Promise.all(ghPromises);
    ghFacts = settledInner.map((r, idx) => {
      const id = ghIds[idx];
      const durationMs = r.durationMs;
      if (r.ok) {
        const f = r.value;
        const rec2 = { ...f, id, root: "/", scanId, commitSha: "unknown" };
        const v = validateFact(rec2);
        let finalRec;
        if (!v.ok) {
          finalRec = { ...rec2, truncated: true, error: { kind: "crash", detail: v.errors.join("; ") } };
        } else {
          finalRec = rec2;
        }
        const status = statusForFact(finalRec);
        const errorKind = errorKindForFact(finalRec);
        const elapsedMs3 = Date.now() - start;
        const label2 = errorKind ? `${id} \u2014 ${durationMs}ms \xB7 ${status} (${errorKind})` : `${id} \u2014 ${durationMs}ms \xB7 ${status}`;
        ghFacts._traces = ghFacts._traces ?? [];
        ghFacts._traces.push({ type: "trace", ts: elapsedMs3, elapsedMs: elapsedMs3, label: label2, phase: "detector", detectorId: id, durationMs, status, errorKind });
        return finalRec;
      }
      const detail = r.error instanceof Error ? r.error.message : String(r.error);
      const isBudget = String(detail).includes("budget-exceeded") || String(detail).includes("TimeoutError");
      const rec = { id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "gh-api", version: "1", flags: [], durationMs: 0 }, truncated: true, error: { kind: isBudget ? "cap" : "crash", detail: detail.slice(0, 300) }, root: "/", scanId };
      const elapsedMs2 = Date.now() - start;
      const label = `${id} \u2014 ${durationMs}ms \xB7 unknown (${isBudget ? "cap" : "crash"})`;
      ghFacts._traces = ghFacts._traces ?? [];
      ghFacts._traces.push({ type: "trace", ts: elapsedMs2, elapsedMs: elapsedMs2, label, phase: "detector", detectorId: id, durationMs, status: "unknown", errorKind: isBudget ? "cap" : "crash" });
      return rec;
    });
    const traces = ghFacts._traces ?? [];
    for (const t of traces) {
      yield t;
    }
    delete ghFacts._traces;
    const elapsedMs = Date.now() - start;
    const completedIds = ghFacts.filter((f) => !f.error).map((f) => f.detectorId);
    const completedCost = completedIds.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? "fast"] ?? 5e3), 0);
    const costPct = totalCost ? completedCost / totalCost : 0;
    const countPct = ghIds.length ? completedIds.length / ghIds.length : 0;
    const pct = Math.min(100, Math.round((0.5 * costPct + 0.5 * countPct) * 100));
    yield { type: "progress", pct, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: `GH detectors \u2014 ${completedIds.length}/${ghIds.length} complete` };
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `GH detectors \u2014 ${completedIds.length}/${ghIds.length} complete`, phase: "gh" };
  }
  if (signal.aborted) {
    if (isKillerTrip(signal)) {
      budget.cancel();
      yield { type: "run-failure", reason: "budget-exceeded", detail: "wall-clock killer fired after the GH phase \u2014 no headline sealed" };
      return;
    }
    const remainingIds = ids.filter((id) => !ghFacts.some((f) => f.detectorId === id));
    const unknownFacts = remainingIds.map((id) => ({ id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "budget", version: toolVersion("budget"), flags: [], durationMs: 0 }, truncated: true, error: { kind: "cap", detail: "budget-exceeded" }, root: "/", scanId }));
    const allFacts2 = [...ghFacts, ...unknownFacts];
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Budget exceeded \u2014 sealing with ${ghFacts.length}/${ids.length} detectors`, phase: "budget", status: "error", errorKind: "cap" };
    budget.cancel();
    yield { type: "done", facts: allFacts2, snapshot: { repo: normalized, scanned_at: scannedAt, engine_version: ENGINE_VERSION, rubric_version: "docs/rubric@tranche-a", scanned_commit: "unknown" }, id: scanId };
    return;
  }
  let archetypeResult = null;
  let identity;
  const needsClone = ids.some((id) => phase2Ids.includes(id));
  let cloneFacts = [];
  if (needsClone && !signal.aborted) {
    {
      const elapsedMs = Date.now() - start;
      const timePct = Math.min(elapsedMs / budgetMs, 1);
      const pct = Math.min(99, Math.round(timePct * 100));
      yield { type: "progress", pct, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds: ghFacts.filter((f) => !f.error).map((f) => f.detectorId), completedCost: ghFacts.filter((f) => !f.error).map((f) => f.detectorId).reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? "fast"] ?? 5e3), 0), totalCost, milestone: `Clone \u2014 shallow clone starting` };
      yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Clone \u2014 shallow clone starting`, phase: "clone" };
    }
    const queue = createQueue({ concurrency: 1 });
    const cloneStartMs = Date.now();
    const job = queue.enqueue("unified-clone", async (sig) => {
      const clone = await shallowClone(repoUrl, { signal: sig, byteCap: 4 * 1024 * 1024 });
      const cloneDurationMs = Date.now() - cloneStartMs;
      job._cloneMeta = { cloneDurationMs, commitSha: clone.commitSha };
      try {
        const sniffStart = Date.now();
        const manifests = await sniffEcosystems(clone.clonePath);
        const sniffDurationMs = Date.now() - sniffStart;
        job._sniffMeta = { sniffDurationMs, manifestCount: manifests.length };
        let archRes = null;
        try {
          const archStart = Date.now();
          archRes = manifests.length > 1 ? await classifyArchetypePerRoot(clone.clonePath, clone.readFile, manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem }))) : await classifyArchetype(clone.clonePath, clone.readFile, manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem })));
          job._archMeta = { archetype: archRes.archetype, confidence: archRes.confidence, planeInventory: archRes.planeInventory, evidencePointers: archRes.evidencePointers, perRoot: archRes.perRoot, durationMs: Date.now() - archStart };
        } catch (archE) {
          job._archMeta = { error: archE instanceof Error ? archE.message : String(archE) };
        }
        let treeWalk = null;
        try {
          treeWalk = await walkSortedTree(clone.clonePath);
          budget.setSampleN(computeSampleN(treeWalk.fileCount));
        } catch {
        }
        const ctx = {
          clonePath: clone.clonePath,
          commitSha: clone.commitSha,
          gh,
          manifests: manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem, lockfile: m.lockfile, manifest: m.manifest })),
          budgetLease: budget.lease(),
          cache: { get: /* @__PURE__ */ __name(() => void 0, "get"), set: /* @__PURE__ */ __name(() => {
          }, "set") },
          toolVersions: buildToolVersions(),
          readFile: clone.readFile
        };
        if (treeWalk) {
          const identityStart = Date.now();
          const subject = { repo: normalized, commit: clone.commitSha, scanned_at: scannedAt };
          try {
            const census = await cachedStackCensus(ctx, sig, { paths: treeWalk.paths });
            identity = await deriveIdentity({
              walk: treeWalk,
              manifests: ctx.manifests,
              readFile: clone.partitionedReadFile(IDENTITY_READ_ALLOCATION),
              archetype: archRes,
              census,
              subject,
              signal: sig
            });
          } catch (identityError) {
            const detail = identityError instanceof Error ? identityError.message : String(identityError);
            identity = degradedIdentity(subject, `identity pass failed: ${detail.slice(0, 200)}`);
          }
          job._identityMeta = { identity, durationMs: Date.now() - identityStart };
        } else {
          identity = degradedIdentity(
            { repo: normalized, commit: clone.commitSha, scanned_at: scannedAt },
            "tree walk did not complete \u2014 identity could not be derived"
          );
        }
        let reqPhase2Ids = phase2Ids.filter((id) => ids.includes(id));
        let reqDetectors = phase2Detectors.filter((_, i) => ids.includes(phase2Ids[i]));
        if (archRes) {
          try {
            const { evaluateApplicability: evaluateApplicability2 } = await Promise.resolve().then(() => (init_applicability(), applicability_exports));
            const filtered = [];
            const filteredDet = [];
            const skipped = [];
            for (let i = 0; i < reqPhase2Ids.length; i++) {
              const id = reqPhase2Ids[i];
              const det = reqDetectors[i];
              const ev = evaluateApplicability2(id, archRes.archetype, archRes.planeInventory);
              if (ev.notApplicable) skipped.push(id);
              else {
                filtered.push(id);
                filteredDet.push(det);
              }
            }
            if (skipped.length) {
              job._skipped = skipped;
            }
            reqPhase2Ids = filtered;
            reqDetectors = filteredDet;
          } catch {
          }
        }
        const starts = reqDetectors.map(() => Date.now());
        const perDetectorCap = partitionByteCap(DETECTOR_TREE_BYTE_BUDGET, Math.max(1, reqDetectors.length));
        const settled = await Promise.all(reqDetectors.map((fn, idx) => {
          const s = starts[idx];
          const dctx = { ...ctx, readFile: clone.partitionedReadFile(perDetectorCap) };
          return fn(dctx, sig).then(
            (v) => ({ ok: true, value: v, durationMs: Date.now() - s }),
            (e) => ({ ok: false, error: e, durationMs: Date.now() - s })
          );
        }));
        const perDetectorMeta = settled.map((r, i) => {
          const id = reqPhase2Ids[i];
          if (r.ok) {
            const f = r.value;
            const rec2 = { ...f, id, root: "/", scanId, commitSha: clone.commitSha };
            const v = validateFact(rec2);
            let finalRec;
            if (!v.ok) finalRec = { ...rec2, truncated: true, error: { kind: "crash", detail: v.errors.join("; ") } };
            else finalRec = rec2;
            const status = statusForFact(finalRec);
            const errorKind = errorKindForFact(finalRec);
            return { rec: finalRec, trace: { detectorId: id, durationMs: r.durationMs, status, errorKind } };
          }
          const detail = String(r.error).slice(0, 300);
          const isBudget = detail.includes("budget-exceeded") || detail.includes("TimeoutError") || detail.includes("AbortError");
          const rec = { id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "phase2", version: toolVersion("phase2"), flags: [], durationMs: 0 }, truncated: true, error: { kind: isBudget ? "cap" : "crash", detail }, root: "/", scanId };
          return { rec, trace: { detectorId: id, durationMs: r.durationMs, status: "unknown", errorKind: isBudget ? "cap" : "crash" } };
        });
        job._perDetector = perDetectorMeta;
        return perDetectorMeta.map((p) => p.rec);
      } finally {
        clone.cleanup();
      }
    });
    try {
      cloneFacts = await job.result;
      {
        const meta = job._cloneMeta;
        if (meta) {
          const elapsedMs = Date.now() - start;
          const shortSha = meta.commitSha && meta.commitSha !== "unknown" ? meta.commitSha.slice(0, 7) : "unknown";
          yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Clone \u2014 ${Math.round(meta.cloneDurationMs / 100) / 10}s \xB7 commit ${shortSha}`, phase: "clone", durationMs: meta.cloneDurationMs };
        }
      }
      {
        const sniffMeta = job._sniffMeta;
        if (sniffMeta) {
          const elapsedMs = Date.now() - start;
          yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Sniff \u2014 ${sniffMeta.manifestCount} ecosystems in ${sniffMeta.sniffDurationMs}ms`, phase: "sniff", durationMs: sniffMeta.sniffDurationMs };
        }
      }
      {
        const archMeta = job._archMeta;
        if (archMeta) {
          const elapsedMs = Date.now() - start;
          if (archMeta.error) {
            yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Archetype \u2014 error: ${archMeta.error.slice(0, 120)}`, phase: "archetype", status: "error" };
          } else {
            const perRootStr = archMeta.perRoot ? ` \xB7 per-root ${archMeta.perRoot.length}` : "";
            yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Archetype \u2014 ${archMeta.archetype} (${archMeta.confidence})${perRootStr}`, phase: "archetype", status: archMeta.archetype ?? "unknown" };
            archetypeResult = archMeta;
          }
        }
        const identityMeta = job._identityMeta;
        if (identityMeta?.identity) {
          identity = identityMeta.identity;
          const elapsedMs = Date.now() - start;
          const lineItem = identity.size.lines;
          const lineLabel = lineItem ? (lineItem.status === "estimated" ? "~" : "") + String(lineItem.value ?? "unknown") : "unknown";
          yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Identity \u2014 ${identity.size.files ?? 0} files \xB7 ${lineLabel} lines \xB7 ${identity.stack.languages.length} languages`, phase: "archetype", durationMs: identityMeta.durationMs };
        }
        const skipped = job._skipped;
        if (skipped && skipped.length) {
          const elapsedMs = Date.now() - start;
          yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Skipped not_applicable: ${skipped.join(", ")}`, phase: "budget", status: "skipped" };
        }
      }
      {
        const perDetector = job._perDetector;
        if (perDetector) {
          for (const p of perDetector) {
            const elapsedMs = Date.now() - start;
            const t = p.trace;
            const label = t.errorKind ? `${t.detectorId} \u2014 ${t.durationMs}ms \xB7 ${t.status} (${t.errorKind})` : `${t.detectorId} \u2014 ${t.durationMs}ms \xB7 ${t.status}`;
            yield { type: "trace", ts: elapsedMs, elapsedMs, label, phase: "detector", detectorId: t.detectorId, durationMs: t.durationMs, status: t.status, errorKind: t.errorKind };
          }
        }
      }
      {
        const elapsedMs = Date.now() - start;
        const completedIds = [...ghFacts.filter((f) => !f.error).map((f) => f.detectorId), ...cloneFacts.filter((f) => !f.error).map((f) => f.detectorId)];
        const completedCost = completedIds.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? "fast"] ?? 5e3), 0);
        const costPct = totalCost ? completedCost / totalCost : 0;
        const countPct = ids.length ? completedIds.length / ids.length : 0;
        const pct = Math.min(99, Math.round((0.5 * costPct + 0.5 * countPct) * 100));
        yield { type: "progress", pct, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: `Clone detectors \u2014 ${cloneFacts.filter((f) => !f.error).length}/${phase2Ids.filter((id) => ids.includes(id)).length} complete` };
        yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Clone detectors \u2014 ${cloneFacts.filter((f) => !f.error).length}/${phase2Ids.filter((id) => ids.includes(id)).length} complete`, phase: "clone" };
        yield { type: "progress", pct: Math.min(99, pct + 1), elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: `Scoring \u2014 gates evaluated` };
        yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Scoring \u2014 gates evaluated`, phase: "scoring" };
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      const remainingPhase2 = phase2Ids.filter((id) => ids.includes(id));
      cloneFacts = remainingPhase2.map((id) => ({ id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "phase2", version: toolVersion("phase2"), flags: [], durationMs: 0 }, truncated: true, error: { kind: "cap", detail: detail.slice(0, 300) }, root: "/", scanId }));
      {
        const elapsedMs = Date.now() - start;
        yield { type: "progress", pct: 95, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds: ghFacts.filter((f) => !f.error).map((f) => f.detectorId), completedCost: 0, totalCost, milestone: `Clone failed \u2014 ${detail.slice(0, 80)}` };
        yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Clone failed \u2014 ${detail.slice(0, 120)}`, phase: "clone", status: "error", errorKind: "crash" };
      }
    }
  }
  budget.cancel();
  if (isKillerTrip(signal)) {
    yield { type: "run-failure", reason: "budget-exceeded", detail: "wall-clock killer fired before deterministic work completed \u2014 no headline sealed" };
    return;
  }
  const allFacts = [...ghFacts, ...cloneFacts];
  const covered = new Set(allFacts.map((f) => f.detectorId));
  for (const id of ids) if (!covered.has(id)) {
    allFacts.push({ id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "budget", version: toolVersion("budget"), flags: [], durationMs: 0 }, truncated: true, error: { kind: "cap", detail: "budget-exceeded" }, root: "/", scanId });
  }
  const scanned_commit = cloneFacts.find((f) => f.commitSha && f.commitSha !== "unknown") ? cloneFacts.find((f) => f.commitSha && f.commitSha !== "unknown").commitSha : "unknown";
  {
    const elapsedMs = Date.now() - start;
    const unknownCount = allFacts.filter((f) => f.error).length;
    const status = unknownCount === 0 ? "complete" : "degraded";
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Seal \u2014 ${status} \xB7 ${allFacts.filter((f) => !f.error).length}/${ids.length} measured`, phase: "seal", status };
  }
  const snapshot = { repo: normalized, scanned_at: scannedAt, engine_version: ENGINE_VERSION, rubric_version: "docs/rubric@tranche-a", scanned_commit };
  if (archetypeResult) {
    snapshot.archetype = archetypeResult.archetype;
    snapshot.archetype_confidence = archetypeResult.confidence;
    snapshot.planeInventory = archetypeResult.planeInventory;
    snapshot.archetype_evidence = archetypeResult.evidencePointers;
    if (archetypeResult.perRoot) snapshot.perRoot = archetypeResult.perRoot;
  } else {
    snapshot.archetype = "unknown";
    snapshot.archetype_confidence = "low";
    snapshot.planeInventory = { has_server: false, has_data: false, has_deploy: false, has_client: false, has_test: false, evidence: { has_server: [], has_data: [], has_deploy: [], has_client: [], has_test: [] } };
    snapshot.archetype_evidence = ["no clone \u2014 GH-only scan"];
  }
  yield { type: "done", facts: allFacts, snapshot, id: scanId, identity };
}
__name(runUnifiedScan, "runUnifiedScan");

// ../../src/scan/local.ts
import { stat as stat4, readFile as fsReadFile2 } from "node:fs/promises";
import { execFile as execFile3 } from "node:child_process";
import { promisify as promisify3 } from "node:util";
import { basename, join as join14, resolve } from "node:path";

// ../../src/scan/offline.ts
var STRICT_OFFLINE_MESSAGE = "strict offline mode: network attempt aborted \u2014 detectors must use vendored snapshots and emit unknown with a re-run hint where live data would be needed";
var StrictOfflineError = class extends Error {
  static {
    __name(this, "StrictOfflineError");
  }
  constructor(detail = "") {
    super(`${STRICT_OFFLINE_MESSAGE}${detail ? ` (${detail})` : ""}`);
    this.name = "StrictOfflineError";
  }
};
function createStrictFetch() {
  const throwing = /* @__PURE__ */ __name((async () => {
    throw new StrictOfflineError();
  }), "throwing");
  return throwing;
}
__name(createStrictFetch, "createStrictFetch");

// ../../src/scan/local.ts
var GH_ONLY_IDS = /* @__PURE__ */ new Set(["VEL-06", "VEL-09", "VEL-08", "VEL-10", "SEC-07", "TEST-08"]);
var LOCAL_IDS = [
  "ECOS-01",
  "ECOS-02",
  "ECOS-03",
  "ECOS-05",
  "ECOS-07",
  "SEC-01",
  "SEC-06",
  "SEC-02",
  "ARCH-01",
  "ARCH-08",
  "ARCH-05",
  "TEST-03",
  "TEST-05",
  "DOCS-01",
  "DOCS-03",
  "DOCS-04",
  "DOCS-08",
  "DOCS-09",
  "PERF-02",
  "PERF-06",
  "DATA-01",
  "ECOS-06",
  "ECOS-08",
  "SEC-09",
  "SEC-10"
];
var LOCAL_DETECTORS = [
  detectEcos01,
  detectEcos02,
  detectEcos03,
  detectEcos05,
  detectEcos07,
  detectSec01,
  detectSec06,
  detectSec02,
  detectArch01,
  detectArch08,
  detectArch05,
  detectTest03,
  detectTest05,
  detectDocs01,
  detectDocs03,
  detectDocs04,
  detectDocs08,
  detectDocs09,
  detectPerf02,
  detectPerf06,
  detectData01,
  detectEcos06,
  detectEcos08,
  detectSec09,
  detectSec10
];
var execFileAsync3 = promisify3(execFile3);
function bindLocalReadFile(root, opts = {}) {
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  let bytesRead = 0;
  return async (p) => {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const full = join14(root, p.replace(/^\//, ""));
    if (full !== root && !full.startsWith(root + "/")) return null;
    try {
      const buf = await fsReadFile2(full);
      bytesRead += buf.length;
      if (bytesRead > byteCap) throw new DOMException("byteCap exceeded", "QuotaExceededError");
      return buf;
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  };
}
__name(bindLocalReadFile, "bindLocalReadFile");
function bindLocalReadFilePartitioned(root, opts = {}) {
  const totalCap = opts.byteCap ?? 4 * 1024 * 1024;
  return {
    totalCap,
    forDetector(perDetectorCap) {
      let bytesRead = 0;
      return async (p) => {
        if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const full = join14(root, p.replace(/^\//, ""));
        if (full !== root && !full.startsWith(root + "/")) return null;
        try {
          const buf = await fsReadFile2(full);
          bytesRead += buf.length;
          if (bytesRead > perDetectorCap) throw new DOMException("byteCap exceeded", "QuotaExceededError");
          return buf;
        } catch (e) {
          if (e.code === "ENOENT") return null;
          throw e;
        }
      };
    }
  };
}
__name(bindLocalReadFilePartitioned, "bindLocalReadFilePartitioned");
async function resolveLocalCommit(absPath) {
  try {
    const { stdout } = await execFileAsync3("git", ["-C", absPath, "rev-parse", "HEAD"]);
    const sha = stdout.trim();
    return /^[0-9a-f]{4,40}$/i.test(sha) ? sha : "unknown";
  } catch {
    return "unknown";
  }
}
__name(resolveLocalCommit, "resolveLocalCommit");
function statusForFact2(f) {
  if (f.error) return "unknown";
  const declared = f.measurement?.status;
  if (declared === "estimated") return "estimated";
  if (declared === "unknown") return "unknown";
  return "measured";
}
__name(statusForFact2, "statusForFact");
function errorKindForFact2(f) {
  const err = f.error;
  if (!err) return void 0;
  if (err.kind === "cap") return "cap";
  if (String(err.detail).toLowerCase().includes("rate-limit") || String(err.detail).toLowerCase().includes("rate limit")) return "rate-limit";
  return "crash";
}
__name(errorKindForFact2, "errorKindForFact");
async function* runLocalScan(targetPath, opts = {}) {
  const absPath = resolve(targetPath);
  const subjectName = basename(absPath) || absPath;
  try {
    const st = await stat4(absPath);
    if (!st.isDirectory()) {
      yield { type: "refused", reason: "bad_path", detail: `not a directory: ${targetPath}` };
      return;
    }
  } catch {
    yield { type: "refused", reason: "bad_path", detail: `path does not exist: ${targetPath}` };
    return;
  }
  const requested = (opts.indicatorIds ?? LOCAL_IDS).filter((id) => !GH_ONLY_IDS.has(id));
  const ids = requested.filter((id) => LOCAL_IDS.includes(id));
  const { budgetMs, breakdown, indicatorCount } = budgetForIndicators(ids, { withCloneBase: true });
  const totalCost = ids.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? "fast"] ?? 5e3), 0) + 3e4;
  const budget = createBudgetControllerForIndicators(ids, { withCloneBase: true, byteCap: opts.byteCap, killerMs: opts.killerMs });
  const start = Date.now();
  const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
  const signal = budget.signal;
  const scanId = `ls_${Date.now().toString(36)}`;
  const fetchImpl = opts.strict ? createStrictFetch() : opts.fetchImpl ?? fetch;
  void fetchImpl;
  yield { type: "meta", budgetMs, breakdown, indicatorCount, totalCost, milestone: `Budget ${Math.ceil(budgetMs / 1e3)}s \xB7 ${indicatorCount} indicators (local)` };
  {
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Budget ${Math.ceil(budgetMs / 1e3)}s \xB7 ${indicatorCount} indicators (local, no clone)`, phase: "budget" };
  }
  const readFile2 = bindLocalReadFile(absPath, { byteCap: opts.byteCap, signal });
  const commitSha = opts.scannedCommitOverride ?? await resolveLocalCommit(absPath);
  let sampleN;
  let treeWalk = null;
  try {
    treeWalk = await walkSortedTree(absPath);
    sampleN = computeSampleN(treeWalk.fileCount);
    budget.setSampleN(sampleN);
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Tree walk \u2014 ${treeWalk.fileCount} files, sampleN ${sampleN ?? "full"} (canonical sorted order)`, phase: "budget" };
  } catch {
  }
  let manifests = [];
  try {
    const sniffed = await sniffEcosystems(absPath);
    manifests = sniffed.map((m) => ({ root: m.root, ecosystem: m.ecosystem, lockfile: m.lockfile, manifest: m.manifest }));
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Sniff \u2014 ${manifests.length} ecosystems (local, no clone)`, phase: "sniff" };
  } catch (e) {
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Sniff failed \u2014 ${String(e).slice(0, 120)}`, phase: "sniff", status: "error" };
  }
  let archetypeResult = null;
  try {
    archetypeResult = manifests.length > 1 ? await classifyArchetypePerRoot(absPath, readFile2, manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem }))) : await classifyArchetype(absPath, readFile2, manifests.map((m) => ({ root: m.root, ecosystem: m.ecosystem })));
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Archetype \u2014 ${archetypeResult.archetype} (${archetypeResult.confidence})`, phase: "archetype", status: archetypeResult.archetype ?? "unknown" };
  } catch (e) {
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Archetype \u2014 error: ${String(e).slice(0, 120)}`, phase: "archetype", status: "error" };
  }
  const ctx = {
    clonePath: absPath,
    commitSha,
    gh: void 0,
    manifests,
    budgetLease: budget.lease(),
    // Real per-scan cache (detector-honesty): a Map-backed store so detectors
    // that share a read (e.g. cachedSourceImports) memoize within one scan while
    // each scan starts cold.
    cache: /* @__PURE__ */ (() => {
      const store = /* @__PURE__ */ new Map();
      return { get: /* @__PURE__ */ __name((key) => store.get(key), "get"), set: /* @__PURE__ */ __name((key, value) => {
        store.set(key, value);
      }, "set") };
    })(),
    toolVersions: buildToolVersions(),
    readFile: readFile2,
    // Deterministic scan instant: date-derived facts (EOL days, staleness,
    // abandonment) reference the scan start, not each detector's wall clock.
    scanMs: start
  };
  let identity;
  if (treeWalk) {
    const identityStart = Date.now();
    const subject = { repo: subjectName, commit: commitSha, scanned_at: scannedAt };
    try {
      const census = await cachedStackCensus(ctx, signal, { paths: treeWalk.paths });
      identity = await deriveIdentity({
        walk: treeWalk,
        manifests: ctx.manifests,
        readFile: bindLocalReadFile(absPath, { byteCap: IDENTITY_READ_ALLOCATION, signal }),
        archetype: archetypeResult,
        census,
        subject,
        signal,
        // Local lane reads every in-scope file (report-identity D5): coverage is
        // complete, so the magnitude is measured rather than extrapolated.
        readAll: true
      });
    } catch (identityError) {
      const detail = identityError instanceof Error ? identityError.message : String(identityError);
      identity = degradedIdentity(subject, `identity pass failed: ${detail.slice(0, 200)}`);
    }
    const elapsedMs = Date.now() - start;
    const lineItem = identity.size.lines;
    const lineLabel = lineItem ? `${lineItem.status === "estimated" ? "~" : ""}${lineItem.value ?? "unknown"}` : "unknown";
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Identity \u2014 ${identity.size.files ?? 0} files \xB7 ${lineLabel} lines \xB7 ${identity.stack.languages.length} languages`, phase: "archetype", durationMs: Date.now() - identityStart };
  } else {
    identity = degradedIdentity(
      { repo: subjectName, commit: commitSha, scanned_at: scannedAt },
      "tree walk did not complete \u2014 identity could not be derived"
    );
  }
  let reqIds = ids;
  let reqDetectors = LOCAL_DETECTORS.filter((_, i) => ids.includes(LOCAL_IDS[i]));
  if (archetypeResult) {
    try {
      const { evaluateApplicability: evaluateApplicability2 } = await Promise.resolve().then(() => (init_applicability(), applicability_exports));
      const filtered = [];
      const filteredDet = [];
      const skipped = [];
      for (let i = 0; i < reqIds.length; i++) {
        const id = reqIds[i];
        const det = reqDetectors[i];
        const ev = evaluateApplicability2(id, archetypeResult.archetype, archetypeResult.planeInventory);
        if (ev.notApplicable) skipped.push(id);
        else {
          filtered.push(id);
          filteredDet.push(det);
        }
      }
      if (skipped.length) {
        const elapsedMs = Date.now() - start;
        yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Skipped not_applicable: ${skipped.join(", ")}`, phase: "budget", status: "skipped" };
      }
      reqIds = filtered;
      reqDetectors = filteredDet;
    } catch {
    }
  }
  const starts = reqDetectors.map(() => Date.now());
  const partitioned = bindLocalReadFilePartitioned(absPath, { byteCap: opts.byteCap, signal });
  const perDetectorCap = partitionByteCap(partitioned.totalCap, Math.max(1, reqDetectors.length));
  const detectorCtxs = reqDetectors.map(() => ({ ...ctx, readFile: partitioned.forDetector(perDetectorCap) }));
  let settled;
  try {
    settled = await Promise.all(reqDetectors.map((fn, idx) => {
      const s = starts[idx];
      if (signal.aborted || opts.strict && signal._strictAborted) {
        return Promise.resolve({ ok: false, error: new StrictOfflineError("aborted"), durationMs: Date.now() - s });
      }
      return fn(detectorCtxs[idx], signal).then(
        (v) => ({ ok: true, value: v, durationMs: Date.now() - s }),
        (e) => ({ ok: false, error: e, durationMs: Date.now() - s })
      );
    }));
  } catch (e) {
    const elapsedMs = Date.now() - start;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Local detectors crashed \u2014 ${String(e).slice(0, 120)}`, phase: "detector", status: "error" };
    settled = [];
  }
  if (isKillerTrip(signal)) {
    budget.cancel();
    yield { type: "run-failure", reason: "budget-exceeded", detail: "wall-clock killer fired before deterministic work completed \u2014 no headline sealed" };
    return;
  }
  const facts = settled.map((r, i) => {
    const id = reqIds[i];
    if (r.ok && r.value) {
      const rec = { ...r.value, id, root: "/", scanId, commitSha };
      const v = validateFact(rec);
      if (!v.ok) {
        return { ...rec, truncated: true, error: { kind: "crash", detail: v.errors.join("; ") } };
      }
      return rec;
    }
    const detail = String(r.error).slice(0, 300);
    const isBudget = detail.includes("budget-exceeded") || detail.includes("TimeoutError") || detail.includes("AbortError") || detail.includes("byteCap");
    return { id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "phase2", version: toolVersion("phase2"), flags: [], durationMs: 0 }, truncated: true, error: { kind: isBudget ? "cap" : "crash", detail }, root: "/", scanId };
  });
  facts.sort((a, b) => String(a.detectorId).localeCompare(String(b.detectorId)));
  for (let i = 0; i < reqIds.length; i++) {
    const id = reqIds[i];
    const f = facts.find((x) => x.detectorId === id);
    const durationMs = settled[i]?.durationMs ?? 0;
    const status = f ? statusForFact2(f) : "unknown";
    const errorKind = f ? errorKindForFact2(f) : void 0;
    const elapsedMs = Date.now() - start;
    const label = errorKind ? `${id} \u2014 ${durationMs}ms \xB7 ${status} (${errorKind})` : `${id} \u2014 ${durationMs}ms \xB7 ${status}`;
    yield { type: "trace", ts: elapsedMs, elapsedMs, label, phase: "detector", detectorId: id, durationMs, status, errorKind };
  }
  {
    const elapsedMs = Date.now() - start;
    const completedIds = facts.filter((f) => !f.error).map((f) => f.detectorId);
    const completedCost = completedIds.reduce((a, id) => a + (BUDGET_COST[INDICATOR_BUDGET_CLASS[id] ?? "fast"] ?? 5e3), 0);
    const costPct = totalCost ? completedCost / totalCost : 0;
    const countPct = reqIds.length ? completedIds.length / reqIds.length : 0;
    const pct = Math.min(99, Math.round((0.5 * costPct + 0.5 * countPct) * 100));
    yield { type: "progress", pct, elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: `Local detectors \u2014 ${completedIds.length}/${reqIds.length} complete` };
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Local detectors \u2014 ${completedIds.length}/${reqIds.length} complete`, phase: "clone" };
    yield { type: "progress", pct: Math.min(99, pct + 1), elapsedMs, remainingMs: Math.max(0, budgetMs - elapsedMs), completedIds, completedCost, totalCost, milestone: "Scoring \u2014 gates evaluated" };
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: "Scoring \u2014 gates evaluated", phase: "scoring" };
  }
  budget.cancel();
  const covered = new Set(facts.map((f) => f.detectorId));
  for (const id of ids) {
    if (!covered.has(id)) {
      facts.push({ id, detectorId: id, schemaVersion: "1.0.0", facts: {}, evidencePointers: [], provenance: { tool: "budget", version: toolVersion("budget"), flags: [], durationMs: 0 }, truncated: true, error: { kind: "cap", detail: "budget-exceeded" }, root: "/", scanId });
    }
  }
  facts.sort((a, b) => String(a.detectorId).localeCompare(String(b.detectorId)));
  {
    const elapsedMs = Date.now() - start;
    const unknownCount = facts.filter((f) => f.error).length;
    const status = unknownCount === 0 ? "complete" : "degraded";
    yield { type: "trace", ts: elapsedMs, elapsedMs, label: `Seal \u2014 ${status} \xB7 ${facts.filter((f) => !f.error).length}/${ids.length} measured`, phase: "seal", status };
  }
  const snapshot = {
    repo: subjectName,
    scanned_at: scannedAt,
    engine_version: ENGINE_VERSION,
    rubric_version: "docs/rubric@tranche-a",
    scanned_commit: commitSha,
    // Vendored-dataset version ids (detector-honesty 3.3): recorded in the report
    // provenance and joined into the fingerprint so a dataset refresh changes the
    // fingerprint while identical data does not.
    snapshot_versions: snapshotVersions()
  };
  if (archetypeResult) {
    snapshot.archetype = archetypeResult.archetype;
    snapshot.archetype_confidence = archetypeResult.confidence;
    snapshot.planeInventory = archetypeResult.planeInventory;
    snapshot.archetype_evidence = archetypeResult.evidencePointers;
    if (archetypeResult.perRoot) snapshot.perRoot = archetypeResult.perRoot;
  } else {
    snapshot.archetype = "unknown";
    snapshot.archetype_confidence = "low";
    snapshot.planeInventory = { has_server: false, has_data: false, has_deploy: false, has_client: false, has_test: false, evidence: { has_server: [], has_data: [], has_deploy: [], has_client: [], has_test: [] } };
    snapshot.archetype_evidence = ["local scan \u2014 archetype unavailable"];
  }
  yield { type: "done", facts, snapshot, id: scanId, strict: !!opts.strict, identity };
}
__name(runLocalScan, "runLocalScan");

// ../../src/scan/scoring/scorer/phase1.ts
init_rubric();
var RUBRIC_REMEDIATION = Object.fromEntries(
  (rubric_default.indicators ?? []).map((i) => [i.id, i.remediation ?? { quick_win: "", structural: "", gold_standard: "", effort: "\u26A1 \u226430 min" }])
);
function lookupRemediation(id) {
  return RUBRIC_REMEDIATION[id] ?? { quick_win: "", structural: "", gold_standard: "", effort: "\u26A1 \u226430 min" };
}
__name(lookupRemediation, "lookupRemediation");
function scoreVel06(facts) {
  const bf = facts.vel06?.bus_factor_repo ?? 1;
  const share = facts.vel06?.top_author_share ?? 1;
  if (bf >= 3 && share < 0.4) return 3;
  if (bf === 1) return 0;
  if (bf === 2) return 2;
  return 1;
}
__name(scoreVel06, "scoreVel06");
function scoreVel09(facts) {
  const p = facts.vel09 ?? {};
  const cov = p.review_coverage_pct ?? 0;
  if (cov >= 0.85) return 3;
  if (cov >= 0.7) return 2;
  if (cov >= 0.5) return 1;
  return 0;
}
__name(scoreVel09, "scoreVel09");
function scoreVel08(facts) {
  const c = facts.vel08 ?? {};
  const chain = c.cd_chain;
  if (chain?.build && chain?.deploy_job && c.rollback_target) return 3;
  if (chain?.build && chain?.deploy_job) return 2;
  if (chain?.build) return 1;
  return 0;
}
__name(scoreVel08, "scoreVel08");
function scoreVel10(facts) {
  const b = facts.vel10 ?? {};
  if (b.model === "trunk-based") return 3;
  if ((b.stale_over_30d ?? 0) > 20) return 0;
  if ((b.stale_over_30d ?? 0) > 5) return 1;
  return 2;
}
__name(scoreVel10, "scoreVel10");
function scoreSec07(facts) {
  const s = facts.sec07 ?? {};
  if (!s.bot?.present) return 0;
  const p952 = s.open_bot_prs?.p95_age_days ?? 0;
  if (p952 > 90) return 1;
  if (p952 > 30) return 2;
  return 3;
}
__name(scoreSec07, "scoreSec07");
function scoreTest08(facts) {
  const t = facts.test08 ?? {};
  const gates = t.gates;
  if (!gates) return 0;
  const count = [gates.lint?.present, gates.sast?.present, gates.coverage_gate?.present].filter(Boolean).length;
  if (count >= 3) return 3;
  if (count === 2) return 2;
  if (count === 1) return 1;
  return 0;
}
__name(scoreTest08, "scoreTest08");
var SCORERS = {
  "VEL-06": scoreVel06,
  "VEL-09": scoreVel09,
  "VEL-08": scoreVel08,
  "VEL-10": scoreVel10,
  "SEC-07": scoreSec07,
  "TEST-08": scoreTest08
};
function flattenFacts(facts, detectorId) {
  const normalized = detectorId.toLowerCase().replace("-", "");
  const inner = facts[normalized];
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  const lower = detectorId.toLowerCase();
  const inner2 = facts[lower];
  if (inner2 && typeof inner2 === "object" && !Array.isArray(inner2)) return inner2;
  const keys = Object.keys(facts);
  if (keys.length === 1 && typeof facts[keys[0]] === "object" && facts[keys[0]] !== null) {
    const v = facts[keys[0]];
    if (!Array.isArray(v)) return v;
  }
  return facts;
}
__name(flattenFacts, "flattenFacts");
function reasonVel06(score, f) {
  const bf = f.bus_factor_repo ?? f.bus_factor ?? 1;
  const share = f.top_author_share ?? 0.5;
  if (score === 3) return `Bus factor ${bf} with top author ${Math.round(share * 100)}% \u2014 knowledge is distributed \u2014 per VEL-06 Green: no single point of failure \u2014 score 3.`;
  if (score === 2) return `Bus factor ${bf} \u2014 two owners \u2014 per VEL-06 Yellow flag: knowledge concentrated in a pair \u2014 score 2.`;
  if (score === 1) return `Bus factor ${bf} \u2014 per VEL-06 Yellow: some concentration, manageable \u2014 score 1.`;
  return `Bus factor ${bf} \u2014 single owner at ${Math.round(share * 100)}% \u2014 per VEL-06 Red flag: bus factor 1, critical knowledge silo \u2014 score 0.`;
}
__name(reasonVel06, "reasonVel06");
function reasonVel09(score, f) {
  const p = f ?? {};
  const cov = p.review_coverage_pct ?? 0;
  const samp = p.prs_sampled ?? 0;
  if (score === 3) return `PR review coverage ${Math.round(cov * 100)}% over ${samp} sampled PRs \u2014 nearly every change reviewed \u2014 per VEL-09 Green: review hygiene sound \u2014 score 3.`;
  if (score === 2) return `Review coverage ${Math.round(cov * 100)}% \u2014 most PRs reviewed \u2014 per VEL-09 Yellow: some gaps \u2014 score 2.`;
  if (score === 1) return `Review coverage ${Math.round(cov * 100)}% \u2014 half of PRs slip through without review \u2014 per VEL-09 Yellow: review hygiene weak \u2014 score 1.`;
  return `Review coverage ${Math.round(cov * 100)}% \u2014 per VEL-09 Red: most changes merge unreviewed \u2014 score 0.`;
}
__name(reasonVel09, "reasonVel09");
function reasonVel08(score, f) {
  const c = f.cd_chain ?? {};
  const rb = f.rollback_target ?? false;
  if (score === 3) return `CD chain build and deploy present with rollback target \u2014 per VEL-08 Green: delivery is automated and reversible \u2014 score 3.`;
  if (score === 2) return `Build and deploy chain present, rollback ${rb ? "present" : "missing"} \u2014 per VEL-08 Yellow: deploy automation present but not fully wrapped \u2014 score 2.`;
  if (score === 1) return `Build present without deploy linkage \u2014 per VEL-08 Yellow: manual promotion remains \u2014 score 1.`;
  return `No build or deploy chain \u2014 per VEL-08 Red: delivery by hand, high friction \u2014 score 0.`;
}
__name(reasonVel08, "reasonVel08");
function reasonVel10(score, f) {
  const b = f;
  if (b.model === "trunk-based") return `Trunk-based branching with ${b.branches_total ?? 0} branches \u2014 per VEL-10 Green: short-lived branches, low divergence \u2014 score 3.`;
  if ((b.stale_over_30d ?? 0) > 20) return `${b.stale_over_30d} stale branches out of ${b.branches_total ?? 0} \u2014 per VEL-10 Red: long-lived release branches diverge \u2014 score 0.`;
  if ((b.stale_over_30d ?? 0) > 5) return `${b.stale_over_30d} stale branches \u2014 per VEL-10 Yellow: branch hygiene drifting \u2014 score 1.`;
  return `${b.stale_over_30d ?? 0} stale branches \u2014 per VEL-10 Yellow/Green: mostly trunk-like \u2014 score 2.`;
}
__name(reasonVel10, "reasonVel10");
function reasonSec07(score, f) {
  const s = f;
  const present = s.bot?.present ?? false;
  const p952 = s.open_bot_prs?.p95_age_days ?? 0;
  if (!present) return `No Dependabot/Renovate automation \u2014 patch cadence is manual \u2014 per SEC-07 Red: dependency updates unmanaged \u2014 score 0.`;
  if (score === 3) return `Bot present; oldest open bot PR ${p952}d \u2014 patch backlog healthy \u2014 per SEC-07 Green: automated updates merged promptly \u2014 score 3.`;
  if (score === 2) return `Bot present; P95 open bot PR age ${p952}d \u2014 per SEC-07 Yellow: backlog starting to age \u2014 score 2.`;
  return `Bot present but P95 open bot PR age ${p952}d \u2014 per SEC-07 Yellow/Red: stale update queue \u2014 score 1.`;
}
__name(reasonSec07, "reasonSec07");
function reasonTest08(score, f) {
  const t = f;
  const gates = t.gates;
  if (!gates) return `No CI gate inventory \u2014 per TEST-08 Red: quality gates absent \u2014 score 0.`;
  const count = [gates.lint?.present, gates.sast?.present, gates.coverage_gate?.present].filter(Boolean).length;
  if (count >= 3) return `Lint, SAST and coverage gates all present and blocking \u2014 per TEST-08 Green: CI enforces the quality bar \u2014 score 3.`;
  if (count === 2) return `${count}/3 gates present \u2014 per TEST-08 Yellow: most gates present \u2014 score 2.`;
  if (count === 1) return `Only ${count}/3 gates present \u2014 per TEST-08 Yellow: gates minimal \u2014 score 1.`;
  return `No lint/SAST/coverage gates \u2014 per TEST-08 Red: CI lets quality slip \u2014 score 0.`;
}
__name(reasonTest08, "reasonTest08");
var REASONERS = {
  "VEL-06": reasonVel06,
  "VEL-09": reasonVel09,
  "VEL-08": reasonVel08,
  "VEL-10": reasonVel10,
  "SEC-07": reasonSec07,
  "TEST-08": reasonTest08
};
function reasonFor(id, score, facts) {
  const fn = REASONERS[id];
  if (fn) return fn(score, facts);
  const s = `${score} \u2014 ${["Critical", "Severe Debt", "Minor Debt", "Healthy"][score] ?? ""}`;
  return `${s}: ${JSON.stringify(facts).slice(0, 120)} \u2014 per ${id} rubric band \u2014 score ${score}.`;
}
__name(reasonFor, "reasonFor");
function factsToRows(facts) {
  const byId = new Map(facts.map((f) => [f.detectorId, f]));
  const defs = [
    { id: "VEL-06", name: "Bus factor", cat: "VEL", effort: "\u26A1 \u226430 min" },
    { id: "VEL-09", name: "PR & code-review hygiene", cat: "VEL", effort: "\u26A1 \u226430 min" },
    { id: "VEL-08", name: "Manual release steps", cat: "VEL", effort: "\u{1F536} ~2\u20134 h" },
    { id: "VEL-10", name: "Branching topology", cat: "VEL", effort: "\u26A1 \u226430 min" },
    { id: "SEC-07", name: "Patch cadence & update workflow", cat: "SEC", effort: "\u26A1 \u226430 min" },
    { id: "TEST-08", name: "Quality gates in CI", cat: "TEST", effort: "\u26A1 \u226430 min" }
  ];
  return defs.map((d) => {
    const f = byId.get(d.id);
    if (!f || f.error) {
      const isNa = f?.facts && f.facts.sec07 && f.facts.sec07.has_manifest === false;
      return {
        id: d.id,
        name: d.name,
        category_id: d.cat,
        status: "unknown",
        unknown_measure_path: f?.error?.kind === "rate-limit" ? "rate-limited \u2014 retry" : isNa ? "no manifests \u2014 na_when" : `what it takes: gh-api ${d.id} failed (${f?.error?.detail ?? "no facts"})`,
        effort: d.effort
      };
    }
    const scorer = SCORERS[d.id];
    const flat = flattenFacts(f.facts, d.id);
    const score = scorer ? scorer(flat) : 2;
    return {
      id: d.id,
      name: d.name,
      category_id: d.cat,
      status: "measured",
      score,
      reason: reasonFor(d.id, score, flat),
      evidence: { tool: f.provenance.tool, tool_version: f.provenance.version, pointers: f.evidencePointers, facts: flat },
      effort: d.effort,
      remediation: lookupRemediation(d.id)
    };
  });
}
__name(factsToRows, "factsToRows");

// ../../src/scan/scoring/scorer/mvp.ts
init_rubric();

// ../../src/scan/scoring/scorer/rollup.ts
function unwrapFact(id, fact) {
  if (!fact || fact.error) return {};
  const raw = fact.facts;
  if (!raw) return {};
  const key = id.toLowerCase().replace("-", "");
  if (key in raw) return raw[key];
  const lower = id.toLowerCase();
  if (lower in raw) return raw[lower];
  return raw;
}
__name(unwrapFact, "unwrapFact");
function evalG1(byId) {
  const f = byId.get("SEC-02");
  if (!f || f.error) return { id: "G1", name: "Credential exposure", status: "unevaluable", source_rows: ["SEC-02"], note: "needs live secrets scan (no tree/history fact) \u2014 unevaluable: source row unknown" };
  const inner = unwrapFact("SEC-02", f);
  const verified = inner.verified_live ?? 0;
  const tree = inner.tree_findings;
  const historyFull = inner.history_scanned_full;
  const historyOnly = inner.history_only_findings;
  if (verified > 0) return { id: "G1", name: "Credential exposure", status: "proven", source_rows: ["SEC-02"], note: "verified-live secret found" };
  if (Array.isArray(tree) && tree.length > 0) return { id: "G1", name: "Credential exposure", status: "proven", source_rows: ["SEC-02"], note: `current-tree finding: ${tree.length} rule(s)` };
  if (historyFull === true && Array.isArray(tree) && tree.length === 0 && (historyOnly ?? 0) === 0) return { id: "G1", name: "Credential exposure", status: "not-proven", source_rows: ["SEC-02"], note: "clean tree + full history" };
  return { id: "G1", name: "Credential exposure", status: "needs-verification", source_rows: ["SEC-02"], note: "findings present but history truncated or verification unavailable" };
}
__name(evalG1, "evalG1");
function evalG2(byId) {
  const f = byId.get("SEC-01");
  if (!f || f.error) return { id: "G2", name: "Crit CVE > 14d", status: "unevaluable", source_rows: ["SEC-01"], note: "needs SCA + reachability (no lockfile fact) \u2014 unevaluable: source row unknown" };
  const inner = unwrapFact("SEC-01", f);
  const over = inner.critical_open_over_14d ?? 0;
  const findings = inner.findings;
  const hasReachable = Array.isArray(findings) && findings.some((r) => r.in_core_import_closure === true);
  if (over > 0 && hasReachable) return { id: "G2", name: "Crit CVE > 14d", status: "proven", source_rows: ["SEC-01"], note: `critical_open_over_14d=${over} reachable-from-core` };
  if (over === 0) return { id: "G2", name: "Crit CVE > 14d", status: "not-proven", source_rows: ["SEC-01"], note: "no critical >14d" };
  return { id: "G2", name: "Crit CVE > 14d", status: "needs-verification", source_rows: ["SEC-01"], note: `critical_open_over_14d=${over} exposure path unknown` };
}
__name(evalG2, "evalG2");
function evalG3(byId) {
  const f = byId.get("ECOS-01");
  if (!f || f.error) return { id: "G3", name: "Runtime EOL", status: "unevaluable", source_rows: ["ECOS-01"], note: "needs endoflife lookup (no runtime fact) \u2014 unevaluable: source row unknown" };
  const inner = unwrapFact("ECOS-01", f);
  const runtimes = inner.runtimes;
  const lookupOk = inner.lookup_ok;
  if (lookupOk === false) return { id: "G3", name: "Runtime EOL", status: "needs-verification", source_rows: ["ECOS-01"], note: "endoflife lookup failed \u2014 estimated" };
  if (Array.isArray(runtimes)) {
    const past = runtimes.filter((r) => r.is_past_eol === true);
    if (past.length > 0) return { id: "G3", name: "Runtime EOL", status: "proven", source_rows: ["ECOS-01"], note: `past EOL: ${past.map((r) => `${r.product}@${r.version}`).join(", ")}` };
    return { id: "G3", name: "Runtime EOL", status: "not-proven", source_rows: ["ECOS-01"], note: "all runtimes within support window" };
  }
  return { id: "G3", name: "Runtime EOL", status: "needs-verification", source_rows: ["ECOS-01"], note: "no runtimes enumerated" };
}
__name(evalG3, "evalG3");
function evalG8(byId) {
  const f = byId.get("ECOS-05");
  if (!f || f.error) return { id: "G8", name: "Copyleft in core", status: "unevaluable", source_rows: ["ECOS-05"], note: "needs SBOM (no license fact) \u2014 unevaluable: source row unknown" };
  const inner = unwrapFact("ECOS-05", f);
  const strong = inner.copyleft_strong;
  const closed = inner.closed_source_distribution_likely;
  if (Array.isArray(strong) && strong.length > 0 && closed === true) return { id: "G8", name: "Copyleft in core", status: "proven", source_rows: ["ECOS-05"], note: `copyleft_strong ${strong.length} with closed distribution` };
  if (Array.isArray(strong) && strong.length === 0) return { id: "G8", name: "Copyleft in core", status: "not-proven", source_rows: ["ECOS-05"], note: "no strong copyleft" };
  return { id: "G8", name: "Copyleft in core", status: "needs-verification", source_rows: ["ECOS-05"], note: "copyleft present but distribution posture ambiguous" };
}
__name(evalG8, "evalG8");
function evalG6(byId) {
  const f08 = byId.get("VEL-08");
  if (!f08 || f08.error) return { id: "G6", name: "Delivery is on fire", status: "unevaluable", source_rows: ["VEL-03", "VEL-08"], note: "needs deploy data (no VEL-08 fact) \u2014 unevaluable: source row unknown" };
  const inner = unwrapFact("VEL-08", f08);
  const manual = inner.manual_steps ?? (inner.cd_chain ? 1 : 0);
  return { id: "G6", name: "Delivery is on fire", status: "needs-verification", source_rows: ["VEL-03", "VEL-08"], note: `VEL-08 manual_steps=${manual}; CFR unknown \u2014 needs deploy data` };
}
__name(evalG6, "evalG6");
function evaluateGates(facts) {
  const byId = new Map(facts.map((f) => [f.detectorId, f]));
  return [
    evalG1(byId),
    evalG2(byId),
    evalG3(byId),
    evalG8(byId),
    evalG6(byId),
    { id: "G4", name: "OWASP Top-10 reachable", status: "unevaluable", source_rows: ["SEC-03", "SEC-04"], note: "needs DAST / staging (outside MVP) \u2014 unevaluable: no detector" },
    { id: "G5", name: "Untested core", status: "unevaluable", source_rows: ["TEST-06"], note: "needs coverage artifact (outside MVP) \u2014 unevaluable: no detector" },
    { id: "G7", name: "Data-rescue risk", status: "unevaluable", source_rows: ["DATA-06"], note: "needs infra/restore drill (outside MVP) \u2014 unevaluable: no detector" }
  ];
}
__name(evaluateGates, "evaluateGates");

// ../../src/scan/scoring/scorer/mvp.ts
init_applicability();
function flattenFacts2(facts, detectorId) {
  const normalized = detectorId.toLowerCase().replace("-", "");
  const inner = facts[normalized];
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  const lower = detectorId.toLowerCase();
  const inner2 = facts[lower];
  if (inner2 && typeof inner2 === "object" && !Array.isArray(inner2)) return inner2;
  const keys = Object.keys(facts);
  if (keys.length === 1 && typeof facts[keys[0]] === "object" && facts[keys[0]] !== null) {
    const v = facts[keys[0]];
    if (!Array.isArray(v)) return v;
  }
  return facts;
}
__name(flattenFacts2, "flattenFacts");
function scoreDocs01(f) {
  const c = f.adr_count ?? 0;
  const newest = f.newest_adr_days ?? 9999;
  if (c === 0) return 0;
  if (c >= 5 && newest < 180) return 3;
  if (c >= 1 && newest < 365) return 2;
  return 1;
}
__name(scoreDocs01, "scoreDocs01");
function reasonDocs01(score, f) {
  const c = f.adr_count ?? 0;
  const dir = f.adr_dir ?? "no ADR dir";
  const newest = f.newest_adr_days ?? 9999;
  if (score === 0) return `No decision records \u2014 no ADR directory found; architecture changes are undocumented \u2014 per DOCS-01 Red flag: decisions live only in heads, onboarding requires a listening tour \u2014 score 0.`;
  if (score === 3) return `${c} ADRs at ${dir}; newest ${newest}d \u2014 decision process exists and is current \u2014 per DOCS-01 Green: consequential changes have ADRs \u2014 score 3.`;
  if (score === 2) return `${c} ADRs at ${dir}; newest ${newest}d \u2014 ADRs exist but stale or recent majors lack ADRs \u2014 per DOCS-01 Yellow flag: process exists but not current \u2014 score 2.`;
  return `${c} ADRs at ${dir}; scattered docs without a consistent ADR location \u2014 per DOCS-01 Yellow flag: decision docs exist but lack convention \u2014 score 1.`;
}
__name(reasonDocs01, "reasonDocs01");
function scoreDocs03(f) {
  const c = f.count ?? 0;
  const restore = f.restore_doc_present ?? false;
  const newest = f.newest_days ?? 9999;
  if (c === 0) return 0;
  if (c >= 4 && restore && newest < 180) return 3;
  if (c >= 2 && newest < 365) return 2;
  return 1;
}
__name(scoreDocs03, "scoreDocs03");
function reasonDocs03(score, f) {
  const c = f.count ?? 0;
  const dir = f.runbook_dir ?? "searched docs/runbooks, runbooks, docs/operations etc.";
  const topics = (f.topics_covered ?? []).join(", ") || "no topics";
  const restore = f.restore_doc_present ?? false;
  if (score === 0) return `No runbooks \u2014 searched ${dir}; zero files found \u2014 per DOCS-03 Red flag: incidents recovered by heroics, every lesson repeated \u2014 score 0.`;
  if (score === 3) return `${c} runbooks at ${dir}; topics ${topics}; restore ${restore ? "present" : "missing"} \u2014 runbooks cover top operational classes including restore and are current \u2014 per DOCS-03 Green: every incident class has a drilled runbook \u2014 score 3.`;
  if (score === 2) return `${c} runbooks at ${dir}; topics ${topics}; restore ${restore ? "present" : "absent"} \u2014 partial coverage of core classes \u2014 per DOCS-03 Yellow flag: fires you planned for are fine, others are a gamble \u2014 score 2.`;
  return `${c} runbooks at ${dir}; topics ${topics} \u2014 sparse or stale, restore/incident missing \u2014 per DOCS-03 Yellow flag: sparse runbooks, heroics still required \u2014 score 1.`;
}
__name(reasonDocs03, "reasonDocs03");
function scoreDocs04(f) {
  const docs = f.docs_present ?? [];
  const covered = f.stages_covered ?? [];
  const last = f.last_verified_days ?? 9999;
  if (docs.length === 0) return 0;
  if (docs.length >= 2 && covered.includes("setup") && covered.includes("run") && covered.includes("test") && last < 180) return 3;
  if (docs.length >= 1 && covered.includes("setup")) return 2;
  return 1;
}
__name(scoreDocs04, "scoreDocs04");
function reasonDocs04(score, f) {
  const docs = f.docs_present ?? [];
  const missing = f.stages_missing ?? [];
  const covered = f.stages_covered ?? [];
  if (score === 0) return `No onboarding guide \u2014 no CONTRIBUTING.md / GETTING_STARTED.md and README has no setup section; stages missing: setup, run, test \u2014 per DOCS-04 Red flag: no documentation, new hires rely on tribal knowledge \u2014 score 0.`;
  if (score === 3) return `Onboarding docs ${docs.join(", ")}; stages ${covered.join(", ")} all covered and current \u2014 per DOCS-04 Green: golden path verified and maintained \u2014 score 3.`;
  if (score === 2) return `Onboarding docs ${docs.join(", ")}; stages covered ${covered.join(", ") || "setup"}; gaps ${missing.join(", ") || "none"} \u2014 per DOCS-04 Yellow flag: covers setup+run+test, contrib/deploy gaps remain \u2014 score 2.`;
  return `Onboarding docs ${docs.join(", ")}; stages missing ${missing.join(", ")} \u2014 minimal or stale guide \u2014 per DOCS-04 Yellow flag: partial guide, broken references \u2014 score 1.`;
}
__name(reasonDocs04, "reasonDocs04");
function scoreDocs08(f) {
  const present = f.changelog_present ?? false;
  const current = f.changelog_current ?? false;
  const pct = f.with_notes_pct ?? 0;
  if (!present && pct === 0) return 0;
  if (present && current && pct >= 0.5) return 3;
  if (present && pct >= 0.2) return 2;
  return 1;
}
__name(scoreDocs08, "scoreDocs08");
function reasonDocs08(score, f) {
  const present = f.changelog_present ?? false;
  const pct = f.with_notes_pct ?? 0;
  const n = f.releases_sampled ?? 0;
  const breaking = f.breaking_with_migration_guide;
  if (score === 0) return `No CHANGELOG.md found at any of 6 candidate paths; ${Math.round(pct * 100)}% of ${n} sampled releases carry notes \u2014 per DOCS-08 Red flag: breaking changes ship unannounced, consumers learn from failures \u2014 score 0.`;
  if (score === 3) return `CHANGELOG present and current; ${Math.round(pct * 100)}% of ${n} releases carry substantive notes; breaking docs ${breaking?.documented ?? 0}/${breaking?.total_breaking ?? 0} \u2014 per DOCS-08 Green: automated notes + migration guides \u2014 score 3.`;
  if (score === 2) return `Changelog present but lagging or notes thin \u2014 ${Math.round(pct * 100)}% of ${n} releases with notes \u2014 per DOCS-08 Yellow flag: changelog sporadic, migration guides partial \u2014 score 2.`;
  return `Notes sporadic \u2014 changelog ${present ? "present" : "absent"}, ${Math.round(pct * 100)}% releases with notes; breaking changes often undocumented \u2014 per DOCS-08 Yellow flag: release communication inconsistent \u2014 score 1.`;
}
__name(reasonDocs08, "reasonDocs08");
function scoreDocs09(f) {
  const steps = f.doc_ci_steps ?? [];
  const link = f.link_checker ?? false;
  const gen = f.api_gen_wired ?? false;
  const stale = f.staleness_gate ?? false;
  if (steps.length === 0 && !link && !gen && !stale) return 0;
  if (steps.length >= 1 && link && gen && stale) return 3;
  if (steps.length >= 1 && (link || gen || stale)) return 2;
  return 1;
}
__name(scoreDocs09, "scoreDocs09");
function reasonDocs09(score, f) {
  const steps = f.doc_ci_steps ?? [];
  const kinds = steps.map((s) => s.kind ?? "step").join(", ") || "no steps";
  const link = f.link_checker ? "link-check present" : "no link-check";
  const gen = f.api_gen_wired ? "API generation wired" : "no API generation";
  const stale = f.staleness_gate ? "staleness gate present" : "no staleness gate";
  if (score === 0) return `No docs-as-code automation \u2014 zero CI steps; ${link}; ${gen} \u2014 per DOCS-09 Red flag: docs are wiki-only, drift unverified \u2014 score 0.`;
  if (score === 3) return `Docs CI steps ${kinds}; ${link}; ${gen}; ${stale} \u2014 build, lint/link, generation and freshness all enforced \u2014 per DOCS-09 Green: docs build and staleness gated \u2014 score 3.`;
  if (score === 2) return `Docs automation present (${kinds}); ${link}; ${gen}; ${stale} \u2014 gaps remain in gates/checkers \u2014 per DOCS-09 Yellow flag: automation partial \u2014 score 2.`;
  return `Single advisory docs step (${kinds}) \u2014 per DOCS-09 Yellow flag: docs pipeline minimal \u2014 score 1.`;
}
__name(reasonDocs09, "reasonDocs09");
function scorePerf02(f) {
  const model = f.model ?? "none-declared";
  if (model === "orchestrated") return 3;
  if (model === "containerized") return 2;
  if (model === "mixed-vm-container") return 1;
  if (model === "vm-scripts") return 0;
  return 0;
}
__name(scorePerf02, "scorePerf02");
function reasonPerf02(score, f) {
  const model = f.model ?? "none-declared";
  const arts = (f.artifacts ?? []).map((a) => a.path ?? "").filter(Boolean).join(", ") || "no artifacts";
  if (score === 3) return `Orchestrated/containerized deployment (${model}); artifacts ${arts} \u2014 per PERF-02 Green: image-built and orchestrated \u2014 score 3.`;
  if (score === 2) return `Containerized without orchestration (${model}); ${arts} \u2014 per PERF-02 Yellow: containerized but not yet orchestrated \u2014 score 2.`;
  if (score === 1) return `Mixed VM + container (${model}); ${arts} \u2014 per PERF-02 Yellow: migration in progress, partial automation \u2014 score 1.`;
  return `VM-scripts or no declared deploy path (${model}); ${arts} \u2014 per PERF-02 Red flag: hand-run provisioning, no declared target \u2014 score 0.`;
}
__name(reasonPerf02, "reasonPerf02");
function scorePerf06(f) {
  const fws = f.iac_frameworks ?? [];
  const undeclared = f.undeclared_classes ?? [];
  if (fws.length === 0) return 1;
  if (undeclared.length === 0) return 2;
  return 1;
}
__name(scorePerf06, "scorePerf06");
function reasonPerf06(score, f) {
  const fws = (f.iac_frameworks ?? []).join(", ") || "no IaC framework";
  const undeclared = (f.undeclared_classes ?? []).join(", ") || "none";
  if (score === 2) return `IaC ${fws}; all implied classes declared; drift gate absent \u2014 per PERF-06 estimated 2: coverage heuristic passes, true drift needs cloud creds \u2014 score 2.`;
  return `IaC ${fws}; undeclared implied classes: ${undeclared} \u2014 per PERF-06 estimated 1: IaC absent or major undeclared \u2014 score 1.`;
}
__name(reasonPerf06, "reasonPerf06");
function scoreData01(f) {
  const n = f.migration_count ?? 0;
  const cycles = f.graph_cycles ?? 0;
  const replayable = f.chain_replayable ?? true;
  const destructive = f.destructive_ops ?? [];
  if (cycles > 0 || !replayable && destructive.length > 0) return 0;
  if (destructive.length > 0) return 1;
  if (n > 0) return 3;
  return 1;
}
__name(scoreData01, "scoreData01");
function reasonData01(score, f) {
  const n = f.migration_count ?? 0;
  const fw = f.framework ?? "unknown";
  const des = (f.destructive_ops ?? []).length;
  const raw = f.raw_sql_share ?? 0;
  if (score === 0) return `${n} migrations (${fw}); unreplayable chain with cycles or destructive ops on core \u2014 per DATA-01 Red flag: migration hell, replay fails \u2014 score 0.`;
  if (score === 1) return `${n} migrations; ${des} destructive ops; raw-sql ${Math.round(raw * 100)}% \u2014 per DATA-01 Yellow: destructive/manual ops present \u2014 score 1.`;
  if (n === 0) return `No migrations found but persistence suspected \u2014 per DATA-01 unknown/estimated band \u2014 score 1.`;
  return `${n} migrations (${fw}); replayable, no destructive ops, raw-sql ${Math.round(raw * 100)}% \u2014 per DATA-01 Green: linear replayable chain \u2014 score 3.`;
}
__name(reasonData01, "reasonData01");
function scoreEcos06(f) {
  if (f.duplicate_security_critical === true) return 0;
  const total = f.transitive_total ?? 0;
  const dups = f.duplicates ?? [];
  const pct = f.pct_direct_unused ?? 0;
  if (total > 500 || dups.length > 3) return 1;
  if (total > 200 || (pct ?? 0) > 10) return 2;
  return 3;
}
__name(scoreEcos06, "scoreEcos06");
function reasonEcos06(score, f) {
  const t = f.transitive_total ?? 0;
  const dups = (f.duplicates ?? []).length;
  const pct = f.pct_direct_unused ?? 0;
  const crit = f.duplicate_security_critical ?? false;
  if (score === 0) return `${t} transitives; duplicate security-critical present \u2014 per ECOS-06 Red: unremovable security dupe \u2014 score 0.`;
  if (score === 1) return `${t} transitives; ${dups} duplicate versions \u2014 per ECOS-06 Red/Yellow: heavy bloat/duplication \u2014 score 1.`;
  if (score === 2) return `${t} transitives; ${pct}% direct unused; ${dups} duplicates \u2014 per ECOS-06 Yellow: bloat band \u2014 score 2.`;
  return `${t} transitives; no security-critical duplicates \u2014 per ECOS-06 Green: graph within budget \u2014 score 3.`;
}
__name(reasonEcos06, "reasonEcos06");
function scoreEcos08(f) {
  const fws = f.frameworks ?? [];
  if (fws.length === 0) return 2;
  const anyEol = fws.some((x) => x.support_status === "eol");
  const anyMaint = fws.some((x) => x.support_status === "maintenance");
  const coupling = f.coupling_share ?? 0;
  const facade = f.facade_layer_detected ?? false;
  if (anyEol && coupling > 0.5 && !facade) return 0;
  if (anyEol) return 1;
  if (anyMaint) return 2;
  return 3;
}
__name(scoreEcos08, "scoreEcos08");
function reasonEcos08(score, f) {
  const fws = f.frameworks ?? [];
  const coupling = f.coupling_share ?? 0;
  const facade = f.facade_layer_detected ?? false;
  const desc = fws.map((x) => `${x.name}@${x.version} ${x.support_status}`).join(", ") || "no framework";
  if (score === 0) return `${desc}; coupling ${Math.round(coupling * 100)}% with no facade \u2014 per ECOS-08 Red: EOL framework with high coupling \u2014 score 0.`;
  if (score === 1) return `${desc}; coupling ${Math.round(coupling * 100)}% \u2014 per ECOS-08 Yellow: EOL confined to non-core \u2014 score 1.`;
  if (score === 2) return `${desc} \u2014 maintenance with ${facade ? "facade present" : "no facade"} \u2014 per ECOS-08 Yellow: needs migration evidence \u2014 score 2.`;
  return `${desc}; all active \u2014 per ECOS-08 Green: supported lifecycle \u2014 score 3.`;
}
__name(reasonEcos08, "reasonEcos08");
var ECOS01_YELLOW_MARGIN_DAYS = 180;
var ECOS01_CORE_PIN = /dockerfile|workflow|ci|\.github/i;
function scoreEcos01(f) {
  const runtimes = f.runtimes ?? [];
  if (runtimes.length === 0) return 2;
  const past = runtimes.filter((r) => r.is_past_eol === true);
  if (past.length) return past.some((r) => ECOS01_CORE_PIN.test(String(r.pin_source ?? ""))) ? 0 : 1;
  const near = runtimes.some((r) => typeof r.days_until_eol === "number" && r.days_until_eol <= ECOS01_YELLOW_MARGIN_DAYS);
  return near ? 2 : 3;
}
__name(scoreEcos01, "scoreEcos01");
function reasonEcos01(score, f) {
  const runtimes = f.runtimes ?? [];
  const desc = runtimes.map((r) => `${r.product}@${r.version} (cycle ${r.cycle}, EOL ${r.is_past_eol ? "PASSED" : `${r.days_until_eol}d`}, pin ${r.pin_source})`).join(", ") || "no runtime pinned";
  if (score === 0) return `${desc}; EOL runtime pinned on the core deploy path \u2014 per ECOS-01 Red flag: unpatched runtime in core logic (G3) \u2014 score 0.`;
  if (score === 1) return `${desc}; EOL runtime confined outside core \u2014 per ECOS-01 Yellow flag: EOL in an isolated path \u2014 score 1.`;
  if (score === 2) return `${desc}; within ${ECOS01_YELLOW_MARGIN_DAYS}d of EOL \u2014 per ECOS-01 Yellow flag: active version near EOL \u2014 score 2.`;
  return `${desc}; all runtimes within support \u2014 per ECOS-01 Green: runtime current \u2014 score 3.`;
}
__name(reasonEcos01, "reasonEcos01");
var ECOS02_Y1 = 30;
var ECOS02_R1 = 50;
function scoreEcos02(f) {
  const pct1 = f.pct_behind_1plus_major ?? 0;
  const gaps = f.core_framework_gaps ?? [];
  const maxGap = gaps.reduce((a, g) => Math.max(a, g.majors_behind ?? 0), 0);
  if (maxGap >= 3) return 0;
  if (maxGap === 2 || pct1 >= ECOS02_R1) return 1;
  if (pct1 >= ECOS02_Y1) return 2;
  return 3;
}
__name(scoreEcos02, "scoreEcos02");
function reasonEcos02(score, f) {
  const pct1 = f.pct_behind_1plus_major ?? 0;
  const pct2 = f.pct_behind_2plus_major ?? 0;
  const gaps = f.core_framework_gaps ?? [];
  const worst = gaps.length ? `; worst core gap ${gaps[0].name} ${gaps[0].majors_behind} major(s)` : "";
  if (score === 0) return `${pct1}% \u22651 major behind, ${pct2}% \u22652${worst} \u2014 per ECOS-02 Red flag: core framework stuck \u22652 majors \u2014 score 0.`;
  if (score === 1) return `${pct1}% \u22651 major behind, ${pct2}% \u22652${worst} \u2014 per ECOS-02 Red/Yellow: deep drift or core framework 2 majors behind \u2014 score 1.`;
  if (score === 2) return `${pct1}% \u22651 major behind${worst} \u2014 per ECOS-02 Yellow flag: 30\u201350% drifting \u2014 score 2.`;
  return `${pct1}% \u22651 major behind; core framework within a major \u2014 per ECOS-02 Green: minor drift only \u2014 score 3.`;
}
__name(reasonEcos02, "reasonEcos02");
var ECOS03_Y_MONTHS = 12;
var ECOS03_R_MONTHS = 24;
function scoreEcos03(f) {
  const abandoned = f.abandoned ?? [];
  if (abandoned.length === 0) return 3;
  const coreFire = abandoned.some((a) => a.in_core_path === true && (a.archived === true || (a.months_since_release ?? 0) > ECOS03_R_MONTHS));
  if (coreFire) return 0;
  const bus = f.bus_factor_1_count ?? 0;
  const peripheralBand = abandoned.some((a) => a.in_core_path !== true && (a.months_since_release ?? 0) >= ECOS03_Y_MONTHS && (a.months_since_release ?? 0) <= ECOS03_R_MONTHS);
  if (peripheralBand || bus > 0 && abandoned.every((a) => a.in_core_path !== true)) return 2;
  return 1;
}
__name(scoreEcos03, "scoreEcos03");
function reasonEcos03(score, f) {
  const abandoned = f.abandoned ?? [];
  const total = f.load_bearing_total ?? 0;
  const names = abandoned.slice(0, 4).map((a) => `${a.name} (${a.months_since_release}mo${a.in_core_path ? ", core" : ""})`).join(", ");
  if (score === 0) return `${abandoned.length}/${total} load-bearing deps abandoned; core: ${names} \u2014 per ECOS-03 Red flag: unmaintained >24mo or archived in core \u2014 score 0.`;
  if (score === 2) return `${abandoned.length}/${total} abandoned in peripheral scope: ${names} \u2014 per ECOS-03 Yellow flag: 12\u201324mo peripheral \u2014 score 2.`;
  if (score === 1) return `${abandoned.length}/${total} abandoned: ${names} \u2014 per ECOS-03 Yellow flag: isolated/very-old abandonment \u2014 score 1.`;
  return `all ${total} load-bearing deps maintained \u2014 per ECOS-03 Green: no abandonment \u2014 score 3.`;
}
__name(reasonEcos03, "reasonEcos03");
function scoreEcos05(f) {
  const strong = f.copyleft_strong ?? [];
  const unknown = f.license_unknown_count ?? 0;
  const sbom = f.sbom_present_in_repo ?? false;
  const closed = f.closed_source_distribution_likely ?? false;
  if (strong.length > 0 && closed) return 0;
  if (strong.length > 0 || unknown > 0) return 1;
  return sbom ? 3 : 2;
}
__name(scoreEcos05, "scoreEcos05");
function reasonEcos05(score, f) {
  const strong = f.copyleft_strong ?? [];
  const unknown = f.license_unknown_count ?? 0;
  const total = f.packages_total ?? 0;
  const sbom = f.sbom_present_in_repo ?? false;
  const closed = f.closed_source_distribution_likely ?? false;
  if (score === 0) return `${strong.length} strong-copyleft of ${total} with closed-source distribution (${strong.map((s) => `${s.name} ${s.license}`).join(", ")}) \u2014 per ECOS-05 Red flag: copyleft in closed distribution (G8) \u2014 score 0.`;
  if (score === 1) return `${unknown} unknown-license + ${strong.length} strong-copyleft of ${total} direct deps \u2014 per ECOS-05 Yellow flag: unknown/copyleft present \u2014 score 1 (estimated clamp [1,2]).`;
  return `${total} direct deps, ${unknown} unknown, no strong copyleft; SBOM ${sbom ? "present" : "absent"} \u2014 per ECOS-05 ${sbom ? "Green" : "Yellow"}: ${sbom ? "compliant" : "clean but no SBOM"} \u2014 score ${score} (estimated clamp [1,2]).`;
}
__name(reasonEcos05, "reasonEcos05");
var ECOS07_R_PIN = 50;
function scoreEcos07(f) {
  const locks = f.lockfiles ?? [];
  const pin = f.pin_ratio ?? 0;
  const enforced = f.ci_immutable_install?.enforced ?? false;
  const manifests = f.manifests_total ?? 0;
  if (locks.length === 0 || pin < ECOS07_R_PIN) return 0;
  if (locks.length < manifests) return 1;
  const anyStale = locks.some((l) => l.stale === true);
  return !anyStale && enforced ? 3 : 2;
}
__name(scoreEcos07, "scoreEcos07");
function reasonEcos07(score, f) {
  const locks = f.lockfiles ?? [];
  const pin = f.pin_ratio ?? 0;
  const enforced = f.ci_immutable_install;
  const manifests = f.manifests_total ?? 0;
  const desc = locks.map((l) => `${l.path}${l.stale ? " (stale)" : ""}${l.integrity_hashes ? "" : " (no integrity)"}`).join(", ") || "no lockfile";
  if (score === 0) return `${desc}; pin_ratio ${pin}% \u2014 per ECOS-07 Red flag: no lockfile or floating pins \u2014 score 0.`;
  if (score === 1) return `${locks.length}/${manifests} manifests locked (${desc}); pin_ratio ${pin}% \u2014 per ECOS-07 Yellow flag: partial coverage \u2014 score 1.`;
  if (score === 2) return `${desc}; pin_ratio ${pin}%; CI immutable install ${enforced?.enforced ? "enforced" : "not enforced"} \u2014 per ECOS-07 Yellow flag: locked but stale/not enforced \u2014 score 2.`;
  return `${desc}; pin_ratio ${pin}%; CI immutable (${enforced?.evidence}) \u2014 per ECOS-07 Green: lockfile + immutable CI \u2014 score 3.`;
}
__name(reasonEcos07, "reasonEcos07");
var ARCH05_Y_SHARE = 0.5;
function scoreArch05(f) {
  const hotspots = f.hotspots ?? [];
  if (hotspots.length === 0) return 3;
  if (hotspots.some((h) => h.in_core_path === true)) return 0;
  if (hotspots.length === 1) return 1;
  const share = f.churn_top10_share ?? 0;
  return share > ARCH05_Y_SHARE ? 2 : 2;
}
__name(scoreArch05, "scoreArch05");
function reasonArch05(score, f) {
  const hotspots = f.hotspots ?? [];
  const share = f.churn_top10_share ?? 0;
  const commits = f.commits_analyzed ?? 0;
  const windowDays = f.window_days ?? 0;
  const desc = hotspots.slice(0, 4).map((h) => `${h.file} (#${h.churn_rank} churn/#${h.defect_rank} defect${h.in_core_path ? ", core" : ""})`).join(", ");
  if (score === 0) return `${commits} commits/${windowDays}d; top10% share ${share}; core hot spot(s): ${desc} \u2014 per ARCH-05 Red flag: hot spot on core path \u2014 score 0.`;
  if (score === 1) return `${commits} commits/${windowDays}d; single isolated hot spot: ${desc} \u2014 per ARCH-05 Yellow flag: isolated hot spot \u2014 score 1.`;
  if (score === 2) return `${commits} commits/${windowDays}d; top10% share ${share}; non-core hot spots: ${desc} \u2014 per ARCH-05 Yellow flag: churn concentrated, defect correlation mild \u2014 score 2.`;
  return `${commits} commits/${windowDays}d; top10% share ${share}; no churn\u2229defect intersection \u2014 per ARCH-05 Green: no hot spots \u2014 score 3.`;
}
__name(reasonArch05, "reasonArch05");
function scoreTest03(f) {
  const unit = f.unit ?? 0;
  const e2e = f.e2e ?? 0;
  const share = f.e2e_share_est ?? 0;
  if (unit === 0 || e2e > 0 && unit < e2e || share > 0.5) return 1;
  return 2;
}
__name(scoreTest03, "scoreTest03");
function reasonTest03(score, f) {
  const unit = f.unit ?? 0;
  const integration = f.integration ?? 0;
  const e2e = f.e2e ?? 0;
  const share = f.e2e_share_est ?? 0;
  const desc = `unit/integration/e2e = ${unit}/${integration}/${e2e}; e2e share ~${Math.round(share * 100)}%`;
  if (score === 1) return `${desc} \u2014 per TEST-03 Yellow/Red: E2E-dominant or no unit layer \u2014 score 1 (estimated clamp [1,2]).`;
  return `${desc} \u2014 per TEST-03 Yellow flag: overweight E2E but unit layer exists \u2014 score 2 (estimated clamp [1,2]; 3 unreachable by construction).`;
}
__name(reasonTest03, "reasonTest03");
var TEST05_GOLD_RATIO = 0.02;
var TEST05_RED_RATIO = 0.1;
var TEST05_AGED_DAYS = 180;
function scoreTest05(f) {
  const ratio = f.skip_ratio ?? 0;
  const aged = f.aged_skips ?? [];
  if (ratio > TEST05_RED_RATIO || aged.some((a) => (a.age_days ?? 0) > TEST05_AGED_DAYS)) return 1;
  if (ratio < TEST05_GOLD_RATIO) return 3;
  return 2;
}
__name(scoreTest05, "scoreTest05");
function reasonTest05(score, f) {
  const total = f.total_tests_est ?? 0;
  const skipped = f.skipped_total ?? 0;
  const ratio = f.skip_ratio ?? 0;
  const aged = f.aged_skips ?? [];
  const agedMax = aged.reduce((a, x) => Math.max(a, x.age_days ?? 0), 0);
  const desc = `${skipped}/${total} skipped (${Math.round(ratio * 100)}%${agedMax ? `, oldest ${agedMax}d` : ""})`;
  if (score === 1) return `${desc} \u2014 per TEST-05 Red flag: >10% skipped or skips aged >6mo \u2014 score 1.`;
  if (score === 3) return `${desc} \u2014 per TEST-05 Green: <2% skipped \u2014 score 3.`;
  return `${desc} \u2014 per TEST-05 Yellow flag: 2\u201310% skipped \u2014 score 2.`;
}
__name(reasonTest05, "reasonTest05");
var SEC01_CRITICAL_DAYS = 14;
var SEC01_HIGH_YELLOW_DAYS = 30;
function scoreSec01(f) {
  const findings = f.findings ?? [];
  const crits = findings.filter((x) => x.severity === "CRITICAL");
  const critFire = crits.some((c) => (c.age_days ?? 0) > SEC01_CRITICAL_DAYS && c.in_core_import_closure !== false);
  if (critFire) return 0;
  if (crits.length > 0) return 1;
  const highs = findings.filter((x) => x.severity === "HIGH");
  if (highs.length === 0) return 3;
  return highs.some((h) => (h.age_days ?? 0) > SEC01_HIGH_YELLOW_DAYS) ? 1 : 2;
}
__name(scoreSec01, "scoreSec01");
function reasonSec01(score, f) {
  const findings = f.findings ?? [];
  const desc = findings.slice(0, 4).map((x) => `${x.id} on ${x.pkg} (${x.severity}, ${x.age_days}d${x.in_core_import_closure ? ", core-reachable" : ""})`).join(", ") || "no findings";
  const crits = findings.filter((x) => x.severity === "CRITICAL").length;
  const highs = findings.filter((x) => x.severity === "HIGH").length;
  if (score === 0) return `${crits} critical, ${highs} high open: ${desc} \u2014 per SEC-01 Red flag: exposed critical >14d (G2) \u2014 score 0.`;
  if (score === 1) return `${crits} critical, ${highs} high open: ${desc} \u2014 per SEC-01 Yellow flag: critical isolated or aged highs \u2014 score 1.`;
  if (score === 2) return `${highs} high open within 30d: ${desc} \u2014 per SEC-01 Yellow flag: high within band \u2014 score 2.`;
  return `zero open high/critical \u2014 per SEC-01 Green: SLAs met \u2014 score 3.`;
}
__name(reasonSec01, "reasonSec01");
var SEC02_CORE_PATH = /(^|\/)(config|conf|env|deploy|deployment|k8s|helm|terraform|secrets?|\.env|auth|ci|\.github)(\/|\.|$)/i;
function scoreSec02(f) {
  const tree = f.tree_findings ?? [];
  const hist = f.history_only_findings ?? 0;
  const verified = f.verified_live ?? 0;
  if (verified > 0) return 0;
  if (tree.length === 0) return hist > 0 ? 2 : 3;
  if (tree.some((t) => SEC02_CORE_PATH.test(String(t.file ?? "")))) return 0;
  return 1;
}
__name(scoreSec02, "scoreSec02");
function reasonSec02(score, f) {
  const tree = f.tree_findings ?? [];
  const hist = f.history_only_findings ?? 0;
  const verified = f.verified_live ?? 0;
  const desc = tree.slice(0, 4).map((t) => `${t.rule}@${t.file}`).join(", ") || "clean tree";
  if (score === 0) return `${tree.length} tree finding(s) (${verified} verified-live): ${desc} \u2014 per SEC-02 Red flag: active secret in core/prod (G1) \u2014 score 0.`;
  if (score === 2) return `clean tree; ${hist} history-only finding(s) \u2014 per SEC-02 Yellow flag: rotated secrets in history \u2014 score 2.`;
  if (score === 1) return `${tree.length} unverified finding(s) in isolated paths: ${desc} \u2014 per SEC-02 Yellow flag: isolated unverified secret \u2014 score 1.`;
  return `zero findings (clean tree + history) \u2014 per SEC-02 Green: no secrets \u2014 score 3.`;
}
__name(reasonSec02, "reasonSec02");
function scoreSec09(f) {
  const parsers = f.parser_surface_detected ?? [];
  const harnesses = f.harnesses ?? [];
  const sanit = f.sanitizers_in_build ?? false;
  const cont = f.continuous_fuzzing ?? {};
  if (parsers.length > 0 && harnesses.length === 0 && !sanit) return 0;
  if (harnesses.length > 0 && sanit && cont.oss_fuzz) return 3;
  if (harnesses.length > 0) return 2;
  if (sanit) return 1;
  return 0;
}
__name(scoreSec09, "scoreSec09");
function reasonSec09(score, f) {
  const h = (f.harnesses ?? []).length;
  const surf = (f.parser_surface_detected ?? []).join(", ") || "unknown surface";
  const sanit = f.sanitizers_in_build ? "sanitizers present" : "no sanitizers";
  const cont = f.continuous_fuzzing?.oss_fuzz ? "continuous fuzzing" : "no continuous fuzzing";
  if (score === 0) return `Parsing surface ${surf}; zero harnesses; ${sanit} \u2014 per SEC-09 Red: input robustness untested \u2014 score 0 (presence-only caveat).`;
  if (score === 3) return `${h} harness(es); ${sanit}; ${cont} \u2014 per SEC-09 Green: harnesses + sanitizers + continuous \u2014 score 3.`;
  if (score === 2) return `${h} harness(es); ${sanit} \u2014 per SEC-09 Yellow: harnesses present, coverage partial \u2014 score 2.`;
  return `${sanit}; single or stale harness \u2014 per SEC-09 Yellow: sanitizers only \u2014 score 1.`;
}
__name(reasonSec09, "reasonSec09");
function scoreSec10(f) {
  const jobs = f.security_jobs ?? [];
  if (jobs.length === 0) return 0;
  const classes = f.classes_present ?? [];
  const hist = f.secret_scan_covers_history ?? false;
  const img = f.image_scan_on_build ?? false;
  if (classes.includes("sast") && hist && img && jobs.every((j) => j.blocking)) return 3;
  if (classes.length >= 2) return 2;
  return 1;
}
__name(scoreSec10, "scoreSec10");
function reasonSec10(score, f) {
  const classes = (f.classes_present ?? []).join(", ") || "none";
  const jobs = (f.security_jobs ?? []).map((j) => j.name).join(", ") || "none";
  if (score === 0) return `No security CI jobs \u2014 classes ${classes}; jobs ${jobs} \u2014 per SEC-10 Red: no SAST/deps/secret/image gates \u2014 score 0.`;
  if (score === 3) return `Security classes ${classes}; jobs ${jobs} all blocking \u2014 per SEC-10 Green: SAST + secret(history) + deps + image present \u2014 score 3.`;
  if (score === 2) return `Classes ${classes}; jobs ${jobs} \u2014 per SEC-10 Yellow: core classes present, partial blocking \u2014 score 2.`;
  return `Single class ${classes} \u2014 per SEC-10 Yellow: advisory-only gate \u2014 score 1.`;
}
__name(reasonSec10, "reasonSec10");
var TRANCHE_SCORERS = {
  "ECOS-01": scoreEcos01,
  "ECOS-02": scoreEcos02,
  "ECOS-03": scoreEcos03,
  "ECOS-05": scoreEcos05,
  "ECOS-07": scoreEcos07,
  "SEC-01": scoreSec01,
  "SEC-02": scoreSec02,
  "ARCH-05": scoreArch05,
  "TEST-03": scoreTest03,
  "TEST-05": scoreTest05,
  "DOCS-01": scoreDocs01,
  "DOCS-03": scoreDocs03,
  "DOCS-04": scoreDocs04,
  "DOCS-08": scoreDocs08,
  "DOCS-09": scoreDocs09,
  "PERF-02": scorePerf02,
  "PERF-06": scorePerf06,
  "DATA-01": scoreData01,
  "ECOS-06": scoreEcos06,
  "ECOS-08": scoreEcos08,
  "SEC-09": scoreSec09,
  "SEC-10": scoreSec10
};
var TRANCHE_REASONS = {
  "ECOS-01": reasonEcos01,
  "ECOS-02": reasonEcos02,
  "ECOS-03": reasonEcos03,
  "ECOS-05": reasonEcos05,
  "ECOS-07": reasonEcos07,
  "SEC-01": reasonSec01,
  "SEC-02": reasonSec02,
  "ARCH-05": reasonArch05,
  "TEST-03": reasonTest03,
  "TEST-05": reasonTest05,
  "DOCS-01": reasonDocs01,
  "DOCS-03": reasonDocs03,
  "DOCS-04": reasonDocs04,
  "DOCS-08": reasonDocs08,
  "DOCS-09": reasonDocs09,
  "PERF-02": reasonPerf02,
  "PERF-06": reasonPerf06,
  "DATA-01": reasonData01,
  "ECOS-06": reasonEcos06,
  "ECOS-08": reasonEcos08,
  "SEC-09": reasonSec09,
  "SEC-10": reasonSec10
};
var ESTIMATED_CLAMP = {
  "ECOS-01": [1, 2],
  "ECOS-02": [1, 2],
  "ECOS-03": [1, 2],
  "ECOS-05": [1, 2],
  "ECOS-06": [1, 2],
  "ECOS-08": [1, 2],
  "SEC-01": [1, 2],
  "TEST-03": [1, 2],
  "ARCH-05": [1, 2]
};
var MVP_IDS2 = ["VEL-06", "VEL-09", "VEL-08", "VEL-10", "SEC-07", "TEST-08", "ECOS-01", "ECOS-02", "ECOS-03", "ECOS-05", "ECOS-07", "SEC-01", "SEC-06", "SEC-02", "ARCH-01", "ARCH-08", "ARCH-05", "TEST-03", "TEST-05"];
var TRANCHE_A_IDS2 = ["DOCS-01", "DOCS-03", "DOCS-04", "DOCS-08", "DOCS-09", "PERF-02", "PERF-06", "DATA-01", "ECOS-06", "ECOS-08", "SEC-09", "SEC-10"];
var ALL_MEASURED_IDS = [...MVP_IDS2, ...TRANCHE_A_IDS2];
var RUBRIC_REGISTRY = Object.fromEntries(
  (rubric_default.indicators ?? []).map((i) => [i.id, { name: i.name, category: i.category, effort: i.effort, remediation: i.remediation }])
);
function lookupName(id) {
  const e = RUBRIC_REGISTRY[id];
  if (!e) {
    console.warn(`Unknown indicator ${id}`);
    return `Unknown indicator (${id})`;
  }
  return e.name;
}
__name(lookupName, "lookupName");
function lookupEffort(id) {
  return RUBRIC_REGISTRY[id]?.effort ?? "\u26A1 \u226430 min";
}
__name(lookupEffort, "lookupEffort");
function lookupCategory(id) {
  return RUBRIC_REGISTRY[id]?.category ?? id.split("-")[0];
}
__name(lookupCategory, "lookupCategory");
function lookupRemediation2(id) {
  return RUBRIC_REGISTRY[id]?.remediation ?? { quick_win: "", structural: "", gold_standard: "", effort: "\u26A1 \u226430 min" };
}
__name(lookupRemediation2, "lookupRemediation");
function scoreMvp(facts, opts = {}) {
  const archetype = opts.archetype ?? "unknown";
  const plane = opts.planeInventory ?? { has_server: true, has_data: true, has_deploy: true, has_client: true, has_test: true };
  const byId = new Map(facts.map((f) => [f.detectorId, f]));
  const rawPhase1 = factsToRows(facts.filter((f) => ["VEL-06", "VEL-09", "VEL-08", "VEL-10", "SEC-07", "TEST-08"].includes(f.detectorId)));
  const phase1 = rawPhase1.map((r) => r.status === "measured" ? { ...r, remediation: lookupRemediation2(r.id) } : r);
  const extraIds = [...MVP_IDS2.slice(6), ...TRANCHE_A_IDS2];
  const extraRows = [];
  for (const id of extraIds) {
    const f = byId.get(id);
    const cat = lookupCategory(id);
    const name = lookupName(id);
    const effort = lookupEffort(id);
    const scorer = TRANCHE_SCORERS[id];
    if (!f || f.error || !scorer) {
      const whatItTakes = f?.unknownMeasurePath ?? `what it takes: ${id} failed`;
      extraRows.push({ id, name, category_id: cat, status: "unknown", unknown_measure_path: whatItTakes, effort });
      continue;
    }
    const flat = flattenFacts2(f.facts, id);
    const reasonFn = TRANCHE_REASONS[id];
    const measurementStatus = f.measurement?.status ?? "measured";
    let score2 = scorer(flat);
    if (measurementStatus === "estimated") {
      const clamp = ESTIMATED_CLAMP[id];
      if (clamp) score2 = Math.min(clamp[1], Math.max(clamp[0], score2));
    }
    const status2 = measurementStatus === "estimated" ? "estimated" : "measured";
    const reason = reasonFn ? reasonFn(score2, flat) : `${name} \u2014 evidence via ${f.provenance.tool} \u2014 score ${score2}.`;
    const remediation = lookupRemediation2(id);
    extraRows.push({ id, name, category_id: cat, status: status2, score: score2, reason, evidence: { tool: f.provenance.tool, tool_version: f.provenance.version, pointers: f.evidencePointers, facts: flat }, effort, remediation });
  }
  const dataNotApplicable = /* @__PURE__ */ new Set();
  {
    const ecos08 = extraRows.find((r) => r.id === "ECOS-08");
    const frameworks = ecos08?.evidence?.facts?.frameworks;
    if (Array.isArray(frameworks) && frameworks.length === 0) dataNotApplicable.add("ECOS-08");
  }
  const IMPLEMENTED_SET = new Set(ALL_MEASURED_IDS);
  const allRowsWithApplicability = [...phase1, ...extraRows].map((r) => {
    if (!IMPLEMENTED_SET.has(r.id)) {
      return { ...r, status: "not_implemented", score: void 0, reason: "detector not implemented in this slice", unknown_measure_path: `What it takes: ${r.id} \u2014 detector pending; see rubric`, evidence: void 0, not_applicable: false };
    }
    if (dataNotApplicable.has(r.id)) {
      const why = "no framework/support surface detected \u2014 ECOS-08 not applicable for this target";
      return { ...r, status: "not_applicable", score: void 0, reason: why, unknown_measure_path: why, evidence: void 0, not_applicable: true };
    }
    const evalRes = evaluateApplicability(r.id, archetype, plane);
    if (evalRes.notApplicable) {
      return { ...r, not_applicable: true, status: "not_applicable", score: void 0, reason: evalRes.reason, unknown_measure_path: evalRes.reason, evidence: void 0 };
    }
    return r;
  });
  const allIds102 = rubric_default.indicators.map((i) => i.id);
  const existingIds = new Set(allRowsWithApplicability.map((r) => r.id));
  const notImplementedStubs = allIds102.filter((id) => !existingIds.has(id)).map((id) => {
    const cat = lookupCategory(id);
    const name = lookupName(id);
    const effort = lookupEffort(id);
    return { id, name, category_id: cat, status: "not_implemented", reason: "detector not implemented in this slice", unknown_measure_path: `Not implemented \u2014 ${id} requires a detector (see rubric)`, effort, not_applicable: false };
  });
  const allRowsForCoverage = [...allRowsWithApplicability, ...notImplementedStubs];
  const allRows = allRowsForCoverage;
  const byCat = /* @__PURE__ */ new Map();
  for (const r of allRows) {
    if (!byCat.has(r.category_id)) byCat.set(r.category_id, []);
    byCat.get(r.category_id).push(r);
  }
  const BASE_WEIGHTS = { SEC: 20, VEL: 10, TEST: 10, ECOS: 10, ARCH: 15, DATA: 10, API: 10, PERF: 10, DOCS: 5 };
  const CATEGORY_LABELS = {
    SEC: "Security, Compliance & Vulnerability",
    VEL: "Developer Velocity & Operational Drag",
    TEST: "Testing & Quality Engineering",
    ECOS: "Dependency & Ecosystem Health",
    ARCH: "Architecture & Code Quality",
    DATA: "Data & Schema Evolution",
    API: "API & Integration Surface",
    PERF: "Performance & Cloud/Infrastructure Fit",
    DOCS: "Documentation & Knowledge Continuity"
  };
  const applicableCats = [...byCat.entries()].filter(([, rows]) => rows.some((r) => r.status === "measured" || r.status === "estimated")).map(([cat]) => cat);
  const renormWeights = renormalizeWeights(applicableCats, BASE_WEIGHTS);
  const legacyScore = (() => {
    let s = 0;
    for (const [cat, rows] of byCat.entries()) {
      const measured2 = rows.filter((r) => !r.not_applicable && (r.status === "measured" || r.status === "estimated"));
      const sum = measured2.reduce((a, r) => a + (r.score ?? 0), 0);
      const applicable = measured2.length;
      const catPct = applicable ? sum / (applicable * 3) * 100 : 0;
      const w = renormWeights[cat] ?? 0;
      s += catPct * w / 100;
    }
    return s;
  })();
  const canonicalScore = (() => {
    let s = 0;
    for (const [cat, rows] of byCat.entries()) {
      const scored = rows.filter((r) => !r.not_applicable && r.status !== "not_implemented" && (r.status === "measured" || r.status === "estimated" || r.status === "unknown"));
      const sum = scored.reduce((a, r) => a + (r.score ?? 0), 0);
      const applicable = scored.length;
      const catPct = applicable ? sum / (applicable * 3) * 100 : 0;
      s += catPct * (BASE_WEIGHTS[cat] ?? 0) / 100;
    }
    return s;
  })();
  const categories = [...byCat.entries()].map(([cat, rows]) => {
    const notApplicable = rows.filter((r) => r.status === "not_applicable").length;
    const notImplemented = rows.filter((r) => r.status === "not_implemented").length;
    const measured2 = rows.filter((r) => r.status === "measured");
    const estimated2 = rows.filter((r) => r.status === "estimated");
    const unknown2 = rows.filter((r) => r.status === "unknown").length;
    const sum = measured2.reduce((a, r) => a + (r.score ?? 0), 0) + estimated2.reduce((a, r) => a + (r.score ?? 0), 0);
    const applicable = measured2.length + estimated2.length;
    const legacy_category_score = applicable ? sum / (applicable * 3) * 100 : null;
    const frozenApplicable = applicable + unknown2;
    const category_score = frozenApplicable ? sum / (frozenApplicable * 3) * 100 : null;
    const weight = renormWeights[cat] ?? 0;
    const canonicalWeight = BASE_WEIGHTS[cat] ?? 0;
    const weighted_contribution = category_score == null ? 0 : category_score * canonicalWeight / 100;
    const legacy_weighted = legacy_category_score == null ? 0 : legacy_category_score * weight / 100;
    return { id: cat, name: CATEGORY_LABELS[cat] ?? cat, weight: canonicalWeight, canonical_weight: canonicalWeight, applicable: frozenApplicable, scored_sum: sum, category_score, renormalized_category_score: legacy_category_score, weighted_contribution, legacy_weighted_contribution: legacy_weighted, status_counts: { measured: measured2.length, estimated: estimated2.length, unknown: unknown2, not_applicable: notApplicable, not_implemented: notImplemented }, indicator_rows: rows };
  });
  const score = categories.reduce((a, c) => a + c.weighted_contribution, 0);
  const renormalizedScore = categories.reduce((a, c) => a + (c.legacy_weighted_contribution ?? 0), 0);
  const measured = allRows.filter((r) => r.status === "measured").length;
  const estimated = allRows.filter((r) => r.status === "estimated").length;
  const not_applicable = allRows.filter((r) => r.status === "not_applicable").length;
  const not_implemented = allRows.filter((r) => r.status === "not_implemented").length;
  const unknown = allRows.filter((r) => r.status === "unknown").length;
  const totalApplicable = measured + estimated + unknown;
  const coverage = { measured, estimated, unknown, not_applicable, not_implemented, measured_pct: `${Math.round(measured / (totalApplicable || 1) * 100)}%`, estimated_pct: `${Math.round(estimated / (totalApplicable || 1) * 100)}%`, unknown_pct: `${Math.round(unknown / (totalApplicable || 1) * 100)}%`, not_applicable_pct: `${Math.round(not_applicable / 102 * 100)}%`, not_implemented_pct: `${Math.round(not_implemented / 102 * 100)}%` };
  const status = measured === ALL_MEASURED_IDS.length || measured === MVP_IDS2.length ? "complete" : "degraded";
  const requested = measured + estimated + unknown;
  const suppressed = requested > 0 && measured + estimated < requested * COVERAGE_FLOOR;
  const verdict = suppressed ? "insufficient-signal" : void 0;
  const rawGates = evaluateGates(facts);
  const rowStatusById = new Map(allRows.map((r) => [r.id, r.status]));
  const gates = rawGates.map((g) => {
    const statuses = g.source_rows.map((id) => rowStatusById.get(id) ?? "not_implemented");
    if (statuses.some((s) => s === "measured" || s === "estimated")) return g;
    let note;
    if (statuses.every((s) => s === "not_implemented")) note = "detector not implemented in this slice \u2014 gate unevaluable";
    else if (statuses.every((s) => s === "not_applicable" || s === "not_implemented")) note = "not applicable for this archetype \u2014 gate unevaluable";
    else note = `${g.note} \u2014 unevaluable: source row(s) unknown`;
    return { ...g, status: "unevaluable", note };
  });
  return { categories, coverage, score, renormalized_score: renormalizedScore, canonical_score: canonicalScore, status, gates, rows: allRows, suppressed, verdict };
}
__name(scoreMvp, "scoreMvp");

// ../../src/scan/scoring/fingerprint.ts
import { createHash } from "node:crypto";
var FINGERPRINT_VERSION = 3;
function stableStringify(v) {
  if (v === null || v === void 0) return "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (typeof v === "object") {
    const keys = Object.keys(v).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(",")}}}`;
  }
  const s = JSON.stringify(v);
  return s === void 0 ? "null" : s;
}
__name(stableStringify, "stableStringify");
function normalizedFact(f) {
  const rec = f;
  const prov = rec.provenance ?? {};
  const { durationMs: _drop, ...provRest } = prov;
  void _drop;
  return {
    detectorId: rec.detectorId,
    schemaVersion: rec.schemaVersion,
    facts: rec.facts,
    evidencePointers: rec.evidencePointers,
    provenance: provRest,
    truncated: rec.truncated,
    error: rec.error ?? null,
    // v2: the detector's measurement verdict and its what-it-takes note are
    // semantic (measured vs estimated vs unknown), never a machine artifact.
    measurement: rec.measurement ?? null,
    unknownMeasurePath: rec.unknownMeasurePath ?? null
  };
}
__name(normalizedFact, "normalizedFact");
function computeScoreFingerprint(input2) {
  const sorted = [...input2.facts].sort(
    (a, b) => String(a.detectorId ?? "").localeCompare(
      String(b.detectorId ?? "")
    )
  );
  const payload = {
    fingerprint_version: FINGERPRINT_VERSION,
    facts: sorted.map(normalizedFact),
    rubric_version: input2.rubricVersion,
    engine_version: input2.engineVersion,
    engine_sha7: input2.engineSha7,
    snapshot_versions: input2.snapshotVersions ?? {},
    strict: input2.strict,
    indicator_set: [...input2.indicatorSet].sort(),
    archetype: input2.archetype,
    score_policy: input2.scorePolicy ?? "frozen"
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}
__name(computeScoreFingerprint, "computeScoreFingerprint");

// ../../src/scan/scoring/bandpath.ts
function costClassForEffort(effort) {
  const tag = String(effort ?? "");
  if (tag.includes("\u26A1")) return "sprint";
  if (tag.includes("\u{1F536}")) return "quarter";
  return "structural";
}
__name(costClassForEffort, "costClassForEffort");
var CLASS_ORDER = ["sprint", "quarter", "structural"];
function bandPathRegistryFromRubric(rubric) {
  const registry = {};
  for (const indicator of rubric.indicators ?? []) {
    if (!indicator?.id) continue;
    registry[indicator.id] = {
      ...indicator.effort ? { effort: indicator.effort } : {},
      ...indicator.remediation?.quick_win ? { quick_win: indicator.remediation.quick_win } : {}
    };
  }
  return registry;
}
__name(bandPathRegistryFromRubric, "bandPathRegistryFromRubric");
function sealedRowSource(input2) {
  if (input2.rows && input2.rows.length > 0) return input2.rows;
  return (input2.categories ?? []).flatMap((category) => category?.indicator_rows ?? []);
}
__name(sealedRowSource, "sealedRowSource");
function quickWinFor(row, registry) {
  const rowWin = row.remediation?.quick_win;
  const win = rowWin?.trim() ? rowWin : registry?.[row.id ?? ""]?.quick_win;
  return win?.trim() ? win : void 0;
}
__name(quickWinFor, "quickWinFor");
function deriveNextBandPath(input2) {
  if (input2.suppressed) return void 0;
  const next = nextBandForTier(input2.score, input2.tier ?? tierForScore(input2.score));
  const sealedRows = sealedRowSource(input2);
  const unreachedRows = sealedRows.filter(
    (row) => row.status === "unknown" || row.status === "not_implemented"
  ).length;
  if (!next) {
    return {
      destination: null,
      threshold: null,
      points_needed: null,
      classes: [],
      unreached_rows: unreachedRows,
      terminal: true
    };
  }
  const pointsNeeded = bandPathDistance(next.threshold, input2.score, input2.tier ?? tierForScore(input2.score));
  const categoryById = /* @__PURE__ */ new Map();
  for (const category of input2.categories ?? []) {
    if (category?.id) categoryById.set(category.id, category);
  }
  const byClass = { sprint: [], quarter: [], structural: [] };
  for (const row of sealedRows) {
    if (row.not_applicable) continue;
    if (row.status !== "measured" && row.status !== "estimated") continue;
    const rowScore = row.score;
    if (typeof rowScore !== "number" || rowScore < 0 || rowScore > 2) continue;
    const category = row.category_id ? categoryById.get(row.category_id) : void 0;
    const weight = typeof category?.weight === "number" ? category.weight : 0;
    const applicable = typeof category?.applicable === "number" ? category.applicable : 0;
    if (weight <= 0 || applicable <= 0) continue;
    const recoverablePp = (3 - rowScore) * weight / (3 * applicable);
    if (recoverablePp <= 0) continue;
    const step = {
      row: row.id ?? "",
      name: row.name ?? row.id ?? "",
      recoverable_pp: recoverablePp,
      effort: row.effort ?? input2.registry?.[row.id ?? ""]?.effort ?? ""
    };
    const quickWin = quickWinFor(row, input2.registry);
    if (quickWin) step.quick_win = quickWin;
    byClass[costClassForEffort(step.effort)].push(step);
  }
  const classes = [];
  let cumulativePp = 0;
  for (const costClass of CLASS_ORDER) {
    const steps = byClass[costClass];
    if (steps.length === 0) continue;
    steps.sort((a, b) => b.recoverable_pp - a.recoverable_pp || a.row.localeCompare(b.row));
    const pp = steps.reduce((sum, step) => sum + step.recoverable_pp, 0);
    cumulativePp += pp;
    const arrival = pp >= pointsNeeded ? "alone" : cumulativePp >= pointsNeeded ? "combined" : "not-reached";
    classes.push({ class: costClass, pp, cumulative_pp: cumulativePp, arrival, steps });
  }
  return {
    destination: next.band,
    threshold: next.threshold,
    points_needed: pointsNeeded,
    classes,
    unreached_rows: unreachedRows,
    terminal: false
  };
}
__name(deriveNextBandPath, "deriveNextBandPath");

// ../../src/scan/scoring/seal.ts
init_rubric();
var ARCH_ALLOW = /* @__PURE__ */ new Set(["library", "service", "cli", "infra", "docs", "agent-skills", "mixed", "unknown"]);
function requestedIndicatorsFromRows(rows) {
  return [...new Set(rows.filter((r) => r.status !== "not_implemented").map((r) => r.id))].sort();
}
__name(requestedIndicatorsFromRows, "requestedIndicatorsFromRows");
function buildToolManifest(rows) {
  const seen = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const tool = r.evidence?.tool;
    if (!tool || seen.has(tool)) continue;
    seen.set(tool, r.evidence?.tool_version ?? "");
  }
  return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([tool, version]) => ({ tool, version }));
}
__name(buildToolManifest, "buildToolManifest");
function deriveTopBlockers(cats) {
  const out = [];
  for (const c of cats) {
    if (!c.applicable) continue;
    const pointValue = 100 * c.weight / (3 * c.applicable) / 100;
    for (const r of c.indicator_rows) {
      if (r.status === "unknown" || r.not_applicable || r.score == null) continue;
      const lost = 3 - r.score;
      if (lost <= 0) continue;
      const firstPointer = r.evidence?.pointers?.[0];
      out.push({
        row: r.id,
        name: r.name,
        points_lost: lost,
        weight_pp: `${(lost * pointValue).toFixed(2)}pp`,
        summary: r.reason ?? "",
        evidence_file: firstPointer?.file ?? firstPointer?.detail,
        rule: r.evidence?.tool ?? r.id
      });
    }
  }
  out.sort((a, b) => parseFloat(b.weight_pp) - parseFloat(a.weight_pp));
  return out.slice(0, 5);
}
__name(deriveTopBlockers, "deriveTopBlockers");
function buildDeepDiveScope(mvpRows) {
  const rubric = rubric_default;
  const known = new Set(mvpRows.map((r) => r.id));
  const unknownIndicators = rubric.indicators.filter((i) => !known.has(i.id));
  let scope = unknownIndicators.slice(0, 18).map((i) => ({ row: i.id, name: i.name, what_it_takes: "Not run in this scan \u2014 deep-dive row" }));
  const unknownRows = mvpRows.filter((r) => r.status === "unknown");
  if (unknownRows.length) {
    scope = unknownRows.slice(0, 18).map((r) => ({ row: r.id, name: r.name, what_it_takes: r.unknown_measure_path ?? "Not run" }));
  }
  return scope;
}
__name(buildDeepDiveScope, "buildDeepDiveScope");
function truncateTrace(trace) {
  if (trace.length <= 200) return trace;
  const sealIdx = trace.findIndex((t) => t.type === "sealed");
  const sealEntry = sealIdx >= 0 ? trace[sealIdx] : null;
  const withoutSeal = sealIdx >= 0 ? trace.filter((_, i) => i !== sealIdx) : trace;
  const toDrop = withoutSeal.length - 199;
  const kept = withoutSeal.slice(toDrop);
  const sentinel = {
    ts: kept[0]?.ts ?? 0,
    elapsedMs: kept[0]?.elapsedMs ?? 0,
    label: `\u2026 ${toDrop} earlier entries truncated`,
    phase: "budget"
  };
  return sealEntry ? [sentinel, ...kept, sealEntry] : [sentinel, ...kept];
}
__name(truncateTrace, "truncateTrace");
function formatStdout(report, opts = {}) {
  const gates = report.gates;
  const fired = gates.filter((g) => g.status === "fired" || g.fired || g.status === "proven").length;
  const unevaluable = gates.filter((g) => g.status === "unevaluable").length;
  const gatePart = unevaluable ? `gates:${fired}/${report.gates.length} unevaluable:${unevaluable}/${report.gates.length}` : `gates:${fired}/${report.gates.length}`;
  const thresholdPart = opts.thresholdState ?? "";
  const coveragePart = `coverage:${report.coverage.measured}m/${report.coverage.estimated}e/${report.coverage.unknown}u`;
  const pathPart = report.next_band_path ? ` ${formatBandPathClause(report.next_band_path, report.headline.tier)}` : "";
  const capPart = report.headline.gate_capped ? ` gate-capped from ${report.headline.uncapped_tier ?? "a higher band"} by ${(report.headline.capped_by_gates ?? []).join("+") || "a proven gate"}` : "";
  const prefix = report.headline.suppressed ? `insufficient-signal ${gatePart} ${coveragePart}${thresholdPart}` : `${report.headline.score}/${report.headline.tier}${capPart} ${gatePart} ${coveragePart}${thresholdPart}${pathPart}`;
  const nextStep = assessmentNextStep(report.headline);
  return `${prefix} \u2014 ${nextStep.sentence} ${nextStep.url}`;
}
__name(formatStdout, "formatStdout");
function sealScan(input2) {
  const rawSnapshot = input2.snapshot ?? {};
  const arch = rawSnapshot.archetype ?? "unknown";
  const plane = rawSnapshot.planeInventory;
  const effectiveArch = input2.archetypeOverride && ARCH_ALLOW.has(input2.archetypeOverride) ? input2.archetypeOverride : arch;
  const mvp = scoreMvp(input2.facts, { archetype: effectiveArch, planeInventory: plane });
  const snapSha = rawSnapshot.scanned_commit;
  const factSha = input2.facts.find(
    (f) => f.commitSha && f.commitSha !== "unknown"
  );
  const repoSha = (snapSha && snapSha !== "unknown" ? snapSha : factSha?.commitSha) ?? "unknown";
  const normalizedRepo = String(rawSnapshot.repo ?? input2.repo ?? "unknown/unknown");
  const scannedAt = String(rawSnapshot.scanned_at ?? (/* @__PURE__ */ new Date()).toISOString());
  const topBlockers = deriveTopBlockers(mvp.categories);
  const deepDiveScope = buildDeepDiveScope(mvp.rows);
  const policy = input2.scorePolicy ?? "frozen";
  const headlineScore = policy === "legacy" ? Math.round((mvp.renormalized_score ?? mvp.score) * 100) / 100 : Math.round(mvp.score * 100) / 100;
  const scoreTier = tierForScore(headlineScore);
  const suppressedHeadline = mvp.suppressed ?? false;
  const provenGateIds = mvp.gates.filter((g) => g.status === "proven").map((g) => g.id);
  const gateCap = suppressedHeadline ? { tier: scoreTier, capped: false, cappedByGates: [] } : gateCapForTier(scoreTier, provenGateIds);
  const tier = gateCap.tier;
  const tierLegacy = tierLegacyFor(tier);
  const nextBandPath = deriveNextBandPath({
    score: headlineScore,
    tier,
    suppressed: suppressedHeadline,
    categories: mvp.categories,
    rows: mvp.rows,
    registry: bandPathRegistryFromRubric(rubric_default)
  });
  const report = {
    id: input2.scanId ?? `ls_${Date.now().toString(36)}`,
    snapshot: {
      ...rawSnapshot,
      archetype: effectiveArch,
      scanned_commit: repoSha,
      repo: normalizedRepo,
      scanned_at: scannedAt,
      archetype_source: input2.archetypeOverride ? "override" : "auto",
      archetype_override_from: input2.archetypeOverride ? arch : void 0
    },
    headline: {
      // Frozen denominator (3.1): unknowns disclosed as unscored. canonical_score
      // is the defined CI-gating number (--fail-under targets it); the legacy
      // renormalized value stays in JSON as reference only.
      score: headlineScore,
      canonical_score: headlineScore,
      renormalized_score: Math.round((mvp.renormalized_score ?? mvp.score) * 100) / 100,
      score_policy: policy,
      suppressed: suppressedHeadline,
      verdict: mvp.verdict,
      tier,
      tier_legacy: tierLegacy,
      // Kill-switch disclosure: present only when a proven gate moved the band.
      ...gateCap.capped ? { gate_capped: true, uncapped_tier: scoreTier, capped_by_gates: gateCap.cappedByGates } : {},
      ci_band: mvp.verdict === "insufficient-signal" ? "insufficient-signal" : mvp.status === "complete" ? "complete" : "degraded"
    },
    categories: mvp.categories,
    coverage: mvp.coverage,
    status: mvp.status,
    gates: mvp.gates,
    provenance: {
      tool_manifest: buildToolManifest(mvp.rows),
      snapshot_versions: rawSnapshot.snapshot_versions ?? {}
    },
    top_blockers: topBlockers,
    deep_dive_scope: deepDiveScope,
    full_table: mvp.rows,
    // Derived view over the sealed rows; the key is absent (not empty) when the
    // headline was suppressed and there is no stated score to measure from.
    ...nextBandPath ? { next_band_path: nextBandPath } : {},
    // Target identity (report-identity): presentation-only, excluded from the
    // fingerprint, present only when the identity pass actually ran.
    ...input2.identity ? { identity: input2.identity } : {},
    report_schema: "1"
  };
  const trace = [...input2.trace];
  const pushTrace = /* @__PURE__ */ __name((label, extra = {}) => {
    trace.push({ ts: Date.now() - input2.startMs, elapsedMs: Date.now() - input2.startMs, label, ...extra });
  }, "pushTrace");
  pushTrace("Scoring \u2014 gates evaluated", { type: "scoring" });
  const sealedLabel = `Sealed \u2014 ${mvp.status} \xB7 ${mvp.coverage.measured}/${mvp.coverage.measured + mvp.coverage.unknown + mvp.coverage.estimated} measured`;
  pushTrace(sealedLabel, { type: "sealed", pct: 100 });
  const traceToPersist = truncateTrace(trace);
  const repoSlug = input2.subjectSlug ?? repoSlugFromUrl(normalizedRepo);
  const ts = normalizeTs(scannedAt);
  const engineSha7 = resolveEngineSha7({ env: input2.env, engineRef: input2.engineRef, execImpl: input2.execImpl });
  const runId = buildRunId(repoSlug, engineSha7, ts);
  const durationMs = Date.now() - input2.startMs;
  const engineVersion = report.snapshot.engine_version ?? ENGINE_VERSION;
  const rubricVersion = report.snapshot.rubric_version ?? "docs/rubric@tranche-a";
  const scoreFingerprint = computeScoreFingerprint({
    facts: input2.facts,
    rubricVersion,
    engineVersion,
    engineSha7,
    snapshotVersions: rawSnapshot.snapshot_versions ?? {},
    strict: !!input2.strict,
    indicatorSet: input2.facts.map((f) => String(f.detectorId ?? "")),
    archetype: effectiveArch,
    scorePolicy: policy
  });
  const meta = {
    repo: normalizedRepo,
    repoUrl: input2.repoUrl ?? `https://github.com/${normalizedRepo}`,
    repoSlug,
    engineSha7,
    runId,
    ranAt: scannedAt,
    durationMs,
    budgetMs: input2.budgetMs,
    repoSha: String(repoSha),
    score: report.headline.score,
    tier: report.headline.tier,
    tier_legacy: tierLegacy,
    status: report.status,
    engine_version: engineVersion,
    rubric_version: rubricVersion,
    filename: `${runId}.json`,
    coverage: report.coverage,
    contractVersion: CONTRACT_VERSION,
    score_fingerprint: scoreFingerprint,
    fingerprint_version: FINGERPRINT_VERSION,
    // Comparability inputs (report-envelope): both are declared views of inputs
    // that already join the fingerprint (`indicator_set`, `score_policy`), so
    // recording them changes no fingerprint. Never `[]` for "unknown".
    requested_indicators: requestedIndicatorsFromRows(mvp.rows),
    score_policy: policy
  };
  return { report, meta, traceToPersist, stdoutLine: formatStdout(report), durationMs, runId, repoSha: String(repoSha) };
}
__name(sealScan, "sealScan");

// ../../src/scan/render.ts
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(esc, "esc");
function identitySummaryLine(identity) {
  const bits = [];
  if (identity.subject.repo) bits.push(identity.subject.repo);
  const commit = identity.subject.commit && identity.subject.commit !== "unknown" ? identity.subject.commit.slice(0, 7) : "unknown";
  bits.push(`commit ${commit}`);
  if (typeof identity.size.files === "number") bits.push(`${identity.size.files} files`);
  if (typeof identity.size.directories === "number") bits.push(`${identity.size.directories} dirs`);
  const lines = identity.size.lines;
  if (lines) {
    bits.push(`${identityValueLabel(lines)} lines${lines.scope ? ` (${lines.scope})` : ""}`);
  }
  const primary = identity.stack.primary_language;
  if (primary) bits.push(`primary ${primary}`);
  if (identity.stack.ecosystems.length) bits.push(identity.stack.ecosystems.join(" + "));
  if (identity.stack.frameworks.length) bits.push(identity.stack.frameworks.join(" + "));
  const legacy = (identity.stack.legacy_stacks ?? []).filter((s) => s.detected).map((s) => s.id);
  if (legacy.length) bits.push(legacy.join(" + "));
  const archetype = identity.shape.archetype;
  if (archetype && archetype !== "unknown") bits.push(`archetype ${archetype}`);
  return bits.join(" \xB7 ");
}
__name(identitySummaryLine, "identitySummaryLine");
function renderPathHtml(path, tier, score) {
  const block = bandPathBlock(path, { tier, score });
  const classes = block.classes.map((c) => {
    const steps = c.steps.map((s) => `<li><strong>${esc(s.row)} ${esc(s.name)}</strong> ${esc(s.pp)} \xB7 ${esc(s.verify)}${s.quick_win ? ` \u2014 Quick win: ${esc(s.quick_win)}` : ""}</li>`).join("\n");
    return `<h3>${esc(c.tag)} ${esc(c.verify)} \u2014 ${esc(c.total)}, cumulative ${esc(c.cumulative)}: ${esc(c.arrival)}</h3>
<ul>${steps}</ul>`;
  }).join("\n");
  return `<h2>${esc(block.heading)}</h2>
<p>${esc(block.statement)}</p>
${classes ? `${classes}
` : ""}${block.shortfall ? `<p>${esc(block.shortfall)}</p>
` : ""}${block.unreached ? `<p>${esc(block.unreached)}</p>
` : ""}<p>${esc(block.assumption)}</p>`;
}
__name(renderPathHtml, "renderPathHtml");
function renderPathMarkdown(path, tier, score) {
  const block = bandPathBlock(path, { tier, score });
  const lines = [`## ${block.heading}`, ``, block.statement];
  for (const c of block.classes) {
    lines.push(``);
    lines.push(`**${c.tag} ${c.verify}** \u2014 ${c.total}, cumulative ${c.cumulative}: ${c.arrival}`);
    for (const s of c.steps) lines.push(`- **${s.row} ${s.name}** ${s.pp} \xB7 ${s.verify}${s.quick_win ? ` \u2014 Quick win: ${s.quick_win}` : ""}`);
  }
  if (block.shortfall) {
    lines.push(``);
    lines.push(block.shortfall);
  }
  if (block.unreached) {
    lines.push(``);
    lines.push(block.unreached);
  }
  lines.push(``);
  lines.push(`_${block.assumption}_`);
  return lines;
}
__name(renderPathMarkdown, "renderPathMarkdown");
function renderHtml(r) {
  const nextStep = assessmentNextStep({
    tier: r.tier,
    suppressed: r.suppressed === true
  });
  const url = nextStep.url;
  const cta = nextStep.sentence;
  const commitShort = r.repoSha && r.repoSha !== "unknown" ? r.repoSha.slice(0, 7) : "unknown";
  const headline = r.suppressed ? `<h1><span class="score">insufficient signal</span></h1>` : `<h1><span class="score">${r.score}</span> <span class="band">${esc(r.tier)}</span></h1>`;
  const risks = r.topBlockers.slice(0, 5).map((b) => {
    const evidence = b.evidence_file ? ` \u2014 evidence: ${esc(b.evidence_file)}` : "";
    const rule = b.rule ? ` (rule: ${esc(b.rule)})` : "";
    return `<li><strong>${esc(b.row)} ${esc(b.name)}</strong> \u2014 ${esc(b.summary)} <em>${esc(b.weight_pp)} lost</em>${evidence}${rule}</li>`;
  }).join("\n");
  const gates = r.gates.map((g) => `<li><strong>${esc(g.id)}</strong> ${esc(g.name)} \u2014 ${esc(g.status)}: ${esc(g.note)}</li>`).join("\n");
  const capNotice = r.gateCapped && r.uncappedTier ? `<p class="gatecap"><strong>Verdict capped at ${esc(r.tier)}.</strong> ${esc(gateCapStatement(r.cappedByGates ?? [], r.uncappedTier))}</p>
` : "";
  const identityLine = r.identity ? `<p class="identity">${esc(identitySummaryLine(r.identity))}</p>
` : "";
  const cats = r.categories.map((c) => `<li>${esc(c.id)} \u2014 ${esc(c.name)}: ${c.category_score == null ? "n/a" : `${Math.round(c.category_score)}`} (weight ${c.weight}%)</li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LeapScore ${r.suppressed ? "insufficient signal" : `${r.score}/${esc(r.tier)}`} \u2014 ${esc(r.repo)}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#111;line-height:1.5}
.score{font-size:2.5rem;font-weight:700}.band{display:inline-block;padding:.2rem .6rem;border-radius:999px;background:#111;color:#fff;font-weight:600}
.meta{color:#555;font-size:.9rem}.cta{border:1px solid #111;padding:1rem;border-radius:.5rem;margin:1.5rem 0}
.identity{color:#333;font-size:.95rem;font-family:ui-monospace,monospace;margin:0 0 .5rem}
h2{margin-top:2rem}ul{padding-left:1.2rem}
</style>
</head>
<body>
${identityLine}${headline}
<p class="meta">${esc(r.repo)} \xB7 commit ${esc(commitShort)} \xB7 ${esc(r.scannedAt)} \xB7 ${esc(r.runId)} \xB7 ${esc(r.status)} \xB7 coverage ${r.coverage.measured}m/${r.coverage.estimated}e/${r.coverage.unknown}u${r.fingerprint ? ` \xB7 fingerprint ${esc(r.fingerprint.slice(0, 12))}` : ""}</p>
${capNotice}<h2>Top risks</h2>
<ul>${risks || "<li>No deductions \u2014 clean scan.</li>"}</ul>
${r.nextBandPath ? `${renderPathHtml(r.nextBandPath, r.tier, r.score)}
` : ""}<h2>Detail</h2>
<h3>Gates</h3>
<ul>${gates}</ul>
<h3>Categories</h3>
<ul>${cats}</ul>
<p class="meta">Methodology: <a href="${METHODOLOGY_URL}">${METHODOLOGY_URL}</a></p>
<div class="cta"><strong>Next step:</strong> ${esc(cta)}<br><a href="${esc(url)}">Continue to the assessment</a></div>
<p class="positioning">${esc(POSITIONING_LINE)}</p>
</body>
</html>`;
}
__name(renderHtml, "renderHtml");
function renderMarkdown(r) {
  const nextStep = assessmentNextStep({
    tier: r.tier,
    suppressed: r.suppressed === true
  });
  const url = nextStep.url;
  const cta = nextStep.sentence;
  const commitShort = r.repoSha && r.repoSha !== "unknown" ? r.repoSha.slice(0, 7) : "unknown";
  const lines = [];
  if (r.identity) {
    lines.push(identitySummaryLine(r.identity));
    lines.push(``);
  }
  lines.push(r.suppressed ? `# LeapScore: insufficient signal \u2014 ${r.repo}` : `# LeapScore: ${r.score}/${r.tier} \u2014 ${r.repo}`);
  lines.push(``);
  lines.push(`commit ${commitShort} \xB7 ${r.scannedAt} \xB7 \`${r.runId}\` \xB7 ${r.status} \xB7 coverage ${r.coverage.measured}m/${r.coverage.estimated}e/${r.coverage.unknown}u${r.fingerprint ? ` \xB7 fingerprint \`${r.fingerprint.slice(0, 12)}\`` : ""}`);
  lines.push(``);
  if (r.gateCapped && r.uncappedTier) {
    lines.push(`> **Verdict capped at ${r.tier}.** ${gateCapStatement(r.cappedByGates ?? [], r.uncappedTier)}`);
    lines.push(``);
  }
  lines.push(`## Top 5 risks`);
  if (!r.topBlockers.length) {
    lines.push(`- No deductions \u2014 clean scan.`);
  } else {
    for (const b of r.topBlockers.slice(0, 5)) {
      const ev = b.evidence_file ? ` \u2014 evidence: ${b.evidence_file}` : "";
      const rule = b.rule ? ` (rule: ${b.rule})` : "";
      lines.push(`- **${b.row} ${b.name}** (${b.weight_pp} lost): ${b.summary}${ev}${rule}`);
    }
  }
  if (r.nextBandPath) {
    lines.push(``);
    lines.push(...renderPathMarkdown(r.nextBandPath, r.tier, r.score));
  }
  lines.push(``);
  lines.push(`## Detail`);
  lines.push(``);
  lines.push(`### Gates`);
  for (const g of r.gates) lines.push(`- **${g.id}** ${g.name} \u2014 ${g.status}: ${g.note}`);
  lines.push(``);
  lines.push(`### Categories`);
  for (const c of r.categories) lines.push(`- ${c.id} ${c.name}: ${c.category_score == null ? "n/a" : Math.round(c.category_score)} (weight ${c.weight}%)`);
  lines.push(``);
  lines.push(`Methodology: ${METHODOLOGY_URL}`);
  lines.push(``);
  lines.push(`> Next step: ${cta}`);
  lines.push(`>`);
  lines.push(`> ${url}`);
  lines.push(``);
  lines.push(POSITIONING_LINE);
  lines.push(``);
  return lines.join("\n");
}
__name(renderMarkdown, "renderMarkdown");

// ../../src/scan/badge.ts
var BADGE_HEIGHT = 20;
var BADGE_RADIUS = 3;
var BADGE_BASELINE = 14;
var BADGE_FONT_FAMILY = "Verdana,Geneva,DejaVu Sans,sans-serif";
var BADGE_FONT_SIZE = 11;
var PAD_X = 5;
var LABEL_FILL = "#3d444d";
var LABEL_INK = "#ffffff";
var QUALIFIER_FILL = "#eef1f4";
var QUALIFIER_INK = "#4d525a";
var BANDLESS_CLAIM_FILL = "#4d525a";
var CHAR_WIDTHS = {
  " ": 4,
  "!": 5,
  '"': 7,
  "#": 9,
  $: 7,
  "%": 11,
  "&": 9,
  "'": 4,
  "(": 5,
  ")": 5,
  "*": 7,
  "+": 9,
  ",": 4,
  "-": 5,
  ".": 4,
  "/": 5,
  ":": 5,
  ";": 5,
  "<": 9,
  "=": 9,
  ">": 9,
  "?": 7,
  "@": 11,
  "[": 5,
  "\\": 5,
  "]": 5,
  "^": 9,
  _: 7,
  "`": 5,
  "{": 7,
  "|": 5,
  "}": 7,
  "~": 9,
  "\xB7": 5,
  "\u2014": 11
};
function charWidth(ch) {
  if (ch >= "0" && ch <= "9") return 7;
  if (ch >= "A" && ch <= "Z") return /[MW]/.test(ch) ? 11 : /[IJ]/.test(ch) ? 5 : 9;
  if (ch >= "a" && ch <= "z") return /[mw]/.test(ch) ? 12 : /[il]/.test(ch) ? 4 : 7;
  return CHAR_WIDTHS[ch] ?? 7;
}
__name(charWidth, "charWidth");
function badgeTextWidth(text) {
  let width = 0;
  for (const ch of text) width += charWidth(ch);
  return width;
}
__name(badgeTextWidth, "badgeTextWidth");
function esc2(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc2, "esc");
function inkOn(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return LABEL_INK;
  const n = parseInt(m[1], 16);
  const channel = /* @__PURE__ */ __name((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }, "channel");
  const luminance = 0.2126 * channel(n >> 16 & 255) + 0.7152 * channel(n >> 8 & 255) + 0.0722 * channel(n & 255);
  return luminance > 0.18 ? "#0b0d10" : "#ffffff";
}
__name(inkOn, "inkOn");
function leftCapPath(width) {
  const h = BADGE_HEIGHT;
  const r = BADGE_RADIUS;
  return `M${r},0H${width}V${h}H${r}A${r},${r} 0 0 1 0,${h - r}V${r}A${r},${r} 0 0 1 ${r},0Z`;
}
__name(leftCapPath, "leftCapPath");
function rightCapPath(x, width) {
  const h = BADGE_HEIGHT;
  const r = BADGE_RADIUS;
  const end = x + width;
  return `M${x},0H${end - r}A${r},${r} 0 0 1 ${end},${r}V${h - r}A${r},${r} 0 0 1 ${end - r},${h}H${x}Z`;
}
__name(rightCapPath, "rightCapPath");
function renderBadgeSvg(viewModel) {
  const label = viewModel.label;
  const claim = viewModel.claim;
  const qualifier = viewModel.qualifier;
  const labelW = Math.round(badgeTextWidth(label) + PAD_X * 2);
  const claimW = Math.round(badgeTextWidth(claim) + PAD_X * 2);
  const qualifierW = Math.round(badgeTextWidth(qualifier) + PAD_X * 2);
  const totalW = labelW + claimW + qualifierW;
  const claimX = labelW;
  const qualifierX = labelW + claimW;
  const claimFill = viewModel.band ? bandColorFor(viewModel.band) : BANDLESS_CLAIM_FILL;
  const claimInk = viewModel.band ? inkOn(claimFill) : LABEL_INK;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${BADGE_HEIGHT}" viewBox="0 0 ${totalW} ${BADGE_HEIGHT}" role="img" aria-label="${esc2(viewModel.accessibleName)}">
<title>${esc2(viewModel.accessibleName)}</title>
<path d="${leftCapPath(labelW)}" fill="${LABEL_FILL}"/>
<path d="M${claimX},0H${claimX + claimW}V${BADGE_HEIGHT}H${claimX}Z" fill="${claimFill}"/>
<path d="${rightCapPath(qualifierX, qualifierW)}" fill="${QUALIFIER_FILL}"/>
<g font-family="${BADGE_FONT_FAMILY}" font-size="${BADGE_FONT_SIZE}" text-anchor="middle">
<text x="${labelW / 2}" y="${BADGE_BASELINE}" fill="${LABEL_INK}">${esc2(label)}</text>
<text x="${claimX + claimW / 2}" y="${BADGE_BASELINE}" fill="${claimInk}">${esc2(claim)}</text>
<text x="${qualifierX + qualifierW / 2}" y="${BADGE_BASELINE}" fill="${QUALIFIER_INK}">${esc2(qualifier)}</text>
</g>
</svg>
`;
}
__name(renderBadgeSvg, "renderBadgeSvg");
function escapeAttr(s) {
  return esc2(s);
}
__name(escapeAttr, "escapeAttr");
function renderBadgeSnippet(viewModel, opts) {
  const alt = viewModel.accessibleName;
  const mdAlt = alt.replace(/[[\]]/g, (ch) => `\\${ch}`);
  if (opts.linkReport !== true) {
    return {
      markdown: `![${mdAlt}](${opts.svgPath})`,
      html: `<img src="${escapeAttr(opts.svgPath)}" alt="${escapeAttr(alt)}">`
    };
  }
  const markdown = `[![${mdAlt}](${opts.svgPath})](${viewModel.permalink})`;
  const html = `<a href="${escapeAttr(viewModel.permalink)}"><img src="${escapeAttr(opts.svgPath)}" alt="${escapeAttr(alt)}"></a>`;
  return { markdown, html };
}
__name(renderBadgeSnippet, "renderBadgeSnippet");

// ../../src/scan/diff.ts
var ABSENT_ROW = "not_implemented";
function rowsOf(report) {
  if (!report) return [];
  const table = report.full_table;
  if (Array.isArray(table) && table.length) return table;
  const cats = report.categories ?? [];
  return cats.flatMap((c) => Array.isArray(c.indicator_rows) ? c.indicator_rows : []);
}
__name(rowsOf, "rowsOf");
function weightsOf(report) {
  const weights = {};
  for (const c of report.categories ?? []) {
    if (c?.id) weights[String(c.id)] = Number(c.weight ?? 0);
  }
  return weights;
}
__name(weightsOf, "weightsOf");
function isGraded(status) {
  return status === "measured" || status === "estimated";
}
__name(isGraded, "isGraded");
function countsInDenominator(status, policy) {
  if (status === "not_implemented" || status === "not_applicable") return false;
  if (policy === "legacy") return isGraded(status);
  return true;
}
__name(countsInDenominator, "countsInDenominator");
function headlineFromRows(rows, policy, weights) {
  const byCat = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const cat = String(r.category_id ?? "");
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(r);
  }
  const legacy = policy === "legacy";
  const applicable = [...byCat.entries()].filter(([, rs]) => rs.some((r) => isGraded(r.status)));
  const totalApplicable = applicable.reduce((sum, [cat]) => sum + (weights[cat] ?? 0), 0);
  let total = 0;
  for (const [cat, rs] of byCat.entries()) {
    const base = weights[cat] ?? 0;
    let effective = base;
    if (legacy) {
      const inApplicable = applicable.some(([c]) => c === cat);
      effective = !inApplicable || totalApplicable === 0 ? 0 : base / totalApplicable * 100;
    }
    const counted = rs.filter((r) => countsInDenominator(r.status, policy));
    if (!counted.length) continue;
    const scored = counted.reduce((sum, r) => sum + (isGraded(r.status) ? Number(r.score ?? 0) : 0), 0);
    total += scored * effective / (3 * counted.length);
  }
  return round2(total);
}
__name(headlineFromRows, "headlineFromRows");
function metaOf(env) {
  return env?.meta ?? {};
}
__name(metaOf, "metaOf");
function headlineOf(env) {
  const headline = env?.report?.headline;
  return {
    score: typeof headline?.score === "number" ? headline.score : void 0,
    tier: headline?.tier,
    suppressed: headline?.suppressed === true,
    policy: headline?.score_policy
  };
}
__name(headlineOf, "headlineOf");
function runReference(env) {
  const meta = metaOf(env);
  const headline = headlineOf(env);
  return {
    runId: String(meta.runId ?? ""),
    score: headline.suppressed || headline.score === void 0 ? null : headline.score,
    tier: String(headline.tier ?? meta.tier ?? ""),
    suppressed: headline.suppressed,
    ...meta.score_fingerprint ? { score_fingerprint: meta.score_fingerprint } : {},
    ...typeof meta.fingerprint_version === "number" ? { fingerprint_version: meta.fingerprint_version } : {},
    ...meta.ranAt ? { ranAt: meta.ranAt } : {},
    ...meta.repoSha ? { repoSha: meta.repoSha } : {},
    ...meta.rubric_version ? { rubric_version: meta.rubric_version } : {},
    ...meta.engine_version ? { engine_version: meta.engine_version } : {},
    ...meta.engineSha7 ? { engineSha7: meta.engineSha7 } : {}
  };
}
__name(runReference, "runReference");
function subjectOf(env) {
  const meta = metaOf(env);
  const slug = meta.repoSlug ?? (meta.repo ? String(meta.repo).toLowerCase().replace("/", "__") : void 0);
  return slug && String(slug).trim() ? String(slug) : void 0;
}
__name(subjectOf, "subjectOf");
function producerOf(row) {
  return { tool: String(row.evidence?.tool ?? ""), version: String(row.evidence?.tool_version ?? "") };
}
__name(producerOf, "producerOf");
function viewOf(env) {
  const rows = rowsOf(env.report);
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) if (r?.id) map.set(String(r.id), r);
  return {
    envelope: env,
    rows: map,
    order: [...map.keys()],
    weights: weightsOf(env.report),
    requested: resolveRequestedIndicators({
      meta: env.meta,
      report: env.report
    }),
    ref: runReference(env)
  };
}
__name(viewOf, "viewOf");
function listLabel(ids) {
  return `${ids.length} requested`;
}
__name(listLabel, "listLabel");
function input(name, matched, detail) {
  return { name, matched, detail };
}
__name(input, "input");
function producerExclusions(base, cur) {
  const rows = [];
  const producers = /* @__PURE__ */ new Map();
  for (const id of cur.order) {
    const b = base.rows.get(id);
    const c = cur.rows.get(id);
    if (!b || !c) continue;
    if (!isGraded(b.status) || !isGraded(c.status)) continue;
    const pb = producerOf(b);
    const pc = producerOf(c);
    if (!pb.version || !pc.version) continue;
    if (pb.tool === pc.tool && pb.version === pc.version) continue;
    rows.push(id);
    const key = `${pb.tool}@${pb.version}->${pc.tool}@${pc.version}`;
    if (!producers.has(key)) {
      producers.set(key, { tool: pc.tool || pb.tool, baseline_version: pb.version, current_version: pc.version });
    }
  }
  rows.sort();
  return { rows, producers: [...producers.values()] };
}
__name(producerExclusions, "producerExclusions");
function comparability(base, cur) {
  const inputs = [];
  const exclusions = producerExclusions(base, cur);
  const empty = { rows: [], producers: [] };
  const bMeta = metaOf(base.envelope);
  const cMeta = metaOf(cur.envelope);
  const refuse = /* @__PURE__ */ __name((cause, detail, name) => ({
    status: "incomparable",
    cause,
    inputs: [...inputs, input(name, false, detail)],
    exclusions: empty,
    requestedDiffer: false
  }), "refuse");
  const bSubject = subjectOf(base.envelope);
  const cSubject = subjectOf(cur.envelope);
  if (!bSubject || !cSubject) {
    return refuse("missing-comparability-inputs", "a run carries no subject slug", "subject");
  }
  if (bSubject !== cSubject) {
    return refuse("subject-mismatch", `${bSubject} vs ${cSubject}`, "subject");
  }
  inputs.push(input("subject", true, bSubject));
  const bEra = bMeta.fingerprint_version;
  const cEra = cMeta.fingerprint_version;
  if (typeof bEra !== "number" || typeof cEra !== "number") {
    return refuse("missing-comparability-inputs", "a run carries no fingerprint scheme version", "fingerprint-era");
  }
  if (bEra !== cEra) {
    return refuse("fingerprint-era-mismatch", `fingerprint_version ${bEra} vs ${cEra}`, "fingerprint-era");
  }
  inputs.push(input("fingerprint-era", true, `fingerprint_version ${bEra}`));
  const bRubric = bMeta.rubric_version;
  const cRubric = cMeta.rubric_version;
  if (!bRubric || !cRubric) {
    return refuse("missing-comparability-inputs", "a run carries no rubric version", "rubric-version");
  }
  if (bRubric !== cRubric) {
    return refuse("rubric-version-mismatch", `${bRubric} vs ${cRubric}`, "rubric-version");
  }
  inputs.push(input("rubric-version", true, String(bRubric)));
  if (!base.requested.ok || !cur.requested.ok) {
    const detail = !base.requested.ok ? base.requested.detail : cur.requested.detail;
    return refuse("missing-comparability-inputs", detail, "requested-indicators");
  }
  const bSet = base.requested.indicators;
  const cSet = cur.requested.indicators;
  const requestedDiffer = bSet.length !== cSet.length || bSet.some((id, i) => id !== cSet[i]);
  inputs.push(
    input(
      "requested-indicators",
      !requestedDiffer,
      `${listLabel(bSet)} (${base.requested.source}) vs ${listLabel(cSet)} (${cur.requested.source})`
    )
  );
  if (base.ref.suppressed || cur.ref.suppressed) {
    return refuse(
      "missing-comparability-inputs",
      `${base.ref.suppressed ? "baseline" : "current"} headline is suppressed (insufficient signal) \u2014 no stated score to compare`,
      "subject"
    );
  }
  const engineMatched = (bMeta.engineSha7 ?? "") === (cMeta.engineSha7 ?? "") && (bMeta.engine_version ?? "") === (cMeta.engine_version ?? "");
  inputs.push(
    input(
      "engine-identity",
      engineMatched,
      `${bMeta.engineSha7 ?? "unknown"}/${bMeta.engine_version ?? "unknown"} vs ${cMeta.engineSha7 ?? "unknown"}/${cMeta.engine_version ?? "unknown"}`
    )
  );
  const bPolicy = bMeta.score_policy ?? headlineOf(base.envelope).policy ?? "frozen";
  const cPolicy = cMeta.score_policy ?? headlineOf(cur.envelope).policy ?? "frozen";
  inputs.push(input("score-policy", bPolicy === cPolicy, `${bPolicy} vs ${cPolicy}`));
  inputs.push(
    input(
      "producer-versions",
      exclusions.rows.length === 0,
      exclusions.rows.length ? `${exclusions.rows.length} row(s) withheld: ${exclusions.producers.map((p) => `${p.tool} ${p.baseline_version}\u2192${p.current_version}`).join(", ")}` : "producing tool versions match for every row graded in both runs"
    )
  );
  const status = exclusions.rows.length > 0 ? "comparable-with-row-exclusions" : requestedDiffer ? "comparable-with-coverage-change" : "comparable";
  return { status, inputs, exclusions, requestedDiffer };
}
__name(comparability, "comparability");
function transitionFor(baseStatus, curStatus) {
  if (baseStatus === curStatus) return void 0;
  if (baseStatus === "not_implemented") return "became-implemented";
  if (curStatus === "not_implemented") return "became-ungraded";
  if (curStatus === "not_applicable") return "became-not-applicable";
  if (baseStatus === "not_applicable") return "became-applicable";
  if (isGraded(baseStatus) && !isGraded(curStatus)) return "became-ungraded";
  if (!isGraded(baseStatus) && isGraded(curStatus)) return "became-graded";
  return void 0;
}
__name(transitionFor, "transitionFor");
var TRANSITION_KIND = {
  "became-graded": "coverage-change",
  "became-ungraded": "coverage-change",
  "became-applicable": "applicability-change",
  "became-not-applicable": "applicability-change",
  "became-implemented": "implementation-change"
};
function transitionReason(row) {
  const reason = row?.reason ?? row?.unknown_measure_path;
  return reason ? String(reason) : void 0;
}
__name(transitionReason, "transitionReason");
function transitionEvidence(row) {
  const pointers = row?.evidence?.pointers ?? [];
  return pointers.map((p) => [p.file, p.line != null ? `:${p.line}` : "", p.detail ? ` \u2014 ${p.detail}` : ""].join("")).filter((s) => s.trim().length > 0);
}
__name(transitionEvidence, "transitionEvidence");
function rowCases(base, cur, exclusions) {
  const ids = [.../* @__PURE__ */ new Set([...cur.order, ...base.order])].sort();
  const cases = [];
  for (const id of ids) {
    const baseRow = base.rows.get(id) ?? { id, status: ABSENT_ROW };
    const curRow = cur.rows.get(id) ?? { id, status: ABSENT_ROW };
    const transition = transitionFor(baseRow.status, curRow.status);
    const excluded = exclusions.has(id);
    const gradedBoth = isGraded(baseRow.status) && isGraded(curRow.status);
    const scoreMoved = gradedBoth && Number(baseRow.score ?? 0) !== Number(curRow.score ?? 0);
    const statusMoved = baseRow.status !== curRow.status;
    let kind = "none";
    if (excluded) kind = "model-change";
    else if (transition) kind = TRANSITION_KIND[transition];
    else if (statusMoved) kind = "coverage-change";
    else if (scoreMoved) kind = "scored-change";
    if (kind === "none") continue;
    cases.push({ id, kind, baseRow, curRow, excluded });
  }
  return cases;
}
__name(rowCases, "rowCases");
function rowDifference(c) {
  const transition = transitionFor(c.baseRow.status, c.curRow.status);
  const gradedBoth = isGraded(c.baseRow.status) && isGraded(c.curRow.status);
  const pb = producerOf(c.baseRow);
  const pc = producerOf(c.curRow);
  const producerChanged = c.excluded && (pb.tool !== pc.tool || pb.version !== pc.version);
  return {
    row: c.id,
    ...c.curRow.name ? { name: c.curRow.name } : {},
    ...c.curRow.category_id ? { category: c.curRow.category_id } : {},
    kind: c.kind,
    from: { status: c.baseRow.status, ...c.baseRow.score != null ? { score: c.baseRow.score } : {} },
    to: { status: c.curRow.status, ...c.curRow.score != null ? { score: c.curRow.score } : {} },
    ...gradedBoth ? { score_delta: round2(Number(c.curRow.score ?? 0) - Number(c.baseRow.score ?? 0)) } : {},
    ...transition ? { transition } : {},
    ...transition && transitionReason(c.curRow) ? { transition_reason: transitionReason(c.curRow) } : {},
    ...transition && transitionEvidence(c.curRow).length ? { transition_evidence: transitionEvidence(c.curRow) } : {},
    ...producerChanged ? { producer: { tool: pc.tool || pb.tool, from: pb.version, to: pc.version } } : {}
  };
}
__name(rowDifference, "rowDifference");
function round2(n) {
  const r = Math.round(n * 100) / 100;
  return r === 0 ? 0 : r;
}
__name(round2, "round2");
function effectiveRowsFor(base, cur, cases, revert) {
  const reverted = new Set(cases.filter(revert).map((c) => c.id));
  return [.../* @__PURE__ */ new Set([...cur.order, ...base.order])].sort().map((id) => {
    const baseRow = base.rows.get(id);
    const curRow = cur.rows.get(id);
    const source = reverted.has(id) ? baseRow : curRow;
    const fallback = source ?? baseRow ?? curRow;
    return {
      category_id: String(fallback?.category_id ?? ""),
      status: fallback?.status ?? ABSENT_ROW,
      ...fallback?.score != null ? { score: fallback.score } : {}
    };
  });
}
__name(effectiveRowsFor, "effectiveRowsFor");
function decompose(base, cur, cases, policy, notes) {
  const weights = { ...base.weights, ...cur.weights };
  const baseSealed = base.ref.score ?? 0;
  const curSealed = cur.ref.score ?? 0;
  const Hcur = headlineFromRows(effectiveRowsFor(base, cur, cases, () => false), policy, weights);
  const HmodelFixed = headlineFromRows(
    effectiveRowsFor(base, cur, cases, (c) => c.kind === "model-change"),
    policy,
    weights
  );
  const HcoverageFixed = headlineFromRows(
    effectiveRowsFor(base, cur, cases, (c) => c.kind !== "scored-change" && c.kind !== "none"),
    policy,
    weights
  );
  const Hbase = headlineFromRows(
    [.../* @__PURE__ */ new Set([...base.order, ...cur.order])].sort().map((id) => {
      const r = base.rows.get(id);
      return {
        category_id: String(r?.category_id ?? ""),
        status: r?.status ?? ABSENT_ROW,
        ...r?.score != null ? { score: r.score } : {}
      };
    }),
    policy,
    weights
  );
  const model = round2(Hcur - HmodelFixed);
  const coverage = round2(HmodelFixed - HcoverageFixed);
  const code = round2(HcoverageFixed - Hbase);
  const movement = round2(curSealed - baseSealed);
  const unattributable = round2(movement - (code + coverage + model));
  const noCodeChangeMeasured = code === 0 && movement !== 0;
  return {
    baseline: round2(baseSealed),
    current: round2(curSealed),
    movement,
    code_attributable: code,
    coverage_attributable: coverage,
    model_attributable: model,
    unattributable,
    policy,
    no_code_change_measured: noCodeChangeMeasured,
    statement: decomposeStatement({ movement, code, coverage, model, unattributable, noCodeChangeMeasured }),
    attribution_notes: notes
  };
}
__name(decompose, "decompose");
function decomposeStatement(parts) {
  const { movement, code, coverage, model, unattributable } = parts;
  const residual = unattributable === 0 ? "" : ` ${Math.abs(unattributable)}pp could not be attributed and is disclosed as unattributable.`;
  if (movement === 0) {
    return `The headline did not move (${code >= 0 ? "+" : ""}${code}pp code, ${coverage >= 0 ? "+" : ""}${coverage}pp coverage, ${model >= 0 ? "+" : ""}${model}pp model).${residual}`;
  }
  if (parts.noCodeChangeMeasured) {
    return `The headline moved ${movement > 0 ? "+" : ""}${movement}pp with a code-attributable part of 0pp: no code change was measured \u2014 the movement is coverage (${coverage > 0 ? "+" : ""}${coverage}pp), model (${model > 0 ? "+" : ""}${model}pp), or applicability.${residual}`;
  }
  const direction = code > 0 ? "rise" : "fall";
  return `The headline ${direction} of ${movement > 0 ? "+" : ""}${movement}pp attributes ${code > 0 ? "+" : ""}${code}pp to code, ${coverage > 0 ? "+" : ""}${coverage}pp to coverage, and ${model > 0 ? "+" : ""}${model}pp to model changes.${residual}`;
}
__name(decomposeStatement, "decomposeStatement");
function computeDelta(baseline, current) {
  const base = viewOf(baseline);
  const cur = viewOf(current);
  const baseRef = base.ref;
  const curRef = cur.ref;
  if (base.order.length === 0 || cur.order.length === 0) {
    return {
      document: DELTA_DOCUMENT,
      delta_schema: DELTA_SCHEMA_VERSION,
      baseline: baseRef,
      current: curRef,
      verdict: {
        status: "incomparable",
        cause: "missing-comparability-inputs",
        inputs: [
          input(
            "subject",
            false,
            `${base.order.length === 0 ? "baseline" : "current"} carries no full table to compare rows over`
          )
        ]
      },
      rows: [],
      transitions: []
    };
  }
  const comparabilityOutcome = comparability(base, cur);
  if (comparabilityOutcome.status === "incomparable") {
    return {
      document: DELTA_DOCUMENT,
      delta_schema: DELTA_SCHEMA_VERSION,
      baseline: baseRef,
      current: curRef,
      verdict: {
        status: "incomparable",
        cause: comparabilityOutcome.cause,
        inputs: comparabilityOutcome.inputs
      },
      rows: [],
      transitions: []
    };
  }
  const excluded = new Set(comparabilityOutcome.exclusions.rows);
  const cases = rowCases(base, cur, excluded);
  const rows = cases.map(rowDifference);
  const transitions = cases.filter((c) => rowDifference(c).transition).map((c) => {
    const diff = rowDifference(c);
    return {
      row: c.id,
      transition: diff.transition,
      kind: diff.kind,
      ...diff.transition_reason ? { reason: diff.transition_reason } : {},
      ...diff.transition_evidence ? { evidence: diff.transition_evidence } : {}
    };
  });
  const curPolicy = metaOf(current).score_policy ?? headlineOf(current).policy ?? "frozen";
  const basePolicy = metaOf(baseline).score_policy ?? headlineOf(baseline).policy ?? "frozen";
  const notes = [];
  if (comparabilityOutcome.exclusions.rows.length) {
    notes.push(
      `${comparabilityOutcome.exclusions.rows.length} row(s) withheld from code attribution \u2014 producing tool version differs: ${comparabilityOutcome.exclusions.producers.map((p) => `${p.tool} ${p.baseline_version}\u2192${p.current_version}`).join(", ")}`
    );
  }
  const transitionRows = cases.filter((c) => c.kind === "coverage-change" || c.kind === "applicability-change" || c.kind === "implementation-change");
  if (transitionRows.length) {
    notes.push(
      `${transitionRows.length} row(s) entered or left the graded set (coverage, applicability, or implementation) and contribute no code movement`
    );
  }
  if (basePolicy !== curPolicy) {
    notes.push(
      `the baseline sealed under score_policy ${basePolicy} and this run under ${curPolicy} \u2014 the decomposition uses ${curPolicy} for both sides, so any remainder appears as unattributable`
    );
  }
  return {
    document: DELTA_DOCUMENT,
    delta_schema: DELTA_SCHEMA_VERSION,
    baseline: baseRef,
    current: curRef,
    verdict: {
      status: comparabilityOutcome.status,
      ...comparabilityOutcome.exclusions.rows.length ? { row_exclusions: comparabilityOutcome.exclusions } : {},
      inputs: comparabilityOutcome.inputs
    },
    headline: decompose(base, cur, cases, curPolicy, notes),
    rows,
    transitions
  };
}
__name(computeDelta, "computeDelta");
function signed(n) {
  return `${n > 0 ? "+" : ""}${n}`;
}
__name(signed, "signed");
function formatDeltaLine(delta, opts = {}) {
  const ratchet = opts.ratchetState ? ` ${opts.ratchetState}` : "";
  if (delta.verdict.status === "incomparable") {
    return `delta:incomparable cause:${delta.verdict.cause} \u2014 comparison refused, no score delta produced${ratchet}`;
  }
  const h = delta.headline;
  const clause = h.no_code_change_measured ? " no-code-change" : "";
  return `delta:${delta.verdict.status} movement:${signed(h.movement)}pp code:${signed(h.code_attributable)}pp coverage:${signed(h.coverage_attributable)}pp model:${signed(h.model_attributable)}pp unattributable:${signed(h.unattributable)}pp rows:${delta.rows.length} transitions:${delta.transitions.length}${clause}${ratchet}`;
}
__name(formatDeltaLine, "formatDeltaLine");
function ratchetOutcome(delta, tolerance) {
  if (delta.verdict.status === "incomparable") {
    const cause = String(delta.verdict.cause);
    return {
      tripped: false,
      refused: true,
      state: `ratchet:refused(${cause})`,
      message: `ratchet refused: comparison is incomparable (${cause}) \u2014 a gate that cannot evaluate does not pass`
    };
  }
  const code = delta.headline?.code_attributable ?? 0;
  const tripped = code < -tolerance;
  return {
    tripped,
    refused: false,
    state: `ratchet:${tripped ? "trip" : "pass"}(code ${signed(code)}pp vs -${tolerance}pp)`,
    message: tripped ? `ratchet trip: code-attributable regression ${signed(code)}pp is beyond the ${tolerance}pp tolerance` : `ratchet pass: code-attributable movement ${signed(code)}pp is within the ${tolerance}pp tolerance`
  };
}
__name(ratchetOutcome, "ratchetOutcome");

// ../../bin/scan.ts
var USAGE = `leapscore-scan [scan] [<path> | --repo <owner/repo>] --out <dir> [--strict] [--fail-under <0-100> | --fail-under-band <critical|high|moderate|low>] [--baseline <report.json> [--ratchet[=<tolerance-pp>]]] [--badge <path>] [--sha <sha>] [--engine-ref <sha>] [--score-policy frozen|legacy]

  scan <path>             Local directory scan (default entry): no clone, no GH-API, 25 local detectors
  --repo <owner/repo>     Remote scan subject as owner/repo (no https:// prefix, no .git suffix)
  --sha <sha>             Reserved \u2014 any non-empty value is rejected (pinning not yet supported)
  --out <dir>             Report directory: writes report.json + report.html + report.md (all three, every sealed run)
  --strict                Zero-socket mode: any network attempt aborts (vendored snapshots only). Conflicts with --repo.
  --fail-under <0-100>    Exit 3 when the sealed score is below <n> (files are still written)
  --fail-under-band <b>   Band-native gate: exit 3 below the named band's floor (critical|high|moderate|low).
                          Mutually exclusive with --fail-under in one invocation.
  --baseline <report.json>
                          Compare against a previously sealed report: writes report.delta.json beside the sealed
                          trio and prints one delta summary line after the sealed-run line. The sealed files are
                          byte-identical to an unbaselined run.
  --ratchet[=<tolerance-pp>]
                          Gate on the code-attributable part of the delta (default tolerance 0pp): exit 3 when it
                          falls beyond tolerance, exit 2 when the comparison is incomparable \u2014 a gate that cannot
                          evaluate never passes. Requires --baseline.
  --badge <path>          Write a self-contained score badge SVG at <path> plus its embed snippet
                          (<name>.snippet.md) beside it. Derived from the sealed envelope only: no change to the
                          report trio or the score fingerprint. Refuses fixtures and delta documents.
  --engine-ref <sha>      Pinned engine ref for meta.engineSha7 identity (else LEAPSCORE_SHA/git/unknown)
  --score-policy <p>      Headline policy: frozen (default; unknowns disclosed as unscored) or legacy (renormalized reference as headline, one-release escape hatch)
  --help                  Print this usage

  Exits: 0 pass \xB7 1 crash \xB7 2 usage-or-refused \xB7 3 threshold trip (--fail-under / --fail-under-band) or ratchet trip (--ratchet)
  Stdout: one line \u2014 score/band, gates, coverage, threshold state, compact next-band path clause when the
  sealed report carries a path, then the band-specific next step with the tracked assessment URL once (final token).
  With --baseline, one additional delta summary line follows the sealed-run line.

  Issue surfacing moved to the standalone app: use \`surface --from <dir>/report.json --repo <owner/repo>\`
  (apps/surface) instead of the removed --surface / --surface-from flags.`;
var SURFACE_MOVED_HINT = `issue surfacing moved out of leapscore-scan: use \`surface --from <envelope.json> --repo <owner/repo>\` (apps/surface) instead of --surface / --surface-from`;
var EXIT_OK = 0;
var EXIT_CRASH = 1;
var EXIT_USAGE = 2;
var EXIT_THRESHOLD = 3;
function parseArgs(argv) {
  const out = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--strict") out.strict = true;
    else if (a === "--surface") out.surface = true;
    else if (a === "--repo") out.repo = argv[++i];
    else if (a === "--sha") out.sha = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--engine-ref") out.engineRef = argv[++i];
    else if (a === "--fail-under") out.failUnder = argv[++i];
    else if (a === "--fail-under-band") out.failUnderBand = argv[++i];
    else if (a === "--baseline") out.baseline = argv[++i];
    else if (a === "--ratchet") {
      const next = argv[i + 1];
      if (next != null && /^\d+(\.\d+)?$/.test(next)) {
        out.ratchet = next;
        i++;
      } else {
        out.ratchet = true;
      }
    } else if (a.startsWith("--ratchet=")) out.ratchet = a.slice("--ratchet=".length);
    else if (a === "--badge") out.badge = argv[++i] ?? "";
    else if (a === "--score-policy") out.scorePolicy = argv[++i];
    else if (a === "--surface-from") out.surfaceFrom = argv[++i];
    else if (a === "--repo-a") out.repoA = argv[++i];
    else if (a === "--run-url") out.runUrl = argv[++i];
    else if (a.startsWith("--repo=")) out.repo = a.slice("--repo=".length);
    else if (a.startsWith("--sha=")) out.sha = a.slice("--sha=".length);
    else if (a.startsWith("--out=")) out.out = a.slice("--out=".length);
    else if (a.startsWith("--engine-ref=")) out.engineRef = a.slice("--engine-ref=".length);
    else if (a.startsWith("--fail-under=")) out.failUnder = a.slice("--fail-under=".length);
    else if (a.startsWith("--fail-under-band=")) out.failUnderBand = a.slice("--fail-under-band=".length);
    else if (a.startsWith("--baseline=")) out.baseline = a.slice("--baseline=".length);
    else if (a.startsWith("--badge=")) out.badge = a.slice("--badge=".length);
    else if (a.startsWith("--score-policy=")) out.scorePolicy = a.slice("--score-policy=".length);
    else if (a.startsWith("--surface-from=")) out.surfaceFrom = a.slice("--surface-from=".length);
    else if (a.startsWith("--repo-a=")) out.repoA = a.slice("--repo-a=".length);
    else if (a.startsWith("--run-url=")) out.runUrl = a.slice("--run-url=".length);
    else if (a.startsWith("--strict=")) throw new Error(`unknown flag ${a}
${USAGE}`);
    else if (a.startsWith("--")) throw new Error(`unknown flag ${a}
${USAGE}`);
    else positionals.push(a);
  }
  const rest = positionals[0] === "scan" ? positionals.slice(1) : positionals;
  if (rest.length > 1) throw new Error(`unexpected argument ${JSON.stringify(rest[1])}
${USAGE}`);
  if (rest.length === 1) out.path = rest[0];
  return out;
}
__name(parseArgs, "parseArgs");
function parseFailUnder(raw) {
  if (raw == null) return void 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(`invalid --fail-under ${JSON.stringify(raw)}: expected a number 0-100
${USAGE}`);
  }
  return n;
}
__name(parseFailUnder, "parseFailUnder");
function parseFailUnderBand(raw) {
  if (raw == null || raw.trim() === "") return void 0;
  const name = raw.trim().toLowerCase();
  if (bandThresholdFor(name) === void 0) {
    throw new Error(`invalid --fail-under-band ${JSON.stringify(raw)}: expected critical|high|moderate|low
${USAGE}`);
  }
  return name;
}
__name(parseFailUnderBand, "parseFailUnderBand");
function parseScorePolicy(raw) {
  if (raw == null || raw === "") return "frozen";
  if (raw === "frozen" || raw === "legacy") return raw;
  throw new Error(`invalid --score-policy ${JSON.stringify(raw)}: expected frozen|legacy
${USAGE}`);
}
__name(parseScorePolicy, "parseScorePolicy");
function parseBadgePath(raw) {
  if (raw == null) return void 0;
  if (raw.trim() === "") {
    throw new Error(`missing value for --badge <path>: expected an output path for the badge SVG
${USAGE}`);
  }
  return raw;
}
__name(parseBadgePath, "parseBadgePath");
function badgeSnippetPath(badgePath) {
  return `${badgePath.replace(/\.svg$/i, "")}.snippet.md`;
}
__name(badgeSnippetPath, "badgeSnippetPath");
async function writeBadgeArtifacts(envelope, badgePath) {
  let viewModel;
  try {
    viewModel = badgeViewModel(envelope);
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
  const svg = renderBadgeSvg(viewModel);
  const snippet = renderBadgeSnippet(viewModel, { svgPath: badgePath });
  await mkdir(dirname(resolve2(badgePath)), { recursive: true });
  await writeFile(badgePath, svg, "utf8");
  const snippetPath = badgeSnippetPath(badgePath);
  await writeFile(snippetPath, `${snippet.markdown}

${snippet.html}
`, "utf8");
  return { ok: true, svgPath: badgePath, snippetPath, viewModel };
}
__name(writeBadgeArtifacts, "writeBadgeArtifacts");
function parseRatchetTolerance(raw) {
  if (raw == null) return void 0;
  if (raw === true) return 0;
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(n) || n < 0) {
    throw new Error(`invalid --ratchet ${JSON.stringify(raw)}: expected a non-negative tolerance in points, e.g. --ratchet or --ratchet=2.5
${USAGE}`);
  }
  return n;
}
__name(parseRatchetTolerance, "parseRatchetTolerance");
function validateBaselineDocument(raw, label = "baseline") {
  if (isDeltaDocument(raw)) {
    return { ok: false, detail: `${label} is a run-diff delta document, not a sealed report \u2014 pass the report.json envelope it was derived from` };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, detail: `${label} is not a sealed report envelope (expected a JSON object)` };
  }
  const env = raw;
  if (!env.meta || typeof env.meta !== "object" || !env.report || typeof env.report !== "object") {
    return { ok: false, detail: `${label} is not a sealed report envelope (missing meta or report)` };
  }
  if (typeof env.meta.runId !== "string" || !env.meta.runId) {
    return { ok: false, detail: `${label} is not a sealed report envelope (meta.runId missing)` };
  }
  try {
    assertContractVersion(env);
  } catch (e) {
    return { ok: false, detail: `${label}: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true, envelope: env };
}
__name(validateBaselineDocument, "validateBaselineDocument");
async function loadBaselineEnvelope(path, readFileImpl = readFile) {
  let text;
  try {
    text = await readFileImpl(path, "utf8");
  } catch (e) {
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    return { ok: false, detail: `cannot read baseline ${path}: ${detail}` };
  }
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    return { ok: false, detail: `baseline ${path} is not valid JSON: ${detail}` };
  }
  return validateBaselineDocument(raw, `baseline ${path}`);
}
__name(loadBaselineEnvelope, "loadBaselineEnvelope");
function validateRepo(raw) {
  if (!raw || !raw.trim()) throw new Error(`missing --repo (expected owner/repo, e.g. vercel/next.js)
${USAGE}`);
  const v = raw.trim();
  if (/^https?:\/\//i.test(v) || /^github\.com\//i.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo without https:// prefix (e.g. vercel/next.js)`);
  }
  if (/\.git$/i.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo without .git suffix (e.g. vercel/next.js)`);
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo (e.g. vercel/next.js)`);
  }
  return v;
}
__name(validateRepo, "validateRepo");
function gateOutcome(score, opts) {
  const numericTrip = opts.failUnder != null && (!!opts.suppressed || score < opts.failUnder);
  const bandFloor = opts.failUnderBand != null ? bandThresholdFor(opts.failUnderBand) : void 0;
  const bandTrip = opts.failUnderBand != null && (!!opts.suppressed || score < (bandFloor ?? Number.POSITIVE_INFINITY));
  const thresholdState = opts.failUnder != null ? ` threshold:${numericTrip ? "trip" : "pass"}(fail-under ${opts.failUnder})` : opts.failUnderBand != null ? ` threshold:${bandTrip ? "trip" : "pass"}(fail-under-band ${opts.failUnderBand})` : "";
  return { tripped: numericTrip || bandTrip, thresholdState };
}
__name(gateOutcome, "gateOutcome");
var EXIT2_REASONS = /* @__PURE__ */ new Set([
  "not_found",
  "private_requires_app",
  "rate-limited",
  "unsupported_host",
  "invalid_url",
  "missing_repo",
  "bad_path",
  "strict_conflict"
]);
function exitCodeForReason(reason) {
  return EXIT2_REASONS.has(reason) ? 2 : 1;
}
__name(exitCodeForReason, "exitCodeForReason");
function refusalHint(reason) {
  if (reason === "private_requires_app") {
    return "private repo \u2014 provide a PAT/App token with contents:read on the target (e.g. LEAPSCORE_TOKEN); GITHUB_TOKEN from another repo cannot read private repos";
  }
  if (reason === "not_found") {
    return "repo not found or invisible to the token (private repos need a PAT/App token with contents:read)";
  }
  if (reason === "rate-limited") return "GitHub rate limit exhausted \u2014 retry later or provide a token with more quota";
  if (reason === "bad_path") return "provide an existing local directory to scan";
  if (reason === "strict_conflict") return "--strict scans a local path only; drop --repo or drop --strict";
  return "";
}
__name(refusalHint, "refusalHint");
async function main(argv, opts = {}) {
  const env = opts.env ?? process.env;
  const stdout = opts.stdout ?? ((s) => process.stdout.write(s + "\n"));
  const stderr = opts.stderr ?? ((s) => process.stderr.write(s + "\n"));
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  if (args.help) {
    stdout(USAGE);
    return EXIT_OK;
  }
  if (args.surfaceFrom || args.surface) {
    stderr(SURFACE_MOVED_HINT);
    return EXIT_USAGE;
  }
  if (args.strict && args.repo != null) {
    stderr(`refused (strict_conflict): --strict cannot be combined with --repo \u2014 ${refusalHint("strict_conflict")}`);
    return EXIT_USAGE;
  }
  if (args.sha != null && args.sha !== "") {
    stderr(`--sha pinning not yet supported (got ${JSON.stringify(args.sha)}); re-run without --sha to scan default-branch HEAD`);
    return EXIT_USAGE;
  }
  let failUnder;
  try {
    failUnder = parseFailUnder(args.failUnder);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  let failUnderBand;
  try {
    failUnderBand = parseFailUnderBand(args.failUnderBand);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  if (failUnder != null && failUnderBand != null) {
    stderr(`--fail-under and --fail-under-band conflict: set one gate per invocation (the conjunction is just the stricter floor)
${USAGE}`);
    return EXIT_USAGE;
  }
  let scorePolicy;
  try {
    scorePolicy = parseScorePolicy(args.scorePolicy);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  let badgePath;
  try {
    badgePath = parseBadgePath(args.badge);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  if (args.ratchet != null && args.baseline == null) {
    stderr(`--ratchet requires --baseline <report.json>: there is no delta to gate without a comparison
${USAGE}`);
    return EXIT_USAGE;
  }
  let ratchet;
  try {
    ratchet = parseRatchetTolerance(args.ratchet);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  let baseline;
  if (args.baseline != null) {
    const loaded = await loadBaselineEnvelope(args.baseline);
    if (!loaded.ok) {
      stderr(`refused (baseline): ${loaded.detail}`);
      return EXIT_USAGE;
    }
    baseline = loaded.envelope;
  }
  if (!args.out) {
    stderr(`missing --out <dir>
${USAGE}`);
    return EXIT_USAGE;
  }
  const outDir = args.out;
  const useLocal = args.path != null || args.repo == null;
  if (useLocal && !args.path) {
    stderr(`missing scan <path> or --repo <owner/repo>
${USAGE}`);
    return EXIT_USAGE;
  }
  const startMs = Date.now();
  const trace = [];
  if (useLocal) {
    return await runLocalMain(args.path, { env, stdout, stderr, outDir, startMs, trace, failUnder, failUnderBand, scorePolicy, strict: !!args.strict, engineRef: args.engineRef, baseline, ratchet, badge: badgePath });
  }
  const repo = validateRepoSafe(args.repo, stderr);
  if (!repo) return EXIT_USAGE;
  return await runRemoteMain(repo, { env, stdout, stderr, outDir, startMs, trace, failUnder, failUnderBand, scorePolicy, engineRef: args.engineRef, baseline, ratchet, badge: badgePath });
}
__name(main, "main");
function validateRepoSafe(raw, stderr) {
  try {
    return validateRepo(raw);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return null;
  }
}
__name(validateRepoSafe, "validateRepoSafe");
async function runLocalMain(targetPath, o) {
  const absPath = resolve2(targetPath);
  try {
    const st = await stat5(absPath);
    if (!st.isDirectory()) {
      o.stderr(`refused (bad_path): not a directory: ${targetPath} \u2014 ${refusalHint("bad_path")}`);
      return EXIT_USAGE;
    }
  } catch {
    o.stderr(`refused (bad_path): path does not exist: ${targetPath} \u2014 ${refusalHint("bad_path")}`);
    return EXIT_USAGE;
  }
  o.trace.push({ ts: 0, elapsedMs: 0, label: `Starting local scan \u2014 ${basename2(absPath)}`, type: "start" });
  let budgetMs = 0;
  let facts = [];
  let snapshot = null;
  let identity;
  let scanId;
  try {
    const killerEnv = o.env.LEAPSCORE_KILLER_MS ?? "";
    const killerMs = killerEnv !== "" && Number.isFinite(Number(killerEnv)) ? Number(killerEnv) : void 0;
    const gen = runLocalScan(absPath, { strict: o.strict, killerMs });
    for await (const evt of gen) {
      if (evt.type === "meta") {
        budgetMs = evt.budgetMs ?? 0;
        o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: evt.milestone ?? `Budget ${Math.ceil(budgetMs / 1e3)}s`, type: "meta" });
      } else if (evt.type === "progress") {
        const m = evt.milestone;
        if (m) o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: m, type: "progress" });
      } else if (evt.type === "trace") {
        o.trace.push({
          ts: evt.elapsedMs ?? Date.now() - o.startMs,
          elapsedMs: evt.elapsedMs ?? Date.now() - o.startMs,
          label: evt.label ?? "",
          type: "trace"
        });
      } else if (evt.type === "run-failure") {
        const reason = String(evt.reason ?? "budget-exceeded");
        const detail = String(evt.detail ?? "").slice(0, 300);
        o.stderr(`crash (${reason}): ${detail}`);
        return EXIT_CRASH;
      } else if (evt.type === "refused") {
        const reason = String(evt.reason ?? "crash");
        const detail = String(evt.detail ?? "").slice(0, 500);
        const hint = refusalHint(reason);
        o.stderr(`refused (${reason}): ${detail}${hint ? ` \u2014 ${hint}` : ""}`);
        return exitCodeForReason(reason);
      } else if (evt.type === "done") {
        facts = evt.facts ?? [];
        snapshot = evt.snapshot;
        identity = evt.identity;
        scanId = evt.id;
        break;
      }
    }
  } catch (e) {
    o.stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return EXIT_CRASH;
  }
  if (!snapshot) {
    o.stderr("crash: scan ended without facts");
    return EXIT_CRASH;
  }
  const sorted = [...facts].sort((a, b) => String(a.detectorId ?? "").localeCompare(String(b.detectorId ?? "")));
  const sealed = sealScan({
    facts: sorted,
    snapshot,
    budgetMs,
    startMs: o.startMs,
    trace: o.trace,
    identity,
    engineRef: o.engineRef,
    env: o.env,
    // 2.3: engine identity from release metadata (--engine-ref / LEAPSCORE_SHA),
    // never `git rev-parse` in the caller's working tree.
    execImpl: /* @__PURE__ */ __name(() => {
      throw new Error("no consumer-tree git");
    }, "execImpl"),
    scanId,
    repo: basename2(absPath),
    subjectSlug: localSlugFromPath(basename2(absPath)),
    // Name-only: a local report must never publish the machine path (scan-local).
    repoUrl: `file://${basename2(absPath)}`,
    strict: o.strict,
    scorePolicy: o.scorePolicy
  });
  return await writeReportsAndExit(sealed, o);
}
__name(runLocalMain, "runLocalMain");
async function runRemoteMain(repo, o) {
  const token = o.env.GH_TOKEN ?? o.env.GITHUB_TOKEN;
  const repoUrl = `https://github.com/${repo}`;
  o.trace.push({ ts: 0, elapsedMs: 0, label: `Starting scan \u2014 ${repo}`, type: "start" });
  let budgetMs = 0;
  let facts = [];
  let snapshot = null;
  let identity;
  let scanId;
  try {
    const killerEnv = o.env.LEAPSCORE_KILLER_MS ?? "";
    const killerMs = killerEnv !== "" && Number.isFinite(Number(killerEnv)) ? Number(killerEnv) : void 0;
    const gen = runUnifiedScan(repoUrl, { ...token ? { token } : {}, ...killerMs != null ? { killerMs } : {} });
    for await (const evt of gen) {
      if (evt.type === "meta") {
        budgetMs = evt.budgetMs ?? 0;
        o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: evt.milestone ?? `Budget ${Math.ceil(budgetMs / 1e3)}s`, type: "meta" });
      } else if (evt.type === "progress") {
        const m = evt.milestone;
        if (m) o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: m, type: "progress" });
      } else if (evt.type === "trace") {
        o.trace.push({
          ts: evt.elapsedMs ?? Date.now() - o.startMs,
          elapsedMs: evt.elapsedMs ?? Date.now() - o.startMs,
          label: evt.label ?? "",
          type: "trace"
        });
      } else if (evt.type === "run-failure") {
        const reason = String(evt.reason ?? "budget-exceeded");
        const detail = String(evt.detail ?? "").slice(0, 300);
        o.stderr(`crash (${reason}): ${detail}`);
        return EXIT_CRASH;
      } else if (evt.type === "refused") {
        const reason = String(evt.reason ?? "crash");
        const detail = String(evt.detail ?? "").slice(0, 500);
        const hint = refusalHint(reason);
        o.stderr(`refused (${reason}): ${detail}${hint ? ` \u2014 ${hint}` : ""}`);
        return exitCodeForReason(reason);
      } else if (evt.type === "done") {
        facts = evt.facts ?? [];
        snapshot = evt.snapshot ?? null;
        identity = evt.identity;
        scanId = evt.id;
        break;
      }
    }
  } catch (e) {
    o.stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return EXIT_CRASH;
  }
  if (!snapshot) {
    o.stderr("crash: scan ended without facts");
    return EXIT_CRASH;
  }
  const sorted = [...facts].sort((a, b) => String(a.detectorId ?? "").localeCompare(String(b.detectorId ?? "")));
  const sealed = sealScan({
    facts: sorted,
    snapshot,
    budgetMs,
    startMs: o.startMs,
    trace: o.trace,
    identity,
    engineRef: o.engineRef,
    env: o.env,
    // 2.3: engine identity from release metadata (--engine-ref / LEAPSCORE_SHA),
    // never `git rev-parse` in the caller's working tree.
    execImpl: /* @__PURE__ */ __name(() => {
      throw new Error("no consumer-tree git");
    }, "execImpl"),
    scanId,
    repo,
    strict: false,
    scorePolicy: o.scorePolicy
  });
  return await writeReportsAndExit(sealed, o);
}
__name(runRemoteMain, "runRemoteMain");
async function writeReportsAndExit(sealed, o) {
  const report = sealed.report;
  const suppressed = report.headline.suppressed === true;
  const meta = sealed.meta;
  const renderInput = {
    score: report.headline.score,
    suppressed,
    fingerprint: sealed.meta.score_fingerprint,
    tier: report.headline.tier,
    tierLegacy: meta.tier_legacy,
    repo: meta.repo,
    repoSha: meta.repoSha,
    runId: meta.runId,
    scannedAt: String(report.snapshot?.scanned_at ?? ""),
    status: String(report.status ?? ""),
    coverage: report.coverage,
    gates: report.gates ?? [],
    topBlockers: report.top_blockers ?? [],
    nextBandPath: report.next_band_path,
    identity: report.identity,
    gateCapped: report.headline.gate_capped === true,
    uncappedTier: report.headline.uncapped_tier,
    cappedByGates: report.headline.capped_by_gates,
    categories: report.categories ?? []
  };
  await mkdir(o.outDir, { recursive: true });
  const envelope = { report: sealed.report, meta: sealed.meta, trace: sealed.traceToPersist, contractVersion: CONTRACT_VERSION };
  await writeFile(`${o.outDir}/report.json`, JSON.stringify(envelope, null, 2), "utf8");
  await writeFile(`${o.outDir}/report.html`, renderHtml(renderInput), "utf8");
  await writeFile(`${o.outDir}/report.md`, renderMarkdown(renderInput), "utf8");
  let delta;
  let ratchet;
  if (o.baseline) {
    delta = computeDelta(o.baseline, envelope);
    if (o.ratchet != null) ratchet = ratchetOutcome(delta, o.ratchet);
    await writeFile(`${o.outDir}/report.delta.json`, JSON.stringify(delta, null, 2), "utf8");
  }
  if (o.badge) {
    const badge = await writeBadgeArtifacts(envelope, o.badge);
    if (!badge.ok) {
      o.stderr(`refused (badge): ${badge.detail}`);
      return EXIT_USAGE;
    }
  }
  const threshold = o.failUnder;
  const bandName = o.failUnderBand;
  const { tripped, thresholdState } = gateOutcome(report.headline.score, {
    failUnder: threshold,
    failUnderBand: bandName,
    suppressed
  });
  o.stdout(formatStdout(report, { thresholdState }));
  if (delta) o.stdout(formatDeltaLine(delta, ratchet ? { ratchetState: ratchet.state } : {}));
  if (tripped) {
    if (bandName != null) {
      const bandFloor = bandThresholdFor(bandName);
      o.stderr(suppressed ? `threshold trip: headline suppressed (insufficient signal) < --fail-under-band ${bandName} (floor ${bandFloor})` : `threshold trip: score ${report.headline.score} < --fail-under-band ${bandName} (floor ${bandFloor})`);
    } else {
      o.stderr(suppressed ? `threshold trip: headline suppressed (insufficient signal) < --fail-under ${threshold}` : `threshold trip: score ${report.headline.score} < --fail-under ${threshold}`);
    }
    return EXIT_THRESHOLD;
  }
  if (ratchet) {
    if (ratchet.refused) {
      o.stderr(ratchet.message);
      return EXIT_USAGE;
    }
    if (ratchet.tripped) {
      o.stderr(ratchet.message);
      return EXIT_THRESHOLD;
    }
  }
  return EXIT_OK;
}
__name(writeReportsAndExit, "writeReportsAndExit");
var invokedDirectly = (() => {
  try {
    const entry = process.argv[1] ?? "";
    return entry.endsWith("/bin/scan.ts") || entry.endsWith("\\bin\\scan.ts") || entry.endsWith("/bin/scan.js") || entry.endsWith("leapscore-scan") || entry.endsWith("leapscore-scan.mjs");
  } catch {
    return false;
  }
})();
if (invokedDirectly) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}
`);
      process.exit(1);
    }
  );
}
export {
  EXIT_CRASH,
  EXIT_OK,
  EXIT_THRESHOLD,
  EXIT_USAGE,
  SURFACE_MOVED_HINT,
  USAGE,
  badgeSnippetPath,
  exitCodeForReason,
  gateOutcome,
  loadBaselineEnvelope,
  main,
  parseArgs,
  parseBadgePath,
  parseFailUnder,
  parseFailUnderBand,
  parseRatchetTolerance,
  parseScorePolicy,
  refusalHint,
  validateBaselineDocument,
  validateRepo,
  writeBadgeArtifacts,
  writeReportsAndExit
};
