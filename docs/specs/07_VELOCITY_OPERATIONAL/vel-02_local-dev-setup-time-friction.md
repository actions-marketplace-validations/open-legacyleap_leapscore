# VEL-02 — Local Dev Setup Time & Friction — Implementation Spec

> **Authority:** This file defines the VEL-02 implementation contract. The [VEL rubric category](../../rubric/07_VELOCITY_OPERATIONAL.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 human · engine: setup-surface inventory |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-02 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** setup-surface matchers: devcontainer (`/.devcontainer`), `docker-compose.dev`, `make dev`/task-runner targets, `.env.example`, seed scripts (`db:seed`), one-command bootstrap scripts, README setup-section parse (command count, manual-step density), setup-docs freshness (DOCS-04 reuse)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos (setup friction exists even when tooling absent).

## 2. Detection recipe

1. Inventory the setup surface; classify posture: containerized-one-command / scripted / documented-manual / undocumented.
2. Manual-step density from README/CONTRIBUTING setup sections (imperative step count).
3. Fresh-clone proof is CI-derived (green build on fresh runner) — no local execution.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"vel02": {
  "devcontainer": false, "compose_dev": true,
  "one_command_target": "make dev",
  "env_example": true, "seed_script": false,
  "readme_manual_steps_est": 9,
  "posture": "scripted"}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # real time-to-first-green needs a timed run (execution)
estimated_when: >=3 of {container, runner, env-template, docs} probes computed   # clamp [1,2]
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium when full surface inventoried
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §VEL-02. Estimated ⇒ score ∈ {1,2}:

- `2`: scripted/containerized partial coverage; some manual steps remain
- `1`: documented-manual-only ∨ missing env templates ∧ no task runner
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "setup-inventory: posture={posture}; compose={bool}; make={target}; ~{n} manual steps in docs"
```

## 9. Scope/overlaps echo

Setup friction posture; ARCH-09 scores agent-operability composition, DOCS-04 the guide's existence/currency.
