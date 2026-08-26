# ARCH-05 — Code Churn vs. Defect Hot Spots — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: git mining + issue correlation |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-05 |

## 1. Inputs

- **Planes:** git + gh-api (issues)
- **Tools:** `git log --name-only --since` mining; GH API `GET /search/issues?q=repo:{r}+is:issue+label:bug` (+ title regex `bug|fix|crash|regression`)
- **Rate-cost:** api-budgeted (issue search, ≤10 pages/scan)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: git history < 6 months or < 200 commits` → insufficient signal, status `unknown`, never N/A (history exists).

## 2. Detection recipe

1. Churn: commits per file over trailing 12mo (bounded by clone budget; shallow-since fallback noted).
2. Defect proxy per file: commit subjects matching bugfix regex (`^fix|bug|hotfix|revert|crash`) — primary; issue-title/path correlation — secondary enrichment.
3. Compute churn decile rank and defect rank per file; intersection = hot spots.
4. Join hot-spot files to core-path set.

Preconditions: usable history.

## 3. Fact schema

```json
{"arch05": {
  "commits_analyzed": 4210, "window_days": 365,
  "churn_top10_share": 0.38,
  "hotspots": [{"file": "auth/session.py", "churn_rank": 1, "defect_rank": 2, "in_core_path": true}],
  "history_truncated": false}}
```

## 4. Statusing rules

```yaml
measured_when:  commits_analyzed >= MIN_COMMITS and not history_truncated
estimated_when: truncated/shallow history                        # clamp [1,2], confidence low
unknown_when:   applicability condition fired (<6mo / <200 commits)
na_when:        never
clamp:          [1,2]
confidence:     medium full-year window; low otherwise
scope_limited:  window shrunk by budget -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §ARCH-05.

- `3`: churn∩defect intersection empty in top deciles
- `2`: churn concentrated (`churn_top10_share > Y_SHARE`), defect correlation mild
- `1`: single hot spot in isolated path
- `0`: hot spot on core path ∧ `defect_rank <= R_RANK ∧ churn_rank <= R_RANK`

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted` (issue enrichment only; git plane is local/fast)
- Issue search rate-limited → proceed with commit-subject proxy alone, evidence notes degradation

## 8. Evidence string

```
evidence: "git-mining {n} commits/{w}d: top10% files absorb {s}% churn; hotspots {files}"
```

## 9. Scope/overlaps echo

Churn∩defect concentration per file; who owns the code is VEL-06 — not this row.
