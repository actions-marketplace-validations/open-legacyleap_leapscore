# PERF-05 — No Auto-Scaling / Capacity Planning

> **Category:** [Performance & Cloud/Infrastructure Fit](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | PERF-05 |
| Name | No Auto-Scaling / Capacity Planning |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 ~2–4 h — config audit + utilization history. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Capacity is static and manual — no autoscaling (still "provision for the peak"), no capacity planning discipline, load surprises hit prod, and scaling is done by humans reacting to pages.
- **Why it signals obsolescence:** Static capacity is a choice between wasting money (peaks provisioned always) or failing (demand exceeds fixtures). Autoscaling + telemetry-driven planning is the modern baseline; its absence means the system "hopes" about demand — and hope is where outages come from. Pairs with PERF-03/04; this is the *policy* while those are the *mechanics*.
- **Where it manifests:** No HPA/ASG, instance counts hand-set, "scale up" is a runbook action, capacity reviews happen after incidents, no load forecasting, spikes trigger "we need more servers" tickets, employee sales events' traffic is a surprise.
- **Objective metric:** `autoscaling coverage % of workloads`; `utilization % (waste)` and `max-utilization incidents`; `time to add capacity (human vs. system)`; `load-test cadence`.
- **Yellow flag (warning):** Some HPA/ASG; manual ceiling for critical services; capacity reviews ad hoc. *(Rationale: warning — the machinery is partial, humans still in the loop.)*
- **Red flag (critical):** No autoscaling at all, capacity is a manual sizing decision, or a peak load event caught the system flat-footed in the last 12 months. *(Rationale: you are one spike from an outage and one off-peak from waste.)*
- **Example symptom:** "The marketing drop is a surprise. 10pm: 'check the dashboard.' 11pm: 'we need 3 more instances.' 1am: someone writes a ticket for capacity. Had the team set an HPA, the drop would've been a non-event."
- **Blast radius:** Availability under spikes, cost (always-peak provision), on-call heroics, growth surprises, feature campaigns.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = autoscaled everything; 2 = partial, manual for critical; 1 = manual scaling with dashboards; 0 = no scaling machinery, hand-on-dial.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: set HPA/ASG on the top 5 workloads with sane thresholds, add utilization + headroom dashboards, run the scheduled-campaign checklist. Structural fix: autoscaling everywhere + telemetry-driven capacity reviewing (monthly), load-testing against forecast demand, SLO-based scaling decisions.
- **Gold standard / target state:** Autoscaling covers critical workloads; capacity changes are system-driven by policy; spikes are non-events; waste is continuously right-sized.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** scaling-config matchers: K8s `HorizontalPodAutoscaler`, ECS service autoscaling policies, ASG blocks in Terraform/CloudFormation, serverless concurrency configs; capacity-review artifacts (load-test scripts in repo, forecasting docs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: PERF-02 shows serverless-only model` (scaling inherent — reason recorded). `unknown_when: no IaC/deploy manifests in repo` (managed elsewhere). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Capacity-telemetry audit — autoscaling configs (HPA/ASG policy present?), utilization history (was there headroom waste?), past incident spikes vs. allocation, forecasting/load-testing cadence, "what triggered the last 3 scale-ups?" (human or system?).

1. Enumerate scaling policies across IaC + deploy manifests.
2. Classify: policy-backed autoscaling / static-instance only / undeclared.
3. Utilization history and spike-response analysis are telemetry plane → emission text.

Preconditions: deploy artifacts present.

## 7. Fact schema

```json
{"perf05": {
  "hpa_or_asg_present": true,
  "policies": [{"kind": "hpa", "path": "k8s/api-hpa.yaml", "min_max": [2, 10]}],
  "capacity_review_artifacts": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # presence ≠ correct sizing under real load
estimated_when: >=1 deploy artifact enumerated # clamp [1,2]; confidence medium when policy params visible
unknown_when:   no infra manifests (clause: managed elsewhere)
na_when:        serverless-only model
clamp:          [1,2]
confidence:     low without policy parameters ("presence proof only" caveat mandatory per the catalog conventions)
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: autoscaling declared on primary services
- `1`: static-capacity-only declarations ∨ no scaling config for a multi-instance model
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "scaling-scan: {kind}@{path} min={a} max={b}; capacity-artifacts={bool} [presence-only]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Scaling-policy posture; deployment model is PERF-02, live contention DATA-05.
