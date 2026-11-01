# ARCH-06 — Architectural Era / Framework Generation

> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-06 |
| Name | Architectural Era / Framework Generation |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — architecture tour + a "unit-test-without-stack" experiment. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The codebase's architectural style is one or more generations behind the ecosystem norm — e.g., a non-modular monolith with no dependency injection where modules are expected, global singleton state where DI is expected, or an architecture style (e.g., action-command giant controllers, RPC-style god endpoints) that modern practice has replaced.
- **Why it signals obsolescence:** Architectural style is a proxy for how much of the system's mechanics are "solved" by structure vs. reinvented by hand. Old eras lack the seams that make change, testing, and tooling cheap. A codebase that predates modularity has to build those seams manually — a huge modernization drag.
- **Where it manifests:** No DI container (manual wiring in a central bootstrap), no package/module boundaries on disk, static service locators, giant controller/service classes, everything depending on everything, build system that doesn't support modules, tests that need a live stack because nothing is swappable.
- **Objective metric:** `generational gap (0/1/2/3+)`; `% of core services constructible in a unit test`; `presence of DI`; `presence of module boundaries`; `# of static singletons/service locators`.
- **Yellow flag (warning):** One generation behind — some seams exist but testing requires a live stack for many paths. *(Rationale: modernization is still incremental — a facade can buy time.)*
- **Red flag (critical):** Two+ generations behind — no DI, no module seams, tests require the full stack, or the architecture style (e.g., EJB 2-era) has no modern tooling support. *(Rationale: the seams modernization needs don't exist; you're building them before you can refactor.)*
- **Example symptom:** "The Java codebase was written in 2008: static service locators, no interfaces, 2,000-line controllers. There is no way to unit-test a service without a live Oracle and a message queue. 'Refactoring' means 'risking prod.'"
- **Blast radius:** Testability, tooling support, hiring, incremental-refactor feasibility, speed of every future change.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = current generation; 2 = one generation behind, seams exist; 1 = two generations behind in isolated services; 0 = whole system two+ generations behind with no seams.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: introduce interface seams around the 3 worst-coupled cores, add a couple of tests to prove the seams work. Structural fix: adopt the modern architecture incrementally — introduce a DI container, extract modules with enforced boundaries, wrap legacy access behind ports, migrate vertical slices one at a time.
- **Gold standard / target state:** Core logic testable without live infrastructure; DI and module boundaries standard; new features land in the modern style while legacy shrinks.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** DI-presence matchers per ecosystem (Spring `@Autowired`/constructor injection share, `inversify`/`tsyringe` deps, Python `dependency-injector`, Go `wire`/`fx`); module-boundary dir conventions; service-locator/static-singleton greps; "unit-testable-without-stack" static proxy = import-graph reachability from core modules to DB/network clients
- **Rate-cost:** none
- **Ecosystems:** all gated; signal strength varies (recorded)
- **Applicability:** `na_when: no source parsed`. Else applicable.

## 6. Detection recipe

- **Detection method:** Architecture inventory — a "generation test": can you instantiate a core service in a unit test without the DB/network? Can you swap one implementation for another without editing callers? Check for DI, module boundaries, hexagonal/ports-and-adapters seams. Compare against the current norm for the language (e.g., .NET 8 modular monolith vs. WebForms-era, Spring Boot vs. EJB 2).

1. DI presence: framework/container dependency in manifests + injection-pattern density in source.
2. Module boundaries: package/dir structure vs flat layout heuristic.
3. Seam proxy: fraction of core modules whose import closure excludes infra drivers (DB/HTTP clients) — static approximation of the "constructible in unit test" experiment.
4. Generation classification against per-ecosystem era table (engine-shipped, e.g., EJB2→Spring Boot, WebForms→.NET modular).

Preconditions: ARCH-02 graph.

## 7. Fact schema

```json
{"arch06": {
  "di_present": false,
  "module_boundaries": false,
  "core_seam_index": 0.18,
  "singleton_count": 41,
  "generation_gap": 2,
  "era_table": "java-2026.1"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # era judgment is inherently inferential
estimated_when: >=2 of {di, boundaries, seam} signals computed   # clamp [1,2], confidence medium if 3-of-3, else low
unknown_when:   no signals computable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium iff di+boundaries+seam all present
```

### Score mapping predicates

Criteria/generation definitions: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: `generation_gap <= 1` ∧ some seams (`core_seam_index >= Y_SEAM`)
- `1`: `generation_gap == 2` confined to isolated services ∨ weak seams elsewhere
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Era-table miss (exotic stack) → `unknown` + emission text naming the missing mapping

## 10. Evidence and output

### Evidence string

```
basis: "era-probes: di={bool} boundaries={bool} seam_index={s}; classified gap={g} generations"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Style/seams generation gap; vendor support status is ECOS-08, runtime EOL is ECOS-01.
