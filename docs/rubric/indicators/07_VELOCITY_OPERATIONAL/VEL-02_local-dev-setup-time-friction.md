# VEL-02 — Local Dev Setup Time & Friction

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for VEL-02. Edit this file; the legacy path [vel-02_local-dev-setup-time-friction.md](../../../specs/07_VELOCITY_OPERATIONAL/vel-02_local-dev-setup-time-friction.md) is a compatibility alias.
> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/07_VELOCITY_OPERATIONAL/VEL-02_local-dev-setup-time-friction.md`

## 1. Identity

| field | value |
|---|---|
| ID | VEL-02 |
| Name | Local Dev Setup Time & Friction |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — timed clean-machine setup. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Getting a working local environment takes 1+ days, requires undocumented manual steps, depends on shared remote infrastructure (staging DBs, third-party credentials), or works only for the people who built it.
- **Why it signals obsolescence:** Onboarding friction is a leading indicator of environment debt: it measures how far the codebase is from "clone → `make dev` → code." Every extra day is a day of not shipping plus a chunk of your senior engineers' time being "the database whisperers." It's also the first thing candidates/new hires report.
- **Where it manifests:** Multi-page setup wiki with un-documented "gotchas," `docker-compose` that half-works, devs pointing at shared remote DBs, setup requires obtaining 6 service credentials "from Alex," "it works on my machine" as a known phrase, no `make dev`/Taskfile/script of record.
- **Objective metric:** `median time to first green local environment`; `# of manual setup steps`; `shared-remote-DB dependency (y/n + count)`; `documentation currency of setup guide`; `time-to-first-code-commit for new hire`.
- **Yellow flag (warning):** 1–2 days depending on custom local steps. *(Rationale: warning — above modern norm; the tax is real but survivable.)*
- **Red flag (critical):** > 3 days, or requires shared remote staging DBs / a single human's credentials / a "provision me" ticket. *(Rationale: the environment can't be reproduced — it's tribal infrastructure, not a codebase.)*
- **Example symptom:** "New hire day 1-3: 'get Docker running, then Andy's `.env` file, then VPN, then ask Maria for the staging DB creds because local DB 'doesn't work', then figure out the seed script that's 4 versions old.' Andy and Maria are both on call."
- **Blast radius:** Onboarding ramp, hiring cost, senior-engineer tax, local-test fidelity (drives flaky local), developer happiness/retention.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = one-command dev up; 2 = 1–2 days, custom steps; 1 = > 3 days / shared deps; 0 = tribal environment owned by individuals.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: containerize the stack with a one-command up, ship `.env.example`, write a working setup doc, document the "Golden Path." Structural fix: hermetic local env (containers, local deps with `testcontainers`), zero shared-remote requirement, setup scripted and CI-tested (a fresh container proves the guide works), "works on my machine" made unfalsifiable.
- **Gold standard / target state:** `git clone && make dev` brings up a working local system in < 30 min with no external dependencies; the instruction is CI-verified.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** setup-surface matchers: devcontainer (`/.devcontainer`), `docker-compose.dev`, `make dev`/task-runner targets, `.env.example`, seed scripts (`db:seed`), one-command bootstrap scripts, README setup-section parse (command count, manual-step density), setup-docs freshness (DOCS-04 reuse)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos (setup friction exists even when tooling absent).

## 6. Detection recipe

- **Detection method:** Onboarding tracking (time-to-first-green-build for new hires, "Golden Path" walkthrough), dev-experience survey, try-it test (have someone time a clean-machine setup), config audit (containers, seed scripts, env templates).

1. Inventory the setup surface; classify posture: containerized-one-command / scripted / documented-manual / undocumented.
2. Manual-step density from README/CONTRIBUTING setup sections (imperative step count).
3. Fresh-clone proof is CI-derived (green build on fresh runner) — no local execution.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"vel02": {
  "devcontainer": false, "compose_dev": true,
  "one_command_target": "make dev",
  "env_example": true, "seed_script": false,
  "readme_manual_steps_est": 9,
  "posture": "scripted"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # real time-to-first-green needs a timed run (execution)
estimated_when: >=3 of {container, runner, env-template, docs} probes computed   # clamp [1,2]
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium when full surface inventoried
scope_limited:  none typical
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: scripted/containerized partial coverage; some manual steps remain
- `1`: documented-manual-only ∨ missing env templates ∧ no task runner
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "setup-inventory: posture={posture}; compose={bool}; make={target}; ~{n} manual steps in docs"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Setup friction posture; ARCH-09 scores agent-operability composition, DOCS-04 the guide's existence/currency.
