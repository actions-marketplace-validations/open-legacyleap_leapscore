# ARCH-03 — Layer & Boundary Violations

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for ARCH-03. Edit this file; the legacy path [arch-03_layer-boundary-violations.md](../../../specs/02_ARCHITECTURE_CODE/arch-03_layer-boundary-violations.md) is a compatibility alias.
> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/02_ARCHITECTURE_CODE/ARCH-03_layer-boundary-violations.md`

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-03 |
| Name | Layer & Boundary Violations |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — rule setup + vertical slice tour. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Architectural layers (presentation → application → domain → infrastructure, or bounded contexts) are routinely crossed in the wrong direction: UI code touching the DB, domain logic in controllers, services importing each other's internals, business rules in views or stored procedures.
- **Why it signals obsolescence:** Eroded boundaries mean the architecture exists only in theory. Once rules don't live where they should, nothing can be reasoned about, tested in isolation, or swapped — the system reverts to "everything depends on everything" and every boundary enforcement is gone.
- **Where it manifests:** Controllers with business logic, domain objects with persistence concerns, UI layer with SQL, services reaching into other services' DBs, stored procedures containing business rules, `#pragma`/`module` hacks, layered module that doesn't exist on disk.
- **Objective metric:** `# of rule violations (if rules exist)`; `existence of arch tests in CI`; `% of controllers/views containing domain logic` (sampled); `# of direct cross-layer SQL/ORM calls from UI`.
- **Yellow flag (warning):** Occasional boundary crossings that reviewers miss; no architecture tests enforcing rules. *(Rationale: violations are currently luck-based — the guard is missing.)*
- **Red flag (critical):** System-wide boundary erosion — UI/controllers do persistence, business rules live in stored procedures, or no architecture enforcement exists *and* the drift is visible in a quick tour. *(Rationale: the architecture is nominal only; treat as structural debt.)*
- **Example symptom:** "The Rails controller for the invoice screen runs three raw SQL queries and an email send, then renders. The domain model is anemic. The 'architecture' — everyone says — is 'the app is the architecture.'"
- **Blast radius:** Testability, security (SQL in views), refactor safety, domain logic duplication, compliance traceability.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = boundaries enforced; 2 = occasional violations, no guard yet; 1 = violations in core slices; 0 = systemic erosion, architecture nominal.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add an arch test (ArchUnit/import-linter) and fix the top violations; enforce at PR time. Structural fix: rebuild the lost layers — extract domain into its own module, move persistence behind repositories, keep UI thin; do it one vertical slice at a time.
- **Gold standard / target state:** Architecture rules enforced in CI; a 30-minute vertical-slice tour confirms correct directions; business rules live in the domain layer only.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** `dependency-cruiser --rules` (JS/TS, engine default rule-pack), `import-linter` contract presence + run (Python), ArchUnit test-file detection (Java — presence of arch tests is itself a signal), generic layer-map heuristics (dir conventions: `controllers→services→repositories`)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python (full); Go/Java (heuristic → estimated)
- **Applicability:** `na_when: no layered structure inferable (flat scripts, <2 layers)` clause-b.

## 6. Detection recipe

- **Detection method:** Architecture enforcement tools — ArchUnit/NetArchTest/ArchUnitNET (Java/.NET), `dependency-cruiser` with rules (JS/TS), `import-linter` (Python), `yapf`+ custom lints, SonarQube architecture rules; manual: a 30-min tour of one vertical slice tracing UI→logic→persistence to check direction. Run existing rule tests (if none exist, that's itself a finding).

1. Detect existing arch-enforcement configs (`import-linter.ini`, `.dependency-cruiser.*`, arch-test packages). Presence recorded as `guard_present`.
2. If none: apply engine default layer rules inferred from dir convention; else run the project's own declared rules read-only.
3. Count violations `{from_layer, to_layer, file}`; classify direction.
4. UI-touches-persistence probe: SQL/ORM imports inside presentation-layer dirs.
5. Join violation files to core-path set.

Preconditions: ARCH-02 graph available.

## 7. Fact schema

```json
{"arch03": {
  "guard_present": false,
  "rule_pack": "engine-default",
  "violations": 23,
  "violations_in_core": 5,
  "ui_persistence_hits": [{"file": "routes/invoice.php", "signal": "raw SQL"}]}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  native rule pack ran (project-owned or engine default on parseable tree)
estimated_when: heuristic-only layering (Go/Java fallback)      # clamp [1,2], confidence low
unknown_when:   no structure parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when guard_present or conventions clean
scope_limited:  sampled dirs -> estimated + scope-limited
```

### Score mapping predicates

Criteria: see §3.

- `3`: `guard_present` ∧ `violations == 0`
- `2`: `¬guard_present` ∧ violations few & peripheral ("luck-based" state)
- `1`: `violations_in_core > 0` in isolated slices
- `0`: systemic erosion: `ui_persistence_hits.len >= R_UI` ∨ business-rules-in-stored-procs detected ∨ core-wide violations

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast` (rule packs are cheap; graph reuse from ARCH-02)
- Project's own rule config malformed → fall back to engine default, note in evidence

## 10. Evidence and output

### Evidence string

```
evidence: "archrules({pack}): {v} violations ({k} core); ui->persistence hits {list}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Direction of layer boundaries only; wire-protocol legaciness lands in API-06 and DATA-02.
