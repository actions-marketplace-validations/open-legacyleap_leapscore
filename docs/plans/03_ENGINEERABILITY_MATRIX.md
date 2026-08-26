# 03 — Engineerability Matrix *(derived view — all 102 indicators)*

> The reference doc that answers *"what can the engine measure, how, and with what tool?"* for every row in the catalog.
> **Derived view:** the canonical per-indicator `Engine tier` / `Default status` / `Scope/overlaps` fields now live on each row in the encyclopedia (`../rubric/*`); this matrix is a consolidated read-out and the home of the per-tool mapping. Source of truth: `../rubric/*`. Depends on `02_TRUST_SCORING_MODEL.md` (status semantics) and feeds `04_V1_SCOPE.md`.

---

## Legend

**Automation tier** (can the machine get the data, given just the repo + GitHub API + local static tools, no deployment/org access):

| Tier | Meaning |
|---|---|
| **A** | Fully automatable from a repo clone + GitHub REST API + local analyzers (v1 target) |
| **B** | Automatable with deeper access (GitHub App with Actions/Dependabot/deployments perms) or by executing the test suite in a sandbox (v2 "deep scan") |
| **C** | Needs a live/deployed environment — `unknown` by default |
| **D** | Needs humans / org data / interviews — `unknown` by default |

**Default status** maps directly onto the `02` taxonomy:
- A-tier rows are typically `measured` (fact) or `estimated` (pattern inference — always labeled, capped 1–2).
- C/D-tier rows are `unknown` with an emission hint (the "what it takes to measure" text).

**v1** flags which rows ship in the first vertical slice (see `04_V1_SCOPE.md`).

Tools column = the OSS/standard tool that produces the signal. `GH API` = GitHub REST/GraphQL. Language-agnostic rows run for every repo.

---

## 1. Dependency & Ecosystem Health

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| ECOS-01 | Runtime/Language EOL | A | measured | manifest pin → cross-check `endoflife.date` API | ✅ |
| ECOS-02 | Major package drift | A | measured | `npm outdated` / `pip list --outdated` / lockfile vs registry; Dependabot PR backlog via GH API | ✅ |
| ECOS-03 | Abandoned libraries | A | measured | `osv-scanner`, Socket.dev/OpenSSF Scorecard, last-release date per dep | ✅ |
| ECOS-04 | Deprecated API usage | A | estimated | compiler `/deprecation` lint run, `eslint-plugin-deprecation`, greps against removal lists | ✅ |
| ECOS-05 | License compliance risk | A | measured | SBOM (`syft`, `cyclonedx-cli`) + license classifier (`license-checker`, `fossa`, `github/licensee`) | ✅ |
| ECOS-06 | Dependency bloat | A | measured | `depcheck`/`knip`, transitive counts (`pipdeptree`, `npm ls`), bundle analyzers | ✅ |
| ECOS-07 | Build reproducibility | A | measured | committed lockfile check (`git ls-files`), CI immutable-install flag, floating-range grep | ✅ |
| ECOS-08 | Framework lock-in | A | measured | framework version + `endoflife.date` support status | ✅ |
| ECOS-09 | Version skew across services | B | unknown | aggregation across a repo *set* (monorepo + sibling repos) — needs org/API scan | ❌ (v2) |
| ECOS-10 | Supply-chain: typosquat/malware | A | measured | OpenSSF Scorecard, `socket.dev` scan, `osv-scanner`, pinned-vs-tag actions audit | ✅ |

## 2. Architecture & Code Quality

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| ARCH-01 | Cognitive complexity / God classes | A | measured | `lizard`, `radon cc`, ESLint complexity, SonarQube metrics | ✅ |
| ARCH-02 | Coupling / cohesion | A | measured | `dependency-cruiser` (JS/TS), `jdepend`, ArchUnit-style rules, import graph | ✅ |
| ARCH-03 | Layer & boundary violations | A | measured | `dependency-cruiser --rules`, `import-linter` (Python), arch tests presence | ✅ |
| ARCH-04 | Dead & orphaned code | A | measured | `knip`, `vulture`, `depcheck`, API traffic not needed if routes enumerable | ✅ |
| ARCH-05 | Churn vs. defect hot spots | A | measured | `git` mining (commits/bugfix per file) + GH issue data (`gh issue search` grouped by path) | ✅ |
| ARCH-06 | Architectural generation | A | estimated | structural checks: DI presence, module boundaries on disk, unit-test-without-stack experiment (static proxy) | ✅ |
| ARCH-07 | Global mutable state / hidden deps | A | estimated | greps for singletons, static mutable, direct `new Date()`/DB in logic; static approximation | ✅ |
| ARCH-08 | Duplication debt | A | measured | `jscpd`, PMD-CPD, SonarQube duplication | ✅ |
| ARCH-09 | Agentic operability / AI codebase-readiness | A | estimated | navigation-aids match disk, seam index, test-to-code proximity, fresh-clone single-command harness | ⚠️ (v1) |
| ARCH-10 | Feature-flag & configuration debt | A | estimated | hardcoded-toggle grep, prod-config-in-repo scan, flag age via git blame | ✅ |
| ARCH-11 | Nullable/untyped code debt *(deep-dive)* | A | measured | `mypy --strict`/`pyright` coverage, TS `no-explicit-any`, `strictNullChecks` state | ⚠️ (deep) |
| ARCH-12 | Duplicated cross-cutting concerns *(deep-dive)* | A | estimated | grep: count manual auth/logging/error-mapping sites vs. middleware | ⚠️ (deep) |

## 3. Testing & Quality Engineering

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| TEST-01 | Code coverage degradation | B | estimated | CI coverage reports if present in Actions artifacts/logs; else `unknown` | ⚠️ (partial) |
| TEST-02 | Flaky test rate | B | unknown | needs CI history (GH Actions run retries) | ❌ (v2 deep scan) |
| TEST-03 | Test pyramid inversion | A | measured | categorize test files by path/type; count + runtime share heuristic | ✅ |
| TEST-04 | Test run time | B | estimated | GH Actions run durations (workflow API); else static guess | ⚠️ (with App perms) |
| TEST-05 | Skipped / disabled tests | A | measured | `rg` for skip/ignore/xit markers + git age | ✅ |
| TEST-06 | Core domain untested | B | estimated | coverage per critical path is business-mapped; static: test files near core modules | ⚠️ |
| TEST-07 | Test isolation / hermeticity | B | unknown | requires executing the suite (random order, parallel, fresh containers) | ❌ |
| TEST-08 | Quality gates in CI | A | measured | CI config audit (lint/SAST/coverage/security stages exist + fail?) | ✅ |
| TEST-09 | Mutation testing score | B | unknown | needs running `stryker`/`PIT`/`MutPy` on a module — deep scan | ❌ |
| TEST-10 | Test maintenance burden | A | estimated | git archaeology: `fix test/snapshot/flake` commit share | ✅ |

## 4. Security, Compliance & Vulnerability

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| SEC-01 | Unpatched vulnerabilities | A | measured | Dependabot alerts API, `trivy`, `osv-scanner`, `pip-audit`/`npm audit`; age-vs-Critical rule | ✅ |
| SEC-02 | Hardcoded secrets | A | measured | `gitleaks`, `trufflehog` (current + full history) | ✅ (G1) |
| SEC-03 | Missing web security controls | C | unknown | needs DAST/staging or TSL+headers on a deployed app | ❌ |
| SEC-04 | AuthN/AuthZ weaknesses | C | estimated | static: default-creds grep, client-side `isAdmin` grep, route-enforcement scan (weak signal — label low) | ⚠️ (estimated only) |
| SEC-05 | Audit logging deficits | C | unknown | needs runtime log/content audit | ❌ |
| SEC-06 | Insecure transitive chains | A | measured | deep SCA: `osv-scanner --experimental-local-db`, `npm audit --all`, Socket.dev provenance chains | ✅ |
| SEC-07 | Patch cadence | A | measured | Dependabot/Renovate presence + PR backlog + age; lockfile freshness | ✅ |
| SEC-08 | Compliance drift | D | unknown | human review of control mapping (spectre: no URL signal) | ❌ |
| SEC-09 | Input robustness / fuzzing | A | measured | fuzz-harness presence (`*_fuzz`, `cargo-fuzz`, `libFuzzer`), sanitizer build config | ✅ (presence-only) |
| SEC-10 | Security testing in CI | A | measured | CI config: SAST/secret/deps/image/DAST job presence + fail-on-find | ✅ |

## 5. Data & Schema Evolution

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| DATA-01 | Migration backlog / hell | A | measured | migration file inventory: count, pending, destructive ops grep (`DROP`, `RENAME`), fresh-build-ability | ✅ |
| DATA-02 | DB coupling & hidden deps | C | unknown | needs connection enumeration + schema-ownership map (may be estimated from configs) | ❌ |
| DATA-03 | Data integrity & constraints | C | unknown | needs live DB catalog + probe queries | ❌ |
| DATA-04 | Legacy storage technology | C | unknown | needs storage inventory / infra (weak static hint from file formats) | ❌ |
| DATA-05 | Lock contention | C | unknown | needs live DB profiling + load test | ❌ |
| DATA-06 | Data lifecycle (restore drills) | C | unknown | needs infra audit / drill evidence | ❌ |
| DATA-07 | ORM / query smells | C | estimated | static: ORM grep for N+1-able patterns, missing-index hints (weak) | ⚠️ (estimated only) |
| DATA-08 | Schema overfitting | A | estimated | schema archaeology from migrations/SQL: versioned/flag columns, `old_`/`_v2` grep | ✅ |
| DATA-09 | Event sourcing / audit readiness | A | measured | model audit: history tables, event/outbox presence, `updated_by` columns | ⚠️ (sprint 2) |
| DATA-10 | Environment schema drift | C | unknown | needs env diff runs | ❌ |

## 6. API & Integration Surface

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| API-01 | Contract drift | A | measured | OpenAPI presence + currency; spec-vs-code diff (validator middleware presence); client-gen usage | ✅ |
| API-02 | Versioning discipline | A | measured | URL/media-type versioning grep, release history breaking-change audit | ✅ |
| API-03 | Integration point bloat | C | unknown | needs topology mapping (service discovery, extra services) | ❌ |
| API-04 | Sync coupling | A | estimated | read core flows: sequential async chains, presence of queues/circuit breakers | ⚠️ (estimated) |
| API-05 | Third-party API risk | A | estimated | grep third-party hosts/APIs; abstraction presence; vendor-deprecation watch (weak) | ⚠️ (estimated) |
| API-06 | Protocol legaciness | A | measured | protocol inventory: WSDL/SOAP/binary grep vs JSON/REST/gRPC presence | ✅ |
| API-07 | Error handling semantics | A | measured | error-contract schema presence (RFC 7807-style), request-id usage, status-code audit | ✅ |
| API-08 | Consumer blindness | D | unknown | needs consumer registry/telemetry | ❌ |
| API-09 | Idempotency & retry semantics | A | estimated | design audit of state-changing endpoints (idempotency-key presence) | ⚠️ (sprint 2) |
| API-10 | Schema evolution process | D | unknown | needs process audit (compat gate may be seen in CI ✔, but breakage history is human) | ❌ |

## 7. Developer Velocity & Operational Drag

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| VEL-01 | CI/CD build duration | B | estimated | GH Actions workflow run durations (workflow API); else static (build script shape) | ⚠️ (with App perms) |
| VEL-02 | Local setup friction | A | estimated | setup tooling presence: Dockerfile/compose, `make dev`, `.env.example`, README setup section | ✅ |
| VEL-03 | Deployment failure rate | B | unknown | needs deploy data (actions deployments, rollback markers, incident tags) | ❌ (v2) |
| VEL-04 | Lead time / deploy freq | B | estimated | GH deployments/releases API (release branches, tags, frequency) | ⚠️ (with App perms) |
| VEL-05 | Onboarding lead time | D | unknown | needs HR/git-per-hire data | ❌ |
| VEL-06 | Bus factor | A | measured | `git shortlog -sne`, per-file authorship, review coverage | ✅ |
| VEL-07 | Env reproducibility | A | estimated | canonical config presence, Dockerfile/compose parity, IaC config | ⚠️ (estimated) |
| VEL-08 | Manual release steps | A | measured | CI config: deploy jobs present? release path automation; prod-edit scripts grep | ✅ |
| VEL-09 | PR & code-review hygiene | A | measured | GH PR API: review coverage %, median/p95 size, latency, bypass/direct-push rate | ✅ |
| VEL-10 | Branching & monorepo strategy legacy | A | measured | git topology: branch age, trunk-green, merge-window config, cross-repo change span | ✅ |
| VEL-11 | DX tooling *(deep-dive)* | B | measured | DX inventory (task runner, scaffolding, watch) + inner-loop cold-start timing | ⚠️ (deep) |
| VEL-12 | Incident recovery / MTTR *(deep-dive)* | D | unknown | needs PagerDuty/incident tooling | ❌ (deep) |

## 8. Performance & Cloud/Infrastructure Fit

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| PERF-01 | Observability gaps | C | estimated | static: instrumentation config/deps (OTel, metrics/library imports) — weak; runtime needed | ⚠️ (estimated) |
| PERF-02 | Legacy deployment model | A | measured | Dockerfile/K8s/ECS manifests presence, VM-script smell grep | ✅ |
| PERF-03 | Resource waste / leakage | C | unknown | needs runtime profiling | ❌ |
| PERF-04 | Monolithic scaling | C | unknown | needs load test | ❌ |
| PERF-05 | Autoscaling / capacity | C | unknown | needs infra config (HPA/ASG) — may be partially seen in IaC | ❌ |
| PERF-06 | Missing IaC / config drift | A | measured | Terraform/Pulumi/CloudFormation presence + coverage heuristic | ✅ |
| PERF-07 | No SLOs / perf budgets | C | estimated | SLO config / load-test harness / CI perf-gate presence (static hints) | ⚠️ (estimated) |
| PERF-08 | Runtime waste / startup | C | unknown | needs runtime measurement | ❌ |
| PERF-09 | Cost efficiency / FinOps | D | unknown | needs cloud bill + attribution data | ❌ |
| PERF-10 | DR & resiliency | D | unknown | needs drills/infra | ❌ |

## 9. Documentation & Knowledge Continuity

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| DOCS-01 | Missing ADRs | A | measured | `docs/adr/` presence + decision-doc inventory | ✅ |
| DOCS-02 | Stale / drifted docs | A | estimated | doc last-update vs code-change correlation, command-verify sample | ⚠️ (estimated) |
| DOCS-03 | Missing runbooks | A | measured | `docs/runbooks/` + ops-wiki coverage of top incident classes (presence) | ✅ |
| DOCS-04 | No onboarding guide | A | measured | CONTRIBUTING/GETTING_STARTED existence + command dry-run | ✅ |
| DOCS-05 | Tribal knowledge | D | unknown | needs interviews ("ask Dave" audit) | ❌ |
| DOCS-06 | Comment debt | A | estimated | TODO/FIXME age (git blame), misleading-comment sample, naming heuristics | ⚠️ (estimated) |
| DOCS-07 | Missing API docs | A | measured | OpenAPI/spec presence, generated reference, docs-in-CI | ✅ |
| DOCS-08 | No release communication | A | measured | CHANGELOG/release notes presence, GH releases API, semantic-release config | ✅ |
| DOCS-09 | Docs-as-code | A | measured | docs CI steps present (build/lint/link/generate), staleness gate | ✅ |
| DOCS-10 | Knowledge exit / ownership | D | unknown | needs org process audit | ❌ |

## 10. Frontend & Client Health (annex)

| ID | Indicator | Tier | Default status | Tool / detection | v1 |
|----|-----------|------|----------------|------------------|----|
| FE-01 | UI framework EOL | A | measured | framework version → `endoflife.date` | ✅ |
| FE-02 | Bundle size & load perf | C | unknown | needs render/Lighthouse; static hint from bundle config budget | ❌ |
| FE-03 | Accessibility deficits | C | unknown | needs render (axe) | ❌ |
| FE-04 | Browser/platform support drift | A | estimated | browserlist presence+currency, responsive heuristics, polyfill-for-obsolete grep | ⚠️ (estimated) |
| FE-05 | Client architecture debt | A | measured | component LOC distribution, global-store count, testability seams | ✅ |
| FE-06 | Design system / UI consistency | A | estimated | primitive-dup count, design-token adoption, hardcoded-color grep | ⚠️ (estimated) |
| FE-07 | i18n / localization debt | A | unknown | hardcoded-string scan, i18n lib + extraction presence, locale/token coverage | ⚠️ (estimated) |
| FE-08 | Mobile / offline support *(deep-dive)* | C | unknown | needs runtime/service-worker audit | ❌ (deep) |

---

## Rollup

| Tier | Count | Notes |
|------|-------|-------|
| **A** — v1 automatable | **59** | of which 44 ship `measured`, 15 `estimated` (always labeled/capped) |
| **B** — needs deeper perms or deep scan | 12 | covered partially in v1 (estimated) where a static proxy exists; full B coverage in v2 |
| **C** — needs live environment | 18 | all `unknown`, emission text authored from encyclopedia |
| **D** — needs humans/org | 8 | all `unknown`, emission text authored |

**Emission rule (v1 auto-text):** every C/D row outputs "What it takes to make this `measured`" drawn from the encyclopedia's *where it manifests* + *verify effort* + *detection method* cells. No blank rows, no scored guesses on Tiers C/D (per `02` §2).

## Cross-check quiz (prove the model on real repos)

Before building, sanity-check the matrix against 5 diverse public repos:
1. A JS SaaS monorepo (Gatsby/Next) with GH Actions.
2. A Python data service with Alembic + pytest.
3. A Go CLI with no CI.
4. A Java Spring monolith with no lockfile packaging.
5. A PHP/legacy repo with SOAP remnant + a `docs/adr` folder.

For each, list the expected `measured`/`estimated`/`unknown` split and one surprising false-positive risk per project. This becomes the acceptance harness for the matrix.