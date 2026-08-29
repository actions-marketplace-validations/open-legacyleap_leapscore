# VEL-06 — Bus Factor / Knowledge Concentration — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ human · engine: git authorship mining |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-06 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** git (+ gh-api enrichment optional)
- **Tools:** `git log --format='%an|%ae' --name-only` mining: commits-per-author per module; ownership share computation; review-coverage proxy via PR API when available (second-pair-of-eyes rate)
- **Rate-cost:** api-budgeted (optional PR join)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: history < 6 months or single-committer repo from day one` → the latter is itself score-0 signal, so only thin-history → unknown. Else applicable.

## 2. Detection recipe

1. Per core module: author commit shares; compute bus factor = authors covering ≥80% of commits.
2. Repo-level aggregate + worst-module callout.
3. Identity normalization (email canonicalization; bot exclusion list).
4. Review coverage: % of module's merged PRs with ≥1 approval (when PR data reachable).

Preconditions: usable history.

## 3. Fact schema

```json
{"vel06": {
  "window_days": 365,
  "bus_factor_repo": 3,
  "worst_modules": [{"path": "payments/", "bus_factor": 1, "top_author_share": 0.91}],
  "review_coverage_pct": null}}
```

## 4. Statusing rules

```yaml
measured_when:  >=200 commits in window         # authorship distribution is fact
estimated_when: truncated window                # clamp [1,2], confidence low
unknown_when:   <6 months history
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  shallow-since clone -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values (bus-factor bands): see encyclopedia §VEL-06.

- `3`: repo bus factor ≥ Y_BF and no core module at 1
- `2`: bus factor adequate repo-wide, single-owner peripheral modules
- `1`: bus-factor-1 on isolated core module
- `0`: bus-factor-1 across multiple core modules / majority of codebase

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Squashed-history repos undercount authors → evidence notes distortion risk

## 8. Evidence string

```
evidence: "git-mining {w}d: bus_factor={bf} ({n} committers); worst {path} bf=1 share={s}%"
```

## 9. Scope/overlaps echo

Who owns the knowledge; churn∩defect concentration is ARCH-05.
