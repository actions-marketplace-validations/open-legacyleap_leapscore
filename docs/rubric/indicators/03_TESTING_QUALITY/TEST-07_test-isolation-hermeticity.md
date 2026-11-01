# TEST-07 — Test Isolation & Hermeticity

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for TEST-07. Edit this file; the legacy path [test-07_test-isolation-hermeticity.md](../../../specs/03_TESTING_QUALITY/test-07_test-isolation-hermeticity.md) is a compatibility alias.
> **Category:** [Testing & Quality Engineering](../../03_TESTING_QUALITY.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/03_TESTING_QUALITY/TEST-07_test-isolation-hermeticity.md`

## 1. Identity

| field | value |
|---|---|
| ID | TEST-07 |
| Name | Test Isolation & Hermeticity |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | B |
| Default status | estimated |
| v1 flag | NO — v2 deep scan |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 ~2–4 h — random/parallel runs + grep audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Tests are not isolated — they depend on shared state: a live/shared database, shared fixtures mutated by earlier tests, execution order, wall-clock time, the network, or each other. They pass only in a particular environment or sequence.
- **Why it signals obsolescence:** Non-hermetic tests are the root cause of flakiness, order-dependence, and the "works on my machine" suite. They also make parallelization impossible, slow everything down, and let prod-vs-test drift hide bugs. Modern test practice demands deterministic, isolated, fast tests.
- **Where it manifests:** Tests using the shared dev DB, tests that mutate a global fixture, `sleep()` calls, tests assuming order (alphabetical luck), `--runInBand` required to pass, "must run the DB locally," tests that need external services live.
- **Objective metric:** `% of tests failing under random order`; `% failing under parallel run`; `# of sleep/timer waits`; `# of tests touching shared DB/network`.
- **Yellow flag (warning):** Some shared fixtures/order-dependence in peripheral suites; parallel run mostly passes. *(Rationale: warning — the rot is localized for now.)*
- **Red flag (critical):** Suite requires single-threaded serial execution or shared live DBs to pass, or random-order runs fail broadly. *(Rationale: the suite is environment-dependent — its results don't generalize to prod, and it cannot scale.)*
- **Example symptom:** "The suite passes on the lead's laptop with the local MySQL seeded by hand. Fresh CI fails 30% of tests. Someone 'fixes' it by setting `--runInBand`. Nobody knows the true suite state."
- **Blast radius:** Flakiness, parallelization ceiling, environment drift, prod bugs that tests can't see, CI reliability.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = hermetic + parallel; 2 = some shared state, mostly passes; 1 = serial-only or shared DB in a service; 0 = environment-dependent suite, results don't transfer.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run randomized + parallel CI to surface the worst offenders, fix shared-fixture tests, replace sleeps with waits. Structural fix: hermetic test infrastructure — per-test DBs (Testcontainers), fixtures scoped to each test, deterministic time, no network in unit tests, parallel by default.
- **Gold standard / target state:** Suite passes under random order and full parallelism on a fresh container; zero sleeps; tests never touch shared live infrastructure.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** execution sandbox (v2)
- **Tools:** randomized-order + parallel runs, fresh containers per run
- **Ecosystems:** all

## 6. Detection recipe

- **Detection method:** Run suite in random order (`--shuffle`/`--random-order`/`pytest-randomly`) and in parallel — count failures; grep for `sleep`, shared DB connection strings in tests, `beforeAll` mutation of shared state; CI on fresh containers vs. warm caches.

1. Run suite shuffled ×K; count new failures vs baseline order.
2. Run parallel with worker scaling; count interference failures.
3. Static greps (`sleep(`, shared connection strings, `beforeAll` mutation) are recorded as *hints* in emission text only — never scored.

**v1 behavior:** row ships `unknown`; hints appended to the "what it takes" appendix.

## 7. Fact schema

```json
{"test07": {"status": "unknown", "reason": "isolation provable only by executing suite",
             "static_hints": {"sleep_calls_in_tests": 14, "shared_db_url_in_tests": true}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # grep hits cannot establish hermeticity either way
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1. `static_hints` survive fact-store for v2 diffing but do not affect status/score.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — requires randomized/parallel suite execution (v2); static hints: {hint_summary}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Suite reaction to shared state; the state itself is ARCH-07's row.
