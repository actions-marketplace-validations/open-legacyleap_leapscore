# PERF-06 — Missing IaC / Config Drift

> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | PERF-06 |
| Name | Missing IaC / Config Drift |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 ~2–4 h — resource vs. code audit + drift run. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Infrastructure is not defined in code — servers/networks/load-balancers/queues are created and modified through consoles or scripts, with no reproducible declaration, so environments drift and rebuilding anything is a project.
- **Why it signals obsolescence:** IaC is the difference between infrastructure being a *reproducible artifact* and being *an accumulation of manual acts*. Without it, nothing infra can be reproduced, upgraded, or audited cheaply (the 12-factor-adjacent "treat servers as cattle" baseline). Config drift is the operational symptom: nominal-identical envs that differ in invisible ways.
- **Where it manifests:** Terraform/CloudFormation/Pulumi absent or < 50% coverage, infra built by clicking (console), "how is our VPC configured?" answered with screenshots, config changes made directly on resources with no precedent, snowflake envs, no drift detection.
- **Objective metric:** `IaC coverage % of resources`; `# of console-done infra changes (last 90 days)`; `drift count between declared & actual`; `time to rebuild an environment from code`.
- **Yellow flag (warning):** Partial IaC (core resources coded), some console drift, rebuild needs a helping hand. *(Rationale: warning — the foundation exists, discipline is leaking.)*
- **Red flag (critical):** No IaC for most resources, environments only explainable by the person who clicked them, or a rebuild is effectively impossible. *(Rationale: infra is memory — regeneration capacity is zero, and DR is theatrics unless this is fixed.)*
- **Example symptom:** "The staging RDS was created in the console 'three years ago, by Jeremy.' Terraform covers 4 resources. The DR drill tries to rebuild the environment — and dies because nobody can reconstruct the security groups. The drill is 'rescheduled.'"
- **Blast radius:** DR readiness, environment rebuilds, audit, drift bugs, scale (IaC is the lever), security (configured-by-accident infra).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full IaC + drift gate; 2 = partial coverage; 1 = scattered IaC, console dominant; 0 = no IaC, irreproducible infra.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: adopt Terraform/Pulumi for the top resource types (VPC/DB/compute), add drift detection (initial run finds the gap), codify the "documented console changes" retroactively. Structural fix: full IaC coverage with state remote + plan-diffs in CI, admin access least-privilege, rebuild-from-code as a tested path, drift = CI failure.
- **Gold standard / target state:** Everything in code, changes flow through CI-plan-review, drift is zero or alerted, and rebuilding an env is an afternoon exercise.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** IaC inventory: Terraform (`*.tf`, state backend configs), Pulumi, CloudFormation templates, Ansible playbooks; coverage heuristic: resource classes implied by deploy artifacts (PERF-02 facts) vs declared in IaC; config-change audit trail markers (plan/apply CI jobs)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: PERF-02 shows fully serverless-managed model with zero infra surface` (reason recorded). Else applicable — including zero-IaC trees (that's score signal).; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** IaC coverage audit — inventory resource types vs. what's declared in code (state file + code search), config-change audit trail (were changes made by CI/Terraform or by console?), drift-check runs against the declared state, rebuild-and-compare test (build env from code, diff).

1. Inventory IaC frameworks + module breadth (network/compute/data-store classes).
2. Coverage heuristic: cross-reference services in compose/K8s manifests against declared resources.
3. Drift-check automation: `terraform plan` in CI as gate; drift-detection schedules.
4. Live-state diffing requires cloud creds → emission text.

Preconditions: deploy inventory available.

## 7. Fact schema

```json
{"perf06": {
  "iac_frameworks": ["terraform"],
  "resource_classes_declared": ["db", "compute", "dns"],
  "classes_implied_by_deploy": ["db", "compute", "cdn"],
  "ci_plan_gate": {"present": false},
  "undeclared_classes": ["cdn"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # coverage ratio is heuristic vs implied needs
estimated_when: >=1 deploy artifact inventoried   # clamp [1,2]; confidence medium with multi-class IaC present
unknown_when:   no deploy/config artifacts
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when both sides of the coverage join parsed cleanly
scope_limited:  partial repo coverage -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: IaC present covering most implied classes; plan-gate optional
- `1`: IaC absent ∨ major implied class undeclared ∨ hand-edited console-culture signals
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "iac-inventory: {frameworks}; declared={classes}; undeclared-implied={list}; plan-gate={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

IaC coverage posture; deployment model is PERF-02, env-parity VEL-07.
