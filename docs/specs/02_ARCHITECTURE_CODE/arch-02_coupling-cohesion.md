# ARCH-02 — Coupling & Cohesion — Implementation Spec

> **Authority:** This file defines the ARCH-02 implementation contract. The [ARCH rubric category](../../rubric/02_ARCHITECTURE_CODE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: import-graph pass |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-02 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** `dependency-cruiser >= 16` (JS/TS), `grimp`/`import-linter` graph (Python), `go list -deps` parse (Go), import/regex parser fallback (Java: `jdeps` output if configured; otherwise generic). Cross-service DB coupling signals from config grep (connection-string reuse across service roots).
- **Rate-cost:** none
- **Ecosystems:** JS/TS (full) · Python (full) · Go (full) · Java (fallback → estimated)
- **Applicability:** `na_when: <2 modules or no importable structure` (single-file scripts, clause-b).

## 2. Detection recipe

1. Build module import graph per ecosystem tool.
2. Compute fan-in/fan-out per module; detect cycles (SCC); identify hub modules (top fan-in decile).
3. Detect cross-service imports in monorepos (imports crossing service roots).
4. DB-coupling hint: same connection identifier referenced by >1 service root.
5. LCOM via language tool when available (recorded, not scored — cohesion secondary).

Preconditions: ≥2 modules.

## 3. Fact schema

```json
{"arch02": {
  "modules": 64, "cycles": [{"members": ["a", "b", "c"], "crosses_bounded_context": true}],
  "hub_modules": [{"name": "shared-utils", "fan_in": 51}],
  "cross_service_imports": 7,
  "db_shared_across_services": true}}
```

## 4. Statusing rules

```yaml
measured_when:  graph built with native tooling
estimated_when: fallback regex importer used                      # clamp [1,2], confidence low
unknown_when:   language unsupported and no imports parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium native / low fallback
scope_limited:  monorepo >N roots sampled -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §ARCH-02.

- `3`: `cycles.len == 0` ∧ no omnipresent hub (`max_fan_in < Y_FANIN`)
- `2`: cycles present, all within single bounded context / peripheral
- `1`: cycles crossing core module groups
- `0`: `db_shared_across_services` ∨ hub imported by >R_HUBSHARE of modules

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (dissolve → direct-imports-only graph, transitive analysis dropped)
- Unparseable files excluded; >20% unparseable → estimated

## 8. Evidence string

```
evidence: "depgraph: {m} modules, {c} cycles ({worst}); hub '{hub}' fan_in={f}; cross-service={x}"
```

## 9. Scope/overlaps echo

Intra-module coupling/cohesion; inter-service & DB coupling belongs to DATA-02 and API-03 — not here.
