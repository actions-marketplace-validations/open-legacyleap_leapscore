# ECOS-08 — Framework Lock-in & Monoculture Risk — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (status arbitrated; encyc said estimated) |
| v1 flag | YES |
| Gates fed | co-drives **G3** with ECOS-01 when framework is EOL in core |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-08 |

## 1. Inputs

- **Planes:** static-src + ecosystem (`endoflife.date`, framework status pages via slug table)
- **Tools:** manifest parsers; framework allowlist (per-ecosystem: react, vue, angular, svelte / django, flask, fastapi / rails / spring-boot, quarkus / gin, echo); import-graph builder for coupling share
- **Rate-cost:** api-budgeted (one lookup per detected framework)
- **Ecosystems:** all gated
- **Applicability:** `na_when: no framework-class dependency detected` (clause-b over parsed manifests — a pure stdlib/CLI repo). Else applicable.

## 2. Detection recipe

1. Detect frameworks from manifests; resolve version.
2. Fetch support status: `active | maintenance | eol` from endoflife.date slug or static status table.
3. Coupling share: fraction of source files importing the framework's modules directly (no facade layer detected: imports concentrated outside a dedicated adapter dir).
4. Fork detection: dependency resolved from git URL/fork registry instead of canonical registry.

Preconditions: ECOS-02-style manifest parse.

## 3. Fact schema

```json
{"ecos08": {
  "frameworks": [{"name": "angularjs", "version": "1.8.3", "support_status": "eol", "eol_date": "2021-12-31"}],
  "coupling_share": 0.62,
  "facade_layer_detected": false,
  "fork_pinned": false}}
```

## 4. Statusing rules

```yaml
measured_when:  frameworks.len > 0 and support lookup succeeded
estimated_when: coupling_share computed on partial import graph   # clamp [1,2], confidence low
unknown_when:   framework present but no support data (niche/vendor framework)
na_when:        applicability fired (no framework deps)
clamp:          [1,2]
confidence:     medium
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §ECOS-08.

- `3`: all frameworks `active`
- `2`: any `maintenance` ∧ `facade_layer_detected ∨ migration_evidence` (upgrade commits/branches)
- `1`: any `eol` framework confined to non-core module set
- `0`: `any(support_status == eol)` ∧ `coupling_share > R_COUPLING` ∧ ¬facade → co-fires G3 evaluation

## 6. Gate hooks (G3 shared)

Fires G3 `proven` only jointly: ECOS-01 runtime past-EOL **or** this row's `0` predicate, with core join true and no-upgrade evidence. Otherwise `needs-verification`. (Single gate, two feeding rows — orchestrator dedupes.)

## 7. Failure & budget semantics

- Budget class: `fast`
- Support-table miss → `unknown` for that framework; if it's the only one, row unknown

## 8. Evidence string

```
evidence: "endoflife.date+import-graph: angularjs 1.8.3 eol since 2021-12-31; coupling {p}% ({k} files), no facade"
```

## 9. Scope/overlaps echo

Framework lifecycle and lock-in; runtime EOL is ECOS-01, code-style generation gap is ARCH-06.
