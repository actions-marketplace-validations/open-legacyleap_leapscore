# ARCH-11 — Nullable/Untyped Code & Runtime Error Density

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for ARCH-11. Edit this file; the legacy path [arch-11_nullable-untyped-code-runtime-error-density.md](../../../specs/02_ARCHITECTURE_CODE/arch-11_nullable-untyped-code-runtime-error-density.md) is a compatibility alias.
> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/02_ARCHITECTURE_CODE/ARCH-11_nullable-untyped-code-runtime-error-density.md`

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-11 |
| Name | Nullable/Untyped Code & Runtime Error Density |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES (deep-dive tier: runs in deep audits / sprint 2+) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: ARCH` |
| Verify effort | 🔷 ~1–2 days — lint report + incident mining. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The codebase is weakly typed or relies on implicit nullability where modern practice expects static typing and explicit null safety — dynamic dispatch, `any`/`Object` as a type, unchecked casts, defensive null checks scattered everywhere, stringly-typed arguments — and runtime errors (NPEs, `undefined` access) are a visible fraction of incidents.
- **Why it signals obsolescence:** Type safety is a modernization "tax" that's often the whole point of upgrading: it converts a class of runtime bugs into compile-time errors. A codebase that predates or rejects it carries a permanently higher runtime-error rate and makes large refactors (renames, signature changes) dangerous and slow.
- **Where it manifests:** TypeScript `any` everywhere, Python without type hints in hot paths, Java/C# with pervasive null checks and unchecked casts, dynamic languages doing introspection, `Optional.get()` chains, crash logs dominated by null/undefined exceptions.
- **Objective metric:** `% of function signatures typed`; `# of `any`/`Object` usages per KLOC`; `% of runtime incidents caused by null/type errors`; `strict mode enabled?`.
- **Yellow flag (warning):** Some typed coverage, strict mode partially on, null-crash share 5–10% of incidents. *(Rationale: warning — type debt is present but not dominant.)*
- **Red flag (critical):** Core paths untyped, strict mode off, null/undefined errors a top incident cause (> 15%). *(Rationale: a whole bug class you could eliminate at compile time is shipping to prod.)*
- **Example symptom:** "Sentry shows 'Cannot read properties of undefined' as the #2 production error for the quarter. The TS codebase has strictNullChecks off and 1,200 `any`s. The team can't rename a field without a search-replace gamble."
- **Blast radius:** Incident rate, refactor safety, onboarding, IDE/tooling value, AI-assisted refactoring quality (types are the interface for tooling).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = strict + typed; 2 = partially typed; 1 = core untyped, strict off; 0 = null errors a top incident class.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: enable `strict`/`strictNullChecks` on the smallest core module, fix the fallout, expand module by module; add `mypy --strict` to CI incrementally with a ban-list. Structural fix: adopt explicit null-safety (Option/Result types), eliminate `any` with real types at boundaries, add type coverage gate (e.g., `typescript coverage > X%`).
- **Gold standard / target state:** Strict mode on across the system; typed coverage > 90%; null/type errors < 2% of incidents; boundary types (API, DB, events) fully defined.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** TS: `tsconfig.json` flags (`strict`, `strictNullChecks`) + `typescript-eslint no-explicit-any` count; Python: `mypy >= 1`/`pyright` config presence + annotation-density AST pass (% of function signatures typed); Java/C#: `@Nullable`/Optional usage density (weak)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python (full); Java/C# (heuristic low)
- **Applicability:** `na_when: language set has no typing surface worth scoring` — only when repo is docs/config-only. Zero-typed-signatures is score signal, not N/A.

## 6. Detection recipe

- **Detection method:** Type-lint rules — TypeScript `no-explicit-any`, `strict` mode off, `strictNullChecks` off; `mypy` coverage %; `pyright`; grep for defensive null checks; incident data mining: what share of prod crashes are null/type errors. Count typed-vs-untyped function signatures in core modules.

1. Read strict-mode config flags per language.
2. Count `any`/untyped-boundary usages per KLOC.
3. Signature-annotation density via AST walk (params + returns).
4. Incident-error-share metric is NOT computable (runtime plane) → emitted as "what it takes" text.

Preconditions: language adapters selected.

## 7. Fact schema

```json
{"arch11": {
  "strict_mode": {"ts": false, "strictNullChecks": false},
  "any_per_kloc": 18.4,
  "typed_signature_pct": 31.0,
  "config_files": ["tsconfig.json"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # red-flag criterion needs runtime error share
estimated_when: >=1 typing probe completed     # clamp [1,2]; confidence medium if config+AST both
unknown_when:   no supported language parsed
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium iff tsconfig/pyright config read + AST density both ran
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: partial typing (`typed_pct >= Y_TYPED` ∨ strict on with exceptions)
- `1`: core modules untyped ∧ strict off
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- mypy/pyright full run dissolves to AST-density-only under budget (no type-checker invocation needed at all in v1)

## 10. Evidence and output

### Evidence string

```
basis: "type-probe: strict={bool}; {a}/KLOC any; {t}% signatures typed ({lang})"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Server-side type safety; client-side untyped state is FE-05, repeated null-defence boilerplate is ARCH-12.
