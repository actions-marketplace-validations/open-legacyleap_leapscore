# DOCS-05 — Tribal Knowledge & Oral Tradition

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-05. Edit this file; the legacy path [docs-05_tribal-knowledge-oral-tradition.md](../../../specs/09_DOCS_KNOWLEDGE/docs-05_tribal-knowledge-oral-tradition.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-05_tribal-knowledge-oral-tradition.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-05 |
| Name | Tribal Knowledge & Oral Tradition |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | D |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 ~2–4 h — Q&A audit + departure drill. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A significant fraction of "how this system actually works" exists only in people's heads — operational quirks, historical constraints, failure lore, "why" explanations — with no written representation, and the most senior people are walking liabilities (and/or mobbed with questions).
- **Why it signals obsolescence:** When knowledge exists only in heads, the codebase's REAL behavior is not inspectable — it's interpersonal. This is the human form of undocumented architecture (DOCS-01) and it's near-universal in legacy systems: every "ask Dave" IS a missing document. It also blocks delegation, review, and modernization scoping (you can't cross-reference what's not recorded).
- **Where it manifests:** "Let me ask X" for routing decisions, the "runbook of knowledge" person, meeting notes as the only record, wiki search returns nothing, a new feature requires a listening tour, critical "maybe it does X" (uncertain) behaviors.
- **Objective metric:** `% of functional questions answerable from written sources`; `# of "ask-the-person" dependencies`; `# of undocumented behaviors in a critical module`; `knowledge-exit simulation time-to-recover`.
- **Yellow flag (warning):** A few critical modules are oral-only; several "ask Dave" dependencies. *(Rationale: warning — the tax is real but bounded.)*
- **Red flag (critical):** The system as a whole is maintained by oral tradition — most decisions/behaviors have no written record and the primary carriers are 1–2 people. *(Rationale: the codebase functions as a social memory — losing the carriers loses the system.)*
- **Example symptom:** "'Why does the night batch process at 2:07 specifically?' — 'Dave knows.' 'Dave' knows 40 such unrecorded facts. The modernization kickoff is a 6-week interview tour because nothing is written anywhere."
- **Blast radius:** Bus factor (VEL-06), onboarding, modernization scoping, review, delegation, incident diagnosis ("person knowledge" needed), retention risk.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = written-answerable; 2 = a few oral modules; 1 = core mostly oral; 0 = entire system runs as social memory.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run the departure drill on the top module — write the unrecorded facts as docs/ADRs/runbooks, pair-document with the oral experts. Structural fix: "write it down or it doesn't exist" culture (every knowledge answer → doc link), knowledge-review on critical modules, retiring the phrase "ask X" in favor of "read the doc," interview-capture sessions for missionaries.
- **Gold standard / target state:** 90%+ of functional questions answerable from written sources; no module depends on a person's memory; the departure drill yields a weekend, not a collapse.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- "If the expert left Friday" outcomes, doc-vs-people answer ratios — interview plane.

## 6. Detection recipe

- **Detection method:** The "departure drill" — pick a critical module, ask "if the primary expert left Friday, what changes Tuesday?"; count how many "how-does-this-work" questions get answers *from documents* vs. *from people*; run a Q&A session with juniors and log the share of answers with no written source.

None in v1. Proxies (bus factor VEL-06, ADR presence DOCS-01) live on their own rows; this row does not re-score them.

## 7. Fact schema

```json
{"docs05": {"status": "unknown", "reason": "requires the departure-drill interview protocol"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never
estimated_when: never
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs departure-drill interviews (see the evidence protocol in the catalog guide); related facts: VEL-06 bus factor"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Oral-tradition dependence; measurable proxies are VEL-06 (authorship) and DOCS-01 (decisions written down).
