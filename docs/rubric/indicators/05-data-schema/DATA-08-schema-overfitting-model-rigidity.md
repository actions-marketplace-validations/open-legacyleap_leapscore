# DATA-08 — Schema Overfitting & Model Rigidity

> **Category:** [Data & Schema Evolution](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | DATA-08 |
| Name | Schema Overfitting & Model Rigidity |
| Category | DATA — Data & Schema Evolution |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 ~2–4 h — schema archaeology + ergonomic test. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The schema bakes in business decisions rather than business facts — columns named after UI features, one-off statuses, booleans like `use_new_pricing_v2`, meanings encoded in column values, and no room for the domain to evolve — making every product change a migration.
- **Why it signals obsolescence:** Data should model the *domain* (durable facts), not the *implementation* (transient decisions). Overfit schemas freeze the product: each rule change needs a schema change, and after years the schema is a fossil of every abandoned experiment. It's the data-layer version of ARCH-01's god-object thinking.
- **Where it manifests:** Columns like `migration_batch_84`, `is_v2_enabled`, `old_tax_rounding_v1`, status values that spool dozens of variants, data copied into new columns rather than normalized, events never recorded (only current state), business rules hidden in trigger/constraint names.
- **Objective metric:** `# of versioned/feature-named columns`; `# of schema elements proving implementation-era (old_, v2, batch)`; `time-to-implement a trivial domain change` (ergonomic test); `% of domain facts modeled as mutable state vs. durable events`.
- **Yellow flag (warning):** Some versioned/flag columns and historical cruft, mostly non-core. *(Rationale: warning — the museum is forming but isn't load-bearing.)*
- **Red flag (critical):** Core domain is modeled around implementation history, or every product change requires a schema migration, or the schema has no way to represent domain evolution (no events/effective-dating). *(Rationale: the model is an anchor — product velocity is now a schema project.)*
- **Example symptom:** "Adding 'invoice discount vs. credit note' — a simple domain concept — touches 12 tables and three one-off columns. The data architect finds a column literally named `refund_workaround_aug` from a hotfix five years ago that nobody will delete."
- **Blast radius:** Feature velocity, migration frequency, data quality drift, rigid APIs, onboarding confusion, modernization cost.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = domain-fact schema; 2 = cruft in non-core columns; 1 = core partially overfit; 0 = implementation-fossil schema, every feature is a migration.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: kill the obvious versioned/flags columns behind an additive migration, document the domain model properly. Structural fix: remodel around domain facts — normalize flags into real entities, adopt effective-dating/event structures for changeable rules (see DATA-09), a domain model owned by the team, schema reviewed as domain design not storage plumbing.
- **Gold standard / target state:** Schema expresses domain facts; product rule changes land without schema surgery; events/snapshots support evolution; archaeology columns gone.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** column-name archaeology over reconstructed schema (DATA-03 reuse): version-suffixed columns (`_v2`, `_new`, `_old`, `_bak`), boolean feature-flag columns (`is_*_enabled`, `use_new_*`), business-campaign-named columns, append-only garbage-column share; event/audit-trail absence check (cross-ref DATA-09 presence facts recomputed inline)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Schema archaeology — review table/column names (grep for version words, `old_`, boolean flags, feature names); count of "append-only garbage columns"; check whether the schema would support an unanticipated product change (a "ergonomic test": add a new price type — how many tables/columns move?); look for a noconcepts-of-the-domain (customers stored as `users.type`), no event/audit structures.

1. Take latest declared schema state.
2. Regex-classify columns: legacy-marker / flag-column / campaign-named classes; count per table.
3. Rigidity probes: single-table inheritance abuse (`type` discriminator columns with >5 values), EAV patterns (`key`,`value` tables referenced by core).
4. Change-history proxy: churn concentration on one table's migrations.

Preconditions: schema state reconstructable.

## 7. Fact schema

```json
{"data08": {
  "legacy_marker_cols": [{"table": "users", "cols": ["email_old", "plan_v2"]}],
  "flag_columns_total": 23,
  "eav_tables_in_core": true,
  "churn_hotspot_table": "orders"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # rigidity judgment is inferential
estimated_when: schema state available         # clamp [1,2]; confidence medium iff full replay
unknown_when:   no schema reconstructable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium full-replay; low snapshot-only
scope_limited:  sampled tables -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: scattered marker/flag columns in non-core tables
- `1`: core tables carrying legacy markers ∨ EAV-in-core ∨ heavy flag-column density
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Column-name heuristics misfire on domain jargon → low-confidence note lists unmatched samples

## 10. Evidence and output

### Evidence string

```
basis: "schema-archaeology: {m} marker cols ({examples}); {f} flag columns; eav-core={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Shape rigidity of the model; migration mechanics are DATA-01, audit-readiness structure DATA-09.
