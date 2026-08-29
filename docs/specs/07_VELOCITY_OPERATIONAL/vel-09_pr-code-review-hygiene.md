# VEL-09 — PR & Code-Review Hygiene — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (C2 addition) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ human · engine: PR API mining |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-09 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** gh-api
- **Tools:** `GET /repos/{o}/{r}/pulls?state=closed` + per-PR reviews endpoint (sampled): review coverage %, size distribution (`additions+deletions`), time-to-first-approval, comment density, bypass/admin-merged rate, direct-push count to default branch (compare `commits` API authors vs PR merges)
- **Rate-cost:** api-budgeted (sample cap: last 200 closed PRs)
- **Ecosystems:** agnostic (GitHub-hosted; other forges → unknown with emission text)
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Sample closed PRs (last N or 12mo window).
2. Compute: review coverage, median/p95 PR size, median first-approval latency, non-author comments/100 LOC.
3. Bypass detection: `merged_by == author`, admin-merge flags; direct pushes to default branch from commits API.
4. Branch-protection cross-check when reachable.

Preconditions: public repo or App token on GitHub.

## 3. Fact schema

```json
{"vel09": {
  "prs_sampled": 200,
  "review_coverage_pct": 0.86,
  "pr_size_median_loc": 210, "p95": 1400,
  "time_to_first_approval_median_h": 9.5,
  "bypass_rate_pct": 0.04,
  "direct_pushes_default_branch": 11}}
```

## 4. Statusing rules

```yaml
measured_when:  >=50 PRs sampled               # distributions are facts
estimated_when: 10 <= n < 50                   # clamp [1,2], confidence low ("small sample")
unknown_when:   <10 PRs (young repo) or API unreachable / non-GitHub forge
na_when:        never
clamp:          [1,2]
confidence:     medium at full sample
scope_limited:  sample truncated by budget -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §VEL-09.

- `3`: coverage ≥ Y_COV ∧ sizes in healthy band ∧ bypass ≈ 0 ∧ no direct-push pattern
- `2`: coverage present, p95 size above Yellow, latency elevated
- `1`: coverage < Y_COV ∨ chronic oversized PRs ∨ regular bypasses
- `0`: bypass/direct-push normative (majority of changes) ∧ no review culture evidence

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limit mid-sample → use collected subset; below floors → unknown "rate-limited"

## 8. Evidence string

```
evidence: "pr-mining n={k}: review {p}%; median {m} LOC (p95 {q}); approval {h}h; bypass {b}%"
```

## 9. Scope/overlaps echo

Review/PR process hygiene; branching topology is VEL-10's row.
