# ARCH-01 — Cognitive Complexity & God Classes

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for ARCH-01. Edit this file; the legacy path [arch-01_cognitive-complexity-god-classes.md](../../../specs/02_ARCHITECTURE_CODE/arch-01_cognitive-complexity-god-classes.md) is a compatibility alias.
> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/02_ARCHITECTURE_CODE/ARCH-01_cognitive-complexity-god-classes.md`

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-01 |
| Name | Cognitive Complexity & God Classes |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — analyzer run + review of top offenders. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Methods, classes, and modules exceed sane complexity budgets — deeply nested branches, methods doing many things, "God Classes" absorbing unrelated responsibilities, files that are thousands of lines long.
- **Why it signals obsolescence:** Complexity is the root tax on every other activity: tests are harder to write, bugs harder to reason about, refactors riskier, onboarding slower. High complexity correlates strongly with defect density and is the classic signature of code that accreted without design pressure.
- **Where it manifests:** Large files, methods with many `if`/`else`/`for`/`while`/`catch` levels, classes with many fields/methods (God Classes), `God object` smells, deeply nested conditionals, methods with 10+ branches.
- **Objective metric:** `max method cognitive complexity`; `mean per-module complexity`; `# of classes > 500 LOC`; `# of methods > 30 complexity`; `file LOC p95`.
- **Yellow flag (warning):** Method complexity 15–30, classes 500–2,000 LOC, complexity concentrated in a few known files. *(Rationale: above SonarQube's default acceptable line but still refactorable in place.)*
- **Red flag (critical):** Method complexity > 30, classes > 2,000 LOC, or God Classes in core domain logic. *(Rationale: these units are no longer safely modifiable — tests are effectively impossible; defect rate is structurally high.)*
- **Example symptom:** "The `OrderProcessor.process` method is 900 lines with 14 nested branches and 8 responsibilities. A one-line discount change last month took three days and regressed two unrelated paths. Nobody reviews it anymore; they just approve."
- **Blast radius:** Defect density, review speed, test feasibility, onboarding, refactor risk, staff turnover around "the scary file."

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = within budgets; 2 = offenders in non-core modules; 1 = God Class in an isolated core path; 0 = core domain logic is unmodifiable God Classes.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: carve the top 5 offenders by automated extract-method (IDE-assisted, with tests), add a complexity budget to CI (`eslint max-complexity`, SonarQube gate). Structural fix: a structured decomposition of God Classes by responsibility; strangle complexity behind facades; pair the two riskiest files on a refactor sprint.
- **Gold standard / target state:** Complexity budget enforced in CI; max method complexity < 15; no file > 1,000 LOC; the top-decile complexity list is shrinking and tracked.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** `lizard >= 1.7` (multi-language CC/LOC), `radon >= 6` (Python), `eslint` `complexity` + `max-lines-per-function` rules (JS/TS). SonarQube-class tools optional enrichment.
- **Rate-cost:** none
- **Ecosystems:** agnostic via lizard; language analyzers add precision
- **Applicability:** `na_when: zero source files in any supported language` (clause-b, enumerated tree). Else applicable.

## 6. Detection recipe

- **Detection method:** Static analysis — SonarQube/SonarCloud cognitive complexity, CodeClimate maintainability, `radon` (Python `cc`), `eslint complexity`/`cognitive-complexity`, `lizard`, `jscpd`; IDE metrics; grep for file LOC. Compute max/mean method complexity per module; flag modules in the top decile.

1. Run lizard over the clone with default cognitive-complexity model; exclude vendored/generated dirs (engine exclusion list: `vendor/`, `node_modules/`, `*.min.js`, lockfiles).
2. Python supplement: `radon cc -s -a` per module.
3. JS/TS supplement: eslint complexity rule run (config-only).
4. Compute per-method complexity distribution, per-class LOC; join file paths against computed core-path set.

Preconditions: tree enumerated; language adapters selected.

## 7. Fact schema

```json
{"arch01": {
  "methods_analyzed": 4820,
  "pct_over_Y": 4.2,
  "top_offenders": [{"file": "app/orders.py", "fn": "process", "ccn": 38, "loc": 912}],
  "god_classes": [{"file": "OrderManager.java", "loc": 2340}],
  "file_loc_p95": 480}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  methods_analyzed >= MIN_SAMPLE (50) and analyzer exit clean
estimated_when: sampled subset only (budget dissolve)          # clamp [1,2], confidence low
unknown_when:   no supported-language source parsed
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (full deterministic static pass)
scope_limited:  >MAX_FILES truncated -> estimated + scope-limited
```

### Score mapping predicates

Y/R values (complexity 15/30, class LOC 500/2000): see §3.

- `3`: `pct_over_Y <= Y_PCT` ∧ no god classes
- `2`: offenders present, all outside core paths
- `1`: god-class or >R-complexity method touching an isolated core path
- `0`: core domain logic dominated by R-band units (`core_offenders_ratio > R_RATIO`)

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `slow-dissolvable` (dissolve → largest-N files by LOC + scope-limited)
- Analyzer crash on pathological files → skip-file count recorded; >10% skipped → estimated

## 10. Evidence and output

### Evidence string

```
evidence: "lizard {ver}: {k} methods >{Y}; worst {file}:{fn} ccn={c}; {g} god classes"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Pure size/complexity of units; duplication that inflates size is scored under ARCH-08 — only shape counted here.
