# ARCH-11 — Nullable/Untyped Code & Runtime Error Density — Implementation Spec *(deep-dive — folds into ARCH when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured — incident-share criterion is unmeasurable, see README §4) |
| v1 flag | YES (deep-dive tier: runs in deep audits / sprint 2+) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: ARCH` |
| Verify effort | 🔷 human · engine: static type-coverage pass |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-11 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** TS: `tsconfig.json` flags (`strict`, `strictNullChecks`) + `typescript-eslint no-explicit-any` count; Python: `mypy >= 1`/`pyright` config presence + annotation-density AST pass (% of function signatures typed); Java/C#: `@Nullable`/Optional usage density (weak)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python (full); Java/C# (heuristic low)
- **Applicability:** `na_when: language set has no typing surface worth scoring` — only when repo is docs/config-only. Zero-typed-signatures is score signal, not N/A.

## 2. Detection recipe

1. Read strict-mode config flags per language.
2. Count `any`/untyped-boundary usages per KLOC.
3. Signature-annotation density via AST walk (params + returns).
4. Incident-error-share metric is NOT computable (runtime plane) → emitted as "what it takes" text.

Preconditions: language adapters selected.

## 3. Fact schema

```json
{"arch11": {
  "strict_mode": {"ts": false, "strictNullChecks": false},
  "any_per_kloc": 18.4,
  "typed_signature_pct": 31.0,
  "config_files": ["tsconfig.json"]}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # red-flag criterion needs runtime error share
estimated_when: >=1 typing probe completed     # clamp [1,2]; confidence medium if config+AST both
unknown_when:   no supported language parsed
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium iff tsconfig/pyright config read + AST density both ran
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §ARCH-11. Estimated ⇒ score ∈ {1,2}:

- `2`: partial typing (`typed_pct >= Y_TYPED` ∨ strict on with exceptions)
- `1`: core modules untyped ∧ strict off
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- mypy/pyright full run dissolves to AST-density-only under budget (no type-checker invocation needed at all in v1)

## 8. Evidence string

```
basis: "type-probe: strict={bool}; {a}/KLOC any; {t}% signatures typed ({lang})"
```

## 9. Scope/overlaps echo

Server-side type safety; client-side untyped state is FE-05, repeated null-defence boilerplate is ARCH-12.
