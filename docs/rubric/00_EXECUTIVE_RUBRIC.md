# 00 — Executive Rubric *(derived view)*

The reusable scoring template. Print this sheet, score every row 0–3 (or N/A), check the gates, compute the rollup.

> **Derived view:** all weights, thresholds, and gate rules live canonically in `11_WEIGHTS_THRESHOLDS_CONFIG.md`; every indicator's 4-level criteria, thresholds, and core-path bound live in its unified file under `indicators/<NN_CATEGORY>/`. Edit there, regenerate here.

**Companion files:** README (catalog guide) · `01_…`–`10_…` (category indexes) · `indicators/` (canonical indicator files) · `11_…` (canonical config) · `templates/` (blank score sheets)

---

## Part 0 — Gating kill-switches (read first)

If **any** of the following is Red Flag, the verdict is **capped at "High"** no matter the numeric total. These are debts that make the system *unsafe or impossible to modernize incrementally*.

| # | Gate | Red Flag trigger | Source indicator |
|---|------|------------------|--------------------|
| G1 | Credential exposure | Active plaintext secrets/credentials in source, history, or config | SEC-02 |
| G2 | Critical vuln exposure | Any Critical CVE > 14 days unpatched on an internet-exposed path | SEC-01 |
| G3 | Runtime EOL, no path out | Core domain logic on EOL runtime/language with no upgrade path | ECOS-01 |
| G4 | OWASP Top-10 reachable | SQLi / RCE / broken auth reachable in core flows | SEC-03, SEC-04 |
| G5 | Untested core | Zero test coverage in the highest-criticality service | TEST-06 |
| G6 | Delivery is on fire | CFR > 30% AND deployments require manual intervention | VEL-03, VEL-08 |
| G7 | Data-rescue risk | No backups, or restore never successfully performed / untestable, in a system holding critical data | DATA-06 |
| G8 | Copyleft in closed-source distribution | GPL/AGPL (or equivalent copyleft) detected in a proprietary, closed-source distribution | ECOS-05 |

> **Escalation semantics:** a gate in Red Flag means the numeric score is *informational only* — the reported verdict is "High" (or "Critical" if the score is also < 27% — the stricter verdict wins).

---

## Part 1 — Scoring guide

Score each applicable, measurable standard indicator **0–3**; mark N/A (with reason) when a row does not apply. An applicable but unmeasurable row is `unknown`: disclose it as unscored and keep it in the category denominator. A detector not implemented in this scanner release is `not_implemented` and is excluded from the denominator. Every indicator's exact 4-level criteria live in its unified indicator file.

| Score | Meaning |
|-------|---------|
| **3 — Healthy** | Complies with modern standards; no flags |
| **2 — Minor Debt** | Manageable debt; meets Yellow Flag criteria in non-core paths |
| **1 — Severe Debt** | Yellow Flag in core logic, or Red Flag in isolated paths |
| **0 — Critical** | Red Flag in core logic, or across multiple paths |
| **N/A** | Not applicable to this system; excluded from the category denominator (reason recorded) |
| **Unknown** | Applicable but not measurable; no score, disclosed, and included in the frozen denominator |
| **Not implemented** | No detector in this scanner release; disclosed and excluded from the denominator |

**Core-path taxonomy (global, computed once):** every 1-vs-0 and 2-vs-1 call uses the *global* core-path definition — core = files reachable from public entry points that touch **money / auth / PII / compliance-sensitive behavior**. Where an entry scopes itself differently, its unified file's `Scope/overlaps` section says so. The engine computes membership once; human auditors use the same rule.

**Deep-dive indicators (18 + 1 FE):** not in this sheet. They belong to the unified catalog and are scored only in deep audits. When a deep audit runs them, they **fold into their category's applicable set** and change that category % (see `11` §2) — a deep-audit total is *not* a standard-audit total plus footnote.

---

## Part 2 — Scoring sheet (standard rows)

Category % = Σ(measured + estimated row scores) ÷ ((measured + estimated + applicable unknown count) × 3) × 100. Unknown rows remain in the denominator as unscored; N/A and not-implemented rows are excluded. Deep-dive rows fold in when run. Row counts vary by category (ARCH 10, VEL 10, others 8). Base weights shown; use the FE-active set (`11` §1) when the repo has a client. The frozen-denominator headline is the default; renormalized scoring is reference-only.

### 1. Dependency & Ecosystem Health — weight 10% (FE-active 9%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| ECOS-01 | Runtime/Language EOL ⚡ | Active version within 6 mo of EOL | Past official EOL, vendor-only support, no upgrade path (G3) | _ |
| ECOS-02 | Major package drift ⚡ | > 30% of direct deps 1–2 major versions behind | > 50% ≥ 2 majors behind, or core framework stuck | _ |
| ECOS-03 | Abandoned libraries ⚡ | Unmaintained 12–24 mo; single maintainer | Archived > 24 mo or package revoked | _ |
| ECOS-04 | Deprecated API usage ⚡ | Deprecated APIs in non-core modules | Core logic depends on deprecated/removed APIs | _ |
| ECOS-05 | License compliance risk 🔶 | Unknown/ambiguous licenses in transitive deps | Copyleft (GPL/AGPL) in proprietary closed-source code (G8) | _ |
| ECOS-06 | Dependency bloat ⚡ | 100–300 transitive deps; > 20 unused direct deps | > 300 transitive deps; orphaned/unremovable deps | _ |
| ECOS-07 | Build reproducibility ⚡ | Lockfile present but partial / non-deterministic | No lockfile, mutable versions, non-reproducible builds | _ |
| ECOS-08 | Framework lock-in risk ⚡ | Framework past "active" status, maintenance-mode | Framework EOL or roadmap forced; migration infeasible | _ |

### 2. Architecture & Code Quality — weight 15% (FE-active 13.5%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| ARCH-01 | Cognitive complexity / God classes 🔶 | Method complexity > 15; class > 500 LOC | Method complexity > 30; class > 2,000 LOC | _ |
| ARCH-02 | Coupling / low cohesion 🔶 | Cyclic deps between submodules | Circular deps across bounded contexts; DB-coupled services | _ |
| ARCH-03 | Layer violations 🔶 | Occasional boundary crossing; no enforcement | Boundaries eroded system-wide; no arch tests/gates | _ |
| ARCH-04 | Dead & orphaned code ⚡ | 10–20% unreferenced functions/flags | > 20% dead code; unreferenced endpoints live in prod | _ |
| ARCH-05 | Churn vs. defect hot spots 🔶 | Top 5% churned files moderate bug frequency | Top 10% churned files = > 50% of prod incident fixes | _ |
| ARCH-06 | Framework generation shift 🔶 | Architecture style is 1 generation behind | Style 2+ generations behind (no DI, no modules, monolith-in-box) | _ |
| ARCH-07 | Global mutable state 🔶 | Singletons/globals in non-core paths | Shared mutable state in core flows; time/IO hidden in logic | _ |
| ARCH-08 | Duplication debt 🔶 | Clone rate 10–20% | > 25% duplication; copy-paste across services | _ |
| ARCH-09 | AI/LLM codebase-readiness (agentic operability) 🔶 | Partial navigation aids / seams; inner loop slow for tooling | No seams, no navigation aids, no single-command harness — agents can't operate | _ |
| ARCH-10 | Feature-flag & config debt 🔶 | Hardcoded flags/config in non-core modules; older flags uneowned | Toggles in core logic; config-as-code for prod; no retirement | _ |

### 3. Testing & Quality Engineering — weight 10% (FE-active 9%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| TEST-01 | Branch coverage ⚡ | 50–70% branch coverage | < 50% coverage on core services | _ |
| TEST-02 | Flaky test rate 🔶 | 5–10% flaky across suite | > 10% flaky; tests routinely disabled | _ |
| TEST-03 | Test pyramid inversion 🔶 | Overweight E2E; few unit tests | E2E-heavy with no unit layer; UI-tests-as-integration | _ |
| TEST-04 | Test run time ⚡ | Full suite 10–30 min | > 30 min; tests in critical path of every deploy | _ |
| TEST-05 | Skipped/disabled tests ⚡ | 5–10% skipped, recent | > 10% skipped or disabled for months | _ |
| TEST-06 | Core domain untested 🔶 | Core paths partially tested | Zero tests on highest-criticality flows (G5) | _ |
| TEST-07 | Test isolation 🔶 | Order-dependent/flaky via shared fixtures | Shared live DB in tests; sleeps/waits; parallel-unfriendly | _ |
| TEST-08 | No quality gates ⚡ | Linting only; no coverage gate | No SAST/static analysis in CI at all | _ |

### 4. Security, Compliance & Vulnerability — weight 20% (FE-active 18%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| SEC-01 | Unpatched vulnerabilities 🔶 | 1–5 High CVEs > 30 days | Any Critical CVE > 14 days exposed (G2) | _ |
| SEC-02 | Hardcoded secrets ⚡ | Revoked/rotated secrets in history | Active plaintext creds in source/config (G1) | _ |
| SEC-03 | Missing web security controls 🔶 | Outdated TLS, missing CSP/headers | OWASP Top-10 (SQLi/RCE/broken auth) reachable (G4) | _ |
| SEC-04 | AuthN/AuthZ weaknesses 🔶 | Weak session policy; no RBAC granularity | Default creds, no auth on admin paths, broken session mgmt | _ |
| SEC-05 | Audit logging deficits 🔶 | Unstructured logs; no request IDs | Zero audit trail for admin/PII/auth events | _ |
| SEC-06 | Insecure transitive chains 🔶 | Deep chain into unmaintained deps | Known malware/hijacked package in lockfile | _ |
| SEC-07 | Patch cadence ⚡ | Manual patch process; no automation | No patching workflow; lockfiles stale > 90 days | _ |
| SEC-08 | Compliance drift 🔶 | Partial control mapping; manual evidence | No mapping to SOC2/GDPR/HIPAA; no retention/encryption | _ |

### 5. Data & Schema Evolution — weight 10% (FE-active 9%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| DATA-01 | Migration backlog 🔶 | 10+ pending migrations; long-running | Schema changed ad hoc; migrations destructive/manual | _ |
| DATA-02 | DB coupling 🔶 | Services share a DB; cross-DB joins | Stored procs as business logic; direct table sharing | _ |
| DATA-03 | Data integrity 🔶 | Missing constraints in non-core tables | No FK/constraints; orphaned rows; silent data corruption | _ |
| DATA-04 | Legacy storage 🔷 | Blob/XML/flat-file stores for niche data | Core data in unmaintainable legacy stores | _ |
| DATA-05 | Lock contention 🔷 | Hot rows; occasional blocking | Single-instance bottleneck; table locks under load | _ |
| DATA-06 | Data lifecycle ⚡ | Retention manual; backups untested | No archival/retention; restore never drilled (G7) | _ |
| DATA-07 | ORM/query smells 🔶 | N+1 in non-critical paths | N+1/implicit queries in core flows; no index strategy | _ |
| DATA-08 | Schema overfitting 🔶 | Business rules leaking into schema | Logic hard-baked in data shapes; no events/audit trail | _ |

### 6. API & Integration Surface — weight 10% (FE-active 9%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| API-01 | Contract drift 🔶 | No schema for some endpoints | No contracts at all; breaking changes ship freely | _ |
| API-02 | Versioning discipline ⚡ | Versioned, but breaking changes on minor | No versioning; clients break without warning | _ |
| API-03 | Integration bloat 🔶 | Many point-to-point integrations | Direct DB access between services; no gateway | _ |
| API-04 | Sync coupling 🔶 | Long synchronous chains in places | Core flows block on slow sync deps; no bulkhead/circuit | _ |
| API-05 | Third-party API risk 🔶 | No fallback for some vendors | Core function depends on deprecated/undocumented vendor API | _ |
| API-06 | Protocol legaciness 🔶 | Mixed SOAP/XML remnants | Core integration on SOAP/XML/proprietary protocols | _ |
| API-07 | Error handling 🔶 | Inconsistent error codes; some 500s | 500s everywhere; no error contracts; no request IDs | _ |
| API-08 | Consumer blindness 🔶 | No consumer registry; manual discovery | Breaking changes with no deprecation policy/communication | _ |

### 7. Developer Velocity & Operational Drag — weight 10% (FE-active 9%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| VEL-01 | CI/CD build duration ⚡ | Clean feedback loop 15–30 min | > 30 min or regularly times out | _ |
| VEL-02 | Local setup friction 🔶 | Setup 1–2 days; custom steps | > 3 days; requires shared remote staging DB | _ |
| VEL-03 | Deployment failure rate 🔶 | CFR 15–30% | CFR > 30%; manual deployment intervention (G6) | _ |
| VEL-04 | Lead time / deploy freq 🔶 | Deploy < weekly; lead time > 1 day | Deploy < monthly; multi-day lead time | _ |
| VEL-05 | Onboarding lead time 🔶 | 2–4 weeks to first production PR | > 4 weeks to first production PR | _ |
| VEL-06 | Bus factor ⚡ | Single author > 50% of a critical module | Single author > 80% of codebase; zero docs | _ |
| VEL-07 | Environment reproducibility 🔶 | Local/prod drift in places | Works-on-my-machine; no containerized dev parity | _ |
| VEL-08 | Manual release steps 🔶 | Some manual release steps | Deploys only via manual scripts on prod hosts (G6) | _ |
| VEL-09 | PR & code-review hygiene 🔶 | Some rubber-stamp reviews; median PR 500–1,000 LOC | Reviews effectively absent; admin merges/direct pushes to core | _ |
| VEL-10 | Branching/monorepo strategy legacy 🔶 | GitFlow ceremony; long-lived branches | Release branches weeks old; trunk divergence; merge windows | _ |

### 8. Performance & Cloud/Infrastructure Fit — weight 10% (FE-active 9%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| PERF-01 | Observability gaps 🔶 | No distributed tracing | No structured metrics; debugging via SSH/log tailing | _ |
| PERF-02 | Legacy deployment model 🔶 | Manual server config via scripts | Bare-metal/VM with manual stateful changes | _ |
| PERF-03 | Resource waste/leakage 🔷 | Memory leaks needing scheduled restarts | Crashes under standard load due to leaks | _ |
| PERF-04 | Monolithic scaling 🔷 | Vertical scaling only for spikes | DB lock contention blocks scaling past single instance | _ |
| PERF-05 | No autoscaling/capacity 🔶 | Static capacity; manual sizing | No autoscaling; capacity surprises in prod | _ |
| PERF-06 | Missing IaC / config drift 🔶 | Partial IaC; some snowflake servers | No IaC; snowflake servers; manual config drift | _ |
| PERF-07 | No SLOs/perf budgets 🔶 | Informal latency targets | No SLOs, no load-test baseline, no perf regression gate | _ |
| PERF-08 | Runtime waste 🔶 | Slow startup; heavy idle footprint | Startup minutes-long; idle cost high; no lazy init | _ |

### 9. Documentation & Knowledge Continuity — weight 5% (FE-active 4.5%)

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| DOCS-01 | Missing ADRs 🔶 | Some decisions documented | No ADRs; decisions live in Slack/heads | _ |
| DOCS-02 | Stale/drifted docs ⚡ | Docs partially outdated | Docs contradict code; no one trusts them | _ |
| DOCS-03 | Missing runbooks 🔶 | Runbooks for some incident types | No runbooks; incidents handled by instinct | _ |
| DOCS-04 | No onboarding guide ⚡ | Setup doc exists but incomplete | No setup docs; onboarding is oral | _ |
| DOCS-05 | Tribal knowledge 🔶 | Knowledge concentrated in 1–2 people | Knowledge only in heads; no written record | _ |
| DOCS-06 | Comment debt 🔶 | Some misleading comments | Comments contradict code; naming cryptic | _ |
| DOCS-07 | Missing API docs 🔶 | Partial OpenAPI for some endpoints | No API docs; consumers reverse-engineer | _ |
| DOCS-08 | No release communication 🔶 | Changelog sporadic | No changelog; breaking changes unannounced | _ |

### 10. Frontend & Client Health *(conditional — separate annex in the standard sheet, folded into the FE-active total)*

| ID | Indicator | Yellow Flag (1–2 pts) | Red Flag (0 pts) | Score |
|----|-----------|----------------------|------------------|-------|
| FE-01 | UI framework EOL ⚡ | Maintenance mode / one gen back, plan underway | EOL with no migration; security patches unavailable | _ |
| FE-02 | Bundle size & load perf 🔶 | 500 KB–1.5 MB initial; LCP 3–4s; splitting partial | > 1.5 MB initial; LCP > 4s; no measurement | _ |
| FE-03 | Accessibility deficits 🔶 | a11y 70–90; some serious violations; no gate | a11y < 70; critical flows keyboard-unusable; no checks | _ |
| FE-04 | Browser/platform support drift 🔶 | Stale matrix or partial responsive | Desktop-only museum or no matrix with real breakage | _ |
| FE-05 | Client architecture debt 🔶 | Some god-components/globals; light tests | God-component sprawl; no component tests; unmappable flow | _ |
| FE-06 | Design system / UI consistency 🔶 | 2–3 primitive impls; some tokens | No shared foundation; 5+ ways to render a button | _ |
| FE-07 | i18n / localization debt 🔶 | Hardcoded strings in some modules; partial locales | Strings hardcoded throughout; no localization pipeline | _ |

---

## Part 3 — Rollup math

### 3a. Per-service → category scores

For each service, score the applicable standard rows in each category (mark N/A with reason). Category % for that service:

```
Category% = (sum of measured and estimated row scores ÷ ((measured + estimated + applicable unknown row count) × 3)) × 100
```

Applicable unknown rows remain in the denominator as unscored; not-applicable and not-implemented rows are excluded. Deep-dive rows fold into the denominator only when run. The renormalized score is reference-only and does not replace the frozen-denominator headline.

### 3b. Service → system rollup

Weight each service by **business criticality** (not LOC):

| Criticality | Weight | Example |
|-------------|--------|---------|
| Critical path | 3× | Revenue-generating, user-facing, compliance-touching |
| Supporting | 1× | Internal tools, batch jobs, non-critical backends |

```
System category% = Σ (service category% × service criticality weight) / Σ weights
```

### 3c. System total

```
System score = Σ (system category% × category weight)
```

Weights come from **`11_WEIGHTS_THRESHOLDS_CONFIG.md`** — the **base set** when the repo has no client; the **FE-active set** (FE 10%, others ×0.9) when it does. Do not hardcode either set here.

### 3d. Tiers

Band labels follow the canonical `11` §3 (Low / Moderate / High / Critical); thresholds are unchanged.

| Tier | Score | Verdict |
|------|-------|---------|
| **Low** | ≥ 80% | Maintain continuous refactoring & incremental dependency updates |
| **Moderate** | 53–79% | Dedicated refactoring sprints; prioritize security & EOL dependencies |
| **High** | 27–52% | Modernization initiative required; isolate core domain behind a facade before rewrite/refactor |
| **Critical** | < 27% | Immediate modernization mandatory; impedes business continuity, security, delivery |

### 3e. Gate override

If any gating kill-switch (G1–G8, Part 0) is Red Flag → verdict = **High** minimum, regardless of total. If total < 27%, the stricter verdict (Critical) wins.

---

## Part 4 — Audit planning cheat-sheet

| Audit type | Duration | Scope | What to run |
|------------|----------|-------|-------------|
| Portfolio screen | 1 day | All repos | ⚡-tagged standard rows only; skip gates G5/G6 |
| Standard audit | 2–3 days | One system | All standard rows + all 8 gates; FE rows folded in if a client exists |
| Deep dive | 1–2 weeks | One system | All standard + deep-dive rows (folded into categories) + FE module if applicable |
