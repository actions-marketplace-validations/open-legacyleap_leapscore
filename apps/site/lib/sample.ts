/*
 * Seeded demo data for django/django (standard audit, base weight set).
 * Every number is derivable: row scores ↑ this file → lib/scoring.ts recomputes
 * category%, weighted contribution, and the headline. The weighted total is
 * exactly 58.00 (see lib/score.consistency.test.ts). Remediation text is pulled
 * verbatim from the unified indicator remediation playbooks (`docs/rubric/indicators/`).
 */

import type { Gate, IndicatorRow, ReportIdentity } from "@/lib/types";
import { INDICATOR_REGISTRY, getIndicatorRemediation } from "@/lib/generated/rubric";

type V = IndicatorRow["verdict_text"];

const VERDICT: Record<number, V> = {
  3: "3 — Healthy",
  2: "2 — Minor Debt",
  1: "1 — Severe Debt",
  0: "0 — Critical",
};

const EFFORT = {
  s: "⚡ ≤ 30 min",
  m: "🔶 ~2–4 h",
  l: "🔷 ~1–2 days",
} as const;

interface RowSeed {
  id: string;
  name: string;
  category_id: string;
  status: "measured" | "estimated" | "unknown";
  score?: 0 | 1 | 2 | 3;
  reason: string;
  evidence?: IndicatorRow["evidence"];
  basis?: IndicatorRow["basis"];
  unknown_measure_path?: string;
  remediation?: IndicatorRow["remediation"];
  not_applicable?: boolean;
  effort: string;
}

function row(s: RowSeed): IndicatorRow {
  const scored = s.status !== "unknown" && s.score != null;
  const reg = INDICATOR_REGISTRY[s.id];
  const canonicalName = reg?.name ?? s.name;
  if (reg && reg.name !== s.name) {
    // Keep canonical from registry; log once for migration visibility
    // Do not throw — sample is illustrative but must track rubric
  }
  const canonicalEffort = reg?.effort ?? s.effort;
  const derivedRemediation = s.status === "unknown" || s.not_applicable
    ? undefined
    : (s.remediation ?? (reg?.remediation as unknown as IndicatorRow["remediation"] | undefined) ?? (getIndicatorRemediation(s.id) as unknown as IndicatorRow["remediation"]));
  return {
    id: s.id,
    name: canonicalName,
    category_id: reg?.category ?? s.category_id,
    status: s.status,
    score: scored ? s.score : undefined,
    verdict_text: scored ? VERDICT[s.score!] : undefined,
    reason: s.reason,
    evidence: s.status === "measured" ? s.evidence : undefined,
    basis: s.status === "estimated" ? s.basis : undefined,
    unknown_measure_path:
      s.status === "unknown" ? s.unknown_measure_path : undefined,
    remediation: derivedRemediation && (derivedRemediation.quick_win || derivedRemediation.gold_standard) ? derivedRemediation : undefined,
    not_applicable: s.not_applicable,
    effort: canonicalEffort,
  };
}

const FE_NA =
  "No user-facing client in this repo (server-rendered templates only); FE module is N/A and the base weight set applies — docs/rubric/model/config.md §1.";

export const ECOS_ROWS: IndicatorRow[] = [
  row({
    id: "ECOS-01",
    name: "Runtime/Language EOL",
    category_id: "ECOS",
    status: "measured",
    score: 3,
    reason:
      "Python 3.11 (LTS) is the app runtime; endoflife.date window open through Oct 2027. No deprecation pressure.",
    evidence: {
      tool: "manifest pin → endoflife.date",
      args: "pyproject.toml requires-python >=3.11,<3.12",
      pointers: [
        {
          file: "pyproject.toml",
          line: 21,
          detail: "requires-python declared",
        },
      ],
      facts: { python: "3.11.9", eol: "2027-10", window_ok: true },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ECOS-02",
    name: "Major package drift",
    category_id: "ECOS",
    status: "measured",
    score: 2,
    reason:
      "Core web framework pinned one LTS generation behind current (3.2 line vs 5.x); > 30% of direct deps within one major, none more.",
    evidence: {
      tool: "pip list --outdated / lockfile vs registry",
      args: "pip list --outdated --format freeze",
      pointers: [
        {
          file: "requirements/base.txt",
          line: 1,
          detail: "django~=3.2 pinned",
        },
      ],
      facts: {
        deps_outdated_by_major: 3,
        core_behind_majors: 2,
        share_gt_2_majors: "0%",
      },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ECOS-03",
    name: "Abandoned libraries",
    category_id: "ECOS",
    status: "measured",
    score: 2,
    reason:
      "One transitive signing lib (siphashc) unmaintained ~4 years; not on the hot path, flagged for swap.",
    evidence: {
      tool: "osv-scanner / last-release audit",
      pointers: [
        {
          file: "requirements/base.txt",
          detail: "siphashc>=0.4 transitive from cache signing",
        },
      ],
      facts: { abandoned: 1, load_bearing: false, last_release_yr: 2022 },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ECOS-04",
    name: "Deprecated API usage",
    category_id: "ECOS",
    status: "estimated",
    score: 2,
    reason:
      "Deprecation warnings surfaced in the template parser and i18n layers; no removed-API dependency in the core model layer.",
    basis: {
      pattern: "compiler deprecation warnings + eslint/djlint rules",
      sample: "django/template → DeprecationWarning at render",
      confidence: "medium",
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ECOS-05",
    name: "License compliance risk",
    category_id: "ECOS",
    status: "measured",
    score: 3,
    reason:
      "SBOM (syft) + github/licensee: BSD-3 root, zero copyleft in the transitive graph, no unknown licenses.",
    evidence: {
      tool: "syft + github/licensee",
      pointers: [
        { file: "LICENSE", detail: "BSD-3-Clause; derivative tree clean" },
      ],
      facts: { copyleft: 0, unknown: 0, sbom_attested: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ECOS-06",
    name: "Dependency bloat",
    category_id: "ECOS",
    status: "measured",
    score: 1,
    reason:
      "Transitive graph over 300 packages (pipdeptree); ~14 unused direct deps per depcheck; install surface larger than runtime needs.",
    evidence: {
      tool: "depcheck + pipdeptree",
      pointers: [
        {
          file: "requirements/dev.txt",
          detail: "14 unused direct deps flagged",
        },
      ],
      facts: { transitive: 317, unused_direct: 14, bloat_band: "> 300" },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ECOS-07",
    name: "Build reproducibility",
    category_id: "ECOS",
    status: "measured",
    score: 3,
    reason:
      "Hashed lockfiles committed; CI installs with --require-hashes and a frozen flag; two clean builds byte-identical.",
    evidence: {
      tool: "lockfile + CI install flags",
      args: "pip install --require-hashes --no-deps",
      pointers: [
        {
          file: ".github/workflows/ci.yml",
          line: 44,
          detail: "frozen hashed install",
        },
      ],
      facts: {
        lockfile: "hashed",
        reproducible: true,
        ci_flag: "--require-hashes",
      },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ECOS-08",
    name: "Framework lock-in risk",
    category_id: "ECOS",
    status: "measured",
    score: 0,
    reason:
      "Web framework out of official support since 2024-04 (Django 3.2 LTS EOL) with the migration deferred; the upgrade path exists but is unowned.",
    evidence: {
      tool: "framework version → endoflife.date",
      pointers: [
        {
          file: "requirements/base.txt",
          line: 1,
          detail: "django==3.2.25 (EOL 2024-04)",
        },
      ],
      facts: {
        framework: "django 3.2.25",
        support_until: "2024-04",
        upgrade_owned: false,
      },
    },
    effort: EFFORT.s,
  }),
];

export const ARCH_ROWS: IndicatorRow[] = [
  row({
    id: "ARCH-01",
    name: "Cognitive complexity / God classes",
    category_id: "ARCH",
    status: "measured",
    score: 1,
    reason:
      "Methods over complexity 30 in django/forms and admin views; django/db/models/options.py exceeds 1,000 LOC with 8 responsibilities.",
    evidence: {
      tool: "radon cc + Lizard",
      pointers: [
        {
          file: "django/db/models/options.py",
          detail: "max CC 52; class > 1k LOC",
        },
      ],
      facts: { max_cc: 52, god_classes: 4, files_gt_2k_loc: 1 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-02",
    name: "Coupling / low cohesion",
    category_id: "ARCH",
    status: "measured",
    score: 1,
    reason:
      "contrib modules show circular references across bounded contexts (auth ↔ admin ↔ contenttypes ↔ sessions); a shared utils hub has fan-in > 400.",
    evidence: {
      tool: "dependency-cruiser",
      pointers: [
        {
          file: "django/contrib/admin",
          detail: "cycles into auth/contenttypes detected",
        },
      ],
      facts: { cycles: 3, hub_fan_in: 427, utils_hub: "django/utils/*" },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-03",
    name: "Layer & boundary violations",
    category_id: "ARCH",
    status: "measured",
    score: 1,
    reason:
      "import-linter flags handlers reaching the ORM directly and business rules in views; no arch tests enforce direction.",
    evidence: {
      tool: "import-linter",
      args: "import-linter --config tomllib",
      pointers: [
        { file: "django/views/", detail: "6 direct ORM calls from view layer" },
      ],
      facts: { violations: 6, arch_tests: false },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-04",
    name: "Dead & orphaned code",
    category_id: "ARCH",
    status: "measured",
    score: 2,
    reason:
      "vulture finds ~12% unreferenced exports; one legacy admin endpoint kept alive with zero traffic for 12 months (auth-protected).",
    evidence: {
      tool: "vulture + route traffic log",
      pointers: [
        {
          file: "django/contrib/admin",
          detail: "zero-traffic route /admin/archive/ remains live",
        },
      ],
      facts: { dead_pct: 12, orphaned_endpoints: 1, in_core: false },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "ARCH-05",
    name: "Churn vs. defect hot spots",
    category_id: "ARCH",
    status: "measured",
    score: 1,
    reason:
      "Top-10% churned files (models/base.py, core/cache) account for 44% of bug-fix commits — churn and defect concentration overlap.",
    evidence: {
      tool: "git hot-spot analysis",
      args: "git log --oneline --no-merges",
      pointers: [
        {
          file: "django/db/models/base.py",
          detail: "top churn AND top defect file",
        },
      ],
      facts: { top10_share_of_fixes: "44%", hotspot_in_core: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-06",
    name: "Architectural era / framework generation",
    category_id: "ARCH",
    status: "estimated",
    score: 1,
    reason:
      "Server-rendered monolith without DI; module seams are implicit on disk; a unit test of core logic still spins the full URLconf and settings.",
    basis: {
      pattern: "generation test (unit-test-without-stack experiment)",
      sample: "instantiate core service without live stack: fails",
      confidence: "medium",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-07",
    name: "Global mutable state & hidden dependencies",
    category_id: "ARCH",
    status: "estimated",
    score: 1,
    reason:
      "settings, the app registry (django/apps/registry.py), and connection defaults (django/db/__init__.py) are process-wide mutable singletons read from core request paths; correctness depends on import order and parallel workers disagree on state.",
    basis: {
      pattern:
        "grep: module-level singletons + hidden time/IO in model methods",
      sample: "django/db/__init__.py → connections default resolved at import",
      confidence: "medium",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-08",
    name: "Duplication debt",
    category_id: "ARCH",
    status: "measured",
    score: 1,
    reason:
      "PMD-CPD clone rate 14%; money-adjacent formatting and validation logic duplicated across five apps with visible drift.",
    evidence: {
      tool: "PMD-CPD",
      pointers: [{ file: "django/apps/", detail: "6 duplicate clusters" }],
      facts: { clone_rate: "14%", clusters: 6, core: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-09",
    name: "Agentic operability (AI/LLM readiness)",
    category_id: "ARCH",
    status: "estimated",
    score: 2,
    reason:
      "Repo map present but stale vs disk; test-to-code proximity ~60% in core; no single-command fresh-clone harness.",
    basis: {
      pattern: "navigation-aid inventory + fresh-clone timed run",
      sample: "no make test; builds spread across scripts/",
      confidence: "medium",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "ARCH-10",
    name: "Feature-flag & configuration debt",
    category_id: "ARCH",
    status: "estimated",
    score: 1,
    reason:
      "Hardcoded toggles (USE_NEW_SESSION_PATCH = True in source); prod endpoint config committed under the settings package; no flag owner or retirement date.",
    basis: {
      pattern: "hardcoded-toggle grep + git blame",
      sample: "django/conf/global_settings.py ships prod values",
      confidence: "medium",
    },
    effort: EFFORT.s,
  }),
];

export const TEST_ROWS: IndicatorRow[] = [
  row({
    id: "TEST-01",
    name: "Code coverage degradation",
    category_id: "TEST",
    status: "measured",
    score: 2,
    reason:
      "CI coverage artifact shows 82% line on core modules; the coverage check in the workflow writes a comment but does not fail the build.",
    evidence: {
      tool: "CI coverage report (Actions artifact)",
      pointers: [
        {
          file: ".github/workflows/ci.yml",
          line: 58,
          detail: "coverage gate is comment-only",
        },
      ],
      facts: { core_coverage: "82%", gate_fails_build: false },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "TEST-02",
    name: "Flaky test rate",
    category_id: "TEST",
    status: "measured",
    score: 1,
    reason:
      "Actions rerun log: ~6% of jobs rerun-to-pass; parallel runs against shared fixtures produce order-dependent failures.",
    evidence: {
      tool: "GH Actions workflow rerun history",
      pointers: [{ file: "tests/", detail: "6% rerun-to-pass over 90 days" }],
      facts: { flaky_rate: "6%", shared_fixtures: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "TEST-03",
    name: "Test pyramid inversion",
    category_id: "TEST",
    status: "measured",
    score: 1,
    reason:
      "E2E (Selenium) runtime share is ~41% of the suite; the unit/integration layer is thin at the view → ORM seams.",
    evidence: {
      tool: "test inventory by level",
      pointers: [{ file: "tests/", detail: "E2E runtime 41%" }],
      facts: { e2e_share: "41%", unit_share: "31%" },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "TEST-04",
    name: "Test run time",
    category_id: "TEST",
    status: "measured",
    score: 1,
    reason:
      "Full suite P95 34 min across a 16-shard matrix; the merge gate blocks on it — over the 30-min line.",
    evidence: {
      tool: "GH Actions workflow durations",
      pointers: [
        {
          file: ".github/workflows/ci.yml",
          line: 31,
          detail: "16-shard matrix",
        },
      ],
      facts: { p95_min: 34, shards: 16, over_30min: true },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "TEST-05",
    name: "Skipped / disabled tests",
    category_id: "TEST",
    status: "measured",
    score: 2,
    reason:
      "7% of tests carry skip markers, mostly recent; few have linked tickets.",
    evidence: {
      tool: "rg skip/ignore markers + git age",
      pointers: [{ file: "tests/", detail: "7% skipped" }],
      facts: { skipped_pct: 7, ticketless: true },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "TEST-06",
    name: "Core domain untested",
    category_id: "TEST",
    status: "measured",
    score: 2,
    reason:
      "Core paths (URL resolver, ORM query compiler) sit above 80% from the coverage artifact; template loader characterisation gaps remain.",
    evidence: {
      tool: "coverage per core module (CI)",
      pointers: [{ file: "django/urls/resolvers.py", detail: "81% covered" }],
      facts: { urlresolver: "81%", query_compiler: "84%" },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "TEST-07",
    name: "Test isolation / hermeticity",
    category_id: "TEST",
    status: "measured",
    score: 1,
    reason:
      "Suite shares a live SQLite + Redis; randomized order surfaces 4 order-dependent failures.",
    evidence: {
      tool: "random-order CI run",
      pointers: [{ file: "tests/", detail: "4 order-dependent failures" }],
      facts: { shared_services: true, order_failures: 4 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "TEST-08",
    name: "Quality gates in CI",
    category_id: "TEST",
    status: "measured",
    score: 0,
    reason:
      "CI runs lint only; no SAST, no coverage gate, no complexity budget — security and quality findings are advisory, never blocking.",
    evidence: {
      tool: "CI config audit",
      pointers: [
        { file: ".github/workflows/ci.yml", detail: "lint stage only" },
      ],
      facts: { sast: false, coverage_gate: false, complexity_gate: false },
    },
    effort: EFFORT.s,
  }),
];

export const SEC_ROWS: IndicatorRow[] = [
  row({
    id: "SEC-01",
    name: "Unpatched vulnerabilities",
    category_id: "SEC",
    status: "measured",
    score: 2,
    reason:
      "Two Critical CVEs patched at day 11 — inside the 14-day window but close; median days to close a High is 27 and the trend is downward.",
    evidence: {
      tool: "osv-scanner + Dependabot alerts",
      args: "osv-scanner -r . --experimental-local-db",
      pointers: [{ commit: "3f1c2a9", detail: "Critical patched day 11" }],
      facts: {
        open_critical: 0,
        critical_age_max_days: 11,
        median_high_close_days: 27,
      },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "SEC-02",
    name: "Hardcoded secrets & credentials",
    category_id: "SEC",
    status: "measured",
    score: 3,
    reason:
      "gitleaks 8.18 over tree + full history: zero active or revoked secrets; credentials injected from a secrets manager at runtime.",
    evidence: {
      tool: "gitleaks@8.18.0",
      args: "gitleaks git . --no-banner",
      pointers: [{ detail: "0 findings in current tree or history" }],
      facts: { active: 0, in_history: 0, revoke_drill: true },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "SEC-03",
    name: "Missing web security controls",
    category_id: "SEC",
    status: "unknown",
    reason:
      "SAST is clean on reachable injection classes, but TLS/header posture and route reachability cannot be proven from code alone.",
    unknown_measure_path:
      "Deploy or point at staging; run OWASP ZAP + testssl.sh + securityheaders review.",
    effort: EFFORT.m,
  }),
  row({
    id: "SEC-04",
    name: "Authentication & authorization weaknesses",
    category_id: "SEC",
    status: "measured",
    score: 2,
    reason:
      "Route audit: server-side session auth everywhere, no default creds; no MFA on admin roles and is_staff is an all-or-nothing gate.",
    evidence: {
      tool: "route enforcement audit",
      pointers: [
        {
          file: "django/contrib/admin",
          detail: "no MFA on admin; coarse staff gate",
        },
      ],
      facts: { unauth_endpoints: 0, mfa_admin: false, idor_probes: 0 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "SEC-05",
    name: "Audit logging deficits",
    category_id: "SEC",
    status: "measured",
    score: 1,
    reason:
      "Admin and PII-mutation paths emit unstructured log lines without request IDs — a PII export cannot be traced end-to-end.",
    evidence: {
      tool: "log/config audit",
      pointers: [
        {
          file: "django/contrib/auth",
          detail: "no structured audit on admin actions",
        },
      ],
      facts: {
        structured: false,
        request_ids: "partial",
        pii_traceable: false,
      },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "SEC-06",
    name: "Insecure transitive chains",
    category_id: "SEC",
    status: "measured",
    score: 3,
    reason:
      "Deep SCA clean: no reachable criticals below top levels, no malware or unpatchable packages in the graph.",
    evidence: {
      tool: "osv-scanner --experimental-local-db + Grype lockfile",
      pointers: [{ detail: "0 reachable deep-chain vulns" }],
      facts: { vulns_at_depth_gt_5: 0, malware: 0, reachable_critical: 0 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "SEC-07",
    name: "Patch cadence & update workflow",
    category_id: "SEC",
    status: "measured",
    score: 2,
    reason:
      "Dependabot enabled; security PRs merged on a ~30-day cadence with no written SLA and auto-merge off.",
    evidence: {
      tool: "Dependabot dashboard + lockfile dates",
      pointers: [{ file: "requirements/", detail: "bot PRs open < 30 total" }],
      facts: { dependabot: true, median_patch_days: 30, auto_merge: false },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "SEC-08",
    name: "Compliance drift",
    category_id: "SEC",
    status: "unknown",
    reason:
      "Control-to-framework mapping (SOC2) is not provable from a public repo; needs org-side evidence.",
    unknown_measure_path:
      "Control-to-evidence mapping + audit review with the compliance/security team.",
    effort: EFFORT.m,
  }),
];

export const DATA_ROWS: IndicatorRow[] = [
  row({
    id: "DATA-01",
    name: "Schema migration backlog",
    category_id: "DATA",
    status: "measured",
    score: 2,
    reason:
      "34 long-running or dependent migrations in Alembic history; fresh-build-from-migrations passes in CI (non-destructive).",
    evidence: {
      tool: "migration inventory + fresh-build check",
      pointers: [
        { file: "migrations/", detail: "34 migrations; fresh build green" },
      ],
      facts: { pending: 3, destructive_ops: 0, fresh_build: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DATA-02",
    name: "DB coupling & hidden dependencies",
    category_id: "DATA",
    status: "estimated",
    score: 1,
    reason:
      "Postgres shared across two services; cross-DB joins in two reporting paths bypass the API layer.",
    basis: {
      pattern: "connection enumeration + join grep",
      sample: "reports → direct join into orders schema",
      confidence: "low",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DATA-03",
    name: "Data integrity & constraints",
    category_id: "DATA",
    status: "unknown",
    reason:
      "Constraint coverage and orphan probes need a live DB catalog plus probe queries.",
    unknown_measure_path:
      "Connect a catalog or staging DB and run constraint/orphan probes.",
    effort: EFFORT.m,
  }),
  row({
    id: "DATA-04",
    name: "Legacy storage technology",
    category_id: "DATA",
    status: "estimated",
    score: 2,
    reason:
      "Two niche reports read legacy CSV-on-S3 exports; not a system-of-record, export pipeline is script-based.",
    basis: {
      pattern: "file-format inventory",
      sample: "CSV export jobs under scripts/",
      confidence: "low",
    },
    effort: EFFORT.l,
  }),
  row({
    id: "DATA-05",
    name: "Lock contention",
    category_id: "DATA",
    status: "unknown",
    reason:
      "Hot-row contention profile requires load testing against a running instance.",
    unknown_measure_path:
      "Load-test the hot rows under concurrency; check table locks at peak.",
    effort: EFFORT.l,
  }),
  row({
    id: "DATA-06",
    name: "Data lifecycle & restore drills",
    category_id: "DATA",
    status: "unknown",
    reason:
      "Backup/restore evidence lives outside the repo; no drill artefacts committed.",
    unknown_measure_path:
      "Infra audit + scheduled restore drill with written evidence.",
    effort: EFFORT.s,
  }),
  row({
    id: "DATA-07",
    name: "ORM / query smells",
    category_id: "DATA",
    status: "measured",
    score: 2,
    reason:
      "N+1 leaf loads found in three non-critical list views; hot query paths are indexed.",
    evidence: {
      tool: "ORM statement logging + index review",
      pointers: [
        { file: "django/db/models/", detail: "3 N+1 sites, non-core" },
      ],
      facts: { n1_sites: 3, in_core: false, index_strategy: "documented" },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DATA-08",
    name: "Schema overfitting & model rigidity",
    category_id: "DATA",
    status: "measured",
    score: 1,
    reason:
      "Business rules leak into the schema: feature/tier flag columns baked into the orders table, so product-rule changes require migrations.",
    evidence: {
      tool: "schema archaeology from migrations",
      pointers: [
        { file: "migrations/", detail: "tier/flag columns on orders" },
      ],
      facts: { versioned_columns: 6, domain_normalized: false },
    },
    effort: EFFORT.m,
  }),
];

export const API_ROWS: IndicatorRow[] = [
  row({
    id: "API-01",
    name: "Contract drift",
    category_id: "API",
    status: "measured",
    score: 2,
    reason:
      "drf-spectacular covers ~82% of endpoints; three legacy endpoints are hand-rolled with no schema.",
    evidence: {
      tool: "OpenAPI spec-vs-code diff",
      pointers: [
        { file: "django/restframework", detail: "3 endpoints unschematised" },
      ],
      facts: { schema_coverage: "82%", legacy_endpoints: 3 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "API-02",
    name: "Versioning discipline",
    category_id: "API",
    status: "measured",
    score: 2,
    reason:
      "URL versioning (v1/v2) in place; one breaking change shipped on a minor release in the last year.",
    evidence: {
      tool: "URL/media-type versioning audit",
      pointers: [{ file: "urls.py", detail: "v1/v2 route namespaces" }],
      facts: { versioned: true, breaking_on_minor: 1 },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "API-03",
    name: "Integration point bloat",
    category_id: "API",
    status: "estimated",
    score: 2,
    reason:
      "Fifteen point-to-point integrations documented; no gateway in front of the densest five.",
    basis: {
      pattern: "service discovery + config grep",
      sample: "15 vendor endpoints under services/",
      confidence: "low",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "API-04",
    name: "Sync coupling",
    category_id: "API",
    status: "measured",
    score: 2,
    reason:
      "Long synchronous chain on checkout (pay → inventory → ledger); timeouts + cache on one hop, no circuit breaker.",
    evidence: {
      tool: "core-flow read",
      pointers: [
        { file: "django/views/payment", detail: "3-service sync chain" },
      ],
      facts: { chain_length: 3, circuit_breaker: false },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "API-05",
    name: "Third-party API risk",
    category_id: "API",
    status: "measured",
    score: 2,
    reason:
      "Three of five key vendors sit behind adapters; two calls are vendor-and-pray with no fallback.",
    evidence: {
      tool: "third-party host grep + abstraction presence",
      pointers: [{ file: "services/", detail: "2 unabstracted vendor calls" }],
      facts: { vendors: 5, abstracted: 3, fallback: false },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "API-06",
    name: "Protocol legaciness",
    category_id: "API",
    status: "measured",
    score: 3,
    reason: "REST/JSON + OpenAPI; zero SOAP/XML/proprietary protocol remnants.",
    evidence: {
      tool: "protocol inventory",
      pointers: [{ detail: "no WSDL/SOAP matches" }],
      facts: { soap: 0, xml_remnants: 0, rest_json: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "API-07",
    name: "Error handling semantics",
    category_id: "API",
    status: "measured",
    score: 2,
    reason:
      "RFC 7807 error bodies on ~70% of routes; request IDs exist but are not correlated end-to-end.",
    evidence: {
      tool: "error-contract schema audit",
      pointers: [{ detail: "RFC 7807 on 70% routes" }],
      facts: { rfc7807: true, request_id_correlated: false },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "API-08",
    name: "Consumer blindness",
    category_id: "API",
    status: "estimated",
    score: 2,
    reason:
      "No consumer registry; deprecations communicated via changelog only.",
    basis: { pattern: "no registry/telemetry config", confidence: "low" },
    effort: EFFORT.m,
  }),
];

export const VEL_ROWS: IndicatorRow[] = [
  row({
    id: "VEL-01",
    name: "CI/CD build duration",
    category_id: "VEL",
    status: "estimated",
    score: 1,
    reason:
      "16-shard Actions matrix with P95 feedback ~38 min — breaks the 30-minute merge path.",
    basis: {
      pattern: "GH Actions workflow run durations",
      sample: "p95 = 38 min across 16 shards",
      confidence: "medium",
    },
    effort: EFFORT.s,
  }),
  row({
    id: "VEL-02",
    name: "Local setup friction",
    category_id: "VEL",
    status: "estimated",
    score: 2,
    reason:
      "make dev brings the stack up via compose with a .env.example; first-time setup runs 30–60 min (Docker memory tuning).",
    basis: {
      pattern: "setup-tooling inventory",
      sample: "compose + Makefile + .env.example present",
      confidence: "medium",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-03",
    name: "Deployment failure rate",
    category_id: "VEL",
    status: "unknown",
    reason:
      "CFR and rollback markers are not readable from code; needs deploy/incident data.",
    unknown_measure_path:
      "Give the report deploy and rollback access (GH Deployments) and run a CFR rollup.",
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-04",
    name: "Deployment frequency & lead time",
    category_id: "VEL",
    status: "estimated",
    score: 1,
    reason:
      "Releases tagged roughly monthly with multi-day lead time; no deploy-on-demand on the critical path.",
    basis: {
      pattern: "GH releases/tags frequency",
      sample: "1 release/month; lead 3+ days",
      confidence: "medium",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-05",
    name: "Onboarding lead time",
    category_id: "VEL",
    status: "estimated",
    score: 1,
    reason:
      "No HR/git-per-hire data in the repo; first-PR path is documented but the typical time to first production PR is 3–4 weeks.",
    basis: {
      pattern: "docs+presence proxy",
      sample: "no onboarding telemetry in repo",
      confidence: "low",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-06",
    name: "Bus factor",
    category_id: "VEL",
    status: "measured",
    score: 3,
    reason:
      "git shortlog: no module single-author > 40%; contributor breadth across the top twenty modules is healthy.",
    evidence: {
      tool: "git shortlog -sne + per-file authorship",
      pointers: [{ detail: "top module at 38% single author" }],
      facts: { max_single_author: "38%", zero_docs_modules: 0 },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "VEL-07",
    name: "Environment reproducibility",
    category_id: "VEL",
    status: "measured",
    score: 2,
    reason:
      "Compose dev parity holds; prod config is partially hand-edited with observable staging drift.",
    evidence: {
      tool: "canonical-config diff",
      pointers: [{ detail: "staging vs source-of-truth drift" }],
      facts: { dev_parity: true, prod_drift: "partial" },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-08",
    name: "Manual release steps",
    category_id: "VEL",
    status: "measured",
    score: 2,
    reason:
      "Deploy pipeline promotes artifacts; one manual smoke step gates promotion to prod.",
    evidence: {
      tool: "CI config deploy-job audit",
      pointers: [
        { file: ".github/workflows/deploy.yml", detail: "1 manual smoke gate" },
      ],
      facts: { manual_steps: 1, prod_ssh_scripts: 0 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-09",
    name: "PR & code-review hygiene",
    category_id: "VEL",
    status: "measured",
    score: 2,
    reason: "Review coverage 92%; median PR 480 LOC with no size gate.",
    evidence: {
      tool: "GH PR API (coverage, size, latency)",
      pointers: [{ detail: "median PR 480 LOC" }],
      facts: {
        review_coverage: "92%",
        median_pr_loc: 480,
        direct_push_rate: "0.4%",
      },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-10",
    name: "Branching / monorepo strategy legacy",
    category_id: "VEL",
    status: "measured",
    score: 1,
    reason:
      "Release branch (fresh-1.0) six weeks old; trunk diverges during release-freeze windows with merge windows in the calendar.",
    evidence: {
      tool: "git topology scan",
      pointers: [
        { branch: "release/fresh-1.0", detail: "6 weeks old, 214 ahead" },
      ],
      facts: { oldest_branch_weeks: 6, trunk_divergence: true },
    },
    effort: EFFORT.m,
  }),
];

export const PERF_ROWS: IndicatorRow[] = [
  row({
    id: "PERF-01",
    name: "Observability gaps",
    category_id: "PERF",
    status: "measured",
    score: 2,
    reason:
      "Instrumentation deps present (structlog, sentry-sdk) with RED-dashboards; no distributed tracing and metric coverage is partial.",
    evidence: {
      tool: "instrumentation inventory",
      pointers: [
        { file: "django/settings", detail: "OTel not wired; sentry present" },
      ],
      facts: {
        tracing: false,
        structured_logs: true,
        dashboards: "RED basics",
      },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "PERF-02",
    name: "Legacy deployment model",
    category_id: "PERF",
    status: "measured",
    score: 2,
    reason:
      "Application containerized; two legacy workers still run from hand-config scripts on VMs.",
    evidence: {
      tool: "manifest inventory",
      pointers: [{ detail: "2 workers via shell scripts on VMs" }],
      facts: { containerized: true, snowflake_workers: 2 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "PERF-03",
    name: "Resource waste / leakage",
    category_id: "PERF",
    status: "unknown",
    reason:
      "Memory-leak profile requires runtime measurement over a sustained run.",
    unknown_measure_path: "24h load profile + RSS trend; heap diagnostics.",
    effort: EFFORT.l,
  }),
  row({
    id: "PERF-04",
    name: "Monolithic scaling",
    category_id: "PERF",
    status: "unknown",
    reason:
      "Scaling ceiling (DB lock contention past a single instance) needs a load test to prove.",
    unknown_measure_path:
      "Load-test the hot path past vertical size; check contention.",
    effort: EFFORT.l,
  }),
  row({
    id: "PERF-05",
    name: "Autoscaling / capacity planning",
    category_id: "PERF",
    status: "estimated",
    score: 1,
    reason:
      "Static capacity; no autoscaling config in the repo and capacity changes are manual.",
    basis: { pattern: "no HPA/ASG config in IaC", confidence: "medium" },
    effort: EFFORT.m,
  }),
  row({
    id: "PERF-06",
    name: "Missing IaC / config drift",
    category_id: "PERF",
    status: "measured",
    score: 2,
    reason:
      "Terraform covers VPC/DB/compute; two snowflake servers are provisioned by hand.",
    evidence: {
      tool: "Terraform coverage heuristic",
      pointers: [{ file: "infra/", detail: "2 manual resource types" }],
      facts: { iaa_c_coverage: "partial", drift_detection: false },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "PERF-07",
    name: "No SLOs / perf budgets",
    category_id: "PERF",
    status: "estimated",
    score: 1,
    reason:
      "No SLO config for latency/availability; no load-test harness or perf regression gate in CI.",
    basis: { pattern: "SLO/load-test config absence", confidence: "medium" },
    effort: EFFORT.m,
  }),
  row({
    id: "PERF-08",
    name: "Runtime waste / startup",
    category_id: "PERF",
    status: "estimated",
    score: 1,
    reason:
      "Cold start ~40s with a heavy idle footprint; scheduler and workers do synchronous boot work with no lazy init.",
    basis: {
      pattern: "static startup-shape estimate",
      sample: "boot DI + warmup on every worker",
      confidence: "low",
    },
    effort: EFFORT.m,
  }),
];

export const DOCS_ROWS: IndicatorRow[] = [
  row({
    id: "DOCS-01",
    name: "Missing ADRs",
    category_id: "DOCS",
    status: "measured",
    score: 2,
    reason:
      "docs/adr/ holds 10 entries; the DB-split and queue decisions predate the folder and are undocumented.",
    evidence: {
      tool: "docs/adr inventory",
      pointers: [{ file: "docs/adr/", detail: "10 ADRs; 2 load-bearing gaps" }],
      facts: { adrs: 10, missing_critical: 2 },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DOCS-02",
    name: "Stale / drifted docs",
    category_id: "DOCS",
    status: "estimated",
    score: 2,
    reason:
      "Command-verified sample: 3 of 10 setup docs drift from the codebase; last-updated dates absent.",
    basis: {
      pattern: "doc-vs-code correlation sample",
      sample: "setup/worker.md out of date",
      confidence: "medium",
    },
    effort: EFFORT.s,
  }),
  row({
    id: "DOCS-03",
    name: "Missing runbooks",
    category_id: "DOCS",
    status: "measured",
    score: 3,
    reason:
      "docs/runbooks covers the top 8 incident classes and is linked from alert dashboards.",
    evidence: {
      tool: "ops-wiki coverage",
      pointers: [
        { file: "docs/runbooks/", detail: "8 incident classes covered" },
      ],
      facts: { runbooks: 8, alert_linked: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DOCS-04",
    name: "No onboarding guide",
    category_id: "DOCS",
    status: "measured",
    score: 3,
    reason: "CONTRIBUTING golden-path doc; every command dry-runs green in CI.",
    evidence: {
      tool: "command dry-run in CI",
      pointers: [
        { file: "CONTRIBUTING.md", detail: "commands verified in CI" },
      ],
      facts: { golden_path: true, ci_verified: true },
    },
    effort: EFFORT.s,
  }),
  row({
    id: "DOCS-05",
    name: "Tribal knowledge",
    category_id: "DOCS",
    status: "estimated",
    score: 1,
    reason:
      "Two critical modules (ledger, scheduler) have no written record outside two engineers.",
    basis: {
      pattern: "coverage proxy: no docs touching module paths",
      confidence: "low",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DOCS-06",
    name: "Comment debt",
    category_id: "DOCS",
    status: "estimated",
    score: 2,
    reason:
      "Median TODO age under 12 months; two misleading comments found near core paths.",
    basis: {
      pattern: "TODO/FIXME age via git blame",
      sample: "2 misleading comments sampled",
      confidence: "low",
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DOCS-07",
    name: "Missing API docs",
    category_id: "DOCS",
    status: "measured",
    score: 3,
    reason: "Generated API reference is current with the OpenAPI contract.",
    evidence: {
      tool: "spec → generated reference",
      pointers: [{ detail: "reference regenerated in CI" }],
      facts: { generated: true, current: true },
    },
    effort: EFFORT.m,
  }),
  row({
    id: "DOCS-08",
    name: "No release communication",
    category_id: "DOCS",
    status: "measured",
    score: 2,
    reason:
      "CHANGELOG maintained; migration guides for breaking changes missing for the last major.",
    evidence: {
      tool: "CHANGELOG + release audit",
      pointers: [
        { file: "CHANGELOG.md", detail: "kept; no migration guide for v2" },
      ],
      facts: { changelog: true, migration_guides: "1 missing" },
    },
    effort: EFFORT.m,
  }),
];

/* — deep-dive rows (standard audits don't run them → status unknown) — */
export const DEEP_DIVE_ROWS: IndicatorRow[] = [
  row({
    id: "ECOS-09",
    name: "Version skew across services",
    category_id: "ECOS",
    status: "unknown",
    reason:
      "Aggregation across the repo set + sibling services; needs an org-level scan.",
    unknown_measure_path: "Org-level API scan across the service set.",
    effort: EFFORT.m,
  }),
  row({
    id: "ECOS-10",
    name: "Supply-chain typosquat/malware",
    category_id: "ECOS",
    status: "unknown",
    reason:
      "Not run in a standard audit; needs Scorecard + provenance verification.",
    unknown_measure_path:
      "Run OpenSSF Scorecard; pin CI actions to SHAs; socket.dev scan.",
    effort: EFFORT.s,
  }),
  row({
    id: "ARCH-11",
    name: "Nullable/untyped code & runtime error density",
    category_id: "ARCH",
    status: "unknown",
    reason: "Deep-dive; needs type-lint coverage + incident-class mining.",
    unknown_measure_path:
      "Run mypy --strict / pyright coverage; mine null-crash incident share.",
    effort: EFFORT.l,
  }),
  row({
    id: "ARCH-12",
    name: "Duplicated cross-cutting concerns",
    category_id: "ARCH",
    status: "unknown",
    reason: "Deep-dive; counts manual auth/logging/error sites vs middleware.",
    unknown_measure_path:
      "Grep-based count of manual cross-cutting sites vs shared middleware.",
    effort: EFFORT.l,
  }),
  row({
    id: "TEST-09",
    name: "Mutation testing score",
    category_id: "TEST",
    status: "unknown",
    reason: "Deep-dive; requires running a mutation tool on a module.",
    unknown_measure_path: "Run mutation testing on the top-criticality module.",
    effort: EFFORT.l,
  }),
  row({
    id: "TEST-10",
    name: "Test maintenance burden",
    category_id: "TEST",
    status: "unknown",
    reason: "Deep-dive; git archaeology of test-only churn.",
    unknown_measure_path: "Analyze share of commits that fix/support tests.",
    effort: EFFORT.m,
  }),
  row({
    id: "SEC-09",
    name: "Input robustness & fuzzing",
    category_id: "SEC",
    status: "unknown",
    reason: "Deep-dive; needs harness inventory and a timed fuzz campaign.",
    unknown_measure_path:
      "Stand up fuzz harnesses for upload/import parsers + sanitizer builds.",
    effort: EFFORT.l,
  }),
  row({
    id: "SEC-10",
    name: "Security testing in CI",
    category_id: "SEC",
    status: "unknown",
    reason:
      "Deep-dive; inventory of CI security jobs and fail-on-find behavior.",
    unknown_measure_path:
      "Inventory SAST/secrets/deps/image/DAST jobs; verify they fail the build.",
    effort: EFFORT.l,
  }),
  row({
    id: "DATA-09",
    name: "Event sourcing / audit readiness",
    category_id: "DATA",
    status: "unknown",
    reason: "Deep-dive; model audit for history/outbox/updated_by.",
    unknown_measure_path:
      "Model audit: history tables, event/outbox presence, updated_by columns.",
    effort: EFFORT.s,
  }),
  row({
    id: "DATA-10",
    name: "Environment schema drift",
    category_id: "DATA",
    status: "unknown",
    reason: "Deep-dive; needs env diffs against the migration baseline.",
    unknown_measure_path: "Fresh-env diff runs against each environment.",
    effort: EFFORT.m,
  }),
  row({
    id: "API-09",
    name: "Idempotency & retry semantics",
    category_id: "API",
    status: "unknown",
    reason: "Deep-dive; design audit of state-changing endpoints.",
    unknown_measure_path:
      "Audit mutation endpoints for idempotency keys + documented retries.",
    effort: EFFORT.m,
  }),
  row({
    id: "API-10",
    name: "Schema evolution process",
    category_id: "API",
    status: "unknown",
    reason: "Deep-dive; process audit of the schema-evolution gate.",
    unknown_measure_path:
      "Process audit of the compat gate + breakage history.",
    effort: EFFORT.m,
  }),
  row({
    id: "VEL-11",
    name: "DX tooling",
    category_id: "VEL",
    status: "unknown",
    reason: "Deep-dive; DX inventory and inner-loop timing.",
    unknown_measure_path: "DX inventory + inner-loop cold-start timing.",
    effort: EFFORT.s,
  }),
  row({
    id: "VEL-12",
    name: "Incident recovery / MTTR",
    category_id: "VEL",
    status: "unknown",
    reason: "Deep-dive; incident tooling data is org-side.",
    unknown_measure_path: "MTTR/incident data from PagerDuty-class tooling.",
    effort: EFFORT.m,
  }),
  row({
    id: "PERF-09",
    name: "Cost efficiency / FinOps",
    category_id: "PERF",
    status: "unknown",
    reason: "Deep-dive; needs cloud bill + attribution.",
    unknown_measure_path:
      "Cost attribution + rightsizing review (cloud access required).",
    effort: EFFORT.l,
  }),
  row({
    id: "PERF-10",
    name: "DR & resiliency",
    category_id: "PERF",
    status: "unknown",
    reason: "Deep-dive; needs drill/infra evidence.",
    unknown_measure_path: "DR plan + documented cross-region drills.",
    effort: EFFORT.l,
  }),
  row({
    id: "DOCS-09",
    name: "Docs-as-code",
    category_id: "DOCS",
    status: "unknown",
    reason: "Deep-dive; docs-build CI steps and staleness gate.",
    unknown_measure_path:
      "Wire docs generation/lint/link into CI with a staleness gate.",
    effort: EFFORT.s,
  }),
  row({
    id: "DOCS-10",
    name: "Knowledge exit / ownership",
    category_id: "DOCS",
    status: "unknown",
    reason: "Deep-dive; org process audit.",
    unknown_measure_path:
      "Ownership map + offboarding knowledge-capture audit.",
    effort: EFFORT.m,
  }),
];

/* — FE annex (repo has no client → N/A, excluded from both numerator and denominator) — */
export const FE_ROWS: IndicatorRow[] = [
  row({
    id: "FE-01",
    name: "UI framework EOL",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.s,
  }),
  row({
    id: "FE-02",
    name: "Bundle size & load perf",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.m,
  }),
  row({
    id: "FE-03",
    name: "Accessibility deficits",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.m,
  }),
  row({
    id: "FE-04",
    name: "Browser/platform support drift",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.m,
  }),
  row({
    id: "FE-05",
    name: "Client architecture debt",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.m,
  }),
  row({
    id: "FE-06",
    name: "Design system / UI consistency",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.m,
  }),
  row({
    id: "FE-07",
    name: "i18n / localization debt",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.m,
  }),
  row({
    id: "FE-08",
    name: "Mobile / offline support",
    category_id: "FE",
    status: "unknown",
    reason: FE_NA,
    not_applicable: true,
    effort: EFFORT.l,
  }),
];

/* — G1–G8 (docs/rubric/model/config.md §3) — */
export const GATES: Gate[] = [
  {
    id: "G1",
    name: "Credential exposure",
    status: "not-proven",
    source_rows: ["SEC-02"],
    note: "gitleaks 8.18 over tree + history: 0 active secrets.",
  },
  {
    id: "G2",
    name: "Critical vuln exposure",
    status: "needs-verification",
    source_rows: ["SEC-01"],
    note: "HEAVY NEAR-MISS — 2 Critical CVEs were open 9–11 days and patched on day 11, inside the 14-day window. Whether the affected path is internet-exposed can't be confirmed from code.",
  },
  {
    id: "G3",
    name: "Runtime EOL, no path out",
    status: "not-proven",
    source_rows: ["ECOS-01"],
    note: "Python 3.11 supported through 2027-10; upgrade path exists.",
  },
  {
    id: "G4",
    name: "OWASP Top-10 reachable",
    status: "needs-verification",
    source_rows: ["SEC-03", "SEC-04"],
    note: "SAST clean on reachable classes; live-route verification needs a staging environment.",
  },
  {
    id: "G5",
    name: "Untested core",
    status: "not-proven",
    source_rows: ["TEST-06"],
    note: "Core coverage ~82% from CI coverage artifacts.",
  },
  {
    id: "G6",
    name: "Delivery is on fire",
    status: "not-proven",
    source_rows: ["VEL-03", "VEL-08"],
    note: "Deploy pipeline present; CFR below 30% in the samples visible from Actions deployments.",
  },
  {
    id: "G7",
    name: "Data-rescue risk",
    status: "needs-verification",
    source_rows: ["DATA-06"],
    note: "Restore-drill evidence isn't in the repo; requires an infra audit.",
  },
  {
    id: "G8",
    name: "Copyleft in closed-source distribution",
    status: "not-proven",
    source_rows: ["ECOS-05"],
    note: "SBOM + licensee: BSD-compatible only.",
  },
];
/* — target identity for the authored sample (report-identity) ——————————————
 * Presentation derives the `~` marker and the rounding from `status`; nothing
 * here stores a display string. The three statuses are all exercised by this one
 * card: measured counts, an estimated line magnitude, and a shape stage the
 * authored sample did not run.
 */
export const SAMPLE_IDENTITY: ReportIdentity = {
  subject: {
    repo: "django/django",
    commit: "506fc82",
    scanned_at: "2026-08-12T00:00:00Z",
  },
  shape: {
    status: "unknown",
    archetype: "unknown",
    reason: "authored sample — archetype classification did not run",
  },
  size: {
    status: "measured",
    files: 3128,
    directories: 412,
    lines: {
      status: "estimated",
      value: 420000,
      method: "stride-sample",
      covered: { files_read: 40, files_in_scope: 1247 },
      scope: "source-v1",
    },
  },
  stack: {
    status: "measured",
    languages: [
      { name: "Python", share: 0.72, files: 898 },
      { name: "JavaScript", share: 0.18, files: 224 },
      { name: "Other", share: 0.1, files: 125 },
    ],
    primary_language: "Python",
    ecosystems: ["js", "py"],
    frameworks: ["Django"],
    legacy_stacks: [
      { id: "vb6", detected: false, files: 0 },
      { id: "delphi", detected: false, files: 0 },
    ],
  },
};
