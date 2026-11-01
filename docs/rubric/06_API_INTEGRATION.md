# 06 — API & Integration Surface

> **Canonical rubric category.** Base weight: 10% · FE-active weight: 9% · Standard indicators: API-01–08 · Deep-dive indicators: API-09–10.
>
> **One-line thesis:** The API is the contract your system makes with the world. When contracts are undocumented, unversioned, and ungoverned, every consumer — internal or external — is at the mercy of the codebase's mood.
>
> This file owns the category's indicator definitions and scoring semantics. Shared weights, formulas, thresholds, and gates are defined in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md); implementation recipes are in [`docs/specs/`](../specs/README.md).

**Category summary:** Scores the health of the interfaces between the system and its consumers (internal services, partners, frontends, IoT, third-party SaaS) — formal contracts, versioning, integration topology, coupling, external-dependency risk, protocol currency, error semantics, and consumer visibility.

---

## Standard indicators (API-01–08)

### API-01 — API Contract Drift
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** spec accuracy/drift today; the schema-evolution *process* is API-10, consumer usage visibility is API-08.
- **Definition:** Interfaces are not governed by a formal contract — no OpenAPI/Swagger/GraphQL schema/Protobuf for many/all endpoints, response shapes drift between deploys, fields appear/disappear silently, and consumers cope by sniffing.
- **Why it signals obsolescence:** A contract is the API's type system — it lets consumers, tests, generators, and mock servers depend on something stable. Its absence returns the world to "read the code, guess the shape," which is the definition of a pre-standard-era integration practice. Contract drift is also a direct cause of "it worked yesterday" integration bugs.
- **Where it manifests:** Endpoints with no schema/spec, response shapes assembled by hand (`res.json({...})` ad hoc), breaking field renames shipped in minor versions, no contract test, consumers parsing `docs/README_old.txt`, Swagger file that predates half the endpoints.
- **Detection method:** Contract inventory — list all endpoints and check each against a spec (OpenAPI file exists? up to date? enforced?); diff spec vs. actual responses (OpenAPI validator middleware, `swagger-validator`, API lint `redocly lint`, spec-probe scripts); check generator usage (clients/tests generated from spec or hand-written); look for `"type":"any"`/untyped responses.
- **Objective metric:** `% of endpoints with a current, accurate contract`; `contract drift count (spec vs. actual)`; `% of clients generated from contract`; `# of undocumented endpoints`.
- **Yellow flag (warning):** Spec exists but stale/partial; some endpoints undocumented; clients hand-written. *(Rationale: warning — the contract exists in name, drift is accumulating.)*
- **Red flag (critical):** No contracts at all (or contracts so stale they're misleading), and/or breaking response changes ship freely. *(Rationale: consumers have no stable target — integration is archaeology.)*
- **Example symptom:** "The mobile app has reverse-engineered the API from logs. A deployment renamed `customerId`→`accountId` in a `1.0.x` patch. Every screen breaks at once. The 'contract' is a two-year-old OpenAPI file nobody regenerated."
- **Blast radius:** Consumer breakage, integration bugs, protocol interoperability (third-party consumers), API documentation trust, mock/test quality.
- **Remediation playbook:** Quick win: generate accurate specs from code (OpenAPI annotations/`apischema`, `drf-spectacular`, NestJS Swagger), validate specs vs. responses in CI. Structural fix: contract-first or contract-enforced development (spec is source of truth, generators produce clients/mocks/tests), a lint gate on spec changes.
- **Gold standard / target state:** Every endpoint covered by a current, accurate contract; clients and tests generated from it; spec drift impossible (CI enforces).
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = contracts current + enforced; 2 = partial/stale coverage; 1 = mostly undocumented; 0 = no contracts, free drift.
- **Verify effort:** 🔶 ~2–4 h — contract inventory + diff.

### API-02 — Versioning & Breaking-Change Discipline
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** versioning/announcement policy; compatibility *checking* tooling is API-10, contract accuracy is API-01.
- **Definition:** API changes are not versioned or announced — breaking changes ship in patch/minor releases, old versions die without notice, and consumers discover changes at runtime.
- **Why it signals obsolescence:** Versioning is the social contract of an API: it says "we will not break you silently." Its absence is a trust failure that forces every consumer to freeze-and-fear updates, blocks external integrations, and argues against ever exposing the API publicly. Modern practice is explicit versioning (path/header/negotiated) + deprecation policy + release cycle.
- **Where it manifests:** No `v1`/`v2` in paths or media types, breaking field removals in minor releases, no deprecation headers/announcements, old versions deleted immediately, consumers pinned to ancient versions with no migration path.
- **Detection method:** Version audit — URL/media-type versioning presence; semantic-release discipline (do breaking changes bump major? inspect release history + CHANGELOG); deprecation mechanism (headers, docs, schedule); consumer migration practice (existence of a version retirement policy).
- **Objective metric:** `# of breaking changes shipped in non-major releases (last 12 mo)`; `version currency: # of concurrently supported versions`; `deprecation-to-retirement window (days)`; `formal versioning mechanism present?`.
- **Yellow flag (warning):** Versioned, but breaking changes slip into minors occasionally; deprecation communicated informally. *(Rationale: warning — the gate exists but is leaky.)*
- **Red flag (critical):** No versioning at all, breaking changes ship without announcement, or consumers broke in the last 12 months as a result. *(Rationale: the platform cannot have external consumers or stable partner integrations — modernization foreclosed.)*
- **Example symptom:** "A partner integration broke on a Tuesday because an endpoint removed a querystring param 'in a cleanup.' The partner said 'we can't build on an API that does this.' The sales pipeline for that deal evaporated."
- **Blast radius:** Consumer trust, external integration viability, partner velocity, API monetization, ecosystem growth.
- **Remediation playbook:** Quick win: introduce versioning at the least cost (path `v2` for the contract-breaking surface; keep `v1` alive with a retirement date). Structural fix: versioning policy (what counts as breaking), deprecation headers + documented schedule, sunset coach with migration guides, semver discipline wired into release automation.
- **Gold standard / target state:** Explicit versioning everywhere; breaking changes only in majors with deprecation windows; a deprecation calendar; zero silent consumer breakage for two years.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = versioned + disciplined; 2 = versioned with leaks; 1 = versioned partially / reactive; 0 = no versioning, silent breakage.
- **Verify effort:** ⚡ ≤ 30 min — release history + versioning audit.

### API-03 — Integration Point Bloat
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** topology sprawl/governance; cross-service shared-DB coupling is DATA-02, sync-chain resilience is API-04.
- **Definition:** The system has a sprawling, unmanaged mesh of point-to-point integrations — direct service-to-service calls, services reading each other's DBs (see DATA-02), N-way connections that only the longest-serving engineers understand, no gateway/registry, and integration sprawl that grows with every feature.
- **Why it signals obsolescence:** Each integration point is a hidden dependency: a deployment, a security surface, an outage path. When the mesh grows without governance, changes ripple invisibly and the "system" is unknowable — a defining property of organic, pre-platform-era architectures.
- **Where it manifests:** A hand-drawn "integration spaghetti" diagram, services calling 5+ other services directly, shared DBs between services, no service registry/API gateway, a network diagram nobody can update, "if X changes we have to check these 11 things."
- **Detection method:** Topology mapping — build the integration graph from configs (service discovery, env vars, DNS targets, HTTP client configs, DB connection strings), visualize it, count edges per node; check for a platform gateway/registry; interview "who can name every integration?" Compute graph density and cross-service DB reads.
- **Objective metric:** `avg outgoing integrations per service`; `graph density (edges/nodes)`; `# of cross-service direct DB reads`; `central registry/gateway exists?`; `# of services with > 8 integrations`.
- **Yellow flag (warning):** Dense point-to-point graph (5–10 edges/service), growing, but documented; a registry/gateway is absent. *(Rationale: warning — still navigable, governance is missing.)*
- **Red flag (critical):** Every service talks to every other / shared DBs are the integration bus, the graph is undocumented, or a deployment integral to another service is routinely discovered by incident. *(Rationale: the topology is unknowable — no change is local anymore.)*
- **Example symptom:** "The diagram has 63 boxes and 120 arrows. Someone asks 'what happens if we decommission the legacy profile service?' Three days of archaeology later, the answer is 'eleven services, two of them not obviously related.'"
- **Blast radius:** Outage chains, security surface, deployment coordination, team autonomy, on-call archaeology, modernization sequencing.
- **Remediation playbook:** Quick win: build the topology map (automated), as the source of truth, and start routing traffic through a gateway for the top 5 hubs. Structural fix: platform governance — service registry, gateway/boundary routing, event-based decoupling for the densest paths, rules against direct cross-service DB access.
- **Gold standard / target state:** Known topology (auto-mapped, current), integration governance (registry/gateway/events), a change to one service locally verifiable, density trending down.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = governed mesh; 2 = dense but documented; 1 = dense, no registry; 0 = unknowable graph / DB-as-integration-bus.
- **Verify effort:** 🔶 ~2–4 h — config-based topology mapping.

### API-04 — Synchronous Coupling & Chatty Interfaces
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** sync fan-out/resilience mechanics; the mesh *topology* is API-03, latency impact of the chain is PERF-01.
- **Definition:** Core flows string many synchronous calls end-to-end — one request fans out into a chain of blocking HTTP calls where any slow/failing dependency is paid by the user, with no async boundaries, no bulkheads, no circuit breakers, no timeouts/SLOs per hop.
- **Why it signals obsolescence:** Synchronous fan-out turns every downstream dependency into your p99 and your outage — "the slowest link owns your product." Modern architecture truncates these chains with async/eventing, bulkheads, and resilience patterns. It's also why legacy systems are so hard to modernize: the failure mode is coupled to latency, not correctness.
- **Where it manifests:** A checkout/onboarding flow instrumented as 8 sequential HTTP calls, no message queue anywhere, no circuit breaker/timeout config, a service that blocks on an ETL's endpoint, "the third-party is slow today so the app is slow."
- **Detection method:** Trace analysis — distributed tracing (from PERF-01) to count hops and N+1-of-services per request, temporal latency waterfall; code review of core flows for `await`/blocking chains; presence of queues/event bus; resilience config audit (timeouts, retries, circuit breakers, batching).
- **Objective metric:** `max sync hops in core flows`; `% of core traffic dependent on > 3 live dependencies`; `<presence of bulkheads/circuit breakers>`; `p95 latency contribution of the longest sync chain`.
- **Yellow flag (warning):** Long sync chains in non-core flows; a couple of hot paths with fragile timeouts. *(Rationale: warning — the pattern exists but isn't load-bearing everywhere yet.)*
- **Red flag (critical):** Core flows block on chains of slow/unreliable sync dependencies with no async escape, or an outage in one dependency takes down the primary flow (no bulkheads). *(Rationale: the product's latency and uptime are hostage to the weakest link.)*
- **Example symptom:** "Checkout calls pricing (2s), which calls loyalty (1.5s), which calls the ad-hoc excel service (4s). Total: 7.5s of synchronous waiting, twice. The excel service has a bad day once a week and checkout fails — then 'sales went down because of the ad-hoc excel service.'"
- **Blast radius:** p95 latency, cascade outages, third-party dependency risk, mobile/web parts, incident chains, modernization sequencing.
- **Remediation playbook:** Quick win: add timeouts + circuit breakers on the fragile hops, cache the slow reads. Structural fix: slice the sync chain with events/async (compute off-path, return fast), bulkhead partitions by dependency, SLO-per-hop, degrade gracefully.
- **Gold standard / target state:** Core flows touch the minimum live dependencies; slow work is async; circuit-broken fallbacks in place; the weakest link cannot sink the product.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = minimal live deps, resilient; 2 = sync chains outside core; 1 = fragile chains in core with no fallback; 0 = primary flow hostage to one dependency.
- **Verify effort:** 🔶 ~2–4 h — tracing waterfall + resilience audit.

### API-05 — Third-Party & Vendor API Dependency Risk
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** external-vendor exposure specifically; *internal* service coupling is API-03/04, vendor runtime EOL is ECOS-08.
- **Definition:** Core functionality depends on external APIs/SaaS/vendors that are unmanaged as risks — no fallback, no circuit breaker, no documentation, no SLA awareness, vendors on deprecated APIs, API keys held by one person, no contract/license review.
- **Why it signals obsolescence:** External dependencies are bets: the vendor can change, deprecate, rate-limit, or vanish. Unmanaged, those bets become surprises. A modern integration surface manages external risk like insurance — fallbacks, abstraction, monitoring, license review, replacement paths. This is often where "the system was built on a promise" class of debt lives.
- **Where it manifests:** Core flows calling a vendor endpoint directly, vendor API deprecated (per their changelog) and still used, no abstraction layer (swap = rewrite), API keys in code/one person's laptop, no vendor SLA/monitoring, single-vendor dependency with no alternative.
- **Detection method:** External-dependency inventory — grep for third-party hosts/APIs, audit each: is it abstracted (behind a port) or called directly? Is the vendor API current (their changelog/deprecation)? Is there a fallback path? Who owns the key and contract? Is usage monitored? Rate-limit margins known?
- **Objective metric:** `# of core flows directly coupled to external vendors`; `% of external calls abstracted`; `# of vendor APIs deprecated/in-use-beyond-EOL`; `fallback coverage %`; `single-vendor concentration on critical paths`.
- **Yellow flag (warning):** Some external calls unabstracted/non-critical; vendor deprecations vaguely watched; no fallback for most. *(Rationale: warning — manageable until the vendor moves.)*
- **Red flag (critical):** Core flows directly coupled to a deprecated/unmaintained vendor API with no abstraction and no fallback, or a single vendor is a silent single point of failure for revenue. *(Rationale: the vendor's roadmap now *is* your roadmap — you ship when they do.)*
- **Example symptom:** "Payments route straight into the acquirer's SDK v1. They EOL'd it last quarter and won't patch the recurring-billing bug. The abstraction layer is 'the SDK wrapper we wrote.' Migration means rewriting a revenue path through a still-moving target."
- **Blast radius:** Revenue continuity, roadmap sovereignty, outage chains, compliance (vendor data handling), pricing changes.
- **Remediation playbook:** Quick win: wrap the top 3 vendor calls behind ports (adapters), add fallback paths where feasible, assign a vendor-risk owner + deprecation watch. Structural fix: integration abstraction for critical vendors, SLA monitoring + circuit breakers, contract/license review, documented replacement paths, vendor deprecation calendar.
- **Gold standard / target state:** External dependencies abstracted, fallbacked, monitored, and reviewed; vendor deprecations tracked and migrations planned; no revenue path is call-vendor-and-pray.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = abstracted + monitored + fallbacked; 2 = some unabstracted non-core; 1 = core calls unabstracted, deprecations watched informally; 0 = revenue on a deprecated vendor API with no path.
- **Verify effort:** 🔶 ~2–4 h — external-call inventory + vendor changelog check.

### API-06 — Protocol & Data-Format Legaciness
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** the wire format itself; the architecture generational gap is ARCH-06, stored-procedure legaciness is DATA-02.
- **Definition:** The system still speaks legacy/modern-hostile protocols and formats on its load-bearing interfaces — SOAP, XML-RPC, REST-less RPC, proprietary binary serialization, XML everywhere, CORBA-era patterns, or hand-rolled wire formats — where modern equivalents (REST/OpenAPI, gRPC, message queues, JSON/Protobuf, AS2/EDIFACT-era interop) are expected.
- **Why it signals obsolescence:** Protocol choice is the era stamp of an integration layer. Legacy protocols carry high operational overhead (web services stacks, ceremony, XML pain), lock out modern tooling (typed clients, gateways, observability), and are where staffing, security, and interop friction concentrate. Pairs with ARCH-06 at the interface level.
- **Where it manifests:** WSDL files, SOAP envelopes, XML namespace ceremony, custom binary formats with hand-maintained mappers, an integration layer gated on a 2005-era middleware, mainframe/interconnect stubs, no JSON/REST/typed-schema path for new integrations.
- **Detection method:** Protocol inventory — list all wire protocols across integrations (inspect clients/servers, WSDL/Proto/OpenAPI presence), check each against the ecosystem norm; measure the share of core traffic on legacy protocols; check newer-format support (JSON, Protobuf, OpenAPI, events) exists at all.
- **Objective metric:** `% of core integration traffic on legacy protocols`; `# of WSDL/SOAP/binary-format consumers`; `modern protocol support present (JSON/REST/gRPC)?`; `staffing difficulty for legacy formats`.
- **Yellow flag (warning):** Some legacy-protocol integrations in non-core corners (a partner still on SOAP/EDI), modern formats available for the rest. *(Rationale: warning — a cost center, but contained.)*
- **Red flag (critical):** Core flows bind on SOAP/XML/binary/proprietary protocols with no modern alternate, or the middleware that speaks them is itself EOL. *(Rationale: every new integration inherits the museum protocol and its staffing tax.)*
- **Example symptom:** "The 'integration platform' is a SOAP/XML layer from 2009. New hires spend a month learning WSDL elbows. A new product wants a webhook. There's no JSON happy path — they must map everything to XML namespaces first."
- **Blast radius:** Interop friction, staffing, gateway/observability compatibility, security (XML parsing attacks), feature velocity on the integration plane.
- **Remediation playbook:** Quick win: stand up modern endpoints (REST/JSON or gRPC) alongside the legacy ones for new traffic, put a gateway in front to let consumers choose. Structural fix: migrate integrations off legacy protocols where feasible (strangler at the protocol layer), retire the EOL middleware, offer modern contracts for every legacy consumer.
- **Gold standard / target state:** Core traffic on modern protocols, legacy formats behind adapters/bridges and shrinking, no EOL middleware, new integrations never require the museum stack.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = modern protocols; 2 = legacy in non-core corners; 1 = core on legacy protocols with a plan; 0 = core binds on EOL middleware/protocols.
- **Verify effort:** 🔶 ~2–4 h — protocol inventory + traffic-share estimate.

### API-07 — Error Handling & API Observability Semantics
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** error-contract semantics; duplicated error-handling infrastructure is ARCH-12, security/audit event logging is SEC-05.
- **Definition:** The API surface has poor error semantics — generic 500s swallowing root causes, unstructured error bodies, no standard error contract, no request IDs/correlation, clients can't distinguish retriable/permanent/validation errors, and errors are invisible in logs.
- **Why it signals obsolescence:** Error contracts are the API's exception handling contract: they tell clients *what to do*. Absent them, every failure is a mystery, debugging is archaeology (no request ID to trace), and consumer code is a basket of string greps. Modern APIs define errors structurally (RFC 7807-style, typed codes, correlation IDs).
- **Where it manifests:** Bare 500s with HTML error pages, `{"error": "something went wrong"}`, no `requestId`/trace id in responses, no error-code taxonomy, validation errors that differ per endpoint, logs of errors without the request context, monitoring that can't tell retriable from fatal.
- **Detection method:** Error-contract audit — sample responses (curl status codes + bodies), check status-code semantics (4xx/5xx correctness), look for a shared error schema/framework, check request IDs in headers/logs; check error tracking (correlated stack traces per endpoint); verify monitoring can segment error classes.
- **Objective metric:** `% of endpoints with a structured error contract`; `% of 500s that are actually expected 4xx (misclassified)`; `request-ID coverage % of error logs`; `# of distinct ad-hoc error body shapes`.
- **Yellow flag (warning):** Inconsistent error bodies and some misclassified status codes, request IDs partial. *(Rationale: warning — debugging is slow, not impossible.)*
- **Red flag (critical):** Generic 500s (or worse, HTML error pages) as normal practice, no request correlation anywhere, or error logs that can't reconstruct a single failing request. *(Rationale: every incident is archaeology — MTTR structurally high.)*
- **Example symptom:** "A payment endpoint returns `500` for a card-that's-expired. The client retries blind, double-charges the customer, and support gets 'the app is broken' with no request ID to trace. The engineers find the error in logs only by grepping a timestamp and the username."
- **Blast radius:** Debugging MTTR, consumer behavior correctness (retry/duplicate risk), integration bugs, monitoring quality, GDPR/PII in error surfaces.
- **Remediation playbook:** Quick win: standardize an error contract (RFC 7807 or a JSON schema: code, message, correlationId, retriable flag), add request IDs everywhere, fix the worst misclassifications. Structural fix: framework-level error middleware (single source of truth), typed error taxonomy, API-monitoring that segments by error class, error payloads free of PII.
- **Gold standard / target state:** Every endpoint returns structured, typed, correlated errors; 4xx/5xx semantics correct; a failing request is traceable in seconds; clients can act on errors programmatically.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = structured + correlated; 2 = partial/inconsistent; 1 = mostly generic, no correlation; 0 = 500s + HTML + zero correlation.
- **Verify effort:** 🔶 ~2–4 h — response sampling + error-log audit.

### API-08 — Consumer Blindness & Backward Compatibility
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** consumer visibility/catalog only; spec accuracy is API-01, versioning/deprecation policy is API-02.
- **Definition:** The team doesn't know its API consumers — no consumer registry, no usage telemetry on endpoints/fields, no deprecation communication channel, and breaking changes are discovered via angry emails rather than design.
- **Why it signals obsolescence:** An API you can't see is an API you can't manage. Modern API platforms know their consumers (who calls what, which fields, which versions), so changes are rational. Legacy APIs are usually blind — grief-driven, reactive, and hostile to change, which freezes the whole platform.
- **Where it manifests:** No consumer registry, no endpoint analytics, "who uses this?" → "some client from 2017 maybe," no changelog/deprecation announcements, consumer teams discovered when they break, no rate-limit/usage data per client.
- **Detection method:** Telemetry/inventory — is there endpoint analytics (each client's call voland field usage)? A consumer registry or at least API-key/credential per consumer? Deprecation announcement channel (changelog, emails, status page)? Interview: can the team answer "which external systems call endpoint X"? Measure breach incidents of the last year.
- **Objective metric:** `% of endpoints with consumer-usage visibility`; `# of consumers registered/tracked`; `field-level usage tracked?`; `deprecation channel exists + used?`; `consumer-breakage incidents (last 12 mo)`.
- **Yellow flag (warning):** Some analytics (API keys, traffic per endpoint), no full consumer registry, deprecation ad hoc. *(Rationale: warning — awareness is partial.)*
- **Red flag (critical):** Zero consumer visibility, changes shipped without any ability to know who's affected, or repeated consumer-breakage incidents. *(Rationale: the API is unowned — every change is a blind shot.)*
- **Example symptom:** "A 'cleanup' removes a field used by exactly one partner for a compliance submission — discovered a week later, in their angry ticket. 'How would we have known?' is the honest question, and the answer is nothing in the platform tracks it."
- **Blast radius:** Consumer trust, integration reliability, change confidence, API growth, partner/sales exposure.
- **Remediation playbook:** Quick win: add per-consumer API keys + endpoint analytics (who, what, how often), start a consumer registry doc. Structural fix: full usage telemetry (endpoint + field level), a deprecation communication channel (changelog + consumer mailer + status page), consumer onboarding/registration as standard, usage dashboards for product decisions.
- **Gold standard / target state:** Every consumer known + registered, endpoint/field usage visible, deprecations announced with migration guides, zero surprise consumer breakage.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full visibility + registry; 2 = partial analytics; 1 = analytics silo'd, no registry; 0 = blind changes, repeated breakage.
- **Verify effort:** 🔶 ~2–4 h — telemetry audit + consumer interview.

---

## Deep-dive indicators (API-09–10)

### API-09 — Idempotency & Retry Semantics
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** state-changing retry/duplicate guarantee; retriable/permanent error semantics are API-07, consumer breakage tracking is API-08.
- **Definition:** The API has no idempotency guarantees or retry contract — clients cannot retry safely; duplicate submissions double-charge/duplicate records, and there's no `Idempotency-Key`/`idempotency` mechanism or documented retry policy.
- **Why it signals obsolescence:** In a network world, retries are inevitable — a retryable-without-idempotency API converts network blips into business-correctness bugs (double payments, duplicate orders). Modern API design treats idempotency as a first-class guarantee for state-changing operations. Its absence is a correctness-era artifact.
- **Where it manifests:** Payment/order/import endpoints without idempotency keys, no deduplication keys, timeouts without conflict-surfacing, docs silent on retry behavior, "we had a double-charge issue last month" incidents.
- **Detection method:** Design audit of all state-changing endpoints — idempotency mechanism (`Idempotency-Key` header, `client_ref`, unique constraints) present and enforced; retry policy documented; test the behavior (replay same payload twice; check duplicate side effects); incident history for duplicate-processing.
- **Objective metric:** `% of state-changing endpoints with idempotency support`; `idempotency tests passing`; `duplicate-process incidents (last 12 mo)`; `retry policy documented?`.
- **Yellow flag (warning):** Most state-changing endpoints lack idempotency; retry/duplicate incidents occasional and manually reconciled. *(Rationale: warning — currently handled by reconciliation heroics.)*
- **Red flag (critical):** Core money/mutation endpoints have no idempotency and no dedupe, and duplicate side effects have already cost money/duplicated records. *(Rationale: this is a standing correctness breach for the money path.)*
- **Example symptom:** "A network timeout on checkout makes the client retry. Two charges hit the card, one order created, a support ticket, a manual refund. The API has no `Idempotency-Key` and the team 'just checks manually' when it happens."
- **Blast radius:** Double-charge/double-record risk, customer trust, reconciliation load, partner integrations (they *will* retry), audit correctness.
- **Remediation playbook:** Quick win: add an idempotency key + response-replay on the top money flows, add a unique constraint (order/client_ref) as a backstop. Structural fix: idempotency as a platform primitive (framework middleware, key storage, replay store), document retry semantics, idempotency tests in CI for all mutation endpoints.
- **Gold standard / target state:** All state-changing endpoints idempotent + tested, retry policy documented, duplicate side effects impossible.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = all state-changing enlistments idempotent; 2 = most, gaps in peripheral; 1 = money/mutation flows lack it; 0 = duplicates have already occurred.
- **Verify effort:** 🔷 ~1–2 days — design audit + replay tests.

### API-10 — Contract Schema Evolution Process
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** the compat-gate/registry *process*; day-to-day spec accuracy is API-01, breaking-change versioning policy is API-02.
- **Definition:** There is no process for evolving API contracts safely — no schema registry, no compatibility checking (additive-only change policy, protobuf/OpenAPI backward-compat rules), no versioned schema lifecycle, so "just change the field" is the default even when it breaks consumers.
- **Why it signals obsolescence:** Schema evolution is the discipline behind versioning (API-02): a defined set of moves that are safe (add field, add optional, widen) vs. breaking. Without it, contract changes are decided by mood, and consumers break by accident. Modern platforms centralize this (schema registry + compat checks in CI).
- **Where it manifests:** No schema registry, no `openapi-diff`/`buf breaking` in CI, breaking field removals pass review, event schemas changed with no consumer migration, "we thought it was private" surprises, no additive-value policy.
- **Detection method:** Process audit — is there a schema registry/repo of record? A compatibility gate in CI (openapi-diff, `buf`, protobuf `buf breaking`, JSON-schema compat check)? Events versioned with schemas? Check review history for breaking changes that merged; measure consumer breaks caused by schema changes.
- **Objective metric:** `compat gate in CI?`; `# of breaking schema merges (last 12 mo)`; `schema registry present?`; `event-schema versioning + migration process?`; `consumer breaks relating to schema changes (last 12 mo)`.
- **Yellow flag (warning):** Additive-change culture informally, no registry or gate, breaking merges rare but possible. *(Rationale: warning — working by shared etiquette, one new hire from a breakage.)*
- **Red flag (critical):** Breaking contract changes merge regularly with consumer breakage, or event schemas change with no consumer awareness, and no registry/gate/culture exists. *(Rationale: the contract is owned by no one — evolution is an incident factory.)*
- **Example symptom:** "An engineer 'simplifies' an event payload by renaming a field. The 14 consumers get no warning — events are fire-and-forget, and three of them crash on deserialize. 'What events does anything consume?' sends everyone into the logs."
- **Blast radius:** Consumer breakage, data-plane corruption (misparsed events), integration trust, platform growth.
- **Remediation playbook:** Quick win: add an OpenAPI/buf compatibility check to CI (fail on breaking changes), document the additive-change policy. Structural fix: schema registry + versioned schemas (event + API), compat gate enforced, consumer-migration process for breaking changes (deprecate → migrate → remove), telemetry of consumers (API-08).
- **Gold standard / target state:** Compat gates in CI, schema registry current, breaking changes rare and migration-led, event schemas versioned with consumers tracked.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = registry + gate; 2 = additive culture, no tooling; 1 = occasional breaking merges; 0 = regular silent schema breakage.
- **Verify effort:** 🔷 ~1–2 days — process audit + breaking-change archaeology.
