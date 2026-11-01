# ARCH-07 — Global Mutable State & Hidden Dependencies — Implementation Spec

> **Authority:** This file defines the ARCH-07 implementation contract. The [ARCH rubric category](../../rubric/02_ARCHITECTURE_CODE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: grep sweep |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-07 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** AST-grep class matchers: singletons (`getInstance`, module-level `export const` state objects, `static` mutable fields), hidden deps (direct `new Date()`/`datetime.now()`/`Math.random()`/DB-client calls inside domain/service layers vs injected clock), ambient config reads at import time
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Go · Java (matcher packs per language; density varies)
- **Applicability:** `na_when: no source parsed`. Else applicable.

## 2. Detection recipe

1. Run matcher pack per language over non-test source.
2. Classify hits by layer (domain/service = high-severity surface; UI/CLI edges = low).
3. Join to core-path set.
4. Parallel/random-order suite behavior is NOT probed here (execution forbidden) — that half of the entry's metric is emitted as "what it takes" text.

Preconditions: language adapters selected.

## 3. Fact schema

```json
{"arch07": {
  "singleton_count": 17,
  "hidden_dep_hits": [{"file": "billing/currency.py", "signal": "datetime.now() in domain", "in_core_path": true}],
  "hits_in_core": 6}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # pattern greps are labeled inference
estimated_when: >=1 matcher pack ran           # clamp [1,2], confidence medium if full pack, else low
unknown_when:   no supported language
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all language matchers ran clean
scope_limited:  sampled dirs -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §ARCH-07. Estimated ⇒ score ∈ {1,2}:

- `2`: globals/hidden-dep hits present, `hits_in_core == 0`
- `1`: `hits_in_core > 0` below Red density
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Matcher-pack crash → partial signals only → confidence low

## 8. Evidence string

```
basis: "state-grep: {s} singletons; {h} hidden time/IO/DB calls ({k} core)"
```

## 9. Scope/overlaps echo

Shared *state* in product code; the test suite's reaction to it is TEST-07 — this row scores the code.
