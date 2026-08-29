# VEL-07 — Environment Reproducibility / Works-on-My-Machine — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 human (parity experiment) · engine: config-parity inventory |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-07 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** canonical-config inventory: IaC presence (PERF-06 reuse), env-config injection patterns (CI env refs vs committed per-env files — ARCH-10 reuse), runtime-version pins (ECOS-01 facts), container parity (`Dockerfile` + compose matching prod image lineage), config-drift comparison between committed env files
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Assemble parity surface from reusable facts: runtime pins, containerization, IaC, env-config handling.
2. Committed per-env file diff: do `*.staging.*` and `*.prod.*` configs structurally diverge (key-set diff)?
3. "Reproduce prod bug in container" timed experiment is execution plane → emission text.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"vel07": {
  "containerized": true, "iac_present": true,
  "env_injection": {"ci_refs": true, "committed_per_env_files": ["config/prod.py", "config/staging.py"]},
  "env_keyset_divergence": 4,
  "runtime_pins_consistent": true}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # parity truth is behavioral
estimated_when: >=3 parity probes computed     # clamp [1,2]; confidence medium when pins+IaC+injection all seen
unknown_when:   no deploy/config artifacts at all
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §VEL-07. Estimated ⇒ score ∈ {1,2}:

- `2`: mostly-canonical pipeline; minor hand-edited per-env residue
- `1`: hand-edited per-env files with keyset divergence ∨ unpinned runtimes ∧ no containers
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "parity-inventory: containers={bool}; iac={bool}; injection={bool}; per-env divergence {k} keys"
```

## 9. Scope/overlaps echo

Env-parity posture; flag/config mechanics are ARCH-10, IaC coverage PERF-06, schema drift DATA-10.
