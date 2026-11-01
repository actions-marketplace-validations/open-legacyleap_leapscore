# TEST-02 — Flaky Test Rate

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for TEST-02. Edit this file; the legacy path [test-02_flaky-test-rate.md](../../../specs/03_TESTING_QUALITY/test-02_flaky-test-rate.md) is a compatibility alias.
> **Category:** [Testing & Quality Engineering](../../03_TESTING_QUALITY.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/03_TESTING_QUALITY/TEST-02_flaky-test-rate.md`

## 1. Identity

| field | value |
|---|---|
| ID | TEST-02 |
| Name | Flaky Test Rate |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | B |
| Default status | measured |
| v1 flag | NO — v2 deep scan |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 ~2–4 h — CI analytics + rerun logs. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A measurable fraction of the test suite fails intermittently without any code change — tests that pass locally, fail in CI, pass on rerun, or fail only in certain orders/environments.
- **Why it signals obsolescence:** Flaky tests are a *behavioral* tax: they train the team to distrust the suite (the "rerun it" reflex), hide real regressions, burn CI time, and erode the will to refactor. A high flake rate is a symptom of test-design debt and of a codebase too coupled to run cleanly.
- **Where it manifests:** CI rerun logs, GitHub Actions "rerun failed jobs" click-rate, `.first`/`.random` ordering issues, sleeps/timers in tests, tests that need a shared DB, non-determinism from real time/network/parallelism.
- **Objective metric:** `flake rate % (intermittent failures / test runs)`; `# of tests flaky > 2×/month`; `% of CI jobs needing reruns`; `mean rerun count per job`.
- **Yellow flag (warning):** 5–10% flaky, or a few notorious flaky tests causing weekly reruns. *(Rationale: warning — the suite is starting to lie.)*
- **Red flag (critical):** > 10% flaky, or flaky tests routinely disabled/deleted to keep CI green, or the team's reflex is "rerun it" for > 50% of failures. *(Rationale: the suite no longer verifies anything — the immune system is compromised.)*
- **Example symptom:** "Every green merge required 2–3 reruns. Two 'always flaky' tests were `@skip`'d in March. A real regression in the queue service failed three times and each failure was dismissed as flaky. It reached prod."
- **Blast radius:** Regression escape, engineer time (reruns), trust in CI, refactor willingness, release confidence.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 2%; 2 = 5–10% flaky; 1 = > 10% or skipped-to-green; 0 = suite widely distrusted, real regressions escaping.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: quarantine flaky tests (run separately, don't block but do report), fix the top 5 by root cause (sleeps → waits, shared DB → test DBs, order-dependence → isolation). Structural fix: make tests hermetic (see TEST-07), add flake detection to CI (auto-quarantine + report), hold the line: no new flaky tests.
- **Gold standard / target state:** Flake rate < 2%; zero "rerun to pass" culture; flaky tests auto-quarantined and tracked to fix within a sprint.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** execution sandbox (v2 only)
- **Tools:** suite runner ×N with `--retry` disabled + randomized order (`pytest-randomly`, jest `--sequence.shuffle`)
- **Ecosystems:** all
- **Applicability:** n/a until v2.

## 6. Detection recipe

- **Detection method:** Flake tracking — CI analytics (GitHub Actions, Datadog CI Visibility), rerun frequency, `--flaky` flags (pytest, Jest `--retry`), running the suite multiple times (`for i in {1..10}; do npm test`), randomized order runs (`--shuffle`, `--random-order`), parallel execution. Track flake rate as `flaky_failures / total_failures`.

1. Execute test suite K times in fresh containers.
2. Flakes = tests with mixed pass/fail across identical SHAs.
3. Rate = flakes / tests.

**v1 behavior:** no detection runs. Row ships `unknown`.

## 7. Fact schema

```json
{"test02": {"status": "unknown", "reason": "requires test execution (v2 deep scan)"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # flake guesses are exactly what the taxonomy forbids
unknown_when:   always in v1                     # emission text: rerun protocol above
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1 (unscored row).

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a in v1. Emission text drawn from §2 *where it manifests* + §6 *detection method* per the catalog evidence grammar.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — flakiness provable only by rerunning the suite; see 'what it takes' appendix"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Flake rate of the suite; order-dependence causes land in TEST-07 when v2 executes both.
