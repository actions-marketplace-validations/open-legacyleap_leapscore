# ECOS-06 — Dependency Bloat

> **Category:** [Dependency & Ecosystem Health](../../01_DEPENDENCY_ECOSYSTEM.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-06 |
| Name | Dependency Bloat |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — three commands, no setup. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The dependency graph is inflated — hundreds/thousands of transitive packages, dozens of unused direct dependencies, multiple packages doing the same job, or full libraries pulled in for one function.
- **Why it signals obsolescence:** Dependency count is a proxy for attack surface, build time, and cognitive load. Modern practice trends toward smaller, composable, tree-shaken dependency surfaces. A bloated graph is also a smell that the codebase accreted rather than was designed — a hallmark of legacy.
- **Where it manifests:** Lockfiles with huge transitive counts (`npm ls --all`), `package.json` unused deps, `go mod why`, duplicates (`npm dedupe` output, `pipdeptree` showing the same lib 3 versions), bundle analysis (webpack/rollup reports), monorepo node_modules sprawl.
- **Objective metric:** `total transitive dependency count`; `% of direct deps unused`; `duplicate package count/versions`.
- **Yellow flag (warning):** 100–300 transitive deps, or > 20% unused direct deps, in a mostly-clean graph. *(Rationale: still shippable, but the attack surface and maintenance drag are above modern norms.)*
- **Red flag (critical):** > 300 transitive deps, or orphaned deps that can't be removed (feature flagged forever), or duplicated versions of security-critical libs. *(Rationale: at this size the graph is un-auditable and upgrades break something every time.)*
- **Example symptom:** "The lockfile has 1,400 packages. Six different `lodash`-class utilities are vendored in. Every `npm audit` run prints a wall of 300 advisories, and no one can tell which path is actually vulnerable."
- **Blast radius:** Security auditability, CI install time, disk/artifact size, upgrade blast radius, supply-chain surface.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = lean, within budget; 2 = 100–300 transitive with some unused; 1 = > 300 or heavy duplication; 0 = un-auditable graph with orphaned security-critical duplicates.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run `knip`/`depcheck`, remove unused direct deps, enable `npm dedupe`/lockfile optimization in CI. Structural fix: set a budget (e.g., "no net-new transitive deps without review"), replace kitchen-sink libs with narrow ones, dedupe semver ranges, and periodically prune.
- **Gold standard / target state:** Transitive count within a declared budget; zero unused direct deps; single version of every critical lib; dependency review is part of code review.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** lockfile graph parsers (native, no install) — transitive counts, per-package version sets, cross-lockfile duplicate aggregation. The dead-dep analyser path (`knip`, `depcheck`, `vulture`, `mvn dependency:analyze`) is not shipped in the offline release: the unused-direct sub-signal is absent (`null`), never estimated.
- **Rate-cost:** none
- **Ecosystems:** npm/pnpm/yarn · pip/poetry/uv · go · Maven/Gradle · NuGet (`packages.lock.json`; classic `packages.config` has no lockfile mechanism → `unknown` per ECOS-07's rule)
- **Applicability:** ECOS-02 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Tree inspection — `npm ls --prod`, `pipdeptree`, `bundle list`, `go mod graph | wc -l`, `cargo tree`; dead-dep detectors (`depcheck`, `knip` for unused); duplicate detection (`npm dedupe --dry-run`, `pipdeptree -d` showing dupes); bundle analyzers (`webpack-bundle-analyzer`). Count: total transitive deps, unused direct deps, duplicated packages.

1. Parse lockfiles → transitive total, per-package version sets (a package at distinct versions within or across lockfiles is a duplicate).
2. Aggregate the duplicate set across ALL parsed lockfiles (not per-lockfile) — the duplicate signal is scoped across the estate so cross-project repeats in a legacy solution are caught.
3. Intersect duplicates with the security-critical family list (crypto/auth/http-client) → `duplicate_security_critical`.
4. Unused-direct: no dead-dep analyser runs in this build → `direct_unused: []`, `pct_direct_unused: null` (absent signal, never a placeholder value).

Preconditions: parsed lockfile; source tree enumerated.

## 7. Fact schema

```json
{"ecos06": {
  "transitive_total": 1403,
  "direct_unused": [],
  "pct_direct_unused": null,
  "duplicates": [{"name": "lodash", "versions": ["4.17.15", "4.17.21"]}],
  "duplicate_security_critical": true,
  "lockfiles_parsed": 2}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=1 lockfile parsed            # transitive totals + duplicate version sets are exhaustive parsed facts
estimated_when: never in this build            # the unshipped unused-direct sub-signal is reported null, not estimated
unknown_when:   no lockfile (transitive counts unknowable)
na_when:        applicability fired
clamp:          [1,2]                          # n/a — measured-only row in this build
confidence:     medium (exhaustive lockfile surface)
scope_limited:  no trigger in this build (the lockfile surface has no read bound)
```

### Score mapping predicates

Thresholds Y/R: see §3.

- `3`: `transitive_total < Y_TRANS` ∧ `duplicates.len == 0`
- `2`: Yellow band (`Y_TRANS <= transitive <= R_TRANS`); the unused-direct fraction cannot contribute in this build (sub-signal absent, `null`)
- `1`: `transitive > R_TRANS` ∨ heavy duplication without security-critical overlap
- `0`: `duplicate_security_critical == true`

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast` in this build (lockfile parse only; the knip-full path is not shipped — unused-direct stays `null`)
- Malformed lockfile → `unknown`

## 10. Evidence and output

### Evidence string

```
evidence: "lockfile-parse: {t} transitives across {k} lockfiles; {d} duplicate package versions"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Dependency graph size/dupes; unused code in modules is ARCH-04, supply-chain exposure is ECOS-10.
