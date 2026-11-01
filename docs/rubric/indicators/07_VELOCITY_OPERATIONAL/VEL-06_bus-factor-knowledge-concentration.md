# VEL-06 — Bus Factor / Knowledge Concentration

> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | VEL-06 |
| Name | Bus Factor / Knowledge Concentration |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ ≤ 30 min — git author stats. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Critical modules are known by one or two people; whole subsystems are "only Paul understands"; there's no redundancy, no docs (see DOCS), and Paul's vacation/exit is a risk event. At the extreme, one author owns most of the codebase.
- **Why it signals obsolescence:** Knowledge concentration is the human face of the same problem as undocumented APIs: the system is maintained by memory, not by structure. It converts a normal life event (someone leaves) into an outage or a stall — and it's alarmingly common in "the codebase only one person can touch" legacy systems.
- **Where it manifests:** Git author analysis (one author dominates critical files/whole repos), "ask Paul" as the architecture diagram, modules with zero review history, no ADRs/runbooks (DOCS-01/03), the person who "knows the billing hack."
- **Objective metric:** `% of modules with single-author ownership > 60%`; `ownership entropy per module`; `# of critical files with zero external review`; `bus-factor per critical service (engineers able to explain/deploy)`.
- **Yellow flag (warning):** Single author responsible for > 50% of a critical module; a couple of know-it-all dependencies. *(Rationale: warning — reviewable, but the clock is ticking on retention.)*
- **Red flag (critical):** A single author owns > 80% of an entire codebase (or every critical service is Paul), zero documentation, zero shared context. *(Rationale: Paul leaving *is* a system failure — the codebase is functionally a memory he carries.)*
- **Example symptom:** "Git blame on the pricing service: 91% of lines are Paul. 'What does that service do?' — everyone points at Paul. Paul's PTO is scheduled; a change is needed; the whole team quietly hopes it waits."
- **Blast radius:** Outage risk on departure, review quality, knowledge transfer cost, feature blocking, retention of the "irreplaceable" (who also can't take vacation).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = distributed ownership; 2 = concentration in a couple modules; 1 = single author on critical modules; 0 = one author owns the codebase (and it's now or never).

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: pair-and-document the top exclusive modules (forced bus-factor increase), get a second reviewer on every critical file from here on. Structural fix: architecture that doesn't need a walking encyclopedia (simplify, DOCS), quarterly rotation of module owners, an "unlearnable-list" audit (which files can no one explain without the author).
- **Gold standard / target state:** No module with single-author > 50%; anyone can explain/deploy any critical service within a day; a leaving engineer is a 1-day disruption, not an event.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** git (+ gh-api enrichment optional)
- **Tools:** `git log --format='%an|%ae' --name-only` mining: commits-per-author per module; ownership share computation; review-coverage proxy via PR API when available (second-pair-of-eyes rate)
- **Rate-cost:** api-budgeted (optional PR join)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: history < 6 months or single-committer repo from day one` → the latter is itself score-0 signal, so only thin-history → unknown. Else applicable.

## 6. Detection recipe

- **Detection method:** Git author distribution — `git shortlog -sne -- <critical module>` to find ownership concentration, per-file/blob authorship, review-history coverage (did a file ever get a second pair of eyes?); interview "name the diagram you'd draw if Paul left."

1. Per core module: author commit shares; compute bus factor = authors covering ≥80% of commits.
2. Repo-level aggregate + worst-module callout.
3. Identity normalization (email canonicalization; bot exclusion list).
4. Review coverage: % of module's merged PRs with ≥1 approval (when PR data reachable).

Preconditions: usable history.

## 7. Fact schema

```json
{"vel06": {
  "window_days": 365,
  "bus_factor_repo": 3,
  "worst_modules": [{"path": "payments/", "bus_factor": 1, "top_author_share": 0.91}],
  "review_coverage_pct": null}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=200 commits in window         # authorship distribution is fact
estimated_when: truncated window                # clamp [1,2], confidence low
unknown_when:   <6 months history
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  shallow-since clone -> estimated + scope-limited
```

### Score mapping predicates

Y/R values (bus-factor bands): see §3.

- `3`: repo bus factor ≥ Y_BF and no core module at 1
- `2`: bus factor adequate repo-wide, single-owner peripheral modules
- `1`: bus-factor-1 on isolated core module
- `0`: bus-factor-1 across multiple core modules / majority of codebase

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Squashed-history repos undercount authors → evidence notes distortion risk

## 10. Evidence and output

### Evidence string

```
evidence: "git-mining {w}d: bus_factor={bf} ({n} committers); worst {path} bf=1 share={s}%"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Who owns the knowledge; churn∩defect concentration is ARCH-05.
