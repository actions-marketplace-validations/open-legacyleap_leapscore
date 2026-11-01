# DOCS-06 — Comment Debt & Self-Documenting Code Imbalance — Implementation Spec

> **Authority:** This file defines the DOCS-06 implementation contract. The [DOCS rubric category](../../rubric/09_DOCS_KNOWLEDGE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 human · engine: TODO-age mining + naming heuristics |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-06 |

## 1. Inputs

- **Planes:** git + static-src
- **Tools:** TODO/FIXME/XXX/HACK marker grep with `git blame -L` age extraction; comment-density ratio per module (comments/LOC); naming-quality heuristics (identifier entropy, single-letter density in core modules) as weak signals
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Marker inventory: count + per-marker age distribution.
2. Density ratio per module; core-path join.
3. "Why vs what" comment classification is LLM/heuristic territory → recorded only as sampled basis text in deep mode; v1 keeps counts+age.
4. Misleading-comment detection requires reading → emission text.

Preconditions: history for blame ages.

## 3. Fact schema

```json
{"docs06": {
  "markers_total": 214,
  "aged_markers_over_year": 88,
  "comment_ratio_core": 0.04,
  "worst_files": [{"file": "core/pricing.py", "todos": 23}]}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # imbalance judgment is inferential
estimated_when: >=1 probe class ran            # clamp [1,2]; confidence medium when blame ages complete
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  blame unavailable -> counts-only, confidence low
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §DOCS-06. Estimated ⇒ score ∈ {1,2}:

- `2`: markers present, minority aged, density not pathological in core
- `1`: aged-marker pile-up on core paths ∨ near-zero comment ratio ∧ opaque naming signals in core
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "comment-debt: {n} TODO-class ({a} >1y); core comment-ratio {p}%; worst {file}"
```

## 9. Scope/overlaps echo

Comment/naming hygiene; dead code those comments often mark is ARCH-04.
