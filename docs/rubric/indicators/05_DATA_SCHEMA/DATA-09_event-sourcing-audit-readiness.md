# DATA-09 — Event Sourcing / Audit Readiness

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DATA-09. Edit this file; the legacy path [data-09_event-sourcing-audit-readiness.md](../../../specs/05_DATA_SCHEMA/data-09_event-sourcing-audit-readiness.md) is a compatibility alias.
> **Category:** [Data & Schema Evolution](../../05_DATA_SCHEMA.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/05_DATA_SCHEMA/DATA-09_event-sourcing-audit-readiness.md`

## 1. Identity

| field | value |
|---|---|
| ID | DATA-09 |
| Name | Event Sourcing / Audit Readiness |
| Category | DATA — Data & Schema Evolution |
| Engine tier | B |
| Default status | unknown |
| v1 flag | YES (deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: DATA` |
| Verify effort | 🔷 ~1–2 days — model audit + as-of test. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system records only current state, has no event/audit trail of changes, and cannot answer "what happened and why" — no append-only log, no effective dating, no immutable history. Business rules are re-run to reconstruct states rather than queried from records.
- **Why it signals obsolescence:** Immutable, append-only history is how modern systems handle audit, time-travel debugging, replay, and compliance. Its absence makes "what did the customer see on X date" a reverse-engineering project, makes reconciliation impossible, and blocks compliance and analytics (this connects to SEC-05's audit logging at the domain level).
- **Where it manifests:** No history tables, no event store, state mutated in place (`UPDATE` overwrites), "we can't tell you what changed," reconciliation by re-running old code, audit requests answered with spreadsheets, effective-dating absent for changeable data.
- **Objective metric:** `% of core aggregates with a history/audit mechanism`; `as-of-query feasibility (yes/no)`; `# of in-place UPDATEs of state that should be evented`; `event/outbox presence`.
- **Yellow flag (warning):** Some history/audit exists for core aggregates; as-of queries possible for some domains; events for a few flows. *(Rationale: warning — partial readiness, gap is known.)*
- **Red flag (critical):** No history or events at all for core business facts, as-of reconstruction impossible, and compliance/analytics depend on it. *(Rationale: the past is provably unrecoverable — a systemic blind spot.)*
- **Example symptom:** "The regulator asks: 'what did the customer's plan look like on March 3?' The team spends a week rebuilding it from backups and half-remembered cron runs. The answer is 'best effort, probably.'"
- **Blast radius:** Audit/compliance, time-travel debugging, replay/reconciliation, analytics correctness, regulatory outcomes.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = full eventing; 2 = partial (some aggregates); 1 = history ad hoc/backup-based; 0 = no history, reconstruction impossible.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add an append-only event/audit log for the top 3 core aggregates going forward (capture authoritative mutation events, not screenshots). Structural fix: eventing strategy for core facts (outbox, event store, or time-boxed history), as-of query support, replay/drills, compliance-backed retention of the history.
- **Gold standard / target state:** Core aggregates are fully evented with versioned state; as-of queries are routine and tested; history feeds audit and analytics directly.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src
- **Tools:** matchers over models + migrations: history/version tables (`*_history`, `*_versions`, `*_audit`), event/outbox structures (`outbox`, `event_store` tables, event-store deps), audit columns (`created_by`, `updated_by`, row `version`), temporal columns (`valid_from/valid_to`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Model audit — check for history/version tables, event/audit columns (`updated_by`, versions), an event log or outbox; test an "as-of" query (what was the state on date X? — if impossible without backups/time-travel, it's absent); review whether domain changes create durable records or just update a row; look for immutable/mutable split.

1. Inventory history/event/audit structures across schema + model files.
2. Classify posture: full event-sourcing / outbox-pattern / timestamp-audit-only / none.
3. "As-of query" capability inferred from structure presence only — executing one is runtime plane → emission text.

Preconditions: schema/model parse.

## 7. Fact schema

```json
{"data09": {
  "history_tables": ["orders_versions"],
  "event_structures": {"outbox": true, "event_store": false},
  "audit_columns_share": 0.82,
  "posture": "outbox"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  schema/model parse completed    # structure inventory is fact (presence-only)
estimated_when: partial parse coverage          # clamp [1,2], confidence low
unknown_when:   no persistence artifacts
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium
scope_limited:  sampled models -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: event/outbox structures ∧ audit columns pervasive ∧ history tables
- `2`: timestamp-audit columns pervasive, no event structures
- `1`: audit columns partial on core tables only
- `0`: no history/audit/event evidence anywhere on core tables

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Presence-only caveat mandatory in report copy ("structure measured; as-of capability unverified")

## 10. Evidence and output

### Evidence string

```
evidence: "model-audit: posture={posture}; history={list}; outbox={bool}; audit-cols {p}%"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

History/event structure presence; shape rigidity is DATA-08.
