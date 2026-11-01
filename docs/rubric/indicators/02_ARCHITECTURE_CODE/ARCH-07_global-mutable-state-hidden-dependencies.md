# ARCH-07 — Global Mutable State & Hidden Dependencies

> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-07 |
| Name | Global Mutable State & Hidden Dependencies |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — grep sweep + parallel-test experiment. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system relies on global mutable state — singletons, module-level variables, static mutable fields, ambient configuration, shared caches — and hides dependencies (time, randomness, network, the DB) inside functions rather than injecting them.
- **Why it signals obsolescence:** Hidden dependencies and globals make correctness a function of execution order and history rather than of inputs. Tests become order-dependent, concurrency becomes a minefield, and the code can't be reasoned about in isolation. Modern practice (pure functions, explicit dependencies, DI) exists precisely to eliminate this class of bug.
- **Where it manifests:** Singleton service locators, static mutable fields, module-level `config`/`state` objects, functions calling `time.now()`/`Math.random()`/the DB directly (not injected), hidden global caches, order-dependent initialization, "set state at import time" patterns.
- **Objective metric:** `# of global mutable singletons`; `# of logic functions calling time/random/IO directly`; `% of tests order-dependent`; `concurrency failure count under parallel test run`.
- **Yellow flag (warning):** Globals/singletons present in non-core paths, or a handful of hidden-dependency calls; tests currently pass serially. *(Rationale: warning — it hasn't bit yet, but it's the same class as the red flag.)*
- **Red flag (critical):** Shared mutable state in core business flows, or hidden time/IO in core logic, or parallel/randomized test runs fail. *(Rationale: correctness is now order-dependent — a structural correctness debt, not just a style debt.)*
- **Example symptom:** "The currency converter reads a `static ExchangeRateService` populated at app start. A deployment that changed init order silently used yesterday's rates for 40 minutes. The test suite passes only because it runs single-threaded in import order."
- **Blast radius:** Concurrency bugs, test reliability, race conditions in prod, hard-to-reproduce defects, refactor risk.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = explicit dependencies everywhere; 2 = globals in peripheral code; 1 = globals/hidden deps in core, tests serial-only; 0 = core correctness is order/concurrency-dependent.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: inject the clock/random/IO at the seams you can reach; make the top 5 singletons instances with explicit wiring. Structural fix: eliminate globals by constructor injection; make state explicit and owned; introduce a proper initialization/DI lifecycle; enforce "no static mutable" with a lint.
- **Gold standard / target state:** All dependencies explicit and injected; time/random/IO behind interfaces; test suite passes under random/parallel execution; zero mutable statics in core.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** AST-grep class matchers: singletons (`getInstance`, module-level `export const` state objects, `static` mutable fields), hidden deps (direct `new Date()`/`datetime.now()`/`Math.random()`/DB-client calls inside domain/service layers vs injected clock), ambient config reads at import time
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Go · Java (matcher packs per language; density varies)
- **Applicability:** `na_when: no source parsed`. Else applicable.

## 6. Detection recipe

- **Detection method:** Static analysis + manual — grep for singleton/service-locator patterns, `static` mutable fields, direct `DateTime.Now`/`new Date()` in logic (vs. injected clock), direct ORM calls in domain functions; dependency injection presence; a test experiment: run the suite in random order / in parallel and count failures (also feeds TEST-07). Tools: `architecture-tests`, `import-linter`, SonarQube, greps.

1. Run matcher pack per language over non-test source.
2. Classify hits by layer (domain/service = high-severity surface; UI/CLI edges = low).
3. Join to core-path set.
4. Parallel/random-order suite behavior is NOT probed here (execution forbidden) — that half of the entry's metric is emitted as "what it takes" text.

Preconditions: language adapters selected.

## 7. Fact schema

```json
{"arch07": {
  "singleton_count": 17,
  "hidden_dep_hits": [{"file": "billing/currency.py", "signal": "datetime.now() in domain", "in_core_path": true}],
  "hits_in_core": 6}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # pattern greps are labeled inference
estimated_when: >=1 matcher pack ran           # clamp [1,2], confidence medium if full pack, else low
unknown_when:   no supported language
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all language matchers ran clean
scope_limited:  sampled dirs -> estimated + scope-limited
```

### Score mapping predicates

Criteria: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: globals/hidden-dep hits present, `hits_in_core == 0`
- `1`: `hits_in_core > 0` below Red density
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Matcher-pack crash → partial signals only → confidence low

## 10. Evidence and output

### Evidence string

```
basis: "state-grep: {s} singletons; {h} hidden time/IO/DB calls ({k} core)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Shared *state* in product code; the test suite's reaction to it is TEST-07 — this row scores the code.
