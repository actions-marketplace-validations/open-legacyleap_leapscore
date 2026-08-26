# API-10 — Contract Schema Evolution Process — Implementation Spec *(deep-dive — folds into API when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (encyc said A·measured, matrix D·unknown — both wrong at the extremes; CI-gate facts are static, process maturity is inferred) |
| v1 flag | YES (deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: API` |
| Verify effort | 🔶 human · engine: evolution-infrastructure sweep |
| Thresholds & 0–3 criteria | see encyclopedia §API-10 |

## 1. Inputs

- **Planes:** static-src + gh-api (PR checks)
- **Tools:** schema-registry presence (`confluent`, `buf.yaml`, `protos/` + `buf.gen`, apicurio); compat gates in CI (`buf breaking`, `openapi-diff`, `oasdiff`, json-schema compat steps); event-schema versioning conventions; PR-history mining for compat-check enforcement
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** API-01 clause-b. Else applicable.

## 2. Detection recipe

1. Registry/repo-of-record inventory for schemas.
2. CI compat-gate detection: step-level matchers; blocking semantics per TEST-08 rules.
3. Breaking-change history sample: releases where schema diffs lack a compat note.
4. Human process quality beyond artifacts → emission text ("needs process audit").

Preconditions: API surface present.

## 3. Fact schema

```json
{"api10": {
  "registry": {"kind": "buf", "evidence": "buf.yaml"},
  "compat_gate": {"present": true, "blocking": true, "step": "ci.yml:42 buf breaking"},
  "events_versioned": true,
  "breaking_without_note_sampled": 0}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # "process" maturity is not fully artifact-provable
estimated_when: >=2 of {registry, gate, events-versioning} probes computed   # clamp [1,2]
unknown_when:   no schema surface found
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when blocking gate evidenced
scope_limited:  thin release history -> estimated low
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §API-10. Estimated ⇒ score ∈ {1,2}:

- `2`: registry or versioned events present ∧ non-blocking or partial gate coverage
- `1`: schemas exist with no registry ∧ no compat gate ∨ gate advisory-only
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limit on PR checks → static files only, confidence low

## 8. Evidence string

```
basis: "evolution-probe: registry={kind}; compat-gate={bool}(blocking={b}); events versioned={bool}"
```

## 9. Scope/overlaps echo

Evolution infrastructure/process; contract currency is API-01, versioning mechanics API-02.
