# TEST-03 — Test Pyramid Inversion

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for TEST-03. Edit this file; the legacy path [test-03_test-pyramid-inversion.md](../../../specs/03_TESTING_QUALITY/test-03_test-pyramid-inversion.md) is a compatibility alias.
> **Category:** [Testing & Quality Engineering](../../03_TESTING_QUALITY.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/03_TESTING_QUALITY/TEST-03_test-pyramid-inversion.md`

## 1. Identity

| field | value |
|---|---|
| ID | TEST-03 |
| Name | Test Pyramid Inversion |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 ~2–4 h — test categorization + runtime measurement. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The distribution of tests is inverted — few unit tests, a top-heavy layer of slow end-to-end tests, or UI-tests-as-integration-tests — instead of a pyramid (many fast unit tests, fewer integration, few E2E).
- **Why it signals obsolescence:** An inverted pyramid is expensive and slow (E2E tests are the slowest, flakiest, most brittle), gives poor failure localization (an E2E failure says nothing about where), and means most logic is tested through the UI — the least stable interface. It's the signature of a suite that grew as "just make it green" rather than by design.
- **Where it manifests:** Test suite where E2E/UI tests dominate runtime, unit tests near-zero, coverage achieved only via slow full-stack tests, `cypress`/`playwright`/`selenium` suites that take an hour, "tests that spin up the whole app."
- **Objective metric:** `unit/integration/e2e ratio (count)`; `E2E runtime share %`; `% of branches covered only by E2E`; `E2E suite duration`.
- **Yellow flag (warning):** E2E-heavy (E2E count ≥ unit count, or E2E runtime > 50% of suite time) in places. *(Rationale: warning — slow and brittle, but the coverage is at least there.)*
- **Red flag (critical):** Test pyramid fully inverted — no meaningful unit layer, all behavior tested through UI/full-stack, E2E suite hours long and frequently failing. *(Rationale: feedback is so slow and coarse that the suite provides almost no regression protection.)*
- **Example symptom:** "The 400-test suite is 340 E2E tests that boot the whole stack; they take 47 minutes. A typo in a util fails a UI test 3 screens away. Nobody can localize failures, so nobody trusts the details."
- **Blast radius:** CI time, failure localization, test flakiness, coverage of edge cases, refactor safety, developer patience.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = pyramid shape; 2 = overweight E2E in places; 1 = E2E-dominant in a service; 0 = no unit layer, behavior tested only through UI.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: move the top 20 E2E tests' logic down to integration/unit level (test the service, not the click). Structural fix: rebuild the pyramid over time — write unit tests for all domain logic, integration for boundaries, keep E2E for < 10 user journeys; budget E2E runtime.
- **Gold standard / target state:** Classic pyramid (e.g., 70/20/10); E2E < 10% runtime; failures localize within seconds; E2E covers only true user journeys.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** test-file classifier: path conventions (`e2e/`, `integration/`, `__tests__`, `test_*.py`, `*.spec.ts`, case-tolerant `Tests?/` dirs, `*Tests?.cs|vb` file names, dotted `*.Tests/` project dirs as high-confidence `unit` conventions — legacy-stacks 8.3), framework markers (playwright/cypress/selenium imports, `@SpringBootTest`, Django `LiveServerTestCase`, MSTest/NUnit/xUnit attributes — C# `[TestMethod]`/`[TestCase]`/`[Test]`/`[Fact]`/`[Theory]`, VB `<TestMethod>` forms), runtime-shape hints (network/db client imports in test files, `WebApplicationFactory`/`Testcontainers`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files of any kind` → score-0 territory belongs to TEST rows generally; here N/A (no pyramid to invert) with reason recorded. Decision: **N/A allowed** — a repo with zero tests has no pyramid shape; TEST-05/08 carry the zero-test signal instead.

## 6. Detection recipe

- **Detection method:** Categorize tests by type (unit/integration/E2E) via config, runtime, or annotations; measure count and *runtime share* per tier; run a pyramid ratio: `unit_count / e2e_count`, and runtime share of E2E. Inspect what the "unit" tests actually do (do they hit the DB? the UI?).

1. Enumerate test files; classify tier per file: unit / integration / e2e via markers above; ambiguous → `unclassified`. .NET convention paths with no e2e/integration marker classify `unit` at high confidence: dotted `*.Tests/` project directories and `*Test.cs|vb` / `*Tests.cs|vb` file names (legacy-stacks 8.3). A bare `Tests/`-style directory alone remains a low-confidence hint — its tier still comes from content.
2. Compute counts and estimated runtime share (E2E share heuristic: e2e_count × typical weight when no timing data).
3. Ratio metrics: `unit:e2e count ratio`, `e2e share`.

Preconditions: tree enumerated. A bounded test-file read (file-count or per-file byte cap) sets `truncated`; the row is then emitted estimated + scope-limited rather than measured over a partial surface.

## 7. Fact schema

```json
{"test03": {
  "unit": 210, "integration": 45, "e2e": 88, "unclassified": 12,
  "e2e_share_est": 0.41,
  "classification_confidence": {"high": 0.86, "low": 0.14}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # per-file tier assignment is heuristic
estimated_when: >=60% of test files classified # clamp [1,2]; confidence medium iff high-ratio >= 0.8
unknown_when:   <60% classifiable
na_when:        zero test files (reason: no shape)
clamp:          [1,2]
confidence:     medium when high-confidence classification dominates
scope_limited:  test-file read bound hit (file count / per-file bytes) -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: overweight E2E but unit layer exists (`e2e_share > Y_SHARE ∧ unit > 0`)
- `1`: near-inverted (`unit:e2e < Y_RATIO`) or UI-tests-as-integration pattern dominant
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Monorepo multi-language trees: classify per language, aggregate shares

## 10. Evidence and output

### Evidence string

```
basis: "pyramid-classify {n} test files: u/i/e = {a}/{b}/{c}; e2e share ~{s}% ({conf} confidence)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Shape of the suite by tier; run-time cost of that shape is TEST-04, skip hygiene is TEST-05.
