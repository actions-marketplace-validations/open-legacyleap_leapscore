# VEL-09 — PR & Code-Review Hygiene

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for VEL-09. Edit this file; the legacy path [vel-09_pr-code-review-hygiene.md](../../../specs/07_VELOCITY_OPERATIONAL/vel-09_pr-code-review-hygiene.md) is a compatibility alias.
> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/07_VELOCITY_OPERATIONAL/VEL-09_pr-code-review-hygiene.md`

## 1. Identity

| field | value |
|---|---|
| ID | VEL-09 |
| Name | PR & Code-Review Hygiene |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — PR API mining + sample read. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Code review is rubber-stamped or absent — low PR coverage, thousands-of-line PRs, admin merges and direct pushes, reviews with no changed-code reading — so quality and knowledge transfer depend on unfiltered commits.
- **Why it signals obsolescence:** Review is the last human gate before code becomes shared truth. Its decay tracks maintenance abandonment: when nobody reads diffs, decisions stop being questioned, knowledge stops transferring, and both defect rate and bus factor rise quietly. Legacy repos typically show both extremes at once — none of the discipline, all of the ceremony.
- **Where it manifests:** PRs merged without review or with an admin bypass, direct pushes to main, median PR sizes in the thousands of lines or multi-week lifetimes, "LGTM" reviews with zero comments, reviews concentrated in one person (feeds VEL-06), no review on the core/path-critical services.
- **Objective metric:** `PR review coverage %`; `median/p95 PR size`; `median review latency (merge wait)`; `admin/bypass merge rate %`; `direct pushes to main (count)`; `review comment density`.
- **Yellow flag (warning):** Review coverage < 80% or rubber-stamp for some modules; median PR 500–1,000 LOC; review latency days. *(Rationale: mostly functioning, but the gate is leaking on size and speed.)*
- **Red flag (critical):** Reviews effectively absent — admin merges / direct pushes as normal practice, or core-path changes ship unreviewed, or median PRs > 1,000 LOC so reviews are theater by construction. *(Rationale: there is no longer a shared reading of the code — defects and knowledge holes land unchallenged.)*
- **Example symptom:** "The dashboard PR was 1,400 lines with 31 files and merged after one emoji comment — the reviewer had clicked 'approve' in 40 seconds. Three days later a regression ships because the 'review' missed a changed edge case. This is the normal path, not the exception."
- **Blast radius:** Defect rate, knowledge transfer, bus factor (VEL-06), decision quality, audit trail of "who looked," review burnout of the one real reviewer.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full coverage, small PRs, substantive reviews; 2 = some rubber-stamp, PRs 500–1,000, latency days; 1 = core paths sometimes unreviewed or consistently oversized PRs; 0 = admin merges / direct pushes as the norm, no real review exists.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: enforce branch protection with required reviews on core paths, ban direct pushes, add a PR-size lint (split > 400-LOC PRs), publish review-coverage metrics. Structural fix: review as a first-class metric (coverage, size, latency tracked), pairing/small-PR culture, a second reviewer on security-adjacent paths, "no unreviewed merge" as an org rule.
- **Gold standard / target state:** 100% coverage on core paths, median PR < 400 LOC, reviews substantive (comments, not emoji), zero bypasses, review latency < 1 day.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** gh-api
- **Tools:** `GET /repos/{o}/{r}/pulls?state=closed` + per-PR reviews endpoint (sampled): review coverage %, size distribution (`additions+deletions`), time-to-first-approval, comment density, bypass/admin-merged rate, direct-push count to default branch (compare `commits` API authors vs PR merges)
- **Rate-cost:** api-budgeted (sample cap: last 200 closed PRs)
- **Ecosystems:** agnostic (GitHub-hosted; other forges → unknown with emission text)
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** GitHub/PR API mining — review coverage % of PRs, median and p95 PR size (additions+deletions), median time-to-first-approval, comment density (non-author comments per 100 LOC), bypass/admin-merge rate, direct-push count to protected branches; sample the top 20 PRs for "was the diff actually read."

1. Sample closed PRs (last N or 12mo window).
2. Compute: review coverage, median/p95 PR size, median first-approval latency, non-author comments/100 LOC.
3. Bypass detection: `merged_by == author`, admin-merge flags; direct pushes to default branch from commits API.
4. Branch-protection cross-check when reachable.

Preconditions: public repo or App token on GitHub.

## 7. Fact schema

```json
{"vel09": {
  "prs_sampled": 200,
  "review_coverage_pct": 0.86,
  "pr_size_median_loc": 210, "p95": 1400,
  "time_to_first_approval_median_h": 9.5,
  "bypass_rate_pct": 0.04,
  "direct_pushes_default_branch": 11}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=50 PRs sampled               # distributions are facts
estimated_when: 10 <= n < 50                   # clamp [1,2], confidence low ("small sample")
unknown_when:   <10 PRs (young repo) or API unreachable / non-GitHub forge
na_when:        never
clamp:          [1,2]
confidence:     medium at full sample
scope_limited:  sample truncated by budget -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3.

- `3`: coverage ≥ Y_COV ∧ sizes in healthy band ∧ bypass ≈ 0 ∧ no direct-push pattern
- `2`: coverage present, p95 size above Yellow, latency elevated
- `1`: coverage < Y_COV ∨ chronic oversized PRs ∨ regular bypasses
- `0`: bypass/direct-push normative (majority of changes) ∧ no review culture evidence

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limit mid-sample → use collected subset; below floors → unknown "rate-limited"

## 10. Evidence and output

### Evidence string

```
evidence: "pr-mining n={k}: review {p}%; median {m} LOC (p95 {q}); approval {h}h; bypass {b}%"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Review/PR process hygiene; branching topology is VEL-10's row.
