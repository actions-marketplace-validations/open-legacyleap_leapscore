# PERF-09 — Cost Efficiency / FinOps

> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | PERF-09 |
| Name | Cost Efficiency / FinOps |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: PERF` |
| Verify effort | 🔷 ~1–2 days — cost analytics + resource audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The cloud/infra bill is bloated — oversized instances, idle resources, orphaned/stale resources, no cost attribution per team/service, no rightsizing reviews, and cost is late-inspected ("it's money, whatever") rather than engineered.
- **Why it signals obsolescence:** Waste is a *structural* signal: a codebase designed for an era before cost visibility (unused clusters, always-on dev envs, 24/7 oversized fleets) leaks money in ways money-discipline would fix. FinOps isn't cosmetic — it's a proxy for engineering discipline, and cost overruns are why modernization budgets get starved (the waste would fund the fix).
- **Where it manifests:** Instances sized 4× what's needed, dev envs running 24/7, orphaned volumes/clusters, no per-team cost tags, no rightsizing review, automatic scaling absent so over-provisioned always, "the bill went up and we shrugged."
- **Objective metric:** `utilization-adjusted waste $`; `idle/orphaned resource $`; `cost attribution coverage %`; `rightsizing review cadence`; `$ per user/request trend`.
- **Yellow flag (warning):** Some waste (over-sized instances, always-on dev), attribution partial, rare reviews. *(Rationale: warning — money discipline is not yet engineered.)*
- **Red flag (critical):** No cost visibility or attribution at all, massive always-on idle waste, or the bill has grown faster than usage for multiple quarters with no one able to explain it. *(Rationale: unmanaged cost is a company-budget risk and the tax that starves modernization funding — the leak becomes the excuse for never fixing anything.)*
- **Example symptom:** "The AWS bill doubled in two years. Nobody has cost explorer logins. An audit finds three production-sized clusters running QA jobs nightly, and a 'dev' instance that's been 3% utilized for 14 months. The ruffled budget is what modernization 'doesn't fit in.'"
- **Blast radius:** Budget, modernization funding, unit economics, audit/governance, growth margin.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = attributed + right-sized; 2 = partial attribution, some waste; 1 = minimal visibility, waste growing; 0 = invisible bill, massive waste.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: tag/attribution, kill the obvious idle/orphaned resources, right-size the top 10 oversized instances, set a budget alert. Structural fix: FinOps cadence (monthly rightsizing + utilization review), autoscaling-for-cost (scale-to-zero for dev), cost dashboards per team/service, and a cost/request SLO.
- **Gold standard / target state:** Spend is attributed, tracked vs. usage, auto-right-sized, budgets alert, and waste < 10% of bill with an explanation for the rest.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Cloud bills, resource-level cost attribution, tagging audits — org/cloud-account plane.

## 6. Detection recipe

- **Detection method:** Cost analytics (Cloud Cost Management, AWS Cost Explorer resource-level, KubeCost), utilization vs. spend (P95% CPU vs. size), idle-resource sweeps (untagged, stopped-rarely, last-used), FinOps practices audit (tags/attribution, budgets, reviews).

None in v1. In-repo hints (tagging policies in IaC, budget-alert configs) are emission context only.

## 7. Fact schema

```json
{"perf09": {"status": "unknown", "reason": "requires cloud-bill + utilization join"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never
estimated_when: never                            # tag-policy greps prove nothing about spend
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs resource-level cost data + P95-utilization join (org access)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Spend efficiency; the capacity/scaling configs that drive it are PERF-05.
