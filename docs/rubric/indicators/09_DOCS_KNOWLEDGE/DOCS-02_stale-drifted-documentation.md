# DOCS-02 — Stale / Drifted Documentation

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-02. Edit this file; the legacy path [docs-02_stale-drifted-documentation.md](../../../specs/09_DOCS_KNOWLEDGE/docs-02_stale-drifted-documentation.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-02_stale-drifted-documentation.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-02 |
| Name | Stale / Drifted Documentation |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ ≤ 30 min to sample-verify. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Documentation exists but is outdated — it contradicts code, describes removed features, references old commands, and the team has learned not to trust it ("the wiki is lies").
- **Why it signals obsolescence:** Stale docs are worse than none: they actively mislead, waste time, and train people to skip docs entirely — which then *creates* the tribal-knowledge problem (DOCS-05). Drift is the natural state of unowned docs, and its prevalence is a sign the team stopped investing in knowledge as code changed.
- **Where it manifests:** README describing commands that don't work, docs referencing `v1` endpoints, arch diagrams from a dead era, code comments contradicting behavior, docs/wiki with "update TBD" for months, misleading runbooks/troubleshooting.
- **Objective metric:** `% of doc commands that actually run`; `median doc staleness (last-update vs. code-change)`; `% of docs misdescribing current code (sampled)`; `team trust rating of docs`.
- **Yellow flag (warning):** Some docs outdated, diluted maintenance, trust mostly intact. *(Rationale: warning — the rot is present but not yet terminal.)*
- **Red flag (critical):** Docs widely contradict code — no one trusts them, setup/runbooks are known-wrong, README is "historical artifact." *(Rationale: documented knowledge is dead weight; all knowledge must move to heads (making DOCS-05 inevitable).)*
- **Example symptom:** "README says `cd app && npm start`. The command 404'd. The deploy doc references a console that doesn't exist. Someone updates the README — badly — and now two docs exist, both slightly wrong."
- **Blast radius:** Onboarding time, debugging detours, runbook trust, tribal knowledge growth, modern planning (docs as a source of truth).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = docs verified current; 2 = partial staleness; 1 = widely stale, partly trustworthy; 0 = docs are lies, trust is dead.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: a doc-rot sweep (delete/rewrite the worst 10), add "last verified" dates, a github-issues link on every doc page so inaccuracies are reportable with one click. Structural fix: docs-as-code with CI verification (commands in docs execute in a test fixture — DOCS-09), ownership per doc, "docs touched in the same PR as code" rule.
- **Gold standard / target state:** Docs match code; commands in docs are CI-verified; a doc is as trustworthy as code, and updated with it.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** git + static-src
- **Tools:** per-doc last-modified (git log) vs last-change of the module it documents (path-proximity mapping); removed-symbol grep: docs referencing symbols/paths absent from the tree; command-verification by execution is forbidden → structural verify only

## 6. Detection recipe

- **Detection method:** Doc-vs-code diff — sample docs (README, setup, API docs) and verify commands/URLs/fields against reality; check "last updated" dates vs. code change dates for the subjects (correlation); grep docs for removed symbols (imports/endpoints flagged in analyzers). Ask a new hire: did you trust the docs?

1. Map docs to modules (path convention: `docs/auth.md` → `src/auth/`).
2. Drift score per doc pair: days since code changed after doc's last touch.
3. Symbol-reference audit: extract code identifiers/paths from docs; check existence in tree.
4. Human command-by-command verification → emission text.

Preconditions: tree + history.

## 7. Fact schema

```json
{"docs02": {
  "doc_module_pairs": 22,
  "stale_pairs": 9,
  "dead_symbol_refs": [{"doc": "README.md", "symbol": "make bootstrap"}],
  "drift_median_days": 118}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # staleness judgment over heuristics stays labeled inference
estimated_when: >=5 doc-module pairs mapped    # clamp [1,2]; confidence medium when symbol audit joins too
unknown_when:   no docs to correlate
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  sampled pairs -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: minority of docs drifted; core setup docs current
- `1`: majority stale ∨ dead-symbol refs in primary docs (README/setup)
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "doc-drift: {k}/{n} pairs stale (median {d}d); dead refs in {files}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Freshness/drift of prose docs; ADR process is DOCS-01, docs automation DOCS-09.
