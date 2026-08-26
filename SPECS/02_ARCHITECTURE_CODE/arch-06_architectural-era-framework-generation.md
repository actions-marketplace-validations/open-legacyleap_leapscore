# ARCH-06 — Architectural Era / Framework Generation — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 human · engine: static generation probes |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-06 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** DI-presence matchers per ecosystem (Spring `@Autowired`/constructor injection share, `inversify`/`tsyringe` deps, Python `dependency-injector`, Go `wire`/`fx`); module-boundary dir conventions; service-locator/static-singleton greps; "unit-testable-without-stack" static proxy = import-graph reachability from core modules to DB/network clients
- **Rate-cost:** none
- **Ecosystems:** all gated; signal strength varies (recorded)
- **Applicability:** `na_when: no source parsed`. Else applicable.

## 2. Detection recipe

1. DI presence: framework/container dependency in manifests + injection-pattern density in source.
2. Module boundaries: package/dir structure vs flat layout heuristic.
3. Seam proxy: fraction of core modules whose import closure excludes infra drivers (DB/HTTP clients) — static approximation of the "constructible in unit test" experiment.
4. Generation classification against per-ecosystem era table (engine-shipped, e.g., EJB2→Spring Boot, WebForms→.NET modular).

Preconditions: ARCH-02 graph.

## 3. Fact schema

```json
{"arch06": {
  "di_present": false,
  "module_boundaries": false,
  "core_seam_index": 0.18,
  "singleton_count": 41,
  "generation_gap": 2,
  "era_table": "java-2026.1"}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # era judgment is inherently inferential
estimated_when: >=2 of {di, boundaries, seam} signals computed   # clamp [1,2], confidence medium if 3-of-3, else low
unknown_when:   no signals computable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium iff di+boundaries+seam all present
```

## 5. Score mapping (predicates)

Criteria/generation definitions: see encyclopedia §ARCH-06. Estimated ⇒ score ∈ {1,2}:

- `2`: `generation_gap <= 1` ∧ some seams (`core_seam_index >= Y_SEAM`)
- `1`: `generation_gap == 2` confined to isolated services ∨ weak seams elsewhere
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Era-table miss (exotic stack) → `unknown` + emission text naming the missing mapping

## 8. Evidence string

```
basis: "era-probes: di={bool} boundaries={bool} seam_index={s}; classified gap={g} generations"
```

## 9. Scope/overlaps echo

Style/seams generation gap; vendor support status is ECOS-08, runtime EOL is ECOS-01.
