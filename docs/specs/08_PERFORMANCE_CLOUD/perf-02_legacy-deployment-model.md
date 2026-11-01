# PERF-02 — Legacy Deployment Model — Implementation Spec

> **Authority:** This file defines the PERF-02 implementation contract. The [PERF rubric category](../../rubric/08_PERFORMANCE_CLOUD.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (status arbitrated; encyc said B·estimated — manifest presence is fact) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into PERF category % |
| Verify effort | 🔶 human · engine: deploy-artifact inventory |
| Thresholds & 0–3 criteria | see encyclopedia §PERF-02 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** deployment-target inventory: `Dockerfile*`, `docker-compose*`, K8s manifests (`k8s/`, `*.yaml` with kind Deployment), Helm charts, serverless configs (`serverless.yml`, `vercel.json`, `sam-template`), ECS task defs; VM-script smells (`systemctl`, `service X restart`, `capistrano`, `fabric` deps)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos (something runs somewhere; absence of all modern artifacts is signal).

## 2. Detection recipe

1. Enumerate deployment artifacts; classify model: containers/orchestration/serverless/VM-scripts/none-declared.
2. Image-build pipeline linkage: does CI build/push images (VEL-08 shared parse).
3. Host-drift probes are runtime plane → emission text.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"perf02": {
  "artifacts": [{"kind": "dockerfile", "path": "Dockerfile"}, {"kind": "vm-script", "path": "ops/deploy.sh", "smell": "systemctl restart"}],
  "model": "mixed-vm-container",
  "ci_builds_images": false}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # artifact inventory decidable statically
estimated_when: ambiguous mixed signals only   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
scope_limited:  infra outside repo -> note in evidence
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §PERF-02.

- `3`: orchestrated/containerized or serverless with CI-built images
- `2`: containerized without orchestration, CI-linked
- `1`: VM-based with partial automation ∨ mixed model mid-migration
- `0`: hand-run VM scripts only / no declared deploy path

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
evidence: "deploy-inventory: model={model}; artifacts={list}; ci-builds-images={bool}; vm-smells={k}"
```

## 9. Scope/overlaps echo

Deployment-model shape; release mechanics are VEL-08, IaC coverage PERF-06.
