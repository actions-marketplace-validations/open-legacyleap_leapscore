# TEST-05 — Skipped / Disabled Tests — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ human · engine: marker grep + blame |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-05 |

## 1. Inputs

- **Planes:** static-src + git
- **Tools:** AST-grep/regex marker pack: `test.skip|xit\(|xdescribe|@Ignore|@Disabled|pytest.mark.skip|skipIf|t.Skip|it.each.skip`, conditional skips (`skipUnless`, `if (process.env.CI) return`), CI-level exclusions (`--ignore` test paths in workflow steps)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files` (nothing to skip — reason recorded).

## 2. Detection recipe

1. Count skip markers per file; total tests estimated per framework counter (`it(`, `def test_`, `@Test`) for ratio.
2. Skip age: introduction commit date per marker via `git blame -L`.
3. Conditional-skip classification (env-dependent vs permanent).
4. Ratio = skipped / total.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"test05": {
  "total_tests_est": 344, "skipped_total": 31,
  "skip_ratio": 0.09,
  "aged_skips": [{"file": "e2e/checkout.spec.ts", "age_days": 233}],
  "ci_exclusions": ["--ignore=tests/flaky"]}}
```

## 4. Statusing rules

```yaml
measured_when:  >=1 test file parsed
estimated_when: never                             # markers are facts
unknown_when:   tree unparseable
na_when:        zero test files
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium; low if blame unavailable (drop age subscore)
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Y/R values (5–10% / >10%; months-aged): see encyclopedia §TEST-05.

- `3`: `skip_ratio < Y_RATIO`
- `2`: Yellow band or recent skips only
- `1`: `skip_ratio > Y_RATIO` with aged skips present
- `0`: `skip_ratio > R_RATIO` ∨ mass aged disables (>6mo) on core-module tests

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Shallow history → age facts dropped → evidence notes it, status stays measured

## 8. Evidence string

```
evidence: "skip-scan: {k}/{n} tests skipped ({p}%); {a} older than {d}d ({files})"
```

## 9. Scope/overlaps echo

Skip/disable hygiene; why suites flake is TEST-02, isolation causes TEST-07.
