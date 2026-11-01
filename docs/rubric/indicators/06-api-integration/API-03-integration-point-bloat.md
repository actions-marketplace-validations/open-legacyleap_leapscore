# API-03 — Integration Point Bloat

> **Category:** [API & Integration Surface](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | API-03 |
| Name | Integration Point Bloat |
| Category | API — API & Integration Surface |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART (candidate) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 ~2–4 h — config-based topology mapping. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system has a sprawling, unmanaged mesh of point-to-point integrations — direct service-to-service calls, services reading each other's DBs (see DATA-02), N-way connections that only the longest-serving engineers understand, no gateway/registry, and integration sprawl that grows with every feature.
- **Why it signals obsolescence:** Each integration point is a hidden dependency: a deployment, a security surface, an outage path. When the mesh grows without governance, changes ripple invisibly and the "system" is unknowable — a defining property of organic, pre-platform-era architectures.
- **Where it manifests:** A hand-drawn "integration spaghetti" diagram, services calling 5+ other services directly, shared DBs between services, no service registry/API gateway, a network diagram nobody can update, "if X changes we have to check these 11 things."
- **Objective metric:** `avg outgoing integrations per service`; `graph density (edges/nodes)`; `# of cross-service direct DB reads`; `central registry/gateway exists?`; `# of services with > 8 integrations`.
- **Yellow flag (warning):** Dense point-to-point graph (5–10 edges/service), growing, but documented; a registry/gateway is absent. *(Rationale: warning — still navigable, governance is missing.)*
- **Red flag (critical):** Every service talks to every other / shared DBs are the integration bus, the graph is undocumented, or a deployment integral to another service is routinely discovered by incident. *(Rationale: the topology is unknowable — no change is local anymore.)*
- **Example symptom:** "The diagram has 63 boxes and 120 arrows. Someone asks 'what happens if we decommission the legacy profile service?' Three days of archaeology later, the answer is 'eleven services, two of them not obviously related.'"
- **Blast radius:** Outage chains, security surface, deployment coordination, team autonomy, on-call archaeology, modernization sequencing.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = governed mesh; 2 = dense but documented; 1 = dense, no registry; 0 = unknowable graph / DB-as-integration-bus.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: build the topology map (automated), as the source of truth, and start routing traffic through a gateway for the top 5 hubs. Structural fix: platform governance — service registry, gateway/boundary routing, event-based decoupling for the densest paths, rules against direct cross-service DB access.
- **Gold standard / target state:** Known topology (auto-mapped, current), integration governance (registry/gateway/events), a change to one service locally verifiable, density trending down.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** integration-edge extractors: outbound HTTP client configs (`base_url` env refs, SDK deps), message-broker topics/queues (`kafka`, `rabbitmq`, `sqs` config), service-discovery references, webhook routes, DB/queue connection strings (shared with DATA-02 sweep)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero outbound integrations and single-service layout` (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Topology mapping — build the integration graph from configs (service discovery, env vars, DNS targets, HTTP client configs, DB connection strings), visualize it, count edges per node; check for a platform gateway/registry; interview "who can name every integration?" Compute graph density and cross-service DB reads.

1. Enumerate edges from the repo's configs/code: `{target, protocol, config_site}`.
2. Dedupe by logical target; count per node (the repo itself) + fan-out.
3. Gateway/registry presence: API gateway config, service mesh, central client library.
4. System-wide topology beyond repo → emission text (org plane).

Preconditions: ≥1 config surface parseable.

## 7. Fact schema

```json
{"api03": {
  "outbound_edges": [{"target": "stripe-api", "protocol": "https", "abstracted": true}],
  "queue_bindings": ["orders.created"],
  "fan_out_total": 17,
  "gateway_present": false,
  "unabstracted_direct_clients": 9}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # bloat judgment over partial graph is inferential
estimated_when: >=1 config surface enumerated  # clamp [1,2]; confidence medium in monorepos
unknown_when:   no configs found in an integration-suspected tree
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when env templates + manifests both parsed
scope_limited:  multi-repo topology -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: moderate fan-out, most clients abstracted
- `1`: high unabstracted fan-out ∨ duplicate bindings to same target via different protocols
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Env-injected-only endpoints (no templates) → undercount risk noted in evidence

## 10. Evidence and output

### Evidence string

```
basis: "integration-graph: {n} outbound edges ({u} direct/unabstracted); queues {list}; gateway={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Integration-point inventory; sync-vs-async shape is API-04, vendor risk per dependency is API-05, DB edges are DATA-02.
