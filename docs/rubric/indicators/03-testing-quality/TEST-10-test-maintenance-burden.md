# TEST-10 — Test Maintenance Burden

> **Category:** [Testing & Quality Engineering](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | TEST-10 |
| Name | Test Maintenance Burden |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔷 ~1–2 days — git archaeology + team survey. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The ongoing cost of keeping the suite green — how often tests break from *infrastructure* rather than *behavior* changes, how much engineering time goes to fixing/debugging tests vs. writing features, snapshot churn, and the ratio of "test fix" commits to feature commits.
- **Why it signals obsolescence:** A suite that costs more to maintain than it saves is net-negative — and teams quietly stop investing in it, which then shows up as the other TEST indicators (flakes, skips, inverted pyramid). High maintenance burden is the *cause* under the symptoms.
- **Where it manifests:** Git log ("fix test", "update snapshot", "flaky fix" commits), snapshot churn (CI updating goldens constantly), test-debugging sessions, PRs blocked by unrelated test failures, `--update-snapshots` habitual use, "tests changed because we changed X" infra coupling.
- **Objective metric:** `test-fix commit share %`; `snapshot updates per month`; `mean time to diagnose a failing test`; `% of PRs touching only tests (as maintenance signal)`.
- **Yellow flag (warning):** 10–20% of commits are test maintenance; snapshot churn noticeable; tests coupled to infra details. *(Rationale: warning — the tax is growing.)*
- **Red flag (critical):** > 25% of commits are test maintenance, or tests break on every infra/rename change (coupled to internals not behavior), or the team actively dreads the suite. *(Rationale: the suite has become a tax, and the response will be abandonment.)*
- **Example symptom:** "Every merge requires 'fix the test that broke because we renamed a field.' Snapshot files churn daily. Sprint velocity shows 30% of story points eaten by 'test upkeep.' The team starts merging without running tests."
- **Blast radius:** Feature velocity, test abandonment risk, engineer morale, regressions that follow test disinvestment.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = < 10% maintenance; 2 = 10–20%; 1 = 20–25% or internal-coupled; 0 = > 25%, team avoiding the suite.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: break the coupling — assert behavior not internals (mock at boundaries, not implementation), stabilize flaky snapshots, stop auto-updating snapshots. Structural fix: treat the suite as a product (owner, budget, KPIs), refactor tests to test contracts not internals, track test-maintenance share as a metric with a ceiling.
- **Gold standard / target state:** < 10% of commits are test maintenance; tests break only when behavior changes; the suite is seen as an asset, not a tax.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** git
- **Tools:** `git log --name-only` classifier: commits whose changed-paths are ≥80% test files AND subject matches `/fix test|snapshot|flake|test update|update test|broken test/i`; snapshot-file churn counter (`__snapshots__/`, `.snap`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files`. History <6mo → unknown (insufficient window).

## 6. Detection recipe

- **Detection method:** Git archaeology — count commits matching `/fix test|snapshot|flake|test update/i` as a share of all commits; snapshot update frequency; time-tracking (rough survey); correlated-failure analysis (which production change breaks which unrelated tests).

1. Partition commits: test-touching vs source-touching over trailing 12mo.
2. Maintenance class share = test-only-fix commits / all test-touching commits.
3. Snapshot churn: update-commits per month; ratio of snapshot updates to behavior commits.
4. Correlated-failure analysis (which prod change broke which tests) — out of scope from URL; emitted as "what it takes".

Preconditions: usable history.

## 7. Fact schema

```json
{"test10": {
  "commits_window": 4210, "test_touching": 380,
  "test_fix_share": 0.34,
  "snapshot_updates_per_month": 11,
  "window_days": 365}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # fix-vs-chore classification is heuristic
estimated_when: >=200 commits in window        # clamp [1,2]; confidence medium if >=1000
unknown_when:   history <6 months
na_when:        zero test files
clamp:          [1,2]
confidence:     medium with full-year window
scope_limited:  shrunk window -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: `test_fix_share < R_SHARE` but snapshot churn elevated
- `1`: `test_fix_share >= R_SHARE` ∨ chronic monthly snapshot churn
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Merge-squash repos distort classification → confidence low note

## 10. Evidence and output

### Evidence string

```
basis: "git-archaeology {n} commits/{w}d: test-fix share {p}%; snapshots {s}/mo"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Maintenance drag of the suite itself; suite shape TEST-03, flakiness TEST-02.
