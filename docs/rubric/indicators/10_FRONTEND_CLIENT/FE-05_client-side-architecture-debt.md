# FE-05 — Client-Side Architecture Debt

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for FE-05. Edit this file; the legacy path [fe-05_client-side-architecture-debt.md](../../../specs/10_FRONTEND_CLIENT/fe-05_client-side-architecture-debt.md) is a compatibility alias.
> **Category:** [Frontend & Client Health](../../10_FRONTEND_CLIENT.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/10_FRONTEND_CLIENT/FE-05_client-side-architecture-debt.md`

## 1. Identity

| field | value |
|---|---|
| ID | FE-05 |
| Name | Client-Side Architecture Debt |
| Category | FE — Frontend & Client Health |
| Engine tier | B |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 ~2–4 h — component/LOC + state inventory. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client's internal structure is legacy-modal — global state sprawl (a dozen stores, mutable globals), prop-drilling and god-components, anemic architecture where UI logic invents the domain, no component model/testable seams, and every feature is a new global.
- **Why it signals obsolescence:** Client architecture debt is ARCH on the frontend: the app grows by global mutation, state is untestable, components are untestable, and refactoring the client (a natural prelude to any modernization) is met with "too risky to touch." It's the reason FE-01/02 migrations stall.
- **Where it manifests:** Global state object/store sprawl, giant god-components (1000+ line components), prop drilling through 6 layers, logic-in-render (`render` computing things), no separation of data/view/state, hundreds of `useEffect`/effects, state-that-can't-be-test, no component architecture.
- **Objective metric:** `max/mean component LOC`; `# of global stores/contexts`; `prop-drill depth`; `component test coverage %`; `state-mutation-outside-store count`.
- **Yellow flag (warning):** Some god-components, 1–3 global stores, prop drilling in places; light component tests. *(Rationale: warning — still navigable, but structure is degrading.)*
- **Red flag (critical):** 5+ unmanaged globals, 2,000-line components as normal, no component tests, unmappable data flow — "the frontend can't be reasoned about." *(Rationale: the client has no architecture worth modernizing incrementally — it's one shot glass of god-components.)*
- **Example symptom:** "The checkout is one 3,500-line component reading 4 global stores, mutating them directly, fluffing 12 styles of prop drilling. A developer adds a field — and two unrelated pages change. 'We feared touching it' is the standing review note."
- **Blast radius:** Client velocity, bug density, test feasibility, migration risk, UX bugs (state races), onboarding.

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (annex) 3 = clean architecture + tests; 2 = some globals/god-components; 1 = a few unmanageables; 0 = unroutable god component sprawl.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: mark the top 3 god-components, extract their clearest slice with a test, introduce a singular state pattern with actions. Structural fix: a deliberately small client architecture (one store, typed, actions-only), component decomposition by responsibility, testable seams with a component test budget, codegen for new screens (VEL-11-style).
- **Gold standard / target state:** God-components ≤ modern norms, single main state path, components testable in isolation with coverage, "touch one page breaks another" is a historical anecdote.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** component inventory (`.tsx/.jsx/.vue/.svelte` files): LOC distribution, god-component detection; state-management audit (global store count — redux/zustand/mobx/pinia stores, context-provider sprawl, prop-drilling depth proxy via AST); mutations-outside-stores greps; test-proximity for components (TEST-06 extractor reuse)
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated
- **Applicability:** FE category gate.

## 6. Detection recipe

- **Detection method:** Component/graph analysis — component LOC distribution (god-components), state-management inventory (global stores, context providers, mutations outside stores), testability experiment (can you test a component in isolation? component testing coverage — from TEST-01 by component), hooks/effects density, data-flow tracing for a nontrivial feature.

1. Enumerate components; compute LOC distribution + top-decile callouts.
2. Store/global-state inventory; count mutation sites outside store boundaries.
3. Isolation proxy: components whose import closure excludes API/DB clients (static testability hint).
4. Render-behavior experiments are execution plane → emission text.

Preconditions: client detected.

## 7. Fact schema

```json
{"fe05": {
  "components": 214, "loc_p95": 640, "god_components": 7,
  "global_stores": 4, "outside_mutations": 31,
  "isolation_proxy_pct": 0.44}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # architecture-debt judgment is inferential
estimated_when: >=2 of {components, stores, isolation} probes ran   # clamp [1,2]
unknown_when:   no parseable client source
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium on full framework support
scope_limited:  multi-app monorepo -> sampled + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: distributions healthy-ish; some sprawl outside core views
- `1`: god-components on core flows ∨ global-store sprawl ∧ outside-mutation density high
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `slow-dissolvable` (full AST pass dissolves to file-inventory only)

## 10. Evidence and output

### Evidence string

```
basis: "client-arch {n} components: p95 {l} LOC, gods={g}; stores={s}, outside-mutations={m}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Client-side structure; server-side typing debt is ARCH-11's row.
