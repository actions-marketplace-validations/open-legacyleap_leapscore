# DOCS-01 — Missing Architectural Decision Records (ADRs) — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ human · engine: decision-doc inventory |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-01 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** decision-doc location matchers (`docs/adr`, `doc/adr`, `decisions/`, `rfcs/`, `architecture-decisions`); file-format recognition (NNN-title.md pattern); git-history sampling of consequential changes (dependency swaps, framework bumps) cross-checked against ADR mentions
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos (absence is the signal).

## 2. Detection recipe

1. Enumerate candidate ADR dirs/files; validate numbering/title conventions.
2. Currency check: newest ADR date vs recent major dependency/architecture commits.
3. Coverage sample: last K major-change commits (dep-major bumps from ECOS-02 facts) — was an ADR written within ±30 days?
4. Human "would this pass the alternatives-test" quality review → emission text.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"docs01": {
  "adr_dir": "docs/adr", "adr_count": 14,
  "newest_adr_days": 412,
  "major_changes_sampled": 6, "with_adr": 1}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # presence/currency/fact-sample are decidable
estimated_when: major-change classification uncertain   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DOCS-01.

- `3`: ADR process exists ∧ current (∈ Y_DAYS) ∧ sampled majors documented
- `2`: ADRs exist but stale; recent majors undocumented
- `1`: scattered decision docs without process/location convention
- `0`: no decision documentation anywhere despite sustained development history

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
evidence: "adr-inventory: {n} ADRs at {dir}; newest {d}d; majors-with-adr {k}/{K}"
```

## 9. Scope/overlaps echo

Decision-record process; doc freshness generally is DOCS-02, knowledge-exit risk DOCS-10.
