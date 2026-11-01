# ARCH-02 — Coupling & Cohesion

> **Category:** [Architecture & Code Quality](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-02 |
| Name | Coupling & Cohesion |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — dependency graph tooling + manual DSM read. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Modules are highly interdependent (coupling) and/or each module bundles many unrelated responsibilities (low cohesion). The system behaves like a plate of tangled spaghetti rather than a set of deep, single-purpose modules.
- **Why it signals obsolescence:** Low cohesion/high coupling is the anti-thesis of maintainability: changes ripple, nothing is replaceable in isolation, and modernization becomes all-or-nothing. It's the architectural fingerprint of a codebase that grew by addition.
- **Where it manifests:** Modules importing from many unrelated modules, services reaching into other services' internals, a "utils" module everyone depends on, god modules, shared DTOs across everything, hidden dependencies via globals.
- **Objective metric:** `mean module fan-in/fan-out`; `# of modules in the top coupling quintile`; `# of cross-service imports/DB accesses`; `size of the central "utils" hub`; `cohesion score (e.g., LCOM)`.
- **Yellow flag (warning):** Cyclic dependencies present between submodules; a growing central hub; several modules with fan-out > 20. *(Rationale: warning-level — you can still reason about it, but ripples are starting.)*
- **Red flag (critical):** Circular dependencies across bounded contexts, or services sharing DBs/tables directly, or one omnipresent "everything" module everyone imports. *(Rationale: no module is independently changeable; this blocks any incremental modernization.)*
- **Example symptom:** "Every service imports `shared-utils`, which imports the DB layer. To change how a config is read, you touch 12 services. A 'small' internal refactor becomes a system-wide deployment."
- **Blast radius:** Change ripple, test isolation, independent deployability, team autonomy (Conway's law inverts — teams can't split), modernization feasibility.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = clean, enforced boundaries; 2 = cycles in peripheral modules; 1 = cycles across core modules; 0 = DB-coupled services / omnipresent hub.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: draw the DSM, pick the 3 highest-fan-in hubs, wrap them behind interfaces and shrink their API. Structural fix: define bounded contexts and enforce them with ArchUnit-style rules in CI; extract the shared hub into a stable, narrow contract; invert dependencies toward stable abstractions.
- **Gold standard / target state:** Acyclic dependency graph at the module boundary; every module has narrow, explicit dependencies; teams can change their module without coordination (tested via a chaos week).

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** `dependency-cruiser >= 16` (JS/TS), `grimp`/`import-linter` graph (Python), `go list -deps` parse (Go), import/regex parser fallback (Java: `jdeps` output if configured; otherwise generic). Cross-service DB coupling signals from config grep (connection-string reuse across service roots).
- **Rate-cost:** none
- **Ecosystems:** JS/TS (full) · Python (full) · Go (full) · Java (fallback → estimated)
- **Applicability:** `na_when: <2 modules or no importable structure` (single-file scripts, clause-b).

## 6. Detection recipe

- **Detection method:** Dependency Structure Matrix (DSM) via Lattix/Structure101, dependency analysis via `jdepend`/`arc42`, ArchUnit, `dependency-cruiser` (JS/TS), `python-dependency-inspector`; manual: import/require graph analysis; measure per-module fan-in/fan-out; detect cycles (ARCH-03) as a symptom.

1. Build module import graph per ecosystem tool.
2. Compute fan-in/fan-out per module; detect cycles (SCC); identify hub modules (top fan-in decile).
3. Detect cross-service imports in monorepos (imports crossing service roots).
4. DB-coupling hint: same connection identifier referenced by >1 service root.
5. LCOM via language tool when available (recorded, not scored — cohesion secondary).

Preconditions: ≥2 modules.

## 7. Fact schema

```json
{"arch02": {
  "modules": 64, "cycles": [{"members": ["a", "b", "c"], "crosses_bounded_context": true}],
  "hub_modules": [{"name": "shared-utils", "fan_in": 51}],
  "cross_service_imports": 7,
  "db_shared_across_services": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  graph built with native tooling
estimated_when: fallback regex importer used                      # clamp [1,2], confidence low
unknown_when:   language unsupported and no imports parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium native / low fallback
scope_limited:  monorepo >N roots sampled -> estimated + scope-limited
```

### Score mapping predicates

Thresholds/criteria: see §3.

- `3`: `cycles.len == 0` ∧ no omnipresent hub (`max_fan_in < Y_FANIN`)
- `2`: cycles present, all within single bounded context / peripheral
- `1`: cycles crossing core module groups
- `0`: `db_shared_across_services` ∨ hub imported by >R_HUBSHARE of modules

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `slow-dissolvable` (dissolve → direct-imports-only graph, transitive analysis dropped)
- Unparseable files excluded; >20% unparseable → estimated

## 10. Evidence and output

### Evidence string

```
evidence: "depgraph: {m} modules, {c} cycles ({worst}); hub '{hub}' fan_in={f}; cross-service={x}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Intra-module coupling/cohesion; inter-service & DB coupling belongs to DATA-02 and API-03 — not here.
