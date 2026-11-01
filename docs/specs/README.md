# Implementation specifications — compatibility guide

> **Status: compatibility aliases only.** The implementation contract for every indicator now
> lives with its rubric semantics in one canonical file under
> [`docs/rubric/indicators/`](../rubric/indicators/). Every per-indicator file in this directory
> is a short alias: it carries the ID, the canonical target, and a deprecation notice — never an
> independent rubric or implementation contract.

## Where to edit

| Material | Canonical location |
|---|---|
| Indicator identity, definition, scoring, remediation, applicability, detection, fact schema, status/score predicates, gates, failure/budget, evidence, scope | [`docs/rubric/indicators/<NN_CATEGORY>/<ID>_<slug>.md`](../rubric/indicators/) |
| Category navigation and weight summaries | [`docs/rubric/01`–`10`](../rubric/README.md) |
| Weights, formulas, bands, applicability vocabulary, gates | [`docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md`](../rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md) |
| Cross-indicator conventions (the former §2 preamble) | [`docs/rubric/README.md`](../rubric/README.md) §Normative cross-indicator conventions |
| Current scan/report behavior | [`openspec/specs/`](../../openspec/specs/) |

The compiler (`tooling/scripts/compile-rubric.ts`) and the structure checks read the unified
catalog. `npm run check:documentation-structure` fails if an alias grows contract sections or a
canonical ID appears in more than one file.

## Legacy skeleton mapping

The retired §0–§9 skeleton maps onto the unified ten-section contract:

| Legacy section | Unified section |
|---|---|
| §0 Identity | §1 Identity |
| §1 Inputs and applicability | §5 Applicability and inputs |
| §2 Detection recipe | §6 Detection recipe |
| §3 Fact schema | §7 Fact schema |
| §4 Statusing rules · §5 Score mapping | §8 Status and score mapping |
| §6 Gate hooks · §7 Failure & budget | §9 Gate, failure, and budget behavior |
| §8 Evidence string · §9 Scope/overlaps echo | §10 Evidence and output |

## Legacy arbitration record (historical)

Before the consolidation, the per-indicator specs arbitrated disagreements between the category
encyclopedias and `docs/plans/03_ENGINEERABILITY_MATRIX.md`; the rulings are preserved here as
history. They are **not** a second source: the unified indicator file is the only editable
contract. The identity table of each unified file carries the values the compiled registry has
always shipped, so the migration changed no generated output. The reconciliation of these
historical rulings into the catalog remains a separate, future change.

| ID | Encyclopedia said | Matrix 03 said | Spec rules as | Rationale |
|----|------------------|----------------|---------------|-----------|
| API-01 | A·estimated | A·measured | **A·estimated** | spec-vs-route matching across static inventories is heuristic alignment |
| API-02 | A·estimated | A·measured | **A·estimated** | version-marker presence is fact; discipline/breakage judgment inferred from history |
| API-03 | B·estimated | C·unknown | **B·estimated** | in-repo edge enumeration from configs; system topology beyond repo unknown |
| API-04 | B·estimated | A·estimated | **A·estimated** | await-chain shape + queue presence greppable (tier fix) |
| API-05 | B·unknown | A·estimated | **A·estimated** | host/key greps + abstraction-layer presence; vendor-risk judgment inferred |
| API-06 | A·estimated | A·measured | **A·measured** | protocol inventory over enumerated clients/servers = fact |
| API-07 | A·estimated | A·measured | **A·estimated** | error-schema/middleware presence factual; per-endpoint status semantics needs runtime sampling |
| API-08 | B·estimated | D·unknown | **D·unknown** | consumer telemetry/registry = org data |
| API-09 | B·unknown | A·estimated | **A·estimated** | idempotency-key middleware presence static (tier fix); enforcement proof needs replay test |
| API-10 | A·measured | D·unknown | **A·estimated** | compat-gate/registry presence in CI = facts; process maturity = inference |
| ARCH-11 | A·estimated | A·measured | **A·estimated** | type-coverage facts are static, but red-flag criterion needs incident share (unavailable) -> inference |
| DATA-02 | B·estimated | C·unknown | **B·estimated** | connection configs enumerable in-repo; cross-service sharing inferred; org topology unknown |
| DATA-03 | A·measured | C·unknown | **B·estimated** | live catalog unreachable; declared constraints in migrations/schema files = proxy inference |
| DATA-04 | B·unknown | C·unknown | **B·estimated** | storage inventory from compose/IaC/connection strings; vendor lifecycle lookup; weak |
| DATA-05 | B·unknown | C·unknown | **C·unknown** | (field-level rationale in spec §0) |
| DATA-06 | B·unknown | C·unknown | **B·estimated** | backup-job presence in CI/IaC observable; restore-drill evidence never is -> G7 stays needs-verification |
| DATA-07 | A·estimated | C·estimated | **A·estimated** | ORM-pattern greps static (tier fix); N+1 confirmation is inference |
| DATA-08 | B·estimated | A·estimated | **A·estimated** | migration/schema-file archaeology static |
| DATA-09 | B·unknown | A·measured | **A·measured** | history/outbox/audit-column presence over enumerated models = fact (presence-only) |
| DATA-10 | A·measured | C·unknown | **C·unknown** | cross-env schema diff impossible from one repo |
| DOCS-02 | B·estimated | A·estimated | **A·estimated** | doc-vs-code mtimes + removed-symbol grep computable from clone (tier fix) |
| DOCS-03 | B·unknown | A·measured | **A·measured** | docs/runbooks presence over enumerated tree = fact (presence-only) |
| DOCS-04 | B·estimated | A·measured | **A·measured** | CONTRIBUTING/setup-doc structure = fact (command dry-run excluded, no execution) |
| DOCS-07 | A·estimated | A·measured | **A·measured** | spec/generated-reference/docs-CI presence = facts (presence-only) |
| DOCS-08 | B·measured | A·measured | **A·measured** | CHANGELOG + GH releases API = facts |
| DOCS-09 | A·estimated | A·measured | **A·measured** | docs-CI step presence = fact |
| ECOS-01 | A·estimated | A·measured | **A·measured** | pin read (.nvmrc/Dockerfile/engines) -> endoflife.date lookup is a fact |
| ECOS-02 | A·estimated | A·measured | **A·measured** | registry/lockfile compare yields computed percentages; framework-gap classification mechanical |
| ECOS-03 | B·estimated | A·measured | **A·measured** | last-release metadata per dep from the vendored registry-derived table = fact; archived-repo check (GH/Scorecard) out of offline scope |
| ECOS-04 | B·estimated | A·estimated | **A·estimated** | static deprecation lints runnable, but signal uneven across ecosystems (Py warnings need execution) |
| ECOS-05 | B·measured | A·measured | **A·measured** | license classification from the vendored metadata table (direct-dep surface) = static facts; transitive/SBOM path pending |
| ECOS-06 | A·estimated | A·measured | **A·measured** | lockfile transitive counts + duplicate version sets = parsed facts (unused-direct analyser not shipped; null sub-signal) |
| ECOS-08 | A·estimated | A·measured | **A·measured** | framework support status via endoflife.date = fact; coupling-share secondary, still static |
| ECOS-09 | A·estimated | B·unknown | **B·estimated** | skew needs multi-service manifests; measurable only within a monorepo, else unknown |
| ECOS-10 | B·measured | A·measured | **A·measured** | Scorecard/osv/actions-pinning audit all remote-static |
| FE-01 | A·estimated | A·measured | **A·measured** | framework version -> endoflife.date = fact |
| FE-02 | A·measured | C·unknown | **C·unknown** | bundle measurement needs building/rendering = executing repo scripts (forbidden) |
| FE-03 | B·measured | C·unknown | **C·unknown** | axe/Lighthouse need render; lint-config presence too weak to score |
| FE-04 | B·measured | A·estimated | **A·estimated** | browserslist presence+currency = fact; support-judgment inferred |
| FE-05 | B·estimated | A·measured | **A·estimated** | LOC/store distributions static; seam/testability judgment inferred |
| FE-06 | C·unknown | A·estimated | **A·estimated** | token-adoption + hardcoded-color greps static (tier fix) |
| FE-07 | A·unknown | A·unknown | **A·estimated** | hardcoded-string density + i18n-lib presence static; thresholds uncalibrated |
| PERF-01 | B·measured | C·estimated | **A·estimated** | instrumentation deps/config presence static (tier fix); coverage/correlation quality inferred |
| PERF-02 | B·estimated | A·measured | **A·measured** | manifest presence (Dockerfile/k8s/tf) + VM-script smell = static facts |
| PERF-03 | B·unknown | C·unknown | **C·unknown** | (field-level rationale in spec §0) |
| PERF-04 | B·estimated | C·unknown | **C·unknown** | load experiment required |
| PERF-05 | B·estimated | C·unknown | **B·estimated** | HPA/ASG blocks in committed IaC = presence proof only; no-IaC repos stay unknown |
| PERF-06 | A·estimated | A·measured | **A·estimated** | IaC presence/coverage heuristic factual; true drift needs cloud creds -> inference |
| PERF-07 | C·unknown | C·estimated | **B·estimated** | SLO/dashboard-as-code/load-gate files greppable (tier fix); measured-SLO proof needs runtime |
| PERF-08 | B·measured | C·unknown | **C·unknown** | startup profiling = runtime |
| PERF-09 | B·unknown | D·unknown | **D·unknown** | (field-level rationale in spec §0) |
| SEC-03 | B·estimated | C·unknown | **C·unknown** | headers/TLS/DAST need a deployed target; nothing provable from URL |
| SEC-04 | B·unknown | C·estimated | **B·estimated** | grep-class static proxies (default-creds, client-side role checks) exist; weak -> estimated low |
| SEC-05 | B·unknown | C·unknown | **C·unknown** | log content/retention adequacy not judgeable statically |
| SEC-06 | B·measured | A·measured | **A·measured** | deep SCA over parsed lockfiles = static fact chain |
| SEC-09 | B·unknown | A·measured | **A·measured** | fuzz-harness/sanitizer-config presence over enumerated tree = fact (presence-only) |
| TEST-01 | A·measured | B·estimated | **B·estimated** | running coverage = test execution, forbidden (D5); CI-artifact/log proxy only |
| TEST-02 | B·measured | B·unknown | **B·unknown** | rerunning suites forbidden; Actions-history flake mining deferred to v2 deep scan |
| TEST-03 | A·estimated | A·measured | **A·estimated** | pyramid-tier assignment per file is a classification heuristic, not a fact |
| TEST-04 | B·measured | B·estimated | **B·estimated** | Actions job durations = elapsed-time signal only, not instrumented timing |
| TEST-07 | B·estimated | B·unknown | **B·unknown** | isolation provable only by executing suite (random/parallel); static greps too weak to score |
| TEST-09 | B·estimated | B·unknown | **B·unknown** | mutation testing executes repo code -> v2 deep scan only |
| TEST-10 | B·estimated | A·estimated | **A·estimated** | git archaeology fully automatable from clone (tier fix); commit-classification heuristic -> estimated |
| VEL-11 | B·estimated | B·measured | **B·estimated** | tooling inventory factual; cold-start timing needs execution |
| VEL-12 | B·unknown | D·unknown | **D·unknown** | incident tooling data = org plane |


---

## Compatibility policy

- Keep every legacy path in place; do not add new files here.
- An alias must remain short (≤ 25 lines) and contain exactly one `ID:` and one
  `Canonical target:` line.
- Deep historical anchors inside old spec bodies are not a maintained API; they now resolve to
  the alias and its canonical link.
