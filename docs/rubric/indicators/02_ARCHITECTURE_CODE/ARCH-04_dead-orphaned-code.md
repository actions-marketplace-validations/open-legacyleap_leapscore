# ARCH-04 — Dead & Orphaned Code

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for ARCH-04. Edit this file; the legacy path [arch-04_dead-orphaned-code.md](../../../specs/02_ARCHITECTURE_CODE/arch-04_dead-orphaned-code.md) is a compatibility alias.
> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/02_ARCHITECTURE_CODE/ARCH-04_dead-orphaned-code.md`

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-04 |
| Name | Dead & Orphaned Code |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | ⚡ ≤ 30 min — one tool run + report read. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Unreferenced functions, classes, endpoints, feature flags that are permanently on (or permanently off), unreachable branches, duplicate implementations where only one is used, and modules that nothing imports.
- **Why it signals obsolescence:** Dead code is fossilized intent. It costs readers time (is this used?), auditors time, and test-maintenance time, and it accumulates whenever the codebase is touched without pruning — a hallmark of unowned code. It also hides which live paths are actually in production.
- **Where it manifests:** Unused exports/imports, feature flags stuck true/false with no plan, endpoints with zero traffic, utility functions with no callers, commented-out blocks, dead branches (`if (false)`), shadowed duplicates.
- **Objective metric:** `% of functions unreferenced`; `count of zero-traffic endpoints`; `# of permanently-on feature flags`; `dead-code report delta between quarters`.
- **Yellow flag (warning):** 10–20% of functions unreferenced, or a handful of zero-traffic endpoints, or flags on for > 1 year. *(Rationale: warning-level bloat — prune it before it compounds.)*
- **Red flag (critical):** > 20% dead code, or unreferenced endpoints live in production exposing attack surface, or the dead-code report has grown two quarters in a row. *(Rationale: the codebase is decaying faster than it's being maintained — plus live-but-orphaned endpoints are an attack surface.)*
- **Example symptom:** "Knip finds 340 unreferenced exports and 12 endpoints with zero production traffic. One of them — a legacy admin route — still passes auth and hits the DB. Nobody knows it exists."
- **Blast radius:** Reader confusion, attack surface, test maintenance, coverage metrics lying to you, refactor accidents.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = scan clean; 2 = 10–20% dead code in peripheral areas; 1 = > 20% or orphaned endpoints in isolated services; 0 = orphaned endpoints live on core/auth paths.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run knip/vulture, delete safely (git history preserves), remove orphaned endpoints and the routes that point to them. Structural fix: a "no dead code" PR gate (knip in CI, fail on new unreferenced exports), flag retirement policy (flags > 6 months get removed or justified), quarterly pruning ritual.
- **Gold standard / target state:** Dead-code scan clean in CI; every feature flag has an owner and a retirement date; all prod endpoints are in an API inventory with traffic.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + git
- **Tools:** `knip >= 5` (JS/TS exports/deps/files), `vulture >= 2` (Python), `go vet`-class unused via `golangci-lint` config presence (Go — detection of its CI usage only; we run `staticcheck --unused` equivalent parse? No: run nothing repo-side; use golangci config presence as proxy → estimated), generic export-reference matcher
- **Rate-cost:** none
- **Ecosystems:** JS/TS (full) · Python (full) · Go/Java (heuristic)
- **Applicability:** never N/A for scored repos (dead code % is defined over whatever exists); `unknown_when: no supported language`.

## 6. Detection recipe

- **Detection method:** Dead-code eliminators — `knip` (TS/JS), `unimported`, `depcheck`, `vulture` (Python), `pyflakes` unused, `golangci-lint` unused, IntelliJ/WebStorm unused-code inspection; coverage diffs (run coverage; code never executed in prod-like tests); API traffic logs for zero-traffic endpoints; git archaeology for "last touched 5 years ago."

1. Run dead-code detector per ecosystem (config-only).
2. Feature-flag inventory: constant-condition patterns (`if True:`, `flag &&` with const literal), flags stuck per git blame age.
3. Unreferenced-endpoint probe: route definitions not reachable from any client/test/config reference (presence-only hint).
4. Compute `% unreferenced` over exported symbols; join to core-path set.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"arch04": {
  "symbols_total": 3120, "unreferenced_pct": 12.8,
  "stuck_flags": [{"name": "checkoutV2", "age_days": 420, "value": true}],
  "orphan_endpoints": [{"route": "/admin/legacy-export", "refs_found": 0}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  native detector ran clean
estimated_when: heuristic-only ecosystem (Go/Java)          # clamp [1,2], confidence low
unknown_when:   no supported language parsed
na_when:        never (see Inputs)
clamp:          [1,2]
confidence:     medium full / low heuristic
scope_limited:  monorepo workspace truncation -> estimated + scope-limited
```

### Score mapping predicates

Y/R values (10–20% / >20%, flag-age 6–12mo): see §3.

- `3`: `unreferenced_pct < Y_PCT` ∧ no stuck flags ∧ no orphans
- `2`: Yellow band, peripheral only
- `1`: `> R_PCT` ∨ orphan endpoints in isolated services
- `0`: orphan endpoints resolving on core/auth paths ∨ two-quarter growth trend (needs scan history; v1 single-scan omits trend)

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `slow-dissolvable` (dissolve → direct-deps+exports subset + scope-limited)
- Dynamic-dispatch-heavy languages inflate false positives → confidence low noted

## 10. Evidence and output

### Evidence string

```
evidence: "knip {ver}: {p}% of {n} symbols unreferenced; stuck flags {list}; orphans {list}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Unreferenced code and flags only; live-but-zero-traffic exposure cross-references API traffic without duplicating it.
