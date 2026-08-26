# DOCS-03 — Missing Runbooks & Operational Docs — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** presence-only (tier arbitrated; encyc said B·unknown — inventory is exhaustive-tree fact) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ human · engine: runbook inventory |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-03 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** runbook-location matchers (`docs/runbooks`, `runbooks/`, `ops/runbooks`, wiki-export dirs); operational-topic coverage scan (deploy, rollback, incident, backup-restore, oncall topics by filename); ops-wiki links from README
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no runnable service surface` (library-only). Else applicable; absence of runbooks on a service repo is score signal.

## 2. Detection recipe

1. Inventory runbook files + topics covered (filename classification).
2. Coverage-vs-top-class heuristic: does any doc address deploy-failure and data-restore classes?
3. Currency: last-touch dates.
4. Incident-history matching (top outage classes vs docs) is org plane → emission text.

Preconditions: service surface.

## 3. Fact schema

```json
{"docs03": {
  "runbook_dir": "docs/runbooks", "count": 3,
  "topics_covered": ["deploy", "oncall"],
  "restore_doc_present": false,
  "newest_days": 240}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # presence inventory decidable
estimated_when: topic classification uncertain # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        applicability fired
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DOCS-03.

- `3`: runbooks cover top operational classes incl. restore ∧ current
- `2`: partial coverage, core classes present
- `1`: sparse runbooks, stale, missing restore/incident
- `0`: zero operational docs on a service with deploy footprint

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Presence-only caveat: "coverage measured by topic-file presence; drill-readiness unverified"

## 8. Evidence string

```
evidence: "runbooks {dir}: {n} files; topics={list}; restore={bool}; newest {d}d"
```

## 9. Scope/overlaps echo

Runbook presence/currency; recovery outcomes are VEL-12's row.
