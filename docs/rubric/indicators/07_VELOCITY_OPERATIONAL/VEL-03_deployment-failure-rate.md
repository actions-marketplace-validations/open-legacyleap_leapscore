# VEL-03 — Deployment Failure Rate (CFR)

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for VEL-03. Edit this file; the legacy path [vel-03_deployment-failure-rate.md](../../../specs/07_VELOCITY_OPERATIONAL/vel-03_deployment-failure-rate.md) is a compatibility alias.
> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/07_VELOCITY_OPERATIONAL/VEL-03_deployment-failure-rate.md`

## 1. Identity

| field | value |
|---|---|
| ID | VEL-03 |
| Name | Deployment Failure Rate (CFR) |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | B |
| Default status | unknown |
| v1 flag | NO (v2) |
| Gates fed | **G6** jointly with VEL-08 (`G6*`) — CFR half unprovable from URL in v1, so G6 proven-state requires both halves; see hooks |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — release/incident data mining. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A meaningful share of deployments either fail, are rolled back, or require emergency/incident-level intervention after the fact (DORA's Change Failure Rate), and the trend is not improving.
- **Why it signals obsolescence:** CFR is the honest verdict on the whole "system is shippable" question. High CFR means every release is a bet — teams respond by shipping less (deploy frequency drops), which compounds: fewer deploys, bigger deploys, more failure. It's also a *gate* (G6) when it hits 30%+ with manual intervention.
- **Where it manifests:** Rollback logs, incident tickets tagged "deployment", "it broke after the release" post-release issues, datadog deploy-markers with red cliffs, GitHub release history with hotfixes.
- **Objective metric:** `CFR % (failed/rolled-back deploys ÷ total deploys)`; `rollback count (last 12 mo)`; `% of deploys needing incident response`.
- **Yellow flag (warning):** CFR 15–30%, or rollbacks concentrated in specific release types. *(Rationale: warning — DORA's "medium" band; clearly improvable but not catastrophic.)*
- **Red flag (critical):** CFR > 30%, or deployments *requiring* manual intervention as standard, or rollback ceremony itself is an incident (triggers **G6**). *(Rationale: releases are the top risk surface — DORA's low band with extra hazard.)*
- **Example symptom:** "Out of 40 deploys this quarter, 11 needed an immediate fix or rollback. One release required SSH-ing into prod at 2am to 'restore a config file.' The team now avoids deploying on Fridays — which makes Monday's deploys bigger."
- **Blast radius:** Availability, on-call load, deploy frequency (which compounds further failure), team confidence, customer-visible bugs.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = CFR < 15%, automated rollback; 2 = 15–30%; 1 = > 30% with some automation; 0 = > 30% + manual-only (G6).

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: implement fast rollback (repo-state rollback, feature flags, DB-migration backup), add canary/smoke checks to catch the common failure classes, post-release verification automation. Structural fix: smaller safer deploys (deploy frequency up = risk down), progressive delivery (canary, blue-green), automated rollback + observability slices, DORA tracked and reviewed monthly.
- **Gold standard / target state:** CFR < 15% and falling, rollback is automated and boring, deploys are small and frequent, no manual prod intervention.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Deploy outcomes vs rollbacks/hotfixes — needs deploy analytics (org plane). GH deployments API gives events but not *outcomes*.

## 6. Detection recipe

- **Detection method:** DORA metrics tracking — calculate CFR from deploy vs. rollback/hotfix data (commit rollout tracking, release annotations, incident tags), dashboards (Datadog, Sleuth, Faros/LinearB), manual release-history mining; distinguish failed-deploy vs. emergency-fix.

1. Join deployment records with rollback/hotfix/incident markers.
2. CFR = failed deploys / total over window.

**v1 behavior:** `unknown`. Tag-based proxies explicitly rejected: a tag is not an outcome. Hotfix-commit density on release windows is recorded as emission context only.

## 7. Fact schema

```json
{"vel03": {"status": "unknown",
            "reason": "failure rate requires deploy-outcome join",
            "context_hints": {"hotfix_commits_last_90d": 7}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # outcome-free proxies would be exactly a scored guess
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

G6 fires `proven` only when BOTH: this row's Red condition evidenced via v2/deep-scan AND VEL-08 manual-deploy evidence. In v1, G6 can at most be `needs-verification` (VEL-08's half may be measured-Red; the orchestrator marks G6 needs-verification citing this row).

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs deploy-vs-rollback join (deep scan); hotfix density {k}/90d as context"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Deploy failure rate; release-path automation is VEL-08, deploy frequency VEL-04.
