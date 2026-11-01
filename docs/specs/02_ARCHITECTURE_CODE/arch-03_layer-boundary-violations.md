# ARCH-03 — Layer & Boundary Violations — Implementation Spec

> **Authority:** This file defines the ARCH-03 implementation contract. The [ARCH rubric category](../../rubric/02_ARCHITECTURE_CODE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: rule-pack run |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-03 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** `dependency-cruiser --rules` (JS/TS, engine default rule-pack), `import-linter` contract presence + run (Python), ArchUnit test-file detection (Java — presence of arch tests is itself a signal), generic layer-map heuristics (dir conventions: `controllers→services→repositories`)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python (full); Go/Java (heuristic → estimated)
- **Applicability:** `na_when: no layered structure inferable (flat scripts, <2 layers)` clause-b.

## 2. Detection recipe

1. Detect existing arch-enforcement configs (`import-linter.ini`, `.dependency-cruiser.*`, arch-test packages). Presence recorded as `guard_present`.
2. If none: apply engine default layer rules inferred from dir convention; else run the project's own declared rules read-only.
3. Count violations `{from_layer, to_layer, file}`; classify direction.
4. UI-touches-persistence probe: SQL/ORM imports inside presentation-layer dirs.
5. Join violation files to core-path set.

Preconditions: ARCH-02 graph available.

## 3. Fact schema

```json
{"arch03": {
  "guard_present": false,
  "rule_pack": "engine-default",
  "violations": 23,
  "violations_in_core": 5,
  "ui_persistence_hits": [{"file": "routes/invoice.php", "signal": "raw SQL"}]}
```

## 4. Statusing rules

```yaml
measured_when:  native rule pack ran (project-owned or engine default on parseable tree)
estimated_when: heuristic-only layering (Go/Java fallback)      # clamp [1,2], confidence low
unknown_when:   no structure parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when guard_present or conventions clean
scope_limited:  sampled dirs -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §ARCH-03.

- `3`: `guard_present` ∧ `violations == 0`
- `2`: `¬guard_present` ∧ violations few & peripheral ("luck-based" state)
- `1`: `violations_in_core > 0` in isolated slices
- `0`: systemic erosion: `ui_persistence_hits.len >= R_UI` ∨ business-rules-in-stored-procs detected ∨ core-wide violations

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast` (rule packs are cheap; graph reuse from ARCH-02)
- Project's own rule config malformed → fall back to engine default, note in evidence

## 8. Evidence string

```
evidence: "archrules({pack}): {v} violations ({k} core); ui->persistence hits {list}"
```

## 9. Scope/overlaps echo

Direction of layer boundaries only; wire-protocol legaciness lands in API-06 and DATA-02.
