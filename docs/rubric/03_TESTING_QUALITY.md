# 03 — Testing & Quality Engineering

> **Canonical rubric category.** Base weight: 10% · FE-active weight: 9% · Standard indicators: TEST-01–08 · Deep-dive indicators: TEST-09–10.
>
> **One-line thesis:** The test suite is the codebase's immune system. When it weakens, every change becomes a gamble — and the codebase stops being safely modifiable at all.
>
> This file owns the category's indicator definitions and scoring semantics. Shared weights, formulas, thresholds, and gates are defined in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md); implementation recipes are in [`docs/specs/`](../specs/README.md).

**Category summary:** Scores the health of the quality engineering function — coverage, reliability, shape (pyramid), speed, and gates. A degraded suite is both a *cause* of modernization difficulty (you can't refactor what you can't verify) and a *symptom* of it (tests decay exactly like production code when unowned).

---

## Standard indicators (TEST-01–08)

### TEST-01 — Code Coverage Degradation
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** coverage % and trend by module; gate enforcement is TEST-08, core-path gaps are TEST-06.
- **Definition:** Coverage of the highest-criticality logic has fallen below a working threshold — either never measured, measured only on trivial code, or measurably dropping over time.
- **Why it signals obsolescence:** Coverage isn't a goal in itself, but it's the cheapest proxy for "can we refactor this safely?" Below ~50% branch coverage, refactoring the core is close to gambling. A coverage trend that's *falling* is a leading indicator that the suite is being abandoned while production grows.
- **Where it manifests:** CI coverage reports (Istanbul/JaCoCo/coverage.py reports), coverage dashboards, modules with notoriously no tests, "we skip tests to ship" patterns, coverage gate absent or set to 0.
- **Detection method:** Coverage runners — `c8`/`istanbul` (JS), `JaCoCo` (Java), `coverage.py`/`pytest-cov` (Python), `dotnet test --collect`, `go test -cover`; view by module, weight by criticality (core domain vs. peripheral). Track the trend over last 4 quarters.
- **Objective metric:** `branch coverage % per module`; `coverage-weighted-by-criticality`; `Δ coverage over 4 quarters`; `existence of a coverage gate in CI`.
- **Yellow flag (warning):** 50–70% branch coverage, or coverage falling > 5 points/quarter in core modules, or gate absent. *(Rationale: below this line refactors get risky; falling coverage means it's getting worse.)*
- **Red flag (critical):** < 50% branch coverage on core services, or zero coverage on a newly shipped critical path, or the coverage gate is absent *and* the trend is down. *(Rationale: the immune system can't catch the damage refactors will cause.)*
- **Example symptom:** "JaCoCo says the billing module sits at 34% branch coverage. The CI 'coverage gate' is a comment-only step that never fails. A refactor last month changed a refund boundary and the bug lived in prod for three weeks."
- **Blast radius:** Refactor safety, regression rate, incident rate, modernization feasibility, compliance evidence.
- **Remediation playbook:** Quick win: add a real coverage gate (fail below threshold) on core modules only, and instrument the trend. Structural fix: invest in testing the highest-churn/highest-risk modules first (correlate with ARCH-05), write tests as part of every bug fix (see coverage climb), make coverage a tracked product metric.
- **Gold standard / target state:** Branch coverage > 80% on core modules; coverage gate enforced in CI; coverage trend visible on a dashboard and rising or stable.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = > 80% core coverage, gate on; 2 = 50–70% with gate; 1 = < 50% on isolated paths; 0 = core untested or gate absent with falling trend.
- **Verify effort:** ⚡ ≤ 30 min — CI coverage report read.

### TEST-02 — Flaky Test Rate
**Engine tier:** B · **Default status:** measured · **Scope/overlaps:** intermittent-failure rate; root-cause hermeticity is TEST-07, skip-graveyard is TEST-05.
- **Definition:** A measurable fraction of the test suite fails intermittently without any code change — tests that pass locally, fail in CI, pass on rerun, or fail only in certain orders/environments.
- **Why it signals obsolescence:** Flaky tests are a *behavioral* tax: they train the team to distrust the suite (the "rerun it" reflex), hide real regressions, burn CI time, and erode the will to refactor. A high flake rate is a symptom of test-design debt and of a codebase too coupled to run cleanly.
- **Where it manifests:** CI rerun logs, GitHub Actions "rerun failed jobs" click-rate, `.first`/`.random` ordering issues, sleeps/timers in tests, tests that need a shared DB, non-determinism from real time/network/parallelism.
- **Detection method:** Flake tracking — CI analytics (GitHub Actions, Datadog CI Visibility), rerun frequency, `--flaky` flags (pytest, Jest `--retry`), running the suite multiple times (`for i in {1..10}; do npm test`), randomized order runs (`--shuffle`, `--random-order`), parallel execution. Track flake rate as `flaky_failures / total_failures`.
- **Objective metric:** `flake rate % (intermittent failures / test runs)`; `# of tests flaky > 2×/month`; `% of CI jobs needing reruns`; `mean rerun count per job`.
- **Yellow flag (warning):** 5–10% flaky, or a few notorious flaky tests causing weekly reruns. *(Rationale: warning — the suite is starting to lie.)*
- **Red flag (critical):** > 10% flaky, or flaky tests routinely disabled/deleted to keep CI green, or the team's reflex is "rerun it" for > 50% of failures. *(Rationale: the suite no longer verifies anything — the immune system is compromised.)*
- **Example symptom:** "Every green merge required 2–3 reruns. Two 'always flaky' tests were `@skip`'d in March. A real regression in the queue service failed three times and each failure was dismissed as flaky. It reached prod."
- **Blast radius:** Regression escape, engineer time (reruns), trust in CI, refactor willingness, release confidence.
- **Remediation playbook:** Quick win: quarantine flaky tests (run separately, don't block but do report), fix the top 5 by root cause (sleeps → waits, shared DB → test DBs, order-dependence → isolation). Structural fix: make tests hermetic (see TEST-07), add flake detection to CI (auto-quarantine + report), hold the line: no new flaky tests.
- **Gold standard / target state:** Flake rate < 2%; zero "rerun to pass" culture; flaky tests auto-quarantined and tracked to fix within a sprint.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 2%; 2 = 5–10% flaky; 1 = > 10% or skipped-to-green; 0 = suite widely distrusted, real regressions escaping.
- **Verify effort:** 🔶 ~2–4 h — CI analytics + rerun logs.

### TEST-03 — Test Pyramid Inversion
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** tier-shape and ratio; E2E runtime cost is TEST-04, brittleness source is TEST-07.
- **Definition:** The distribution of tests is inverted — few unit tests, a top-heavy layer of slow end-to-end tests, or UI-tests-as-integration-tests — instead of a pyramid (many fast unit tests, fewer integration, few E2E).
- **Why it signals obsolescence:** An inverted pyramid is expensive and slow (E2E tests are the slowest, flakiest, most brittle), gives poor failure localization (an E2E failure says nothing about where), and means most logic is tested through the UI — the least stable interface. It's the signature of a suite that grew as "just make it green" rather than by design.
- **Where it manifests:** Test suite where E2E/UI tests dominate runtime, unit tests near-zero, coverage achieved only via slow full-stack tests, `cypress`/`playwright`/`selenium` suites that take an hour, "tests that spin up the whole app."
- **Detection method:** Categorize tests by type (unit/integration/E2E) via config, runtime, or annotations; measure count and *runtime share* per tier; run a pyramid ratio: `unit_count / e2e_count`, and runtime share of E2E. Inspect what the "unit" tests actually do (do they hit the DB? the UI?).
- **Objective metric:** `unit/integration/e2e ratio (count)`; `E2E runtime share %`; `% of branches covered only by E2E`; `E2E suite duration`.
- **Yellow flag (warning):** E2E-heavy (E2E count ≥ unit count, or E2E runtime > 50% of suite time) in places. *(Rationale: warning — slow and brittle, but the coverage is at least there.)*
- **Red flag (critical):** Test pyramid fully inverted — no meaningful unit layer, all behavior tested through UI/full-stack, E2E suite hours long and frequently failing. *(Rationale: feedback is so slow and coarse that the suite provides almost no regression protection.)*
- **Example symptom:** "The 400-test suite is 340 E2E tests that boot the whole stack; they take 47 minutes. A typo in a util fails a UI test 3 screens away. Nobody can localize failures, so nobody trusts the details."
- **Blast radius:** CI time, failure localization, test flakiness, coverage of edge cases, refactor safety, developer patience.
- **Remediation playbook:** Quick win: move the top 20 E2E tests' logic down to integration/unit level (test the service, not the click). Structural fix: rebuild the pyramid over time — write unit tests for all domain logic, integration for boundaries, keep E2E for < 10 user journeys; budget E2E runtime.
- **Gold standard / target state:** Classic pyramid (e.g., 70/20/10); E2E < 10% runtime; failures localize within seconds; E2E covers only true user journeys.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = pyramid shape; 2 = overweight E2E in places; 1 = E2E-dominant in a service; 0 = no unit layer, behavior tested only through UI.
- **Verify effort:** 🔶 ~2–4 h — test categorization + runtime measurement.

### TEST-04 — Test Run Time
**Engine tier:** B · **Default status:** measured · **Scope/overlaps:** feedback-loop timing; pyramid rebalance is TEST-03, flaky rerun overhead is TEST-02.
- **Definition:** The full test suite takes so long that it throttles delivery — minutes of feedback on every commit, or so long that tests are skipped, split, or gamed.
- **Why it signals obsolescence:** Feedback latency is the core of engineering speed. Long suites push people to skip tests locally, to not run the suite before merge, and to treat CI as the "slow lane." It's both a symptom of test bloat (from the pyramid inversion, dead code, over-heavy E2E) and a cause of quality decay.
- **Where it manifests:** CI pipeline metrics (suite duration trend), `pytest --durations`, Jest timings, "tests take too long" complaints, people committing without running tests, "we split CI and hope" configurations.
- **Detection method:** CI analytics — pipeline duration per stage, test-stage duration trend over quarters; per-test timing reports (`--durations=20`, Jest `--verbose`); measure P95 feedback loop (commit → test result).
- **Objective metric:** `test-stage duration (P50/P95)`; `P95 feedback loop time`; `# of tests in the "slow" tail`; `tests skipped because of time`.
- **Yellow flag (warning):** 10–30 min suite, tests usually run before merge, slow tail known. *(Rationale: warning — still survivable, but the tax is real.)*
- **Red flag (critical):** > 30 min suite, or tests routinely not run locally, or CI times out and tests are dropped to keep deploy green. *(Rationale: at this speed the suite stops being run — it's ceremonial, not protective.)*
- **Example symptom:** "The full suite takes 52 minutes. Engineers run a 20-test subset locally. CI runs everything, so merges queue behind a queue. Someone suggests 'running tests only on release day.' The room goes quiet."
- **Blast radius:** Merge velocity, refactor willingness, CI cost, flake exposure, deploy frequency.
- **Remediation playbook:** Quick win: parallelize across shards/workers, move slow E2E out of the merge gate (nightly), fix the slowest 10 tests. Structural fix: attack root causes — pyramid rebalance (TEST-03), hermetic fast tests, caching, and a runtime budget with a gate.
- **Gold standard / target state:** Suite < 10 min P95; every engineer runs the suite before merge; a runtime budget enforced in CI.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 10 min; 2 = 10–30 min; 1 = > 30 min or split-and-hope; 0 = tests not part of the merge loop.
- **Verify effort:** ⚡ ≤ 30 min — CI pipeline metrics.

### TEST-05 — Skipped / Disabled Tests
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** skip count and age; coverage silently lost on core paths is TEST-06.
- **Definition:** A growing graveyard of `@skip`/`@Ignore`/`xit`/`pytest.skip`/commented-out tests — disabled with "fix later" intent that never comes.
- **Why it signals obsolescence:** Skipped tests are *written-down coverage* — they document that a path was important enough to test and then abandoned. Each skip is a forgotten debt. A suite with many skips has systematically withdrawn its protection, and the trend usually tracks overall maintenance abandonment.
- **Where it manifests:** `@Ignore`/`@Disabled` (JUnit), `@skip` (pytest/Jest `xit`), `describe.skip`, commented-out test blocks, "temporarily disabled for release" commits, tests excluded in CI config.
- **Detection method:** Grep for skip markers with `rg "@skip|@Ignore|xit\(|test.skip|pytest.mark.skip"`, count by module and date of skip; git log for skip-adding commits (check dates); CI config exclusions.
- **Objective metric:** `% of tests skipped (skipped / total)`; `median age of skipped tests`; `# of skips added in the last 6 months` (trend).
- **Yellow flag (warning):** 5–10% skipped, or skips concentrated in a few modules, some recent. *(Rationale: warning — a fix-it-within-a-sprint item.)*
- **Red flag (critical):** > 10% skipped, or skips aged > 6 months with no ticket, or skips added to force a release through. *(Rationale: the team is actively deleting its safety net to ship.)*
- **Example symptom:** "A pre-release audit finds 90 `@Ignore`d tests — average age 2 years. Three are the refund-eligibility edge cases. The comments say 'broken after the payments refactor, re-enable soon.'"
- **Blast radius:** Silent coverage loss, regression escape, honesty of the coverage report, team morale.
- **Remediation playbook:** Quick win: re-enable or delete each skip deliberately (delete-with-justification or fix-with-test); no skips without a linked ticket and owner. Structural fix: CI gate that fails on new skips without a ticket; a monthly "skip inventory" review; fix the top skipped module's root cause.
- **Gold standard / target state:** < 2% skipped, all with tickets + owners, none older than a sprint; new skips auto-blocked.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 2%; 2 = 5–10%; 1 = > 10% or aged; 0 = skips used to force releases or coverage silently gone.
- **Verify effort:** ⚡ ≤ 30 min — grep + git log.

### TEST-06 — Core Domain Untested
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** coverage of critical business journeys; gross coverage is TEST-01, agent test-proximity is ARCH-09.
- **Definition:** The highest-criticality flows — the code that makes or loses money, touches PII, or is the product's reason to exist — have no (or negligible) test coverage.
- **Why it signals obsolescence:** Untested core logic is a *gate* (G5). It means the system's most important behavior is verified by production incidents, not by engineering. Modernizing or even touching that code becomes a bet. This indicator is the "but the tests cover the wrong things" trap — coverage can be high elsewhere while the crown jewels are naked.
- **Where it manifests:** The billing/payments/quotes/compliance module with no tests, coverage report filtered by module shows the core at ~0%, "we never wrote tests for that," incident history clustering on the same untested path.
- **Detection method:** Cross-reference the highest-criticality modules (from business mapping) against coverage reports per module; grep the core module for test files; check incident data for the untested path (defects = unverified behavior). Use a "core-path map" — pick 10 business-critical user journeys and check each has a test.
- **Objective metric:** `coverage % of top-criticality modules`; `# of the 10 core journeys with at least one test`; `incident count on untested paths vs. tested paths`.
- **Yellow flag (warning):** Core paths partially tested (some journeys covered, gaps in edge cases), or tests exist but are E2E-only. *(Rationale: warning — the skeleton is there but the guard is thin.)*
- **Red flag (critical):** Zero tests on the highest-criticality service or core journey (triggers G5). *(Rationale: the most important behavior in the company is unverified — you cannot refactor it safely, and you cannot claim it works.)*
- **Example symptom:** "The pricing engine — the entire product — has 4% branch coverage. It was 'too complex to test.' Last quarter a pricing rule change overcharged 200 enterprise customers for 11 days. The refund call happened in the incident, not the tests."
- **Blast radius:** Business risk, regulatory risk, refactor feasibility, modernization strategy (untested core = rewrite candidate by default).
- **Remediation playbook:** Quick win: characterisation-test the core (capture current behavior, lock it), then fix the top 3 divergent behaviors. Structural fix: treat the core as the highest test priority — require tests on every core change, build a test-heavy "crown jewels" suite, tie core coverage to the gate.
- **Gold standard / target state:** All 10 core journeys have tests; core module coverage > 80%; a core change without tests cannot merge; incidents on core paths are rare and never "first discovery."
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = core fully tested; 2 = core partially tested (gaps); 1 = core tested only via E2E or edge cases missing; 0 = core untested (triggers G5).
- **Verify effort:** 🔶 ~2–4 h — module-to-criticality map + coverage cross-reference.

### TEST-07 — Test Isolation & Hermeticity
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** suite isolation under order/parallel; the code's shared-state cause is ARCH-07.
- **Definition:** Tests are not isolated — they depend on shared state: a live/shared database, shared fixtures mutated by earlier tests, execution order, wall-clock time, the network, or each other. They pass only in a particular environment or sequence.
- **Why it signals obsolescence:** Non-hermetic tests are the root cause of flakiness, order-dependence, and the "works on my machine" suite. They also make parallelization impossible, slow everything down, and let prod-vs-test drift hide bugs. Modern test practice demands deterministic, isolated, fast tests.
- **Where it manifests:** Tests using the shared dev DB, tests that mutate a global fixture, `sleep()` calls, tests assuming order (alphabetical luck), `--runInBand` required to pass, "must run the DB locally," tests that need external services live.
- **Detection method:** Run suite in random order (`--shuffle`/`--random-order`/`pytest-randomly`) and in parallel — count failures; grep for `sleep`, shared DB connection strings in tests, `beforeAll` mutation of shared state; CI on fresh containers vs. warm caches.
- **Objective metric:** `% of tests failing under random order`; `% failing under parallel run`; `# of sleep/timer waits`; `# of tests touching shared DB/network`.
- **Yellow flag (warning):** Some shared fixtures/order-dependence in peripheral suites; parallel run mostly passes. *(Rationale: warning — the rot is localized for now.)*
- **Red flag (critical):** Suite requires single-threaded serial execution or shared live DBs to pass, or random-order runs fail broadly. *(Rationale: the suite is environment-dependent — its results don't generalize to prod, and it cannot scale.)*
- **Example symptom:** "The suite passes on the lead's laptop with the local MySQL seeded by hand. Fresh CI fails 30% of tests. Someone 'fixes' it by setting `--runInBand`. Nobody knows the true suite state."
- **Blast radius:** Flakiness, parallelization ceiling, environment drift, prod bugs that tests can't see, CI reliability.
- **Remediation playbook:** Quick win: run randomized + parallel CI to surface the worst offenders, fix shared-fixture tests, replace sleeps with waits. Structural fix: hermetic test infrastructure — per-test DBs (Testcontainers), fixtures scoped to each test, deterministic time, no network in unit tests, parallel by default.
- **Gold standard / target state:** Suite passes under random order and full parallelism on a fresh container; zero sleeps; tests never touch shared live infrastructure.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = hermetic + parallel; 2 = some shared state, mostly passes; 1 = serial-only or shared DB in a service; 0 = environment-dependent suite, results don't transfer.
- **Verify effort:** 🔶 ~2–4 h — random/parallel runs + grep audit.

### TEST-08 — Quality Gates in CI
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** CI gate presence; per-axis thresholds live with their rows (coverage TEST-01, complexity ARCH-01).
- **Definition:** There are no automated quality gates — no static analysis (SAST/lint), no coverage threshold, no complexity budget, no security scan — blocking or reporting on the merge path. Quality relies entirely on human review.
- **Why it signals obsolescence:** Gates are the difference between a *process* that maintains quality and a *hope* that it does. A codebase without gates is one where every quality debt is discovered by incident or by argument. It's also a signal the CI was built in an era before quality tooling, or that the team has given up on enforcement.
- **Where it manifests:** CI that only builds and runs tests (or not even that), no lint step, no SAST (Semgrep/SonarQube/CodeQL), no coverage gate, no `knip`/complexity check, "reviewers are the gate" as the whole policy.
- **Detection method:** CI config audit — read the pipeline (GitHub Actions/`.gitlab-ci.yml`/Jenkinsfile): list jobs; check for lint/static-analysis/coverage/security stages; check if gates fail the build or just comment; count of merges that bypassed CI (admin merges).
- **Objective metric:** `# of quality tool stages in CI`; `% of mergeable PRs blocked by a gate`; `# of bypassed/admin merges per month`; `existence of coverage & lint & SAST gates`.
- **Yellow flag (warning):** Linting only; no coverage or SAST gate; quality relies on review. *(Rationale: warning — some guard exists but it's toothless on the important axes.)*
- **Red flag (critical):** No static analysis or quality gates of any kind on the merge path. *(Rationale: every quality defect is discovered downstream — the process has no immune system either.)*
- **Example symptom:** "The CI 'pipeline' is build + test. A `console.log(process.env.AWS_SECRET)` gets merged behind an admin bypass because the 'reviewer was busy.' Nothing ran to catch it."
- **Blast radius:** Secret leakage, dead code, security debt, coverage decay, quality disputes, refactor safety.
- **Remediation playbook:** Quick win: add lint + SAST (Semgrep/CodeQL/SonarQube) as failing stages, add a coverage gate on core, block admin bypass (require justification audit). Structural fix: define the quality bar in code (lint rules, complexity budgets, coverage thresholds, security checks) and let CI enforce it; tie all gates to the same config the team reviews.
- **Gold standard / target state:** CI fails on lint, SAST, coverage, complexity, and security findings; bypasses are impossible or audited; the gates' config is itself reviewed.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full gates enforced; 2 = lint-only, review as gate; 1 = gates exist but bypassable/comment-only; 0 = no gates at all.
- **Verify effort:** ⚡ ≤ 30 min — CI config read.

---

## Deep-dive indicators (TEST-09–10)

### TEST-09 — Mutation Testing Score
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** verification depth via mutants; plain coverage is TEST-01, weak-assertion rot is TEST-10.
- **Definition:** Mutation testing results — the percentage of injected mutants (faults) the test suite actually kills — indicating whether the suite *verifies* behavior or merely *executes* code. A suite can have high coverage and kill almost no mutants (assertions missing or weak).
- **Why it signals obsolescence:** Coverage measures "did we run the code," not "would we catch a bug in it." A low mutation score means the suite is theater — green CI with low real protection. For a modernization decision, it's the difference between "refactor with confidence" and "refactor into a brick wall."
- **Where it manifests:** Mutation tool reports — Stryker (JS/TS/Java/C#), MutPy (Python), PIT (Java), go-mutesting; a suite with high line coverage but weak assertions, tests that only call functions without asserting outcomes, snapshot-heavy tests that auto-update.
- **Detection method:** Run mutation testing on a representative module (often the core domain) — Stryker/PIT/MutPy default operators; compute killed/overall mutant ratio; time-box to a module (full-repo mutation is slow). Watch for equivalent mutants and timeouts as noise.
- **Objective metric:** `mutation score % (killed / (killed + survived + timeout))`; `# of surviving mutants in the core module`; `assertion strength (asserts per test) as a proxy`.
- **Yellow flag (warning):** 60–80% mutation score; some survivors in edge cases; assertions weak in peripheral tests. *(Rationale: decent, but surviving mutants mark blind spots.)*
- **Red flag (critical):** < 60% mutation score on the core module, or surviving mutants in security/pricing/correctness logic. *(Rationale: the suite looks green but wouldn't catch a real bug in the code that matters.)*
- **Example symptom:** "The payments suite has 92% line coverage — and a 41% mutation score. Stryker kills the refund-on-credit check; the suite goes green. 'Coverage' had been the department's KPI for years."
- **Blast radius:** True regression protection, refactor confidence, false sense of security in coverage KPIs, audit credibility.
- **Remediation playbook:** Quick win: run mutation on the top-criticality module, fix the highest-value survivors (add assertions, kill branches). Structural fix: run mutation on core modules in CI (time-boxed), use surviving-mutant count as a tracked quality metric, strengthen weak assertions.
- **Gold standard / target state:** Core module mutation score ≥ 85%; mutation runs in CI on the core; survivors are reviewed and justified.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = ≥ 85% core; 2 = 60–80%; 1 = < 60% core or key-logic survivors; 0 = suite executes but verifies almost nothing.
- **Verify effort:** 🔷 ~1–2 days — mutation run + survivor triage.

### TEST-10 — Test Maintenance Burden
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** ongoing suite upkeep cost; symptom flakes/skips are TEST-02/TEST-05.
- **Definition:** The ongoing cost of keeping the suite green — how often tests break from *infrastructure* rather than *behavior* changes, how much engineering time goes to fixing/debugging tests vs. writing features, snapshot churn, and the ratio of "test fix" commits to feature commits.
- **Why it signals obsolescence:** A suite that costs more to maintain than it saves is net-negative — and teams quietly stop investing in it, which then shows up as the other TEST indicators (flakes, skips, inverted pyramid). High maintenance burden is the *cause* under the symptoms.
- **Where it manifests:** Git log ("fix test", "update snapshot", "flaky fix" commits), snapshot churn (CI updating goldens constantly), test-debugging sessions, PRs blocked by unrelated test failures, `--update-snapshots` habitual use, "tests changed because we changed X" infra coupling.
- **Detection method:** Git archaeology — count commits matching `/fix test|snapshot|flake|test update/i` as a share of all commits; snapshot update frequency; time-tracking (rough survey); correlated-failure analysis (which production change breaks which unrelated tests).
- **Objective metric:** `test-fix commit share %`; `snapshot updates per month`; `mean time to diagnose a failing test`; `% of PRs touching only tests (as maintenance signal)`.
- **Yellow flag (warning):** 10–20% of commits are test maintenance; snapshot churn noticeable; tests coupled to infra details. *(Rationale: warning — the tax is growing.)*
- **Red flag (critical):** > 25% of commits are test maintenance, or tests break on every infra/rename change (coupled to internals not behavior), or the team actively dreads the suite. *(Rationale: the suite has become a tax, and the response will be abandonment.)*
- **Example symptom:** "Every merge requires 'fix the test that broke because we renamed a field.' Snapshot files churn daily. Sprint velocity shows 30% of story points eaten by 'test upkeep.' The team starts merging without running tests."
- **Blast radius:** Feature velocity, test abandonment risk, engineer morale, regressions that follow test disinvestment.
- **Remediation playbook:** Quick win: break the coupling — assert behavior not internals (mock at boundaries, not implementation), stabilize flaky snapshots, stop auto-updating snapshots. Structural fix: treat the suite as a product (owner, budget, KPIs), refactor tests to test contracts not internals, track test-maintenance share as a metric with a ceiling.
- **Gold standard / target state:** < 10% of commits are test maintenance; tests break only when behavior changes; the suite is seen as an asset, not a tax.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = < 10% maintenance; 2 = 10–20%; 1 = 20–25% or internal-coupled; 0 = > 25%, team avoiding the suite.
- **Verify effort:** 🔷 ~1–2 days — git archaeology + team survey.
