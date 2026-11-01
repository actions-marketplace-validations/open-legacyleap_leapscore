# API-06 — Protocol & Data-Format Legaciness

> **Category:** [API & Integration Surface](../../06_API_INTEGRATION.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | API-06 |
| Name | Protocol & Data-Format Legaciness |
| Category | API — API & Integration Surface |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 ~2–4 h — protocol inventory + traffic-share estimate. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system still speaks legacy/modern-hostile protocols and formats on its load-bearing interfaces — SOAP, XML-RPC, REST-less RPC, proprietary binary serialization, XML everywhere, CORBA-era patterns, or hand-rolled wire formats — where modern equivalents (REST/OpenAPI, gRPC, message queues, JSON/Protobuf, AS2/EDIFACT-era interop) are expected.
- **Why it signals obsolescence:** Protocol choice is the era stamp of an integration layer. Legacy protocols carry high operational overhead (web services stacks, ceremony, XML pain), lock out modern tooling (typed clients, gateways, observability), and are where staffing, security, and interop friction concentrate. Pairs with ARCH-06 at the interface level.
- **Where it manifests:** WSDL files, SOAP envelopes, XML namespace ceremony, custom binary formats with hand-maintained mappers, an integration layer gated on a 2005-era middleware, mainframe/interconnect stubs, no JSON/REST/typed-schema path for new integrations.
- **Objective metric:** `% of core integration traffic on legacy protocols`; `# of WSDL/SOAP/binary-format consumers`; `modern protocol support present (JSON/REST/gRPC)?`; `staffing difficulty for legacy formats`.
- **Yellow flag (warning):** Some legacy-protocol integrations in non-core corners (a partner still on SOAP/EDI), modern formats available for the rest. *(Rationale: warning — a cost center, but contained.)*
- **Red flag (critical):** Core flows bind on SOAP/XML/binary/proprietary protocols with no modern alternate, or the middleware that speaks them is itself EOL. *(Rationale: every new integration inherits the museum protocol and its staffing tax.)*
- **Example symptom:** "The 'integration platform' is a SOAP/XML layer from 2009. New hires spend a month learning WSDL elbows. A new product wants a webhook. There's no JSON happy path — they must map everything to XML namespaces first."
- **Blast radius:** Interop friction, staffing, gateway/observability compatibility, security (XML parsing attacks), feature velocity on the integration plane.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = modern protocols; 2 = legacy in non-core corners; 1 = core on legacy protocols with a plan; 0 = core binds on EOL middleware/protocols.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: stand up modern endpoints (REST/JSON or gRPC) alongside the legacy ones for new traffic, put a gateway in front to let consumers choose. Structural fix: migrate integrations off legacy protocols where feasible (strangler at the protocol layer), retire the EOL middleware, offer modern contracts for every legacy consumer.
- **Gold standard / target state:** Core traffic on modern protocols, legacy formats behind adapters/bridges and shrinking, no EOL middleware, new integrations never require the museum stack.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** protocol matchers: SOAP/WSDL (`*.wsdl`, `soap` deps, `zeep`/`suds`), XML-RPC, CORBA/IIOP refs, binary legacy formats (BSON-in-rest, custom TCP framing), EDI/X12 files; modern markers: OpenAPI/gRPC proto files, GraphQL schemas, JSON:API conventions; message formats on queues (avro/proto/json-schema registry presence)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no integration surface at all` (API-01 clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Protocol inventory — list all wire protocols across integrations (inspect clients/servers, WSDL/Proto/OpenAPI presence), check each against the ecosystem norm; measure the share of core traffic on legacy protocols; check newer-format support (JSON, Protobuf, OpenAPI, events) exists at all.

1. Inventory wire protocols across clients/servers/configs over the enumerated tree.
2. Classify each: modern-norm / aging / legacy per per-language era table.
3. Core-share: fraction of core-flow modules touching legacy protocols.
4. Format registry hygiene for async messages.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"api06": {
  "protocols": [{"kind": "soap", "evidence": ["wsdl/partner.wsdl", "zeep in requirements"], "legacy": true}],
  "modern_share": 0.7,
  "core_legacy_touch": true,
  "schema_registry_present": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # inventory + classification is deterministic given era table
estimated_when: era-table gaps for exotic protocols   # clamp [1,2], confidence low
unknown_when:   no parseable surface
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium
scope_limited:  vendored client libs excluded -> noted
```

### Score mapping predicates

Y/R values: see §3.

- `3`: all-modern inventory
- `2`: legacy protocols present but zero core-touch
- `1`: legacy in isolated core-adjacent paths
- `0`: legacy protocol carrying core flows ∨ removed-standard protocols still active

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Era-table miss → protocol listed unclassified → estimated branch

## 10. Evidence and output

### Evidence string

```
evidence: "protocol-inventory {n}: legacy={list} ({k} core-touching); modern share={p}%"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Wire-protocol/format choices; the endpoints' contract currency is API-01, vendor lifecycle is API-05.
