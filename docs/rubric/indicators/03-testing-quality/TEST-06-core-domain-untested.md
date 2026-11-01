# TEST-06 — Core Domain Untested

> **Category:** [Testing & Quality Engineering](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | TEST-06 |
| Name | Core Domain Untested |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART (catalog conventions) |
| Gates fed | **G5** — untested core |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 ~2–4 h — module-to-criticality map + coverage cross-reference. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The highest-criticality flows — the code that makes or loses money, touches PII, or is the product's reason to exist — have no (or negligible) test coverage.
- **Why it signals obsolescence:** Untested core logic is a *gate* (G5). It means the system's most important behavior is verified by production incidents, not by engineering. Modernizing or even touching that code becomes a bet. This indicator is the "but the tests cover the wrong things" trap — coverage can be high elsewhere while the crown jewels are naked.
- **Where it manifests:** The billing/payments/quotes/compliance module with no tests, coverage report filtered by module shows the core at ~0%, "we never wrote tests for that," incident history clustering on the same untested path.
- **Objective metric:** `coverage % of top-criticality modules`; `# of the 10 core journeys with at least one test`; `incident count on untested paths vs. tested paths`.
- **Yellow flag (warning):** Core paths partially tested (some journeys covered, gaps in edge cases), or tests exist but are E2E-only. *(Rationale: warning — the skeleton is there but the guard is thin.)*
- **Red flag (critical):** Zero tests on the highest-criticality service or core journey (triggers G5). *(Rationale: the most important behavior in the company is unverified — you cannot refactor it safely, and you cannot claim it works.)*
- **Example symptom:** "The pricing engine — the entire product — has 4% branch coverage. It was 'too complex to test.' Last quarter a pricing rule change overcharged 200 enterprise customers for 11 days. The refund call happened in the incident, not the tests."
- **Blast radius:** Business risk, regulatory risk, refactor feasibility, modernization strategy (untested core = rewrite candidate by default).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = core fully tested; 2 = core partially tested (gaps); 1 = core tested only via E2E or edge cases missing; 0 = core untested (triggers G5).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: characterisation-test the core (capture current behavior, lock it), then fix the top 3 divergent behaviors. Structural fix: treat the core as the highest test priority — require tests on every core change, build a test-heavy "crown jewels" suite, tie core coverage to the gate.
- **Gold standard / target state:** All 10 core journeys have tests; core module coverage > 80%; a core change without tests cannot merge; incidents on core paths are rare and never "first discovery."

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src (+ TEST-01 signals when available)
- **Tools:** core-path set (engine-computed); test-proximity matcher: co-located test files, import-graph reference from any test file; coverage join when TEST-01 observed a number (never executed locally)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no source parsed`. Zero tests anywhere is score signal here, not N/A.

## 6. Detection recipe

- **Detection method:** Cross-reference the highest-criticality modules (from business mapping) against coverage reports per module; grep the core module for test files; check incident data for the untested path (defects = unverified behavior). Use a "core-path map" — pick 10 business-critical user journeys and check each has a test.

1. Take computed core module set (money/auth/PII/compliance reachability).
2. Per core module: `has_direct_test` (co-located) ∨ `has_import_ref_test` (any test imports it).
3. Proximity % = covered modules / core modules.
4. Business-criticality weighting beyond the global core definition is unavailable from URL → recorded as caveat.

Preconditions: core-path computation done.

## 7. Fact schema

```json
{"test06": {
  "core_modules": 22,
  "with_any_test": 9,
  "proximity_pct": 0.41,
  "untested_core_sample": ["billing/refund.py", "auth/session.py"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1                      # proximity ≠ coverage
estimated_when: core set non-empty               # clamp [1,2]; confidence low always
unknown_when:   core-path computation failed
na_when:        never
clamp:          [1,2]
confidence:     low by rule ("business map missing" caveat mandatory per the catalog conventions)
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: partial (`proximity >= Y_PROX`)
- `1`: `proximity < Y_PROX`
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

- `proven`: exhaustive enumeration shows zero test files repo-wide ∧ zero CI test jobs ∧ ≥1 core module exists (positive absence over complete surfaces)
- `not-proven`: `proximity >= Y_PROX`
- `needs-verification`: everything between — the common case; surfaced as top deep-dive item per the catalog gate conventions

### Failure and budget semantics

- Budget class: `fast`
- Import graph unavailable → co-location-only proximity → confidence stays low

## 10. Evidence and output

### Evidence string

```
basis: "core-proximity: {k}/{n} core modules have adjacent/referenced tests ({p}%); untested e.g. {files}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Whether core paths are tested; overall suite shape is TEST-03, coverage level TEST-01.
