# PERF-02 — Legacy Deployment Model

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for PERF-02. Edit this file; the legacy path [perf-02_legacy-deployment-model.md](../../../specs/08_PERFORMANCE_CLOUD/perf-02_legacy-deployment-model.md) is a compatibility alias.
> **Category:** [Performance & Cloud/Infrastructure Fit](../../08_PERFORMANCE_CLOUD.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/08_PERFORMANCE_CLOUD/PERF-02_legacy-deployment-model.md`

## 1. Identity

| field | value |
|---|---|
| ID | PERF-02 |
| Name | Legacy Deployment Model |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 ~2–4 h — infra inventory + "add an instance" test. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system runs on bare metal/VMs or a hand-managed fleet where servers are purchased, configured by hand (or by fragile scripts), statefully modified over time, and replaced/infra changes are a project rather than a deployment concern.
- **Why it signals obsolescence:** The deployment model is infrastructure's era stamp. Containerization + orchestration + immutable infra is the modern baseline because it's reproducible, scalable, and auditable; the pre-container model is slow, snowflake-prone, and is where "upgrades" become multi-week efforts. Not every VM is legacy — but VMs configured by throwing commands at them are.
- **Where it manifests:** `ssh`-configured servers, golden images that drift after setup, no containers anywhere, capacity added by buying/allocating a VM, deploys that are "git pull on the host," snowflake servers named after the intern who set them up, no immutable/rebuilt concept.
- **Objective metric:** `% of workloads containerized`; `% infra provisioned by IaC`; `host drift count`; `time-to-add-an-instance`; `deploy path (immutable artifact vs. mutate-in-place)`.
- **Yellow flag (warning):** Partial containerization/IaC; some VMs still configured by scripts; a couple of snowflakes. *(Rationale: warning — the migration is underway but incomplete.)*
- **Red flag (critical):** Bare-metal/VM with manual stateful modifications as the standard; scale = "buy a bigger server." *(Rationale: every env change is a project and every size change is a downtime.)*
- **Example symptom:** "Prod is three VMs 'configured by a script that lives on the ops guy's laptop.' Adding a 4th took two weeks and still drifted. Scaling for the holiday spike meant ordering hardware. 'Containerize' elicits 'we tried once, didn't finish.'"
- **Blast radius:** Scale speed, provisioning cost, drift bugs, deploy risk, disaster recovery (rebuild from what?), modernization sequencing.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = containers + IaC; 2 = partial; 1 = VMs + IaC-light; 0 = hand-configured snowflakes.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: containerize the app (it's usually the smallest step), move VM provisioning to IaC (Terraform/cloud-init), codify the laptop script. Structural fix: immutable, containerized, orchestrated deployment (K8s/ECS) with IaC for everything, auto-scaling-ready, snowflakes eliminated by rebuild-from-code.
- **Gold standard / target state:** Everything containerized + IaC-managed, instances are cattle (rebuildable in minutes), scale is a config change, drift impossible by construction.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** deployment-target inventory: `Dockerfile*`, `docker-compose*`, K8s manifests (`k8s/`, `*.yaml` with kind Deployment), Helm charts, serverless configs (`serverless.yml`, `vercel.json`, `sam-template`), ECS task defs; VM-script smells (`systemctl`, `service X restart`, `capistrano`, `fabric` deps)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos (something runs somewhere; absence of all modern artifacts is signal).

## 6. Detection recipe

- **Detection method:** Infra inventory — deployment targets and provisioning method (Terraform/cloud-init/Ansible vs. hand-run commands), containerization %, image-build pipeline for the app, drift between nominally-identical hosts, "how would you add a 2nd instance?" test (this answer reveals the model).

1. Enumerate deployment artifacts; classify model: containers/orchestration/serverless/VM-scripts/none-declared.
2. Image-build pipeline linkage: does CI build/push images (VEL-08 shared parse).
3. Host-drift probes are runtime plane → emission text.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"perf02": {
  "artifacts": [{"kind": "dockerfile", "path": "Dockerfile"}, {"kind": "vm-script", "path": "ops/deploy.sh", "smell": "systemctl restart"}],
  "model": "mixed-vm-container",
  "ci_builds_images": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # artifact inventory decidable statically
estimated_when: ambiguous mixed signals only   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
scope_limited:  infra outside repo -> note in evidence
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: orchestrated/containerized or serverless with CI-built images
- `2`: containerized without orchestration, CI-linked
- `1`: VM-based with partial automation ∨ mixed model mid-migration
- `0`: hand-run VM scripts only / no declared deploy path

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
evidence: "deploy-inventory: model={model}; artifacts={list}; ci-builds-images={bool}; vm-smells={k}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Deployment-model shape; release mechanics are VEL-08, IaC coverage PERF-06.
