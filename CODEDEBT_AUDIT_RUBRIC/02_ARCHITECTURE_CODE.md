# 02 — Architecture & Code Quality

> **Weight:** 15% · **Standard:** ARCH-01…08 · **Deep-dive:** ARCH-09, 10
>
> **One-line thesis:** Architecture debt is the shape of the code disagreeing with what the code now needs to do. When the shape is wrong, every future feature is a fight.

**Category summary:** Scores the internal structure of the codebase — complexity, coupling, boundaries, dead code, churn hot spots, architectural era, and state hygiene. This is the highest-weight *engineering* category (15%) because architecture determines whether a system can be modernized incrementally at all or must be treated as a rewrite candidate.

---

## Standard indicators

### ARCH-01 — Cognitive Complexity & God Classes
- **Definition:** Methods, classes, and modules exceed sane complexity budgets — deeply nested branches, methods doing many things, "God Classes" absorbing unrelated responsibilities, files that are thousands of lines long.
- **Why it signals obsolescence:** Complexity is the root tax on every other activity: tests are harder to write, bugs harder to reason about, refactors riskier, onboarding slower. High complexity correlates strongly with defect density and is the classic signature of code that accreted without design pressure.
- **Where it manifests:** Large files, methods with many `if`/`else`/`for`/`while`/`catch` levels, classes with many fields/methods (God Classes), `God object` smells, deeply nested conditionals, methods with 10+ branches.
- **Detection method:** Static analysis — SonarQube/SonarCloud cognitive complexity, CodeClimate maintainability, `radon` (Python `cc`), `eslint complexity`/`cognitive-complexity`, `lizard`, `jscpd`; IDE metrics; grep for file LOC. Compute max/mean method complexity per module; flag modules in the top decile.
- **Objective metric:** `max method cognitive complexity`; `mean per-module complexity`; `# of classes > 500 LOC`; `# of methods > 30 complexity`; `file LOC p95`.
- **Yellow flag (warning):** Method complexity 15–30, classes 500–2,000 LOC, complexity concentrated in a few known files. *(Rationale: above SonarQube's default acceptable line but still refactorable in place.)*
- **Red flag (critical):** Method complexity > 30, classes > 2,000 LOC, or God Classes in core domain logic. *(Rationale: these units are no longer safely modifiable — tests are effectively impossible; defect rate is structurally high.)*
- **Example symptom:** "The `OrderProcessor.process` method is 900 lines with 14 nested branches and 8 responsibilities. A one-line discount change last month took three days and regressed two unrelated paths. Nobody reviews it anymore; they just approve."
- **Blast radius:** Defect density, review speed, test feasibility, onboarding, refactor risk, staff turnover around "the scary file."
- **Remediation playbook:** Quick win: carve the top 5 offenders by automated extract-method (IDE-assisted, with tests), add a complexity budget to CI (`eslint max-complexity`, SonarQube gate). Structural fix: a structured decomposition of God Classes by responsibility; strangle complexity behind facades; pair the two riskiest files on a refactor sprint.
- **Gold standard / target state:** Complexity budget enforced in CI; max method complexity < 15; no file > 1,000 LOC; the top-decile complexity list is shrinking and tracked.
- **Scoring guidance:** 3 = within budgets; 2 = offenders in non-core modules; 1 = God Class in an isolated core path; 0 = core domain logic is unmodifiable God Classes.
- **Verify effort:** 🔶 ~2–4 h — analyzer run + review of top offenders.

### ARCH-02 — Coupling & Cohesion
- **Definition:** Modules are highly interdependent (coupling) and/or each module bundles many unrelated responsibilities (low cohesion). The system behaves like a plate of tangled spaghetti rather than a set of deep, single-purpose modules.
- **Why it signals obsolescence:** Low cohesion/high coupling is the anti-thesis of maintainability: changes ripple, nothing is replaceable in isolation, and modernization becomes all-or-nothing. It's the architectural fingerprint of a codebase that grew by addition.
- **Where it manifests:** Modules importing from many unrelated modules, services reaching into other services' internals, a "utils" module everyone depends on, god modules, shared DTOs across everything, hidden dependencies via globals.
- **Detection method:** Dependency Structure Matrix (DSM) via Lattix/Structure101, dependency analysis via `jdepend`/`arc42`, ArchUnit, `dependency-cruiser` (JS/TS), `python-dependency-inspector`; manual: import/require graph analysis; measure per-module fan-in/fan-out; detect cycles (ARCH-03) as a symptom.
- **Objective metric:** `mean module fan-in/fan-out`; `# of modules in the top coupling quintile`; `# of cross-service imports/DB accesses`; `size of the central "utils" hub`; `cohesion score (e.g., LCOM)`.
- **Yellow flag (warning):** Cyclic dependencies present between submodules; a growing central hub; several modules with fan-out > 20. *(Rationale: warning-level — you can still reason about it, but ripples are starting.)*
- **Red flag (critical):** Circular dependencies across bounded contexts, or services sharing DBs/tables directly, or one omnipresent "everything" module everyone imports. *(Rationale: no module is independently changeable; this blocks any incremental modernization.)*
- **Example symptom:** "Every service imports `shared-utils`, which imports the DB layer. To change how a config is read, you touch 12 services. A 'small' internal refactor becomes a system-wide deployment."
- **Blast radius:** Change ripple, test isolation, independent deployability, team autonomy (Conway's law inverts — teams can't split), modernization feasibility.
- **Remediation playbook:** Quick win: draw the DSM, pick the 3 highest-fan-in hubs, wrap them behind interfaces and shrink their API. Structural fix: define bounded contexts and enforce them with ArchUnit-style rules in CI; extract the shared hub into a stable, narrow contract; invert dependencies toward stable abstractions.
- **Gold standard / target state:** Acyclic dependency graph at the module boundary; every module has narrow, explicit dependencies; teams can change their module without coordination (tested via a chaos week).
- **Scoring guidance:** 3 = clean, enforced boundaries; 2 = cycles in peripheral modules; 1 = cycles across core modules; 0 = DB-coupled services / omnipresent hub.
- **Verify effort:** 🔶 ~2–4 h — dependency graph tooling + manual DSM read.

### ARCH-03 — Layer & Boundary Violations
- **Definition:** Architectural layers (presentation → application → domain → infrastructure, or bounded contexts) are routinely crossed in the wrong direction: UI code touching the DB, domain logic in controllers, services importing each other's internals, business rules in views or stored procedures.
- **Why it signals obsolescence:** Eroded boundaries mean the architecture exists only in theory. Once rules don't live where they should, nothing can be reasoned about, tested in isolation, or swapped — the system reverts to "everything depends on everything" and every boundary enforcement is gone.
- **Where it manifests:** Controllers with business logic, domain objects with persistence concerns, UI layer with SQL, services reaching into other services' DBs, stored procedures containing business rules, `#pragma`/`module` hacks, layered module that doesn't exist on disk.
- **Detection method:** Architecture enforcement tools — ArchUnit/NetArchTest/ArchUnitNET (Java/.NET), `dependency-cruiser` with rules (JS/TS), `import-linter` (Python), `yapf`+ custom lints, SonarQube architecture rules; manual: a 30-min tour of one vertical slice tracing UI→logic→persistence to check direction. Run existing rule tests (if none exist, that's itself a finding).
- **Objective metric:** `# of rule violations (if rules exist)`; `existence of arch tests in CI`; `% of controllers/views containing domain logic` (sampled); `# of direct cross-layer SQL/ORM calls from UI`.
- **Yellow flag (warning):** Occasional boundary crossings that reviewers miss; no architecture tests enforcing rules. *(Rationale: violations are currently luck-based — the guard is missing.)*
- **Red flag (critical):** System-wide boundary erosion — UI/controllers do persistence, business rules live in stored procedures, or no architecture enforcement exists *and* the drift is visible in a quick tour. *(Rationale: the architecture is nominal only; treat as structural debt.)*
- **Example symptom:** "The Rails controller for the invoice screen runs three raw SQL queries and an email send, then renders. The domain model is anemic. The 'architecture' — everyone says — is 'the app is the architecture.'"
- **Blast radius:** Testability, security (SQL in views), refactor safety, domain logic duplication, compliance traceability.
- **Remediation playbook:** Quick win: add an arch test (ArchUnit/import-linter) and fix the top violations; enforce at PR time. Structural fix: rebuild the lost layers — extract domain into its own module, move persistence behind repositories, keep UI thin; do it one vertical slice at a time.
- **Gold standard / target state:** Architecture rules enforced in CI; a 30-minute vertical-slice tour confirms correct directions; business rules live in the domain layer only.
- **Scoring guidance:** 3 = boundaries enforced; 2 = occasional violations, no guard yet; 1 = violations in core slices; 0 = systemic erosion, architecture nominal.
- **Verify effort:** 🔶 ~2–4 h — rule setup + vertical slice tour.

### ARCH-04 — Dead & Orphaned Code
- **Definition:** Unreferenced functions, classes, endpoints, feature flags that are permanently on (or permanently off), unreachable branches, duplicate implementations where only one is used, and modules that nothing imports.
- **Why it signals obsolescence:** Dead code is fossilized intent. It costs readers time (is this used?), auditors time, and test-maintenance time, and it accumulates whenever the codebase is touched without pruning — a hallmark of unowned code. It also hides which live paths are actually in production.
- **Where it manifests:** Unused exports/imports, feature flags stuck true/false with no plan, endpoints with zero traffic, utility functions with no callers, commented-out blocks, dead branches (`if (false)`), shadowed duplicates.
- **Detection method:** Dead-code eliminators — `knip` (TS/JS), `unimported`, `depcheck`, `vulture` (Python), `pyflakes` unused, `golangci-lint` unused, IntelliJ/WebStorm unused-code inspection; coverage diffs (run coverage; code never executed in prod-like tests); API traffic logs for zero-traffic endpoints; git archaeology for "last touched 5 years ago."
- **Objective metric:** `% of functions unreferenced`; `count of zero-traffic endpoints`; `# of permanently-on feature flags`; `dead-code report delta between quarters`.
- **Yellow flag (warning):** 10–20% of functions unreferenced, or a handful of zero-traffic endpoints, or flags on for > 1 year. *(Rationale: warning-level bloat — prune it before it compounds.)*
- **Red flag (critical):** > 20% dead code, or unreferenced endpoints live in production exposing attack surface, or the dead-code report has grown two quarters in a row. *(Rationale: the codebase is decaying faster than it's being maintained — plus live-but-orphaned endpoints are an attack surface.)*
- **Example symptom:** "Knip finds 340 unreferenced exports and 12 endpoints with zero production traffic. One of them — a legacy admin route — still passes auth and hits the DB. Nobody knows it exists."
- **Blast radius:** Reader confusion, attack surface, test maintenance, coverage metrics lying to you, refactor accidents.
- **Remediation playbook:** Quick win: run knip/vulture, delete safely (git history preserves), remove orphaned endpoints and the routes that point to them. Structural fix: a "no dead code" PR gate (knip in CI, fail on new unreferenced exports), flag retirement policy (flags > 6 months get removed or justified), quarterly pruning ritual.
- **Gold standard / target state:** Dead-code scan clean in CI; every feature flag has an owner and a retirement date; all prod endpoints are in an API inventory with traffic.
- **Scoring guidance:** 3 = scan clean; 2 = 10–20% dead code in peripheral areas; 1 = > 20% or orphaned endpoints in isolated services; 0 = orphaned endpoints live on core/auth paths.
- **Verify effort:** ⚡ ≤ 30 min — one tool run + report read.

### ARCH-05 — Code Churn vs. Defect Hot Spots
- **Definition:** A small fraction of files absorbs a disproportionate share of commits (churn), and those same files produce a disproportionate share of defects and incident fixes. Change is fractal: the same code is reworked over and over.
- **Why it signals obsolescence:** High-churn/high-defect "hot spots" are where the codebase is actively fighting its own shape. They signal that a module's design is wrong for its workload — and the fix isn't more commits, it's a redesign. DORA and CodeScene research tie this pattern directly to delivery slowdown and engineer churn.
- **Where it manifests:** Git history (files with the most commits and most bug-fix commits), bug tracker (which modules get the most defect tickets), incident data (which files are implicated in production fixes), files that are touched on every feature.
- **Detection method:** Git hot-spot analysis — CodeScene, GitPrime/Pluralsight Flow, `git log --since --oneline -- <path> | wc -l`, `git blame` density, commit graph mining (custom script counting commits/bugfixes per file); correlate with defect tracker (`gh issue --search "in:title bug"` grouped by path). Compute churn rank and defect rank; flag files in both top deciles.
- **Objective metric:** `churn concentration (top 10% files' % of commits)`; `defect correlation (top churn files' % of bug fixes)`; `# of files in the churn∩defect intersection`.
- **Yellow flag (warning):** Top 5% churned files show moderate bug frequency; churn is concentrated but defects not yet correlated. *(Rationale: warning — the shape is starting to hurt.)*
- **Red flag (critical):** Top 10% churned files account for > 50% of production incident fixes, or a single file is both #1 churn and #1 defect. *(Rationale: the module is structurally broken — every change breeds a bug.)*
- **Example symptom:** "GitPrime shows the auth module has 40% of all commits and 60% of all incident fixes. Every security tweak touches it; every tweak ships a regression. The team knows it's wrong but 'can't stop to fix it.'"
- **Blast radius:** Delivery throughput, incident rate, engineer retention (people burn out on the hot file), review load.
- **Remediation playbook:** Quick win: put the top hot spot behind a designated owner, add targeted tests, freeze feature scope on it for one sprint. Structural fix: redesign the hot spot — decompose by responsibility, rewrite the risky core with tests first, rotate engineers to avoid bus-factor in the fix. Track the metric quarterly to prove improvement.
- **Gold standard / target state:** Churn evenly distributed relative to responsibility; no file in the top churn∩defect intersection for two quarters; hot-spot list tracked in the refactoring backlog.
- **Scoring guidance:** 3 = no overlap; 2 = churn concentrated, defects mild; 1 = hot spot in an isolated path; 0 = hot spot in core logic driving incidents.
- **Verify effort:** 🔶 ~2–4 h — git mining + defect tracker correlation.

### ARCH-06 — Architectural Era / Framework Generation
- **Definition:** The codebase's architectural style is one or more generations behind the ecosystem norm — e.g., a non-modular monolith with no dependency injection where modules are expected, global singleton state where DI is expected, or an architecture style (e.g., action-command giant controllers, RPC-style god endpoints) that modern practice has replaced.
- **Why it signals obsolescence:** Architectural style is a proxy for how much of the system's mechanics are "solved" by structure vs. reinvented by hand. Old eras lack the seams that make change, testing, and tooling cheap. A codebase that predates modularity has to build those seams manually — a huge modernization drag.
- **Where it manifests:** No DI container (manual wiring in a central bootstrap), no package/module boundaries on disk, static service locators, giant controller/service classes, everything depending on everything, build system that doesn't support modules, tests that need a live stack because nothing is swappable.
- **Detection method:** Architecture inventory — a "generation test": can you instantiate a core service in a unit test without the DB/network? Can you swap one implementation for another without editing callers? Check for DI, module boundaries, hexagonal/ports-and-adapters seams. Compare against the current norm for the language (e.g., .NET 8 modular monolith vs. WebForms-era, Spring Boot vs. EJB 2).
- **Objective metric:** `generational gap (0/1/2/3+)`; `% of core services constructible in a unit test`; `presence of DI`; `presence of module boundaries`; `# of static singletons/service locators`.
- **Yellow flag (warning):** One generation behind — some seams exist but testing requires a live stack for many paths. *(Rationale: modernization is still incremental — a facade can buy time.)*
- **Red flag (critical):** Two+ generations behind — no DI, no module seams, tests require the full stack, or the architecture style (e.g., EJB 2-era) has no modern tooling support. *(Rationale: the seams modernization needs don't exist; you're building them before you can refactor.)*
- **Example symptom:** "The Java codebase was written in 2008: static service locators, no interfaces, 2,000-line controllers. There is no way to unit-test a service without a live Oracle and a message queue. 'Refactoring' means 'risking prod.'"
- **Blast radius:** Testability, tooling support, hiring, incremental-refactor feasibility, speed of every future change.
- **Remediation playbook:** Quick win: introduce interface seams around the 3 worst-coupled cores, add a couple of tests to prove the seams work. Structural fix: adopt the modern architecture incrementally — introduce a DI container, extract modules with enforced boundaries, wrap legacy access behind ports, migrate vertical slices one at a time.
- **Gold standard / target state:** Core logic testable without live infrastructure; DI and module boundaries standard; new features land in the modern style while legacy shrinks.
- **Scoring guidance:** 3 = current generation; 2 = one generation behind, seams exist; 1 = two generations behind in isolated services; 0 = whole system two+ generations behind with no seams.
- **Verify effort:** 🔶 ~2–4 h — architecture tour + a "unit-test-without-stack" experiment.

### ARCH-07 — Global Mutable State & Hidden Dependencies
- **Definition:** The system relies on global mutable state — singletons, module-level variables, static mutable fields, ambient configuration, shared caches — and hides dependencies (time, randomness, network, the DB) inside functions rather than injecting them.
- **Why it signals obsolescence:** Hidden dependencies and globals make correctness a function of execution order and history rather than of inputs. Tests become order-dependent, concurrency becomes a minefield, and the code can't be reasoned about in isolation. Modern practice (pure functions, explicit dependencies, DI) exists precisely to eliminate this class of bug.
- **Where it manifests:** Singleton service locators, static mutable fields, module-level `config`/`state` objects, functions calling `time.now()`/`Math.random()`/the DB directly (not injected), hidden global caches, order-dependent initialization, "set state at import time" patterns.
- **Detection method:** Static analysis + manual — grep for singleton/service-locator patterns, `static` mutable fields, direct `DateTime.Now`/`new Date()` in logic (vs. injected clock), direct ORM calls in domain functions; dependency injection presence; a test experiment: run the suite in random order / in parallel and count failures (also feeds TEST-07). Tools: `architecture-tests`, `import-linter`, SonarQube, greps.
- **Objective metric:** `# of global mutable singletons`; `# of logic functions calling time/random/IO directly`; `% of tests order-dependent`; `concurrency failure count under parallel test run`.
- **Yellow flag (warning):** Globals/singletons present in non-core paths, or a handful of hidden-dependency calls; tests currently pass serially. *(Rationale: warning — it hasn't bit yet, but it's the same class as the red flag.)*
- **Red flag (critical):** Shared mutable state in core business flows, or hidden time/IO in core logic, or parallel/randomized test runs fail. *(Rationale: correctness is now order-dependent — a structural correctness debt, not just a style debt.)*
- **Example symptom:** "The currency converter reads a `static ExchangeRateService` populated at app start. A deployment that changed init order silently used yesterday's rates for 40 minutes. The test suite passes only because it runs single-threaded in import order."
- **Blast radius:** Concurrency bugs, test reliability, race conditions in prod, hard-to-reproduce defects, refactor risk.
- **Remediation playbook:** Quick win: inject the clock/random/IO at the seams you can reach; make the top 5 singletons instances with explicit wiring. Structural fix: eliminate globals by constructor injection; make state explicit and owned; introduce a proper initialization/DI lifecycle; enforce "no static mutable" with a lint.
- **Gold standard / target state:** All dependencies explicit and injected; time/random/IO behind interfaces; test suite passes under random/parallel execution; zero mutable statics in core.
- **Scoring guidance:** 3 = explicit dependencies everywhere; 2 = globals in peripheral code; 1 = globals/hidden deps in core, tests serial-only; 0 = core correctness is order/concurrency-dependent.
- **Verify effort:** 🔶 ~2–4 h — grep sweep + parallel-test experiment.

### ARCH-08 — Duplication Debt
- **Definition:** The same logic, algorithms, or structures are copy-pasted across the codebase and/or across services, with variations drifting over time — "the same bug in 5 places."
- **Why it signals obsolescence:** Duplication is the most visible sign that code wasn't given a home to live in. Every duplicated instance multiplies fix cost, allows drift (one copy gets the fix, others don't), and inflates the surface area of every change. It's the persistence of "temporary" code that became permanent.
- **Where it manifests:** Similar functions/classes across modules, copy-pasted validation/date/price logic, identical DTOs, duplicated middleware/error handling, near-identical test fixtures, similar blocks in different languages.
- **Detection method:** Clone detection — `jscpd` (code clone detection, all languages), PMD-CPD, Simian, SonarQube duplication, `dupl` (Go), `pylint` similar; manual: two files implementing the same concept; cross-service grep for the same constant/logic string.
- **Objective metric:** `clone/duplication % (SonarQube or jscpd)`; `# of duplicated logic clusters`; `count of near-identical files`; `cross-service duplication instances`.
- **Yellow flag (warning):** Duplication 10–20%, mostly within a module, mostly peripheral. *(Rationale: warning — extract and consolidate before it becomes a web.)*
- **Red flag (critical):** > 25% duplication, or the same core business logic duplicated across services (where a bug in one copy costs money), or duplicated security/auth logic. *(Rationale: divergent copies of critical logic are a correctness and security hazard.)*
- **Example symptom:** "The pricing discount rule exists in six places across three services. Last quarter one place got 'fixed' for a client; the other five didn't. The client's accountant noticed first."
- **Blast radius:** Fix multiplication, drift bugs, test bloat, inconsistency in business rules, security (auth duplicated, one copy weak).
- **Remediation playbook:** Quick win: run jscpd, consolidate the top clusters behind a shared library (start with the business-critical ones). Structural fix: establish a shared internal library with a review process; kill duplicates at PR time (clone scan in CI); migrate duplicated logic incrementally with tests preserving behavior.
- **Gold standard / target state:** Duplication < 10%; core business rules exist exactly once, in one owned library; clone scan in CI fails new duplication.
- **Scoring guidance:** 3 = < 10% dup, single source of truth; 2 = 10–20% peripheral dup; 1 = dup in core logic within one service; 0 = core rules duplicated across services with drift.
- **Verify effort:** 🔶 ~2–4 h — clone detector + cross-service grep.

---

## Deep-dive indicators

### ARCH-09 — Nullable/Untyped Code & Runtime Error Density
- **Definition:** The codebase is weakly typed or relies on implicit nullability where modern practice expects static typing and explicit null safety — dynamic dispatch, `any`/`Object` as a type, unchecked casts, defensive null checks scattered everywhere, stringly-typed arguments — and runtime errors (NPEs, `undefined` access) are a visible fraction of incidents.
- **Why it signals obsolescence:** Type safety is a modernization "tax" that's often the whole point of upgrading: it converts a class of runtime bugs into compile-time errors. A codebase that predates or rejects it carries a permanently higher runtime-error rate and makes large refactors (renames, signature changes) dangerous and slow.
- **Where it manifests:** TypeScript `any` everywhere, Python without type hints in hot paths, Java/C# with pervasive null checks and unchecked casts, dynamic languages doing introspection, `Optional.get()` chains, crash logs dominated by null/undefined exceptions.
- **Detection method:** Type-lint rules — TypeScript `no-explicit-any`, `strict` mode off, `strictNullChecks` off; `mypy` coverage %; `pyright`; grep for defensive null checks; incident data mining: what share of prod crashes are null/type errors. Count typed-vs-untyped function signatures in core modules.
- **Objective metric:** `% of function signatures typed`; `# of `any`/`Object` usages per KLOC`; `% of runtime incidents caused by null/type errors`; `strict mode enabled?`.
- **Yellow flag (warning):** Some typed coverage, strict mode partially on, null-crash share 5–10% of incidents. *(Rationale: warning — type debt is present but not dominant.)*
- **Red flag (critical):** Core paths untyped, strict mode off, null/undefined errors a top incident cause (> 15%). *(Rationale: a whole bug class you could eliminate at compile time is shipping to prod.)*
- **Example symptom:** "Sentry shows 'Cannot read properties of undefined' as the #2 production error for the quarter. The TS codebase has strictNullChecks off and 1,200 `any`s. The team can't rename a field without a search-replace gamble."
- **Blast radius:** Incident rate, refactor safety, onboarding, IDE/tooling value, AI-assisted refactoring quality (types are the interface for tooling).
- **Remediation playbook:** Quick win: enable `strict`/`strictNullChecks` on the smallest core module, fix the fallout, expand module by module; add `mypy --strict` to CI incrementally with a ban-list. Structural fix: adopt explicit null-safety (Option/Result types), eliminate `any` with real types at boundaries, add type coverage gate (e.g., `typescript coverage > X%`).
- **Gold standard / target state:** Strict mode on across the system; typed coverage > 90%; null/type errors < 2% of incidents; boundary types (API, DB, events) fully defined.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = strict + typed; 2 = partially typed; 1 = core untyped, strict off; 0 = null errors a top incident class.
- **Verify effort:** 🔷 ~1–2 days — lint report + incident mining.

### ARCH-10 — Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions)
- **Definition:** Cross-cutting concerns — authentication, authorization, logging, error mapping, transaction boundaries, validation — are implemented ad hoc in every call site instead of as shared, testable infrastructure (middleware/interceptors/decorators).
- **Why it signals obsolescence:** Cross-cutting concerns are where security and compliance bugs live, and ad-hoc implementation means: inconsistent coverage (one route forgets auth), duplicated and drifted logic, and no single place to add a security control or a trace. Modern frameworks provide interceptors/middleware precisely to centralize these.
- **Where it manifests:** Auth checked manually at the top of N controllers (and missed in a few), logging calls sprinkled with inconsistent context, try/catch duplication, transaction management inside every service method, validation hand-rolled per endpoint.
- **Detection method:** Grep/pattern analysis — count manual auth checks vs. middleware; error-handling duplication (catch blocks with the same mapping); transaction boilerplate per method; trace/log-context consistency (from PERF-01/API-07). Tools: SonarQube rules, custom greps, security review sampling.
- **Objective metric:** `# of manual auth check sites`; `% of endpoints covered by shared middleware`; `# of duplicated error-mapping blocks`; `# of un-caught/unmapped exception paths`.
- **Yellow flag (warning):** Some duplication of cross-cutting code; manual auth in a few non-critical routes. *(Rationale: warning — the drift is seeded.)*
- **Red flag (critical):** Manual security checks in core routes (with known coverage gaps), or no centralized error/logging infrastructure at all. *(Rationale: this is where a missed check becomes a breach.)*
- **Example symptom:** "Auth is a copy-pasted `if (!session) redirect` block at the top of 80 controllers — and three new ones forgot it. A pentest finds an unauthenticated admin endpoint that's been public for 14 months."
- **Blast radius:** Security coverage, compliance, error-handling consistency, observability quality, developer discipline.
- **Remediation playbook:** Quick win: audit for missing shared middleware and missed auth sites; move the top repeated concern (auth) to framework middleware. Structural fix: centralize each concern (authN/authZ, logging, error mapping, validation, transactions) into one owned infrastructure layer with tests; wire via framework interceptors; add security tests that assert every endpoint enforces auth.
- **Gold standard / target state:** Every cross-cutting concern implemented once, in infrastructure, enforced by framework; a security test walks all routes asserting auth coverage; zero manual auth in controllers.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = centralized + enforced; 2 = mostly centralized, gaps; 1 = manual checks in core; 0 = missed coverage in security-sensitive paths.
- **Verify effort:** 🔷 ~1–2 days — grep analysis + route-coverage test.
