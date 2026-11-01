# API-10 — Contract Schema Evolution Process

> **Category:** [API & Integration Surface](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | API-10 |
| Name | Contract Schema Evolution Process |
| Category | API — API & Integration Surface |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES (deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: API` |
| Verify effort | 🔷 ~1–2 days — process audit + breaking-change archaeology. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There is no process for evolving API contracts safely — no schema registry, no compatibility checking (additive-only change policy, protobuf/OpenAPI backward-compat rules), no versioned schema lifecycle, so "just change the field" is the default even when it breaks consumers.
- **Why it signals obsolescence:** Schema evolution is the discipline behind versioning (API-02): a defined set of moves that are safe (add field, add optional, widen) vs. breaking. Without it, contract changes are decided by mood, and consumers break by accident. Modern platforms centralize this (schema registry + compat checks in CI).
- **Where it manifests:** No schema registry, no `openapi-diff`/`buf breaking` in CI, breaking field removals pass review, event schemas changed with no consumer migration, "we thought it was private" surprises, no additive-value policy.
- **Objective metric:** `compat gate in CI?`; `# of breaking schema merges (last 12 mo)`; `schema registry present?`; `event-schema versioning + migration process?`; `consumer breaks relating to schema changes (last 12 mo)`.
- **Yellow flag (warning):** Additive-change culture informally, no registry or gate, breaking merges rare but possible. *(Rationale: warning — working by shared etiquette, one new hire from a breakage.)*
- **Red flag (critical):** Breaking contract changes merge regularly with consumer breakage, or event schemas change with no consumer awareness, and no registry/gate/culture exists. *(Rationale: the contract is owned by no one — evolution is an incident factory.)*
- **Example symptom:** "An engineer 'simplifies' an event payload by renaming a field. The 14 consumers get no warning — events are fire-and-forget, and three of them crash on deserialize. 'What events does anything consume?' sends everyone into the logs."
- **Blast radius:** Consumer breakage, data-plane corruption (misparsed events), integration trust, platform growth.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = registry + gate; 2 = additive culture, no tooling; 1 = occasional breaking merges; 0 = regular silent schema breakage.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add an OpenAPI/buf compatibility check to CI (fail on breaking changes), document the additive-change policy. Structural fix: schema registry + versioned schemas (event + API), compat gate enforced, consumer-migration process for breaking changes (deprecate → migrate → remove), telemetry of consumers (API-08).
- **Gold standard / target state:** Compat gates in CI, schema registry current, breaking changes rare and migration-led, event schemas versioned with consumers tracked.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src + gh-api (PR checks)
- **Tools:** schema-registry presence (`confluent`, `buf.yaml`, `protos/` + `buf.gen`, apicurio); compat gates in CI (`buf breaking`, `openapi-diff`, `oasdiff`, json-schema compat steps); event-schema versioning conventions; PR-history mining for compat-check enforcement
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** API-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Process audit — is there a schema registry/repo of record? A compatibility gate in CI (openapi-diff, `buf`, protobuf `buf breaking`, JSON-schema compat check)? Events versioned with schemas? Check review history for breaking changes that merged; measure consumer breaks caused by schema changes.

1. Registry/repo-of-record inventory for schemas.
2. CI compat-gate detection: step-level matchers; blocking semantics per TEST-08 rules.
3. Breaking-change history sample: releases where schema diffs lack a compat note.
4. Human process quality beyond artifacts → emission text ("needs process audit").

Preconditions: API surface present.

## 7. Fact schema

```json
{"api10": {
  "registry": {"kind": "buf", "evidence": "buf.yaml"},
  "compat_gate": {"present": true, "blocking": true, "step": "ci.yml:42 buf breaking"},
  "events_versioned": true,
  "breaking_without_note_sampled": 0}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # "process" maturity is not fully artifact-provable
estimated_when: >=2 of {registry, gate, events-versioning} probes computed   # clamp [1,2]
unknown_when:   no schema surface found
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when blocking gate evidenced
scope_limited:  thin release history -> estimated low
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: registry or versioned events present ∧ non-blocking or partial gate coverage
- `1`: schemas exist with no registry ∧ no compat gate ∨ gate advisory-only
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limit on PR checks → static files only, confidence low

## 10. Evidence and output

### Evidence string

```
basis: "evolution-probe: registry={kind}; compat-gate={bool}(blocking={b}); events versioned={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Evolution infrastructure/process; contract currency is API-01, versioning mechanics API-02.
