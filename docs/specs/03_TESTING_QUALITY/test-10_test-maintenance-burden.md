# TEST-10 — Test Maintenance Burden — Implementation Spec

> **Authority:** This file defines the TEST-10 implementation contract. The [TEST rubric category](../../rubric/03_TESTING_QUALITY.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B — git archaeology is clone-local) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 human · engine: commit-class mining |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-10 |

## 1. Inputs

- **Planes:** git
- **Tools:** `git log --name-only` classifier: commits whose changed-paths are ≥80% test files AND subject matches `/fix test|snapshot|flake|test update|update test|broken test/i`; snapshot-file churn counter (`__snapshots__/`, `.snap`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero test files`. History <6mo → unknown (insufficient window).

## 2. Detection recipe

1. Partition commits: test-touching vs source-touching over trailing 12mo.
2. Maintenance class share = test-only-fix commits / all test-touching commits.
3. Snapshot churn: update-commits per month; ratio of snapshot updates to behavior commits.
4. Correlated-failure analysis (which prod change broke which tests) — out of scope from URL; emitted as "what it takes".

Preconditions: usable history.

## 3. Fact schema

```json
{"test10": {
  "commits_window": 4210, "test_touching": 380,
  "test_fix_share": 0.34,
  "snapshot_updates_per_month": 11,
  "window_days": 365}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # fix-vs-chore classification is heuristic
estimated_when: >=200 commits in window        # clamp [1,2]; confidence medium if >=1000
unknown_when:   history <6 months
na_when:        zero test files
clamp:          [1,2]
confidence:     medium with full-year window
scope_limited:  shrunk window -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §TEST-10. Estimated ⇒ score ∈ {1,2}:

- `2`: `test_fix_share < R_SHARE` but snapshot churn elevated
- `1`: `test_fix_share >= R_SHARE` ∨ chronic monthly snapshot churn
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Merge-squash repos distort classification → confidence low note

## 8. Evidence string

```
basis: "git-archaeology {n} commits/{w}d: test-fix share {p}%; snapshots {s}/mo"
```

## 9. Scope/overlaps echo

Maintenance drag of the suite itself; suite shape TEST-03, flakiness TEST-02.
