# ECOS-08 — Framework Lock-in & Monoculture Risk

> **Category:** [Dependency & Ecosystem Health](../../01_DEPENDENCY_ECOSYSTEM.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-08 |
| Name | Framework Lock-in & Monoculture Risk |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | co-drives **G3** with ECOS-01 when framework is EOL in core |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — lifecycle page + a quick coupling grep. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system is deeply locked to a framework/ecosystem whose maintenance status is declining, whose roadmap is hostile or migrating away, or where the org's options are foreclosed (e.g., a bespoke fork, a dead vendor, or a proprietary dependency you can't exit).
- **Why it signals obsolescence:** Lock-in itself isn't debt — *dying* lock-in is. When the framework you bet on stops evolving (or its community migrates), the codebase becomes progressively harder to staff, secure, and extend. This indicator separates "old but fine" from "obsolete."
- **Where it manifests:** Framework status pages (AngularJS EOL, jQuery, Spring Framework lifecycle, Laravel, Django support policy), vendor announcements (SaaS/PAAS framework retirements), community exodus signals (Stack Overflow trends, job postings, contributor decline), custom forks of OSS that must be maintained in-house, license changes that foreclose use.
- **Objective metric:** `framework support status (active/maintenance/EOL)`; `years since last non-security release`; `# of core business flows coupled to framework-specific abstractions`; `single-vendor share of critical path`.
- **Yellow flag (warning):** Framework in maintenance mode, or community clearly migrating, while the org still has a migration path. *(Rationale: this is the time to plan the exit, while the path is cheap.)*
- **Red flag (critical):** Framework is EOL, vendor-retired, or license-change-foreclosed, with core logic coupled to it and no viable migration path. *(Rationale: the platform is sinking under the codebase; this is a rewrite driver.)*
- **Example symptom:** "We built the product on AngularJS 1.x. Google EOL'd it in 2021. The security scanner now flags it; the two engineers who knew it left. Every candidate interview starts with 'why are you still on this?'"
- **Blast radius:** Staffing, security, feature velocity, ecosystem tooling (CI templates, IDE plugins, libraries all assume the new world).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = framework current/supported; 2 = maintenance mode, exit plan exists; 1 = EOL-ish framework in isolated module; 0 = EOL/retired framework in core logic with no path (overlaps G3).

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: quantify the coupling (which modules touch framework-specific APIs directly) and freeze scope on framework-dependent features. Structural fix: extract the framework behind a facade at the boundaries (ports & adapters), migrate incrementally module-by-module on the critical path, keep the system runnable through the whole migration.
- **Gold standard / target state:** Framework either current-and-supported, or the core logic is framework-independent behind an interface with an active migration plan.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + ecosystem (`endoflife.date`, framework status pages via slug table)
- **Tools:** manifest parsers; framework allowlist (per-ecosystem: react, vue, angular, svelte / django, flask, fastapi / rails / spring-boot, quarkus / gin, echo); import-graph builder for coupling share
- **Rate-cost:** api-budgeted (one lookup per detected framework)
- **Ecosystems:** all gated
- **Applicability:** `na_when: no framework-class dependency detected` (clause-b over parsed manifests — a pure stdlib/CLI repo). Else applicable.

## 6. Detection recipe

- **Detection method:** Lifecycle audits — framework official support matrix; `endoflife.date`; contributor/release cadence (GitHub `commits since`); internal "how stuck are we" test: `how hard is a 1-line change to the framework?`; check org skill availability (jobs, interviews); vendor dependency review (single-vendor lock for core).

1. Detect frameworks from manifests; resolve version.
2. Fetch support status: `active | maintenance | eol` from endoflife.date slug or static status table.
3. Coupling share: fraction of source files importing the framework's modules directly (no facade layer detected: imports concentrated outside a dedicated adapter dir).
4. Fork detection: dependency resolved from git URL/fork registry instead of canonical registry.

Preconditions: ECOS-02-style manifest parse.

## 7. Fact schema

```json
{"ecos08": {
  "frameworks": [{"name": "angularjs", "version": "1.8.3", "support_status": "eol", "eol_date": "2021-12-31"}],
  "coupling_share": 0.62,
  "facade_layer_detected": false,
  "fork_pinned": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  frameworks.len > 0 and support lookup succeeded
estimated_when: coupling_share computed on partial import graph   # clamp [1,2], confidence low
unknown_when:   framework present but no support data (niche/vendor framework)
na_when:        applicability fired (no framework deps)
clamp:          [1,2]
confidence:     medium
scope_limited:  none typical
```

### Score mapping predicates

Thresholds/criteria: see §3.

- `3`: all frameworks `active`
- `2`: any `maintenance` ∧ `facade_layer_detected ∨ migration_evidence` (upgrade commits/branches)
- `1`: any `eol` framework confined to non-core module set
- `0`: `any(support_status == eol)` ∧ `coupling_share > R_COUPLING` ∧ ¬facade → co-fires G3 evaluation

## 9. Gate, failure, and budget behavior

### Gate hooks

Fires G3 `proven` only jointly: ECOS-01 runtime past-EOL **or** this row's `0` predicate, with core join true and no-upgrade evidence. Otherwise `needs-verification`. (Single gate, two feeding rows — orchestrator dedupes.)

### Failure and budget semantics

- Budget class: `fast`
- Support-table miss → `unknown` for that framework; if it's the only one, row unknown

## 10. Evidence and output

### Evidence string

```
evidence: "endoflife.date+import-graph: angularjs 1.8.3 eol since 2021-12-31; coupling {p}% ({k} files), no facade"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Framework lifecycle and lock-in; runtime EOL is ECOS-01, code-style generation gap is ARCH-06.
