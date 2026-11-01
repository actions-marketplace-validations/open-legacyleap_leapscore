# ARCH-05 — Code Churn vs. Defect Hot Spots

> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-05 |
| Name | Code Churn vs. Defect Hot Spots |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — git mining + defect tracker correlation. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A small fraction of files absorbs a disproportionate share of commits (churn), and those same files produce a disproportionate share of defects and incident fixes. Change is fractal: the same code is reworked over and over.
- **Why it signals obsolescence:** High-churn/high-defect "hot spots" are where the codebase is actively fighting its own shape. They signal that a module's design is wrong for its workload — and the fix isn't more commits, it's a redesign. DORA and CodeScene research tie this pattern directly to delivery slowdown and engineer churn.
- **Where it manifests:** Git history (files with the most commits and most bug-fix commits), bug tracker (which modules get the most defect tickets), incident data (which files are implicated in production fixes), files that are touched on every feature.
- **Objective metric:** `churn concentration (top 10% files' % of commits)`; `defect correlation (top churn files' % of bug fixes)`; `# of files in the churn∩defect intersection`.
- **Yellow flag (warning):** Top 5% churned files show moderate bug frequency; churn is concentrated but defects not yet correlated. *(Rationale: warning — the shape is starting to hurt.)*
- **Red flag (critical):** Top 10% churned files account for > 50% of production incident fixes, or a single file is both #1 churn and #1 defect. *(Rationale: the module is structurally broken — every change breeds a bug.)*
- **Example symptom:** "GitPrime shows the auth module has 40% of all commits and 60% of all incident fixes. Every security tweak touches it; every tweak ships a regression. The team knows it's wrong but 'can't stop to fix it.'"
- **Blast radius:** Delivery throughput, incident rate, engineer retention (people burn out on the hot file), review load.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no overlap; 2 = churn concentrated, defects mild; 1 = hot spot in an isolated path; 0 = hot spot in core logic driving incidents.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: put the top hot spot behind a designated owner, add targeted tests, freeze feature scope on it for one sprint. Structural fix: redesign the hot spot — decompose by responsibility, rewrite the risky core with tests first, rotate engineers to avoid bus-factor in the fix. Track the metric quarterly to prove improvement.
- **Gold standard / target state:** Churn evenly distributed relative to responsibility; no file in the top churn∩defect intersection for two quarters; hot-spot list tracked in the refactoring backlog.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** git + gh-api (issues)
- **Tools:** `git log --name-only --since` mining; GH API `GET /search/issues?q=repo:{r}+is:issue+label:bug` (+ title regex `bug|fix|crash|regression`)
- **Rate-cost:** api-budgeted (issue search, ≤10 pages/scan)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: git history < 6 months or < 200 commits` → insufficient signal, status `unknown`, never N/A (history exists).

## 6. Detection recipe

- **Detection method:** Git hot-spot analysis — CodeScene, GitPrime/Pluralsight Flow, `git log --since --oneline -- <path> | wc -l`, `git blame` density, commit graph mining (custom script counting commits/bugfixes per file); correlate with defect tracker (`gh issue --search "in:title bug"` grouped by path). Compute churn rank and defect rank; flag files in both top deciles.

1. Churn: commits per file over trailing 12mo (bounded by clone budget; shallow-since fallback noted).
2. Defect proxy per file: commit subjects matching bugfix regex (`^fix|bug|hotfix|revert|crash`) — primary; issue-title/path correlation — secondary enrichment.
3. Compute churn decile rank and defect rank per file; intersection = hot spots.
4. Join hot-spot files to core-path set.

Preconditions: usable history.

## 7. Fact schema

```json
{"arch05": {
  "commits_analyzed": 4210, "window_days": 365,
  "churn_top10_share": 0.38,
  "hotspots": [{"file": "auth/session.py", "churn_rank": 1, "defect_rank": 2, "in_core_path": true}],
  "history_truncated": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  commits_analyzed >= MIN_COMMITS and not history_truncated
estimated_when: truncated/shallow history                        # clamp [1,2], confidence low
unknown_when:   applicability condition fired (<6mo / <200 commits)
na_when:        never
clamp:          [1,2]
confidence:     medium full-year window; low otherwise
scope_limited:  window shrunk by budget -> estimated + scope-limited
```

### Score mapping predicates

Thresholds/criteria: see §3.

- `3`: churn∩defect intersection empty in top deciles
- `2`: churn concentrated (`churn_top10_share > Y_SHARE`), defect correlation mild
- `1`: single hot spot in isolated path
- `0`: hot spot on core path ∧ `defect_rank <= R_RANK ∧ churn_rank <= R_RANK`

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted` (issue enrichment only; git plane is local/fast)
- Issue search rate-limited → proceed with commit-subject proxy alone, evidence notes degradation

## 10. Evidence and output

### Evidence string

```
evidence: "git-mining {n} commits/{w}d: top10% files absorb {s}% churn; hotspots {files}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Churn∩defect concentration per file; who owns the code is VEL-06 — not this row.
