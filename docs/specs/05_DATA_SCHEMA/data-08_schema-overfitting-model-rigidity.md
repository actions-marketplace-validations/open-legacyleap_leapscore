# DATA-08 — Schema Overfitting & Model Rigidity — Implementation Spec

> **Authority:** This file defines the DATA-08 implementation contract. The [DATA rubric category](../../rubric/05_DATA_SCHEMA.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human · engine: schema archaeology pass |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-08 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** column-name archaeology over reconstructed schema (DATA-03 reuse): version-suffixed columns (`_v2`, `_new`, `_old`, `_bak`), boolean feature-flag columns (`is_*_enabled`, `use_new_*`), business-campaign-named columns, append-only garbage-column share; event/audit-trail absence check (cross-ref DATA-09 presence facts recomputed inline)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b. Else applicable.

## 2. Detection recipe

1. Take latest declared schema state.
2. Regex-classify columns: legacy-marker / flag-column / campaign-named classes; count per table.
3. Rigidity probes: single-table inheritance abuse (`type` discriminator columns with >5 values), EAV patterns (`key`,`value` tables referenced by core).
4. Change-history proxy: churn concentration on one table's migrations.

Preconditions: schema state reconstructable.

## 3. Fact schema

```json
{"data08": {
  "legacy_marker_cols": [{"table": "users", "cols": ["email_old", "plan_v2"]}],
  "flag_columns_total": 23,
  "eav_tables_in_core": true,
  "churn_hotspot_table": "orders"}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # rigidity judgment is inferential
estimated_when: schema state available         # clamp [1,2]; confidence medium iff full replay
unknown_when:   no schema reconstructable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium full-replay; low snapshot-only
scope_limited:  sampled tables -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §DATA-08. Estimated ⇒ score ∈ {1,2}:

- `2`: scattered marker/flag columns in non-core tables
- `1`: core tables carrying legacy markers ∨ EAV-in-core ∨ heavy flag-column density
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Column-name heuristics misfire on domain jargon → low-confidence note lists unmatched samples

## 8. Evidence string

```
basis: "schema-archaeology: {m} marker cols ({examples}); {f} flag columns; eav-core={bool}"
```

## 9. Scope/overlaps echo

Shape rigidity of the model; migration mechanics are DATA-01, audit-readiness structure DATA-09.
