# DOCS-01 — Missing Architectural Decision Records (ADRs)

> **Category:** [Documentation & Knowledge Continuity](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-01 |
| Name | Missing Architectural Decision Records (ADRs) |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 ~2–4 h — decision inventory + doc audit. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There's no record of *why* the system is the way it is — no ADRs, no design docs, no decision history. Ask "why did we choose X?" and the answer is a memory, a Slack thread, or a shrug.
- **Why it signals obsolescence:** Undocumented decisions are how obsolete architecture persists: nobody can change a decision they can't see, so every "why is this like this?" defaults to "always has been" and stays frozen. ADRs turn frozen architecture into revisitable choices, and their absence makes the codebase a museum no one can curate.
- **Where it manifests:** No `docs/adr/`, no design doc history, decisions argued in Slack/meetings with no record, "why is this here" questions with no citation, PRs that make major architecture choices with no written rationale.
- **Objective metric:** `# of consequential decisions with a written ADR`; `decision trail completeness (%)`; `ADR process exists (template/tooling)?`; `time-to-answer "why X" for a new hire`.
- **Yellow flag (warning):** Some design docs exist, ADR convention unofficial or partial, several big decisions undocumented. *(Rationale: warning — recoverable, the trail is mostly findable.)*
- **Red flag (critical):** No decision records anywhere; consequential choices (datastore, architecture, integration) only live in heads/historical memory. *(Rationale: the codebase is a black box of extinct reasoning — you cannot evolve what you cannot explain.)*
- **Example symptom:** "The team wants to modernize the reporting stack. The question 'why did we choose this ETL design?' gets: 'I think it was the 2018 architecture meeting? Wasn't me.' No document says. The modernization brief is written into fog."
- **Blast radius:** Modernization feasibility, decision reversibility, onboarding, recurring re-litigations ("why is this here?" fights), institutional memory.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = ADR-covered; 2 = partial docs; 1 = sparse/undocumented core; 0 = no decision trail exists.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: write ADRs for the top 10 load-bearing decisions (interview the oldest engineers, mine git/past docs), establish a template + PR requirement for consequential choices. Structural fix: ADR convention in the repo (ADR-NNN, status, decision, context, alternatives considered), decisions now documented at review time, an "explain every load-bearing choice" refactoring task.
- **Gold standard / target state:** Every consequential decision has an ADR with alternatives; new decisions document as standard practice; teams can revisit a decision on evidence, not memory.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** decision-doc location matchers (`docs/adr`, `doc/adr`, `decisions/`, `rfcs/`, `architecture-decisions`); file-format recognition (NNN-title.md pattern); git-history sampling of consequential changes (dependency swaps, framework bumps) cross-checked against ADR mentions
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos (absence is the signal).

## 6. Detection recipe

- **Detection method:** Documentation inventory — is there an ADR/decision doc location and process? Sample 10 consequential architecture decisions (from git history/reviews) and check each has a written rationale + alternatives ("nd": what would a new engineer find?); check code comments "why" density vs. "what".

1. Enumerate candidate ADR dirs/files; validate numbering/title conventions.
2. Currency check: newest ADR date vs recent major dependency/architecture commits.
3. Coverage sample: last K major-change commits (dep-major bumps from ECOS-02 facts) — was an ADR written within ±30 days?
4. Human "would this pass the alternatives-test" quality review → emission text.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"docs01": {
  "adr_dir": "docs/adr", "adr_count": 14,
  "newest_adr_days": 412,
  "major_changes_sampled": 6, "with_adr": 1}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # presence/currency/fact-sample are decidable
estimated_when: major-change classification uncertain   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
scope_limited:  none typical
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: ADR process exists ∧ current (∈ Y_DAYS) ∧ sampled majors documented
- `2`: ADRs exist but stale; recent majors undocumented
- `1`: scattered decision docs without process/location convention
- `0`: no decision documentation anywhere despite sustained development history

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
evidence: "adr-inventory: {n} ADRs at {dir}; newest {d}d; majors-with-adr {k}/{K}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Decision-record process; doc freshness generally is DOCS-02, knowledge-exit risk DOCS-10.
