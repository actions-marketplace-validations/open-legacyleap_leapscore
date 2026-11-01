# VEL-08 — Manual Release Steps & Operability — Implementation Spec

> **Authority:** This file defines the VEL-08 implementation contract. The [VEL rubric category](../../rubric/07_VELOCITY_OPERATIONAL.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | **G6** (with VEL-03) — manual-deploy half |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 human · engine: release-path audit of CI + scripts |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-08 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src + gh-api
- **Tools:** deploy-job detection in CI configs (environment deployment jobs, `deploy` steps, CD workflows); release-automation markers (`semantic-release`, `release-please`, `goreleaser`, `auto`); prod-edit script greps (`ssh `+prod aliases in scripts, `kubectl exec --it` runbooks as procedure); rollback-path evidence (`rollback` job/target)
- **Rate-cost:** none/api-light
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos; no CI at all → measured score-0 territory (manual-by-default), clause-b evidence.

## 2. Detection recipe

1. Trace artifact→environment promotion: build job → registry push → deploy job chain present?
2. Classify last-mile: automated CD / one-command manual / multi-step manual (from scripts+docs procedure density).
3. Rollback path: dedicated job/target vs "revert and redeploy" prose only.
4. Prod-direct-edit smell inventory.

Preconditions: CI parse (TEST-08 shared).

## 3. Fact schema

```json
{"vel08": {
  "cd_chain": {"build": true, "registry_push": true, "deploy_job": false},
  "release_automation": {"tool": null},
  "rollback_target": false,
  "manual_procedure_steps_est": 14,
  "prod_direct_edit_smells": [{"file": "ops/fix.sh", "pattern": "ssh prod"}]}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # automation presence/absence decidable statically
estimated_when: partial CI parse               # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
scope_limited:  deploy infra outside repo -> estimated + scope-limited note
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §VEL-08.

- `3`: full CD chain ∧ rollback target ∧ zero prod-edit smells
- `2`: automated build+push, one-command manual last mile
- `1`: multi-step manual deploys ∨ rollback prose-only
- `0`: no deploy automation at all ∨ prod-direct-edit culture signals on core ops

## 6. Gate hooks (G6)

This row's Red predicate is G6's second half. Orchestrator marks G6:
- `needs-verification` when this row measures Red but VEL-03 CFR is unknown (the v1 norm)
- `proven` only when VEL-03 also proves its half (v2)

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
evidence: "release-audit: cd-chain b/p/d={bool}/{bool}/{bool}; rollback={bool}; ~{n} manual steps; smells={k}"
```

## 9. Scope/overlaps echo

Release-path mechanics; deploy outcomes are VEL-03, frequency VEL-04.
