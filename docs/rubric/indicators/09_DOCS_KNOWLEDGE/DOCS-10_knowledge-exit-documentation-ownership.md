# DOCS-10 — Knowledge Exit & Documentation Ownership

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-10. Edit this file; the legacy path [docs-10_knowledge-exit-documentation-ownership.md](../../../specs/09_DOCS_KNOWLEDGE/docs-10_knowledge-exit-documentation-ownership.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-10_knowledge-exit-documentation-ownership.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-10 |
| Name | Knowledge Exit & Documentation Ownership |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | D |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: DOCS` |
| Verify effort | 🔷 ~1–2 days — ownership map + offboarding-process audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Documentation has no owner and no process for the "knowledge exit" (when people leave, what they knew leaves with them) — no docs champion, no offboarding knowledge capture, no doc ownership map, and institutional memory leaves in the same car as the departing engineer.
- **Why it signals obsolescence:** Knowledge continuity is how a system survives turnover; its absence is why "that person left and now we're stuck" is the most common legacy story. Documentation without ownership rots (root of DOCS-02); knowledge without an offboarding ritual is lost at clock-out pace. This is the *management* of the whole category.
- **Where it manifests:** No docs owner/maintainer role, no offboarding checklist capturing knowledge, "X left and took the runbook in his head," unowned wiki sprawl, no documentation-review cadence, docs written by whoever had PTO guilt.
- **Objective metric:** `docs with a named owner (%)`; `offboarding knowledge-capture coverage %`; `post-departure knowledge-loss incidents`; `net doc growth rate (new vs. stale)`; `docs champion role exists?`
- **Yellow flag (warning):** Some docs owned, offboarding capture partial, a couple of knowledge-loss incidents. *(Rationale: warning — the drain is real and mostly unmanaged.)*
- **Red flag (critical):** No ownership, no offboarding capture, and knowledge leaves visibly (recent incidents post-departure). *(Rationale: the system's memory is intentionally unbounded-liability — every exit is a reset.)*
- **Example symptom:** "The 'docs' are a wiki nobody owns. When the batch-process expert left, so did the runbook's meaning. Four months later the batch 'breaks' and the team discovers the expert's offboarding session was a 30-min chat with a blank board. The whole org felt it."
- **Blast radius:** Turnover resilience, VEL-06 bus factor, onboarding ramp, tribal-knowledge growth, modernization continuity (the survey keeps restarting).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = owned + capture ritual; 2 = partial ownership/capture; 1 = sparse ownership, capture ad hoc; 0 = unowned, knowledge exits with each departure.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: name an owner/champion for the docs, run an offboarding knowledge-capture ritual for the top knowledge holders (scripted walkthroughs into docs/ADRs), capture the last 3 departures' gaps retroactively. Structural fix: ownership map (every doc/module has a maintainer), offboarding checklist enforced by HR tools, doc health reviews (growth vs. decay) quarterly, documentation as a funded line item not a PTO activity.
- **Gold standard / target state:** Every knowledge area has an owner; offboarding reliably captures knowledge; departures are 1-day disruptions; the doc library grows while decaying nothing.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- Offboarding checklists, doc ownership assignments, post-departure incident attribution — org plane.

## 6. Detection recipe

- **Detection method:** Ownership audit — who maintains each doc/module's knowledge? Offboarding process: does the checklist include knowledge capture (walkthroughs, runbooks, ADRs, ticket handover)? Post-departure incidents attributable to knowledge loss? Doc-new-content rate vs. doc-decay rate (is the library growing or rotting?).

None in v1. In-repo hints (`CODEOWNERS` coverage of docs paths, ownership headers in docs) are emission context; ownership *concentration* facts live in VEL-06.

## 7. Fact schema

```json
{"docs10": {"status": "unknown", "reason": "requires offboarding-process and ownership audit"}}
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
emission: "unknown — needs ownership/offboarding process audit; related facts: VEL-06, CODEOWNERS coverage"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Knowledge-exit process; measurable proxies are VEL-06 (concentration) and DOCS-01 (written decisions).
