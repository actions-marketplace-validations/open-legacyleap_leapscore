# TEST-03 — Test Pyramid Inversion — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured — tier assignment is classification) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 human · engine: file classification pass |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-03 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** test-file classifier: path conventions (`e2e/`, `integration/`, `__tests__`, `test_*.py`, `*.spec.ts`, case-tolerant `Tests?/` dirs, `*Tests?.cs|vb` file names, dotted `*.Tests/` project dirs as high-confidence `unit` conventions — legacy-stacks 8.3), framework markers (playwright/cypress/selenium imports, `@SpringBootTest`, Django `LiveServerTestCase`, MSTest/NUnit/xUnit attributes — C# `[TestMethod]`/`[TestCase]`/`[Test]`/`[Fact]`/`[Theory]`, VB `<TestMethod>` forms), runtime-shape hints (network/db client imports in test files, `WebApplicationFactory`/`Testcontainers`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files of any kind` → score-0 territory belongs to TEST rows generally; here N/A (no pyramid to invert) with reason recorded. Decision: **N/A allowed** — a repo with zero tests has no pyramid shape; TEST-05/08 carry the zero-test signal instead.

## 2. Detection recipe

1. Enumerate test files; classify tier per file: unit / integration / e2e via markers above; ambiguous → `unclassified`. .NET convention paths with no e2e/integration marker classify `unit` at high confidence: dotted `*.Tests/` project directories and `*Test.cs|vb` / `*Tests.cs|vb` file names (legacy-stacks 8.3). A bare `Tests/`-style directory alone remains a low-confidence hint — its tier still comes from content.
2. Compute counts and estimated runtime share (E2E share heuristic: e2e_count × typical weight when no timing data).
3. Ratio metrics: `unit:e2e count ratio`, `e2e share`.

Preconditions: tree enumerated. A bounded test-file read (file-count or per-file byte cap) sets `truncated`; the row is then emitted estimated + scope-limited rather than measured over a partial surface.

## 3. Fact schema

```json
{"test03": {
  "unit": 210, "integration": 45, "e2e": 88, "unclassified": 12,
  "e2e_share_est": 0.41,
  "classification_confidence": {"high": 0.86, "low": 0.14}}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # per-file tier assignment is heuristic
estimated_when: >=60% of test files classified # clamp [1,2]; confidence medium iff high-ratio >= 0.8
unknown_when:   <60% classifiable
na_when:        zero test files (reason: no shape)
clamp:          [1,2]
confidence:     medium when high-confidence classification dominates
scope_limited:  test-file read bound hit (file count / per-file bytes) -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §TEST-03. Estimated ⇒ score ∈ {1,2}:

- `2`: overweight E2E but unit layer exists (`e2e_share > Y_SHARE ∧ unit > 0`)
- `1`: near-inverted (`unit:e2e < Y_RATIO`) or UI-tests-as-integration pattern dominant
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Monorepo multi-language trees: classify per language, aggregate shares

## 8. Evidence string

```
basis: "pyramid-classify {n} test files: u/i/e = {a}/{b}/{c}; e2e share ~{s}% ({conf} confidence)"
```

## 9. Scope/overlaps echo

Shape of the suite by tier; run-time cost of that shape is TEST-04, skip hygiene is TEST-05.
