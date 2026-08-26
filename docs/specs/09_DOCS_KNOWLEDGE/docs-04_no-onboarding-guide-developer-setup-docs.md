# DOCS-04 — No Onboarding Guide / Developer Setup Docs — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** presence-only (tier arbitrated; encyc said B — structure is static fact; timed dry-runs are execution) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ human · engine: setup-docs structural audit |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-04 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** onboarding-doc inventory: `CONTRIBUTING*`, `GETTING_STARTED*`, README setup section; lifecycle-stage coverage parse (setup→run→test→contribute→deploy headings); command extraction (referenced vs defined-in-repo consistency); freshness via git
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Inventory docs + parse stage headings.
2. Command cross-check: commands referenced in docs exist as scripts/targets in repo (VEL-02 fact reuse).
3. Currency: doc mtime vs last major setup-file change.
4. New-engineer timing is human/execution plane → emission text.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"docs04": {
  "docs_present": ["CONTRIBUTING.md", "README.md#setup"],
  "stages_covered": ["setup", "run", "test"],
  "stages_missing": ["contribute", "deploy"],
  "undefined_commands": [{"doc": "CONTRIBUTING.md", "cmd": "make bootstrap"}],
  "last_verified_days": 300}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # presence/stage coverage decidable
estimated_when: heading-parse uncertain        # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DOCS-04.

- `3`: guide present ∧ all five stages ∧ no undefined commands ∧ current
- `2`: guide covers setup+run+test; gaps elsewhere
- `1`: minimal/partial guide, stale or broken references
- `0`: no onboarding documentation at all

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Presence-only caveat for the timed-dry-run half

## 8. Evidence string

```
evidence: "onboarding-docs {list}: stages {covered}; undefined cmds={k}; age {d}d"
```

## 9. Scope/overlaps echo

Guide existence/currency; friction posture VEL-02, drift mechanics DOCS-02.
