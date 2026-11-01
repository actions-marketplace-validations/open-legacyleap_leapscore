# API-08 — Consumer Blindness & Backward Compatibility — Implementation Spec

> **Authority:** This file defines the API-08 implementation contract. The [API rubric category](../../rubric/06_API_INTEGRATION.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** (tier arbitrated; encyc said B — consumer telemetry is org plane) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: API` |
| Verify effort | 🔷 human (consumer registry/telemetry audit) |
| Thresholds & 0–3 criteria | see encyclopedia §API-08 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Endpoint analytics, consumer registry, deprecation-announcement channels — org/telemetry plane. Not derivable from URL.

## 2. Detection recipe

None in v1. In-repo hints (per-consumer API keys in config templates, changelog announcement sections) are emission context only.

## 3. Fact schema (v1)

```json
{"api08": {"status": "unknown",
            "reason": "field-usage/consumer inventory requires telemetry or registry access"}}
```

## 4. Statusing rules

```yaml
measured_when:  never
estimated_when: never                            # key-in-config hints prove registration exists, not awareness quality
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs per-consumer call-volume/field telemetry (deep scan with org access)"
```

## 9. Scope/overlaps echo

Consumer-awareness gap; the versioning mechanics that serve them are API-02.
