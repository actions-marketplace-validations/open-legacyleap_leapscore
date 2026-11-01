# VEL-11 — Developer Experience Tooling

> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | VEL-11 |
| Name | Developer Experience Tooling |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART (candidate; deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: VEL` |
| Verify effort | 🔷 ~1–2 days — timed inner-loop + tooling inventory. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The local coding experience is primitive — no scaffolding/generators, no hot reload, no IDE integration, no codegen, no task runners of record, so modern DX affordances (AI tooling, named tasks, watch mode) either don't work or never existed.
- **Why it signals obsolescence:** DX tooling is the difference between a codebase that feels "built in the era it was made" and one that feels current. It's also an objective check for modernization-readiness: AI-assisted tooling (copilots, agents, refactoring machines) performs dramatically worse on pre-modern setup (long builds, no types, no task definitions). It's the canary for "can we tool this codebase going forward."
- **Where it manifests:** No `Makefile`/Taskfile/`just`/npm scripts of record, no codegen/scaffolding (hand-copying boilerplate), no watch/hot reload, long cold starts per action, no language-server-friendly project structure, manual "create a new endpoint" rituals.
- **Objective metric:** `inner-loop time (edit→feedback)`; `# of scaffolding/codegen tools`; `task-runner of record present + documented`; `AI/IDE integration friction score`; `% of repetitive setup automated`.
- **Yellow flag (warning):** Inner loop 5–15 min, some tooling but no scaffolding, DX tax noticeable. *(Rationale: warning — above modern norms, survivable.)*
- **Red flag (critical):** Inner loop > 15 min (cold builds, manual steps), no task runner of record, no generator for boilerplate, and modern tooling/AI integration effectively impossible/agonizing. *(Rationale: the inner loop is the most frequent cost in software; this one is running at loss-leader rates.)*
- **Example symptom:** "Every change: save, wait 4 min for the bundler, click through a manual rebuild, hunt the console. 'Create an endpoint' is copy-paste a 300-line file. A copilot suggests something; the repo's actually slow to index. The devs live in the waiting room."
- **Blast radius:** Hourly cost per engineer, AI-tooling ROI, onboarding, prototyping velocity, modernization feasibility (this is what makes refactors feasible at scale).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = fast inner loop, tooled; 2 = 5–15 min inner loop; 1 = > 15 min with some scripts; 0 = ritualistic manual inner loop.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: define a task runner of record (Makefile/Taskfile), add scaffolding commands for the top 3 boilerplates, enable watch mode. Structural fix: invest in DX as product work — fast inner loop, generated code, language-server health, CI parity for local checks.
- **Gold standard / target state:** Inner loop < 1 min, scaffolding for common work, task runner documented and CI-consistent, AI/IDE tooling first-class.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** DX inventory: task runners of record (Makefile/justfile/package-scripts), scaffolding tooling (`plop`, `hygen`, custom generators), watch-mode configs (`jest --watch` scripts, `air` for Go, `uvicorn --reload`), codegen pipelines (`openapi-generator`, `graphql-codegen` configs), IDE-config currency (`.editorconfig`, recommended extensions), AI-tooling config (`CLAUDE.md`, `.cursor/rules`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A.

## 6. Detection recipe

- **Detection method:** DX audit — inventory developer tooling (task runner, scaffolding, watch mode, codegen), measure cold-start time for the common inner-loop (edit→rebuild→test), check IDE/AI-tool friction (does the language tooling index cleanly? any `exclude` hacks?), survey "name one script that makes you faster vs. one that makes you slower".

1. Inventory tooling classes present with config evidence.
2. Inner-loop cold-start timing requires execution → emission text ("what it takes").
3. Watch/codegen wiring into CI as proof of usage (not just presence).

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"vel11": {
  "task_runner": {"present": true, "tool": "make", "targets": ["dev", "test", "lint"]},
  "scaffolding": false, "watch_scripts": true, "codegen": ["openapi-generator"],
  "ci_wired_codegen": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # the decisive metric is timed inner-loop latency
estimated_when: inventory completed            # clamp [1,2]; confidence medium when CI-wired evidence exists
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium with usage proof; low presence-only
scope_limited:  none typical
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: runner + partial automation (watch or codegen) wired
- `1`: no task runner of record ∨ nothing wired into CI
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "dx-inventory: runner={tool}; scaffolding={bool}; watch={bool}; codegen wired-in-ci={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Tooling breadth/wiring; setup friction is VEL-02, agent-operability composition ARCH-09.
