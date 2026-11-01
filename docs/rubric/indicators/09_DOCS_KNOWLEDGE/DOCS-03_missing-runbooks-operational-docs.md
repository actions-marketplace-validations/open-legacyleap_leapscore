# DOCS-03 — Missing Runbooks & Operational Docs

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-03. Edit this file; the legacy path [docs-03_missing-runbooks-operational-docs.md](../../../specs/09_DOCS_KNOWLEDGE/docs-03_missing-runbooks-operational-docs.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-03_missing-runbooks-operational-docs.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-03 |
| Name | Missing Runbooks & Operational Docs |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | B |
| Default status | unknown |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 ~2–4 h — incident-class inventory + runbook check. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There are no runbooks — no documented incident response, no restore/rollback procedures, no "what to do when X breaks" — so every operational event is improvised live, at 3am, by the bravest person.
- **Why it signals obsolescence:** Runbooks are what turn an incident from a fire into a procedure. Their absence is the operational twin of no tests: you only find out you don't have one while you're on fire. It compounds VEL-12 (MTTR), converts every outage into heroics, and burns out everyone on-call.
- **Where it manifests:** No `docs/runbooks/` or ops wiki, on-call without procedures ("just figure it out"), restored-from-memory steps, "the person who knows" must be woken up, no post-incident doc updates.
- **Objective metric:** `runbook coverage % of incident classes`; `runbook currency (last update vs. infra change)`; `time-to-mitigate with vs. without runbook (postmortem comparison)`; `on-call confidence survey`.
- **Yellow flag (warning):** Runbooks for some incident types, others improvised; runbook vs. infra drift. *(Rationale: warning — the fires you planned for are fine, the others are gamble-rated.)*
- **Red flag (critical):** No runbooks at all (or runbooks so wrong they're harmful); incidents are recovered by heroics every time. *(Rationale: the recurrence of incidents is structural — you will repeat every lesson, forever.)*
- **Example symptom:** "3am queue-backlog incident: the on-call finds no runbook, greps 40 files, pings the 'guy who knows' (asleep), and recovers by experiment. The postmortem writes 'learned lesson' — into a report nobody reads, unturned into a runbook."
- **Blast radius:** MTTR, on-call burnout, incident recurrence, escalation chaos ("who owns this?"), compliance (evidence of response).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = complete + drilled; 2 = partial coverage; 1 = sparse / drifting; 0 = no runbooks, heroics-only.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: write runbooks for the top 5 incident classes today (postmortem-driven), make them linkable from alert dashboards, add "runme at the first sign" steps. Structural fix: runbook-as-product (owned, tested, games rehearsed), alert→runbook binding, postmortem = runbook update, drill the top runbook quarterly.
- **Gold standard / target state:** Every incident class has a current, tested runbook; on-call executes procedures not improv; incident time is dominated by execution, not discovery.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** runbook-location matchers (`docs/runbooks`, `runbooks/`, `ops/runbooks`, wiki-export dirs); operational-topic coverage scan (deploy, rollback, incident, backup-restore, oncall topics by filename); ops-wiki links from README
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no runnable service surface` (library-only). Else applicable; absence of runbooks on a service repo is score signal.

## 6. Detection recipe

- **Detection method:** Runbook inventory — list the top 10 outage/incident classes (from incident history) and check each has: detection (dashboard/alert), diagnosis (where to look), mitigation (restore steps), escalation (who/when). Test: hand a junior on-call the runbook for the top incident and observe whether they can execute it.

1. Inventory runbook files + topics covered (filename classification).
2. Coverage-vs-top-class heuristic: does any doc address deploy-failure and data-restore classes?
3. Currency: last-touch dates.
4. Incident-history matching (top outage classes vs docs) is org plane → emission text.

Preconditions: service surface.

## 7. Fact schema

```json
{"docs03": {
  "runbook_dir": "docs/runbooks", "count": 3,
  "topics_covered": ["deploy", "oncall"],
  "restore_doc_present": false,
  "newest_days": 240}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # presence inventory decidable
estimated_when: topic classification uncertain # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        applicability fired
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: runbooks cover top operational classes incl. restore ∧ current
- `2`: partial coverage, core classes present
- `1`: sparse runbooks, stale, missing restore/incident
- `0`: zero operational docs on a service with deploy footprint

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Presence-only caveat: "coverage measured by topic-file presence; drill-readiness unverified"

## 10. Evidence and output

### Evidence string

```
evidence: "runbooks {dir}: {n} files; topics={list}; restore={bool}; newest {d}d"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Runbook presence/currency; recovery outcomes are VEL-12's row.
