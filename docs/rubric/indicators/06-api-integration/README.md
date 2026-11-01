# 06 — API & Integration Surface

> **Category charter.** Standard indicators: API-01–API-07 · Deep-dive indicators: API-08–API-10
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** The API is the contract your system makes with the world. When contracts are undocumented, unversioned, and ungoverned, every consumer — internal or external — is at the mercy of the codebase's mood.
**Category summary:** Scores the health of the interfaces between the system and its consumers (internal services, partners, frontends, IoT, third-party SaaS) — formal contracts, versioning, integration topology, coupling, external-dependency risk, protocol currency, error semantics, and consumer visibility.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| API-01 | API Contract Drift | A | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./API-01-api-contract-drift.md) |
| API-02 | Versioning & Breaking-Change Discipline | A | estimated | YES | none | standard · folds into API category % | ⚡ ≤30 min | [unified](./API-02-versioning-breaking-change-discipline.md) |
| API-03 | Integration Point Bloat | B | estimated | PART (candidate) | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./API-03-integration-point-bloat.md) |
| API-04 | Synchronous Coupling & Chatty Interfaces | B | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./API-04-synchronous-coupling-chatty-interfaces.md) |
| API-05 | Third-Party & Vendor API Dependency Risk | B | unknown | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./API-05-third-party-vendor-api-dependency-risk.md) |
| API-06 | Protocol & Data-Format Legaciness | A | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./API-06-protocol-data-format-legaciness.md) |
| API-07 | Error Handling & API Observability Semantics | A | estimated | YES | none | standard · folds into API category % | 🔶 ~2–4 h | [unified](./API-07-error-handling-api-observability-semantics.md) |
| API-08 | Consumer Blindness & Backward Compatibility | B | estimated | NO | none | deep-dive · `folds_into: API` | 🔶 ~2–4 h | [unified](./API-08-consumer-blindness-backward-compatibility.md) |
| API-09 | Idempotency & Retry Semantics | B | unknown | YES (deep-dive tier) | none | deep-dive · `folds_into: API` | 🔷 ~1–2 days | [unified](./API-09-idempotency-retry-semantics.md) |
| API-10 | Contract Schema Evolution Process | A | measured | YES (deep-dive tier) | none | deep-dive · `folds_into: API` | 🔷 ~1–2 days | [unified](./API-10-contract-schema-evolution-process.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).
