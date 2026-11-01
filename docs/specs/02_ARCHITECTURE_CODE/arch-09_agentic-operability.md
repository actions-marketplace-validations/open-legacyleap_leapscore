# ARCH-09 — Agentic Operability (AI/LLM Codebase-Readiness) — Implementation Spec

> **Authority:** This file defines the ARCH-09 implementation contract. The [ARCH rubric category](../../rubric/02_ARCHITECTURE_CODE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: composed static signals |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-09 |

## 1. Inputs

- **Planes:** static-src + gh-api (check-runs) — composition row; owns no new heavy tooling
- **Tools:** reuses facts: `arch02` (seams), `test06` (test-to-code proximity), `docs02` (contradiction sample), plus new cheap probes: repo-map/nav-file inventory (`README` module index vs disk, `.cursor/rules`, `CLAUDE.md`, `llms.txt`), task-runner of record (Makefile/package-scripts justfile), fresh-clone proof via **CI** (green check-run on push ≠ local execution)
- **Rate-cost:** api-budgeted (one check-runs list call)
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Nav-aid inventory: candidate files exist AND reference real paths (`matches_disk`: sampled path resolution).
2. Test proximity: % of core source files with co-located or import-referenced test (shared fact from TEST-06).
3. Seam index: reuse `arch06.core_seam_index`.
4. Harness proof: latest pushes have green build+test check-runs (workflow names matched to test jobs) — proxy for "single command works", no local execution.
5. Docs contradiction sample: reuse DOCS-02 sampled verify count.

Preconditions: none new.

## 3. Fact schema

```json
{"arch09": {
  "nav_aids": {"present": true, "files": ["CLAUDE.md"], "matches_disk": 0.9},
  "test_proximity_core": 0.42,
  "core_seam_index": 0.55,
  "ci_green_proof": {"found": true, "workflow": "ci.yml", "last_green_days": 2},
  "docs_contradictions_sampled": 3}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # compound judgment
estimated_when: >=3 of 4 signals computed      # clamp [1,2]; confidence medium iff all 4
unknown_when:   <3 signals computable (emit which)
na_when:        never
clamp:          [1,2]
confidence:     medium iff nav+proximity+seam+ci_proof all present
scope_limited:  ci proof unavailable (no Actions) -> estimated low + scope-limited note
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §ARCH-09. Estimated ⇒ score ∈ {1,2}:

- `2`: aids partial ∨ `proximity >= Y_PROX` ∧ seams exist ∧ slow harness signal
- `1`: aids absent ∨ `proximity < Y_PROX` in core ∨ no CI proof
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast` (all inputs already computed or one API call)
- Missing sibling-facts (TEST-06 not run) → recompute the shared extractor inline rather than read cross-spec facts (convention 6)

## 8. Evidence string

```
basis: "agentic-compose: nav={p}% disk-match; proximity={q}; seam={s}; ci_green={bool}({d}d)"
```

## 9. Scope/overlaps echo

Compound operability score; inherits seams of ARCH-02/06, proximity of TEST-06, freshness of DOCS-02 — measured once here.
