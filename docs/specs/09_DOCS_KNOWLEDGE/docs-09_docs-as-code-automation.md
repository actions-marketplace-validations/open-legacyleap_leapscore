# DOCS-09 — Docs-as-Code & Automation — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (status arbitrated; encyc said estimated — CI-step presence is fact) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ human · engine: docs-CI audit (shared parse with TEST-08) |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-09 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** docs-pipeline matchers in CI configs: doc build steps (`mkdocs`, `docusaurus`, `mdbook`), markdown lint (`markdownlint`, `vale`), link checkers (`lychee`, `muffet`), API-doc generation steps (DOCS-07 reuse), staleness gates (last-verified scripts, doc-diff requirements in PR templates)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Enumerate docs-related CI steps + blocking semantics.
2. Generation-from-contract detection (spec → reference wired).
3. Runbook-command verification jobs presence.
4. Staleness-gate inventory.

Preconditions: CI parse available.

## 3. Fact schema

```json
{"docs09": {
  "doc_ci_steps": [{"kind": "build", "tool": "mkdocs", "blocking": false}],
  "link_checker": true, "api_gen_wired": true,
  "staleness_gate": false}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated               # step inventory decidable
estimated_when: CI parse partial              # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DOCS-09.

- `3`: build ∧ lint/link ∧ generation wired ∧ staleness gate present
- `2`: automation present, gaps in gates/checkers
- `1`: single advisory-only step
- `0`: zero docs automation

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
evidence: "docs-ci: steps={kinds}; lint={bool}; links={bool}; gen-wired={bool}; stale-gate={bool}"
```

## 9. Scope/overlaps echo

Docs pipeline automation; the content quality it protects is DOCS-02/03/04/07.
