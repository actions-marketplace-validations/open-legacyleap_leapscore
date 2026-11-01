# 06 — API & Integration Surface

> **Canonical category index.** Base weight: 10% · FE-active weight: 9% · Standard indicators: API-01–API-07 · Deep-dive indicators: API-08–API-10
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** The API is the contract your system makes with the world. When contracts are undocumented, unversioned, and ungoverned, every consumer — internal or external — is at the mercy of the codebase's mood.
**Category summary:** Scores the health of the interfaces between the system and its consumers (internal services, partners, frontends, IoT, third-party SaaS) — formal contracts, versioning, integration topology, coupling, external-dependency risk, protocol currency, error semantics, and consumer visibility.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| API-01 | API Contract Drift | A | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-01_api-contract-drift.md) |
| API-02 | Versioning & Breaking-Change Discipline | A | estimated | YES | none | standard · folds into API category % | ⚡ ≤30 min | [unified](./indicators/06_API_INTEGRATION/API-02_versioning-breaking-change-discipline.md) |
| API-03 | Integration Point Bloat | B | estimated | PART (candidate) | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-03_integration-point-bloat.md) |
| API-04 | Synchronous Coupling & Chatty Interfaces | B | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-04_synchronous-coupling-chatty-interfaces.md) |
| API-05 | Third-Party & Vendor API Dependency Risk | B | unknown | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-05_third-party-vendor-api-dependency-risk.md) |
| API-06 | Protocol & Data-Format Legaciness | A | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-06_protocol-data-format-legaciness.md) |
| API-07 | Error Handling & API Observability Semantics | A | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-07_error-handling-api-observability-semantics.md) |
| API-08 | Consumer Blindness & Backward Compatibility | B | estimated | NO | none | deep-dive · `folds_into: API` | 🔶 ~2–4 h | [unified](./indicators/06_API_INTEGRATION/API-08_consumer-blindness-backward-compatibility.md) |
| API-09 | Idempotency & Retry Semantics | B | unknown | YES (deep-dive tier) | none | deep-dive · `folds_into: API` | 🔷 ~1–2 days | [unified](./indicators/06_API_INTEGRATION/API-09_idempotency-retry-semantics.md) |
| API-10 | Contract Schema Evolution Process | A | measured | YES (deep-dive tier) | none | deep-dive · `folds_into: API` | 🔷 ~1–2 days | [unified](./indicators/06_API_INTEGRATION/API-10_contract-schema-evolution-process.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.
