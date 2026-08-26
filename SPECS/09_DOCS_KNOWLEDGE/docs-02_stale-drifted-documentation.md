# DOCS-02 — Stale / Drifted Documentation — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B — mtime correlation is clone-computable) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 human · engine: doc-vs-code correlation pass |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-02 |

## 1. Inputs

- **Planes:** git + static-src
- **Tools:** per-doc last-modified (git log) vs last-change of the module it documents (path-proximity mapping); removed-symbol grep: docs referencing symbols/paths absent from the tree; command-verification by execution is forbidden → structural verify only

## 2. Detection recipe

1. Map docs to modules (path convention: `docs/auth.md` → `src/auth/`).
2. Drift score per doc pair: days since code changed after doc's last touch.
3. Symbol-reference audit: extract code identifiers/paths from docs; check existence in tree.
4. Human command-by-command verification → emission text.

Preconditions: tree + history.

## 3. Fact schema

```json
{"docs02": {
  "doc_module_pairs": 22,
  "stale_pairs": 9,
  "dead_symbol_refs": [{"doc": "README.md", "symbol": "make bootstrap"}],
  "drift_median_days": 118}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # staleness judgment over heuristics stays labeled inference
estimated_when: >=5 doc-module pairs mapped    # clamp [1,2]; confidence medium when symbol audit joins too
unknown_when:   no docs to correlate
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  sampled pairs -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §DOCS-02. Estimated ⇒ score ∈ {1,2}:

- `2`: minority of docs drifted; core setup docs current
- `1`: majority stale ∨ dead-symbol refs in primary docs (README/setup)
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "doc-drift: {k}/{n} pairs stale (median {d}d); dead refs in {files}"
```

## 9. Scope/overlaps echo

Freshness/drift of prose docs; ADR process is DOCS-01, docs automation DOCS-09.
