# TEST-05 — Skipped / Disabled Tests

> **Category:** [Testing & Quality Engineering](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | TEST-05 |
| Name | Skipped / Disabled Tests |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | ⚡ ≤ 30 min — grep + git log. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A growing graveyard of `@skip`/`@Ignore`/`xit`/`pytest.skip`/commented-out tests — disabled with "fix later" intent that never comes.
- **Why it signals obsolescence:** Skipped tests are *written-down coverage* — they document that a path was important enough to test and then abandoned. Each skip is a forgotten debt. A suite with many skips has systematically withdrawn its protection, and the trend usually tracks overall maintenance abandonment.
- **Where it manifests:** `@Ignore`/`@Disabled` (JUnit), `@skip` (pytest/Jest `xit`), `describe.skip`, commented-out test blocks, "temporarily disabled for release" commits, tests excluded in CI config.
- **Objective metric:** `% of tests skipped (skipped / total)`; `median age of skipped tests`; `# of skips added in the last 6 months` (trend).
- **Yellow flag (warning):** 5–10% skipped, or skips concentrated in a few modules, some recent. *(Rationale: warning — a fix-it-within-a-sprint item.)*
- **Red flag (critical):** > 10% skipped, or skips aged > 6 months with no ticket, or skips added to force a release through. *(Rationale: the team is actively deleting its safety net to ship.)*
- **Example symptom:** "A pre-release audit finds 90 `@Ignore`d tests — average age 2 years. Three are the refund-eligibility edge cases. The comments say 'broken after the payments refactor, re-enable soon.'"
- **Blast radius:** Silent coverage loss, regression escape, honesty of the coverage report, team morale.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 2%; 2 = 5–10%; 1 = > 10% or aged; 0 = skips used to force releases or coverage silently gone.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: re-enable or delete each skip deliberately (delete-with-justification or fix-with-test); no skips without a linked ticket and owner. Structural fix: CI gate that fails on new skips without a ticket; a monthly "skip inventory" review; fix the top skipped module's root cause.
- **Gold standard / target state:** < 2% skipped, all with tickets + owners, none older than a sprint; new skips auto-blocked.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + git
- **Tools:** AST-grep/regex marker pack: `test.skip|xit\(|xdescribe|@Ignore|@Disabled|pytest.mark.skip|skipIf|t.Skip|it.each.skip`, conditional skips (`skipUnless`, `if (process.env.CI) return`), CI-level exclusions (`--ignore` test paths in workflow steps); .NET forms — `[Ignore]`/`<Ignore>`, `[TestMethod, Ignore]`, `Skip = "reason"` / VB `Skip:="reason"`, `Assert.Ignore(`, `Assert.Inconclusive(`
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files` (nothing to skip — reason recorded).

## 6. Detection recipe

- **Detection method:** Grep for skip markers with `rg "@skip|@Ignore|xit\(|test.skip|pytest.mark.skip"`, count by module and date of skip; git log for skip-adding commits (check dates); CI config exclusions.

1. Count skip markers per file; total tests estimated per framework counter (`it(`, `def test_`, `@Test`, `[TestMethod]`/`[Test]`/`[Fact]`/`[Theory]`/`[TestCase]`) for ratio.
2. Skip age: introduction commit date per marker via `git blame -L`.
3. Conditional-skip classification (env-dependent vs permanent).
4. Ratio = skipped / total.

Preconditions: tree enumerated. A bounded test-file read (file count / per-file bytes) sets `truncated` → the row is disclosed scope-limited (counts stand; coverage is partial).

## 7. Fact schema

```json
{"test05": {
  "total_tests_est": 344, "skipped_total": 31,
  "skip_ratio": 0.09,
  "aged_skips": [{"file": "e2e/checkout.spec.ts", "age_days": 233}],
  "ci_exclusions": ["--ignore=tests/flaky"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=1 test file parsed
estimated_when: never                             # markers are facts
unknown_when:   tree unparseable
na_when:        zero test files
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium; low if blame unavailable (drop age subscore)
scope_limited:  test-file read bound hit (file count / per-file bytes) -> measured + scope-limited
```

### Score mapping predicates

Y/R values (5–10% / >10%; months-aged): see §3.

- `3`: `skip_ratio < Y_RATIO`
- `2`: Yellow band or recent skips only
- `1`: `skip_ratio > Y_RATIO` with aged skips present
- `0`: `skip_ratio > R_RATIO` ∨ mass aged disables (>6mo) on core-module tests

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Shallow history → age facts dropped → evidence notes it, status stays measured

## 10. Evidence and output

### Evidence string

```
evidence: "skip-scan: {k}/{n} tests skipped ({p}%); {a} older than {d}d ({files})"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Skip/disable hygiene; why suites flake is TEST-02, isolation causes TEST-07.
