# ECOS-09 — Version Skew Across Services — Implementation Spec *(deep-dive — folds into ECOS when run)*

> **Authority:** This file defines the ECOS-09 implementation contract. The [ECOS rubric category](../../rubric/01_DEPENDENCY_ECOSYSTEM.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (arbitrated; encyc A·estimated / matrix B·unknown — see README §4) |
| v1 flag | **PART** — only for in-repo multi-service layouts (monorepo); org-wide skew is v2 |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: ECOS` |
| Verify effort | 🔷 ~1–2 days (human) · engine: bounded monorepo pass |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-09 |

## 1. Inputs

- **Planes:** static-src (in-repo service manifests)
- **Tools:** manifest parsers run per service root; service-root detector (`*/Dockerfile`, `*/package.json`, `*/pyproject.toml`, `services/`, `apps/` conventions)
- **Rate-cost:** none
- **Ecosystems:** all gated
- **Applicability:** `na_when: single-service layout detected (one root manifest set, no sibling service dirs)` → N/A clause-b. `unknown_when: multi-service but manifests live in other repos` (org plane unreachable from URL).

## 2. Detection recipe

1. Detect service roots (dir containing its own runtime manifest + deploy artifact).
2. Per root: extract runtime version + framework version + shared-lib versions (ECOS-01/02 extractors, re-invoked per root).
3. Group by dependency; count distinct majors per core dep; compute share of services on the modal ("reference") version.

Preconditions: ≥2 service roots detected.

## 3. Fact schema

```json
{"ecos09": {
  "service_roots": ["services/api", "services/worker"],
  "skew": [{"dep": "python", "majors": ["3.9", "3.12"], "services_on_reference": 0.5}],
  "max_distinct_majors": {"dep": "django", "count": 3}}}
```

## 4. Statusing rules

```yaml
measured_when:  >=2 service roots and >=80% roots yielded parseable pins
estimated_when: partial root coverage                                    # clamp [1,2], confidence low
unknown_when:   multi-service suspected but manifests outside repo scope
na_when:        single-service layout (clause-b)
clamp:          [1,2]
confidence:     medium within monorepo
```

## 5. Score mapping (predicates)

Thresholds/criteria: see encyclopedia §ECOS-09.

- `3`: `all(max_distinct_majors.count == 1)`
- `2`: `max(count) == 2` ∧ coordinated-upgrade evidence (shared bump commit across roots)
- `1`: `max(count) == 3`
- `0`: `max(count) > 3` ∨ no reference-version convergence

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (>12 roots → sample 12 largest by manifest size + scope-limited)
- Root-detection ambiguity → unknown with emission text listing candidate dirs

## 8. Evidence string

```
basis: "monorepo-scan: django at 3 majors across {n} services; {p}% on reference"
```

## 9. Scope/overlaps echo

Per-service version skew only; single-repo major drift is ECOS-02.
