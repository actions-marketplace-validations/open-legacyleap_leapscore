# FE-05 — Client-Side Architecture Debt — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured — seam judgment is inferential) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 human · engine: component-graph pass |
| Thresholds & 0–3 criteria | see encyclopedia §FE-05 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** component inventory (`.tsx/.jsx/.vue/.svelte` files): LOC distribution, god-component detection; state-management audit (global store count — redux/zustand/mobx/pinia stores, context-provider sprawl, prop-drilling depth proxy via AST); mutations-outside-stores greps; test-proximity for components (TEST-06 extractor reuse)
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated
- **Applicability:** FE category gate.

## 2. Detection recipe

1. Enumerate components; compute LOC distribution + top-decile callouts.
2. Store/global-state inventory; count mutation sites outside store boundaries.
3. Isolation proxy: components whose import closure excludes API/DB clients (static testability hint).
4. Render-behavior experiments are execution plane → emission text.

Preconditions: client detected.

## 3. Fact schema

```json
{"fe05": {
  "components": 214, "loc_p95": 640, "god_components": 7,
  "global_stores": 4, "outside_mutations": 31,
  "isolation_proxy_pct": 0.44}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # architecture-debt judgment is inferential
estimated_when: >=2 of {components, stores, isolation} probes ran   # clamp [1,2]
unknown_when:   no parseable client source
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium on full framework support
scope_limited:  multi-app monorepo -> sampled + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §FE-05. Estimated ⇒ score ∈ {1,2}:

- `2`: distributions healthy-ish; some sprawl outside core views
- `1`: god-components on core flows ∨ global-store sprawl ∧ outside-mutation density high
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (full AST pass dissolves to file-inventory only)

## 8. Evidence string

```
basis: "client-arch {n} components: p95 {l} LOC, gods={g}; stores={s}, outside-mutations={m}"
```

## 9. Scope/overlaps echo

Client-side structure; server-side typing debt is ARCH-11's row.
