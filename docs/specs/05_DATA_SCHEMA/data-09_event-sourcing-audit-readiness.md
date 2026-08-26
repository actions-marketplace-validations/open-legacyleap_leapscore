# DATA-09 — Event Sourcing / Audit Readiness — Implementation Spec *(deep-dive — folds into DATA when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** — presence-only (tier arbitrated; encyc said B·unknown) |
| v1 flag | YES (deep-dive tier; sprint 2 per `docs/plans/04` §4) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: DATA` |
| Verify effort | 🔶 human · engine: model-structure inventory |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-09 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** matchers over models + migrations: history/version tables (`*_history`, `*_versions`, `*_audit`), event/outbox structures (`outbox`, `event_store` tables, event-store deps), audit columns (`created_by`, `updated_by`, row `version`), temporal columns (`valid_from/valid_to`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b. Else applicable.

## 2. Detection recipe

1. Inventory history/event/audit structures across schema + model files.
2. Classify posture: full event-sourcing / outbox-pattern / timestamp-audit-only / none.
3. "As-of query" capability inferred from structure presence only — executing one is runtime plane → emission text.

Preconditions: schema/model parse.

## 3. Fact schema

```json
{"data09": {
  "history_tables": ["orders_versions"],
  "event_structures": {"outbox": true, "event_store": false},
  "audit_columns_share": 0.82,
  "posture": "outbox"}}
```

## 4. Statusing rules

```yaml
measured_when:  schema/model parse completed    # structure inventory is fact (presence-only)
estimated_when: partial parse coverage          # clamp [1,2], confidence low
unknown_when:   no persistence artifacts
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium
scope_limited:  sampled models -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DATA-09.

- `3`: event/outbox structures ∧ audit columns pervasive ∧ history tables
- `2`: timestamp-audit columns pervasive, no event structures
- `1`: audit columns partial on core tables only
- `0`: no history/audit/event evidence anywhere on core tables

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Presence-only caveat mandatory in report copy ("structure measured; as-of capability unverified")

## 8. Evidence string

```
evidence: "model-audit: posture={posture}; history={list}; outbox={bool}; audit-cols {p}%"
```

## 9. Scope/overlaps echo

History/event structure presence; shape rigidity is DATA-08.
