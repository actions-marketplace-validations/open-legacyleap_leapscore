# ECOS-04 — Deprecated API Usage

> **Category:** [Dependency & Ecosystem Health](../../01_DEPENDENCY_ECOSYSTEM.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-04 |
| Name | Deprecated API Usage |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — clean build log + grep. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The codebase calls APIs the upstream ecosystem has formally deprecated, removed, or replaced — compiler deprecation warnings, deprecated framework methods, removed stdlib functions, or documented "do not use" surfaces.
- **Why it signals obsolescence:** Deprecation warnings are the ecosystem telling you exactly where your code will break next. Ignoring them means every dependency upgrade becomes a surprise; the code accumulates friction and loses compatibility, and it's a leading indicator that the code has been "touched less than the world moved."
- **Where it manifests:** Compiler/linter output (`DeprecationWarning`, `@deprecated`, `#[deprecated]`, ESLint `no-deprecated-api`), language build logs, framework upgrade guides (e.g., Django removal timelines, Rails `deprecated_columns`, Angular deprecation list), IDE warnings, docs.
- **Objective metric:** `count of deprecation warnings`; `% of deprecated calls in core domain files`.
- **Yellow flag (warning):** Deprecated APIs used in non-critical modules, with warnings suppressed or ignored. *(Rationale: warning-level risk — it will bite on the next upgrade but is not an emergency.)*
- **Red flag (critical):** Core business logic depends on deprecated or already-removed APIs, or calls APIs removed in the *next* LTS version of the framework. *(Rationale: the next upgrade is blocked, and removed APIs often have security implications.)*
- **Example symptom:** "Every build spews 200 DeprecationWarnings from the ORM layer. When we finally bump the framework for a security fix, three core queries no longer exist. The bump becomes a two-week archaeology project."
- **Blast radius:** Dependency/framework upgrade feasibility, security patches availability, code reader confusion, IDE refactoring reliability.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no warnings; 2 = warnings in peripheral code; 1 = warnings in core, or in modules that will break next LTS; 0 = removed APIs already in use in core logic.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: turn deprecation warnings into a CI-visible report (not silent); fix the 20 highest-value warnings. Structural fix: treat deprecation debt like feature debt — a quarterly "modernize the deprecated surface" slice; keep the target version's removal list as a tracked checklist.
- **Gold standard / target state:** Zero deprecation warnings in the core module build; a CI gate that fails (or reports) on new deprecation warnings; removal timelines tracked.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** JS/TS: `eslint` + deprecation rule set (`>= 8`) with type-aware run; Python: `flake8` + deprecation plugin set, `ast` grep against curated removal lists; Go: `staticcheck` config presence + `grep` of stdlib-deprecated list; Java: compiler-flag scan only (no compile → grep `@Deprecated` call sites via import graph)
- **Rate-cost:** none (local)
- **Ecosystems:** JS/TS · Python · Go (partial) · Java (weak)
- **Applicability:** `na_when: no source files of any gated language detected in an enumerated tree`. Else applicable.

## 6. Detection recipe

- **Detection method:** Static analysis — compile with warnings-as-errors or `-Werror` in a canary build; AST/deprecation linters (`flake8-deprecated`, `eslint-plugin-deprecation`, `@deprecated` grep); framework's own deprecation checks (e.g., `django.checks`); grep for known-removed APIs from upgrade guides. Count warnings; classify by module.

1. Run the ecosystem's static deprecation lint over the clone (config-only invocation, no repo scripts executed).
2. Collect warning sites: `{file, line, symbol, deprecated_since?}`.
3. Join sites against computed core-path set.
4. Curated removal-list grep: match calls to APIs removed in the next LTS of the detected framework version.

Preconditions: language adapter selected by detect-ecosystem.

## 7. Fact schema

```json
{"ecos04": {
  "warning_total": 213,
  "warnings_in_core": 41,
  "removed_api_hits": [{"symbol": "django.utils.functional.allow_tags", "file": "app/views.py"}],
  "lint_ran": true, "tool_version": "eslint 8.57"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # signal quality is ecosystem-dependent -> always labeled inference
estimated_when: lint_ran == true               # clamp [1,2], confidence medium if type-aware run, else low
unknown_when:   lint could not run (language unsupported or parse failure)
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when type-aware analysis completed; low for grep-class runs
scope_limited:  output cap hit -> estimated + scope-limited
```

### Score mapping predicates

Threshold values: see §3. Estimated ⇒ score ∈ {1,2} only:

- `2`: `warning_total > 0` ∧ `warnings_in_core == 0`
- `1`: `warnings_in_core > 0` ∨ `removed_api_hits.len > 0` (next-LTS breakage risk)
- `3`/`0` unreachable by construction (certainty claims not allowed on estimated rows)

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `slow-dissolvable` (type-aware lint is the expensive form; dissolve → grep-class run + confidence low)
- Parse-catastrophe (malformed tree) → `unknown` + error field

## 10. Evidence and output

### Evidence string

```
basis: "eslint-deprecation: {n} warnings ({k} in core); {m} next-LTS removal hits"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Deprecated API calls in code; version drift is ECOS-02, framework support status is ECOS-08.
