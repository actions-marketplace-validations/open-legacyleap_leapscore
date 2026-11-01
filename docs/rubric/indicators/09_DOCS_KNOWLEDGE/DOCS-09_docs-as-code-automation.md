# DOCS-09 — Docs-as-Code & Automation

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-09. Edit this file; the legacy path [docs-09_docs-as-code-automation.md](../../../specs/09_DOCS_KNOWLEDGE/docs-09_docs-as-code-automation.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-09_docs-as-code-automation.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-09 |
| Name | Docs-as-Code & Automation |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔷 ~1–2 days — docs-pipeline audit + fresh-container run. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Documentation is not treated as code — no docs CI, no generated-from-contract docs, no docs freshness checks, no "docs in CI" — so every doc rots (DOCS-02) and the only guarantee is entropy wins.
- **Why it signals obsolescence:** Docs-as-code is the engineering answer to doc rot: generate what can be generated (API specs → reference), verify what can be verified (commands in docs run in CI), fail on fresh rot (staleness checks). Its absence means the knowledge layer depends on human discipline forever — and that's how it died in the first place.
- **Where it manifests:** Docs stored without CI/test, `~/docs` or personal folders, OpenAPI spec unused for generation, no linting of docs, no doc-freshness verification, "regenerate docs" not part of release, docs repo excluded from quality gates.
- **Objective metric:** `docs CI presence (build/lint/link/generate)`; `% of doc content generated from source of truth (spec/schema/code)`; `% of doc commands CI-verified`; `staleness gate present?`
- **Yellow flag (warning):** Some generated docs (spec → reference), no docs CI pipeline, freshness unguarded. *(Rationale: warning — the artifacts exist, the machine does not.)*
- **Red flag (critical):** All docs hand-maintained, nothing generated/verified/tested, no docs CI — docs will rot and the team knows it. *(Rationale: the knowledge layer has no immune system — DOCS-02 is guaranteed, not accidental.)*
- **Example symptom:** "The OpenAPI file exists but its only consumer is a person regenerating docs 'whenever someone remembers.' The docs CI 'struggle' was abandoned in 2021. The freshness check is a Word doc with 'please update' comments."
- **Blast radius:** Doc rot recurrence, DOCS-02/07 (API reference drifts), onboarding trust, maintenance cost of the knowledge layer.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = docs CI + generation; 2 = partial generation, no pipeline; 1 = hand-maintained, verified sporadically; 0 = unreinforced hand-maintenance.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: wire docs generation into CI (spec → reference), add links/lint checks for markdown, CI-verify the top setup commands (fresh container). Structural fix: full docs-as-code — generate what's generatable, verify what's actionable, staleness gates (docs touch-required on code change), docs failures block merge like code failures.
- **Gold standard / target state:** Docs build like code, generate from truth, verify their own commands, and fail CI on rot — the knowledge layer is as maintained as the code.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** docs-pipeline matchers in CI configs: doc build steps (`mkdocs`, `docusaurus`, `mdbook`), markdown lint (`markdownlint`, `vale`), link checkers (`lychee`, `muffet`), API-doc generation steps (DOCS-07 reuse), staleness gates (last-verified scripts, doc-diff requirements in PR templates)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Docs-pipeline audit — is there a docs CI (build, lint, links)? Are API docs generated from contract in CI (spec → reference)? Are runbook commands verified/tests? Is doc freshness checked (staleness gates, last-verified markers)? Can a doc change break the build (intentional)?

1. Enumerate docs-related CI steps + blocking semantics.
2. Generation-from-contract detection (spec → reference wired).
3. Runbook-command verification jobs presence.
4. Staleness-gate inventory.

Preconditions: CI parse available.

## 7. Fact schema

```json
{"docs09": {
  "doc_ci_steps": [{"kind": "build", "tool": "mkdocs", "blocking": false}],
  "link_checker": true, "api_gen_wired": true,
  "staleness_gate": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated               # step inventory decidable
estimated_when: CI parse partial              # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: build ∧ lint/link ∧ generation wired ∧ staleness gate present
- `2`: automation present, gaps in gates/checkers
- `1`: single advisory-only step
- `0`: zero docs automation

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
evidence: "docs-ci: steps={kinds}; lint={bool}; links={bool}; gen-wired={bool}; stale-gate={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Docs pipeline automation; the content quality it protects is DOCS-02/03/04/07.
