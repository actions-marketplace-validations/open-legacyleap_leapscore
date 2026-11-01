# DOCS-04 — No Onboarding Guide / Developer Setup Docs

> **Category:** [Documentation & Knowledge Continuity](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-04 |
| Name | No Onboarding Guide / Developer Setup Docs |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ ≤ 30 min — doc existence + dry-run. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There's no effective developer-onboarding documentation — no golden path for setting up, running, and contributing; new engineers learn by being told, in person, repeatedly.
- **Why it signals obsolescence:** A codebase with no written setup path is one where knowledge is not transferable at scale (teams can't grow, turnover is expensive). It's also the *first* documentation every candidate/mentor checks — its absence colors the entire repository's reputation. (Connects directly to VEL-02/VEL-05.)
- **Where it manifests:** No CONTRIBUTING/onboarding guide, setup only in a personal doc, "ask on day 1" lists, README that skips setup ("just ask"), no local-env golden path, no "first PR" guide.
- **Objective metric:** `existence + currency of an onboarding/golden-path doc`; `time-to-first-green-local per the doc`; `% of onboarding steps covered in writing vs. told`; `new-hire survey on doc usefulness`.
- **Yellow flag (warning):** Setup doc exists but incomplete/stale; much onboarding is still oral. *(Rationale: warning — there's a skeleton, the muscle is word-of-mouth.)*
- **Red flag (critical):** No onboarding guide at all (or it's known-wrong — DOCS-02), every hire learns the setup from a human. *(Rationale: team growth and knowledge transfer are structurally capped at one-person-at-a-time.)*
- **Example symptom:** "Day 1, the new engineer gets a Zoom link: 'I'll walk you through setup.' Three days later, they have a working DB and no written note of how. The next hire repeats the exact same three days — and the 'setup expertise' is now in two heads."
- **Blast radius:** Onboarding cost, team scaling, VEL-05 (first-PR time), knowledge concentration (DOCS-05), candidate/mentor perception.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = golden path verified; 2 = drafted, partially stale; 1 = skeletal/oral-reliant; 0 = no guide, setup is word-of-mouth.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: write the golden path (clone → setup → run → test → first PR) and verify every command executes, add CONTRIBUTING.md. Structural fix: golden path CI-verified (fresh container proves it — DOCS-09), onboarding checklist wired into the ticket system, "setup docs break" = blame-the-repo not the human.
- **Gold standard / target state:** A new hire takes < 2 hours to a working local env entirely from docs; the setup guide is CI-tested and always current.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** onboarding-doc inventory: `CONTRIBUTING*`, `GETTING_STARTED*`, README setup section; lifecycle-stage coverage parse (setup→run→test→contribute→deploy headings); command extraction (referenced vs defined-in-repo consistency); freshness via git
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Onboarding-doc audit — does CONTRIBUTING/GETTING_STARTED exist, is it current (commands run — tie to DOCS-02 verify), does it cover setup→run→test→contribute→deploy to local? Time a new engineer against it (already measured in VEL-05); survey "what did setup cost you?".

1. Inventory docs + parse stage headings.
2. Command cross-check: commands referenced in docs exist as scripts/targets in repo (VEL-02 fact reuse).
3. Currency: doc mtime vs last major setup-file change.
4. New-engineer timing is human/execution plane → emission text.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"docs04": {
  "docs_present": ["CONTRIBUTING.md", "README.md#setup"],
  "stages_covered": ["setup", "run", "test"],
  "stages_missing": ["contribute", "deploy"],
  "undefined_commands": [{"doc": "CONTRIBUTING.md", "cmd": "make bootstrap"}],
  "last_verified_days": 300}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # presence/stage coverage decidable
estimated_when: heading-parse uncertain        # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured row
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: guide present ∧ all five stages ∧ no undefined commands ∧ current
- `2`: guide covers setup+run+test; gaps elsewhere
- `1`: minimal/partial guide, stale or broken references
- `0`: no onboarding documentation at all

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Presence-only caveat for the timed-dry-run half

## 10. Evidence and output

### Evidence string

```
evidence: "onboarding-docs {list}: stages {covered}; undefined cmds={k}; age {d}d"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Guide existence/currency; friction posture VEL-02, drift mechanics DOCS-02.
