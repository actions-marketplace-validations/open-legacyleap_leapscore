# VEL-10 — Branching & Monorepo Strategy Legacy — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (C2 addition) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ human · engine: git topology mining |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-10 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** git (+ gh-api branch list)
- **Tools:** branch enumeration with last-commit dates (`git for-each-ref`); merge-commit vs rebase-lineage shape; long-lived branch detection (age > Y_DAYS, divergence depth from trunk); monorepo layout detection (multi-service roots — ECOS-09 reuse) + cross-root change span (single commits touching multiple roots)
- **Rate-cost:** api-light
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Compute branch-age distribution; classify release-branch model (release/*, hotfix/* longevity) vs trunk-based.
2. Divergence: commits ahead/behind default per stale branch.
3. Merge-window evidence: batch-merge clusters (many merges same day into release branches).
4. Trunk-green proxy: CI on default branch pass-rate (check-runs).

Preconditions: usable history.

## 3. Fact schema

```json
{"vel10": {
  "branches_total": 143, "stale_over_30d": 61,
  "model": "long-lived-release",
  "max_divergence_commits": 214,
  "merge_window_bursts": true,
  "trunk_green_rate_30d": null}}
```

## 4. Statusing rules

```yaml
measured_when:  history >=6 months             # topology is fact
estimated_when: truncated history / shallow clone   # clamp [1,2], confidence low
unknown_when:   no usable history
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  branch list capped -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §VEL-10.

- `3`: trunk-based or short-lived branches ∧ trunk green
- `2`: some stale branches, no release-train lock-in
- `1`: long-lived release branches ∨ heavy divergence on core dirs
- `0`: multi-week integration windows ∨ cross-repo change span requiring lockstep releases without tooling

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Squash-merge repos: lineage shape less informative → note in evidence

## 8. Evidence string

```
evidence: "git-topology: {n} branches ({s} stale>30d); model={model}; max-divergence {d} commits"
```

## 9. Scope/overlaps echo

Branch/release topology; PR-level review behavior is VEL-09, multi-service skew ECOS-09.
