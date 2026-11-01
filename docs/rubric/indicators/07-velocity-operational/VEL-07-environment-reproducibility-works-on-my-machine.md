# VEL-07 — Environment Reproducibility / Works-on-My-Machine

> **Category:** [Developer Velocity & Operational Drag](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | VEL-07 |
| Name | Environment Reproducibility / Works-on-My-Machine |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — parity audit + repro test. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Local, staging, and prod environments drift so much that "works on my machine" is a standing phenomenon — configs differ, versions differ, data differs, and bugs only reproduce in one environment.
- **Why it signals obsolescence:** Environment reproducibility is the ground truth behind every "it works here" argument. Its failure means the team's work product (a fix) doesn't reliably transfer to prod — the whole loop of develop→test→deploy is leaky. Pairs with DATA-10 (schema drift) but covers the whole stack.
- **Where it manifests:** The "works on my machine" retort, environment-specific bugs, config files differing per env by hand, no containerized parity, feature flags on in one env only, "we can't reproduce" tickets, version skew local vs. prod.
- **Objective metric:** `env-version divergence count`; `% of configs managed by a canonical pipeline`; `time to reproduce a prod-only bug`; `works-on-my-machine incident frequency`.
- **Yellow flag (warning):** Some config/version divergence between envs, occasional prod-only bugs. *(Rationale: warning — the leak is real but not structural yet.)*
- **Red flag (critical):** Reproducing prod locally is routinely impossible, or configs are maintained per-env by hand with no source of truth. *(Rationale: you cannot develop against your product — every fix is blind until it's not.)*
- **Example symptom:** "A bug 'only happens on prod' — three reproductions take a week. Root cause: an env-specific config value edited by hand in 2019 nobody knew about. The team's standing joke is 'works on my machine, ships in yours.'"
- **Blast radius:** Debugging time, prod-only bugs, fix-transfer failure, deploy risk (VEL-03), dev confidence.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full parity; 2 = minor divergence; 1 = meaningful divergence, repro hard; 0 = local ≠ prod, routine blind shipping.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: containerize dev for parity, make config canonical (one source of truth, injected per env), stand up a staging clone of prod config. Structural fix: full parity — same containers/versions everywhere, IaC for all envs, config as code, "prod reproduction" as a standard step (spin replica to confirm).
- **Gold standard / target state:** Any environment can be rebuilt to match prod; prod-only bugs are a thing of the past; config drift is zero-diff against the source of truth.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** canonical-config inventory: IaC presence (PERF-06 reuse), env-config injection patterns (CI env refs vs committed per-env files — ARCH-10 reuse), runtime-version pins (ECOS-01 facts), container parity (`Dockerfile` + compose matching prod image lineage), config-drift comparison between committed env files
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Parity audit — compare dev/CI/staging/prod versions (runtime, deps, OS, configs); check for canonical config pipeline (IaC + env-config injection) vs. hand-edited files; try "reproduce the prod bug in a container" TIMED; survey "last time a support bug was reproduced locally".

1. Assemble parity surface from reusable facts: runtime pins, containerization, IaC, env-config handling.
2. Committed per-env file diff: do `*.staging.*` and `*.prod.*` configs structurally diverge (key-set diff)?
3. "Reproduce prod bug in container" timed experiment is execution plane → emission text.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"vel07": {
  "containerized": true, "iac_present": true,
  "env_injection": {"ci_refs": true, "committed_per_env_files": ["config/prod.py", "config/staging.py"]},
  "env_keyset_divergence": 4,
  "runtime_pins_consistent": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # parity truth is behavioral
estimated_when: >=3 parity probes computed     # clamp [1,2]; confidence medium when pins+IaC+injection all seen
unknown_when:   no deploy/config artifacts at all
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  none typical
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: mostly-canonical pipeline; minor hand-edited per-env residue
- `1`: hand-edited per-env files with keyset divergence ∨ unpinned runtimes ∧ no containers
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "parity-inventory: containers={bool}; iac={bool}; injection={bool}; per-env divergence {k} keys"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Env-parity posture; flag/config mechanics are ARCH-10, IaC coverage PERF-06, schema drift DATA-10.
