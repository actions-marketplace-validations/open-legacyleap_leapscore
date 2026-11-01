# VEL-10 — Branching & Monorepo Strategy Legacy

> **Category:** [Developer Velocity & Operational Drag](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | VEL-10 |
| Name | Branching & Monorepo Strategy Legacy |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ ≤ 30 min — branch-age + CI-green + merge data. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The branching model is a legacy ceremony — GitFlow-style long-lived branches, release branches that live for weeks, merge windows, trunk divergence — or a monorepo/multi-repo split that no longer matches how the team ships, so integration is a sprint in itself.
- **Why it signals obsolescence:** Branch strategy is the plumbing of trunk-based delivery: the modern norm is short-lived branches, trunk as the source of truth, and continuous integration. Long-lived branches and forced merge windows are the *brakes* every other modernization win has to fight — they multiply merge cost, hide integration failures until merge time, and convert "ship" into a scheduled drama.
- **Where it manifests:** `develop` vs `main` with a promotion ceremony, release branches older than 2 weeks, weeks-old "feature" branches, mandatory merge freezes, no enforcement of trunk stability (broken builds on main), a monorepo where every deploy drags everything, or a multi-repo where one logical change spans six PRs.
- **Objective metric:** `median/p95 branch lifetime`; `release branch age at merge`; `distance-of-integration (commits per merge)`; `main-always-green? (broken-main incidents)`; `logical changes spanning > 1 repo (count)`; `merge-freeze days/quarter`.
- **Yellow flag (warning):** GitFlow-style ceremony with mostly-short branches; occasional month-long branches; a couple of forced merge windows; multi-repo changes needing coordination. *(Rationale: friction is real but the train mostly runs.)*
- **Red flag (critical):** Release branches weeks old with accumulating divergence, trunk routinely broken, mandatory merge windows/freezes as policy, or a monorepo/multi-repo shape that makes every change a coordination event. *(Rationale: integration is a permanent tax — every DORA-style improvement is blocked at the plumbing.)*
- **Example symptom:** "There's a `release/2.14` branch that's 6 weeks old; `develop` has drifted 400 commits ahead. Merging it back is a 3-day ceremony nobody schedules. 'Main is always red on Monday' is a known phrase. A one-line fix needs a cross-repo PR dance."
- **Blast radius:** Merge cost, integration bugs, deploy cadence (VEL-04), context switching, cross-repo coordination load, developer frustration.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = short-lived branches, trunk green, no windows; 2 = GitFlow ceremony, mostly short, occasional windows; 1 = release branches drifting, trunk often red; 0 = coordinated multi-week merge ceremony as the norm — plumbing blocks all modernization velocity.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: trunk-based basics — short-lived branches < 3 days, protect main + require green CI, delete the oldest release branch with a manual backport policy. Structural fix: move to trunk-based development with feature flags (ties ARCH-10), shrink multi-repo coordination via a platform or monorepo_tools strategy, enforce main-always-green with a CI gate.
- **Gold standard / target state:** Branches live < 3 days, main is always mergeable and green, merges are small and continuous, no merge windows, one logical change fits in one repo/PR.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** git (+ gh-api branch list)
- **Tools:** branch enumeration with last-commit dates (`git for-each-ref`); merge-commit vs rebase-lineage shape; long-lived branch detection (age > Y_DAYS, divergence depth from trunk); monorepo layout detection (multi-service roots — ECOS-09 reuse) + cross-root change span (single commits touching multiple roots)
- **Rate-cost:** api-light
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Git topology audit — branch age distribution (release + feature branch lifetimes), distance-from-trunk (commit divergence), merge-window/CI-config evidence (is main always green?), direct-push protection, monorepo/multi-repo change-span (how many repos does one logical change touch), PR-to-merge time outliers.

1. Compute branch-age distribution; classify release-branch model (release/*, hotfix/* longevity) vs trunk-based.
2. Divergence: commits ahead/behind default per stale branch.
3. Merge-window evidence: batch-merge clusters (many merges same day into release branches).
4. Trunk-green proxy: CI on default branch pass-rate (check-runs).

Preconditions: usable history.

## 7. Fact schema

```json
{"vel10": {
  "branches_total": 143, "stale_over_30d": 61,
  "model": "long-lived-release",
  "max_divergence_commits": 214,
  "merge_window_bursts": true,
  "trunk_green_rate_30d": null}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  history >=6 months             # topology is fact
estimated_when: truncated history / shallow clone   # clamp [1,2], confidence low
unknown_when:   no usable history
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  branch list capped -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3.

- `3`: trunk-based or short-lived branches ∧ trunk green
- `2`: some stale branches, no release-train lock-in
- `1`: long-lived release branches ∨ heavy divergence on core dirs
- `0`: multi-week integration windows ∨ cross-repo change span requiring lockstep releases without tooling

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Squash-merge repos: lineage shape less informative → note in evidence

## 10. Evidence and output

### Evidence string

```
evidence: "git-topology: {n} branches ({s} stale>30d); model={model}; max-divergence {d} commits"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Branch/release topology; PR-level review behavior is VEL-09, multi-service skew ECOS-09.
