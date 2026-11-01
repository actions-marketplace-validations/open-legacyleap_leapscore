# Scoring scale and core-path rule *(authored)*

How a single indicator row becomes a 0–3 grade. This file is the only authored scoring
model in the rubric: it carries the two things nothing else can derive — the meaning of each
grade, and the rule that decides whether a finding sits on a core path.

Weights, formulas, band thresholds, and the gate roster are canonical in
[`config.md`](./config.md). Per-indicator criteria live in each indicator file under
[`../indicators/`](../indicators/). Neither is restated here.

**Companion layers:** [`../README.md`](../README.md) (ontology and reading order) ·
[`../indicators/`](../indicators/) (the measured set) · [`config.md`](./config.md) (the
composing rules) · [`../sheets/`](../sheets/) (the generated instrument).

---

## 1. The 0–3 scale

Score each applicable, measurable row **0–3**. An applicable but unmeasurable row is
`unknown`: disclosed as unscored and kept in the category denominator. A detector absent
from this scanner release is `not_implemented` and leaves the denominator. A row that does
not apply to the system is N/A, with the reason recorded.

| Score | Meaning |
|-------|---------|
| **3 — Healthy** | Complies with modern standards; no flags |
| **2 — Minor Debt** | Manageable debt; meets the Yellow flag criteria in non-core paths |
| **1 — Severe Debt** | Yellow flag in core logic, or Red flag in isolated paths |
| **0 — Critical** | Red flag in core logic, or across multiple paths |
| **N/A** | Not applicable to this system; excluded from the category denominator (reason recorded) |
| **Unknown** | Applicable but not measurable; no score, disclosed, and included in the frozen denominator |
| **Not implemented** | No detector in this scanner release; disclosed and excluded from the denominator |

Every row's exact four-level criteria live in its indicator file §3; its Yellow and Red flag
criteria live in §2 of the same file and are echoed for printing in
[`../sheets/score-sheet.md`](../sheets/score-sheet.md).

## 2. The core-path rule

Every 1-versus-0 and 2-versus-1 call uses the *global* core-path definition:

> **Core** = files reachable from public entry points that touch **money / auth / PII /
> compliance-sensitive behavior**.

The engine computes membership once, and human auditors apply the same rule. Where an
indicator scopes itself differently, its own §10 `Scope/overlaps` section says so — that
section is the only place an indicator may narrow this rule.

## 3. Deep-dive rows

The catalog carries standard rows and deep-dive rows. Deep-dive rows are scored only in a
deep audit; when they run they join their category's applicable set and change that
category's percentage. A deep-audit total is therefore not a standard-audit total plus a
footnote — see [`config.md`](./config.md) for the composition.
