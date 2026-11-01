# TEST-09 — Mutation Testing Score

> **Category:** [Testing & Quality Engineering](../../03_TESTING_QUALITY.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | TEST-09 |
| Name | Mutation Testing Score |
| Category | TEST — Testing & Quality Engineering |
| Engine tier | B |
| Default status | estimated |
| v1 flag | NO — v2 deep scan |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: TEST` |
| Verify effort | 🔷 ~1–2 days — mutation run + survivor triage. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Mutation testing results — the percentage of injected mutants (faults) the test suite actually kills — indicating whether the suite *verifies* behavior or merely *executes* code. A suite can have high coverage and kill almost no mutants (assertions missing or weak).
- **Why it signals obsolescence:** Coverage measures "did we run the code," not "would we catch a bug in it." A low mutation score means the suite is theater — green CI with low real protection. For a modernization decision, it's the difference between "refactor with confidence" and "refactor into a brick wall."
- **Where it manifests:** Mutation tool reports — Stryker (JS/TS/Java/C#), MutPy (Python), PIT (Java), go-mutesting; a suite with high line coverage but weak assertions, tests that only call functions without asserting outcomes, snapshot-heavy tests that auto-update.
- **Objective metric:** `mutation score % (killed / (killed + survived + timeout))`; `# of surviving mutants in the core module`; `assertion strength (asserts per test) as a proxy`.
- **Yellow flag (warning):** 60–80% mutation score; some survivors in edge cases; assertions weak in peripheral tests. *(Rationale: decent, but surviving mutants mark blind spots.)*
- **Red flag (critical):** < 60% mutation score on the core module, or surviving mutants in security/pricing/correctness logic. *(Rationale: the suite looks green but wouldn't catch a real bug in the code that matters.)*
- **Example symptom:** "The payments suite has 92% line coverage — and a 41% mutation score. Stryker kills the refund-on-credit check; the suite goes green. 'Coverage' had been the department's KPI for years."
- **Blast radius:** True regression protection, refactor confidence, false sense of security in coverage KPIs, audit credibility.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = ≥ 85% core; 2 = 60–80%; 1 = < 60% core or key-logic survivors; 0 = suite executes but verifies almost nothing.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run mutation on the top-criticality module, fix the highest-value survivors (add assertions, kill branches). Structural fix: run mutation on core modules in CI (time-boxed), use surviving-mutant count as a tracked quality metric, strengthen weak assertions.
- **Gold standard / target state:** Core module mutation score ≥ 85%; mutation runs in CI on the core; survivors are reviewed and justified.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** execution sandbox (v2)
- **Tools:** `stryker` (JS/TS), `PIT` (Java), `mutmut`/`MutPy` (Python), time-boxed to one core module
- **Ecosystems:** JS/TS · Java · Python

## 6. Detection recipe

- **Detection method:** Run mutation testing on a representative module (often the core domain) — Stryker/PIT/MutPy default operators; compute killed/overall mutant ratio; time-box to a module (full-repo mutation is slow). Watch for equivalent mutants and timeouts as noise.

1. Select representative core module.
2. Run mutator with default operators, time-boxed.
3. Score = killed / total mutants (watch equivalent-mutant noise per §3).

**v1 behavior:** `unknown`. Static hints (mutation config files present: `stryker.conf.json`, `pitest` pom entries — "configured but no evidence of runs") recorded as basis-free notes.

## 7. Fact schema

```json
{"test09": {"status": "unknown",
             "reason": "mutation testing executes the suite against mutants (v2)",
             "config_present": ["stryker.conf.json"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # a configured-but-unrun score would be exactly a scored guess
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

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs a time-boxed mutation run on a core module (v2 deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Mutant kill strength; ordinary coverage is TEST-01's row.
