# VEL-11 — Developer Experience Tooling — Implementation Spec *(deep-dive — folds into VEL when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (status arbitrated; matrix said measured — cold-start timing needs execution) |
| v1 flag | PART (candidate; deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: VEL` |
| Verify effort | 🔷 human · engine: DX inventory |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-11 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** DX inventory: task runners of record (Makefile/justfile/package-scripts), scaffolding tooling (`plop`, `hygen`, custom generators), watch-mode configs (`jest --watch` scripts, `air` for Go, `uvicorn --reload`), codegen pipelines (`openapi-generator`, `graphql-codegen` configs), IDE-config currency (`.editorconfig`, recommended extensions), AI-tooling config (`CLAUDE.md`, `.cursor/rules`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A.

## 2. Detection recipe

1. Inventory tooling classes present with config evidence.
2. Inner-loop cold-start timing requires execution → emission text ("what it takes").
3. Watch/codegen wiring into CI as proof of usage (not just presence).

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"vel11": {
  "task_runner": {"present": true, "tool": "make", "targets": ["dev", "test", "lint"]},
  "scaffolding": false, "watch_scripts": true, "codegen": ["openapi-generator"],
  "ci_wired_codegen": true}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # the decisive metric is timed inner-loop latency
estimated_when: inventory completed            # clamp [1,2]; confidence medium when CI-wired evidence exists
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium with usage proof; low presence-only
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §VEL-11. Estimated ⇒ score ∈ {1,2}:

- `2`: runner + partial automation (watch or codegen) wired
- `1`: no task runner of record ∨ nothing wired into CI
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "dx-inventory: runner={tool}; scaffolding={bool}; watch={bool}; codegen wired-in-ci={bool}"
```

## 9. Scope/overlaps echo

Tooling breadth/wiring; setup friction is VEL-02, agent-operability composition ARCH-09.
