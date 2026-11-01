# API-05 — Third-Party & Vendor API Dependency Risk

> **Category:** [API & Integration Surface](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | API-05 |
| Name | Third-Party & Vendor API Dependency Risk |
| Category | API — API & Integration Surface |
| Engine tier | B |
| Default status | unknown |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 ~2–4 h — external-call inventory + vendor changelog check. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Core functionality depends on external APIs/SaaS/vendors that are unmanaged as risks — no fallback, no circuit breaker, no documentation, no SLA awareness, vendors on deprecated APIs, API keys held by one person, no contract/license review.
- **Why it signals obsolescence:** External dependencies are bets: the vendor can change, deprecate, rate-limit, or vanish. Unmanaged, those bets become surprises. A modern integration surface manages external risk like insurance — fallbacks, abstraction, monitoring, license review, replacement paths. This is often where "the system was built on a promise" class of debt lives.
- **Where it manifests:** Core flows calling a vendor endpoint directly, vendor API deprecated (per their changelog) and still used, no abstraction layer (swap = rewrite), API keys in code/one person's laptop, no vendor SLA/monitoring, single-vendor dependency with no alternative.
- **Objective metric:** `# of core flows directly coupled to external vendors`; `% of external calls abstracted`; `# of vendor APIs deprecated/in-use-beyond-EOL`; `fallback coverage %`; `single-vendor concentration on critical paths`.
- **Yellow flag (warning):** Some external calls unabstracted/non-critical; vendor deprecations vaguely watched; no fallback for most. *(Rationale: warning — manageable until the vendor moves.)*
- **Red flag (critical):** Core flows directly coupled to a deprecated/unmaintained vendor API with no abstraction and no fallback, or a single vendor is a silent single point of failure for revenue. *(Rationale: the vendor's roadmap now *is* your roadmap — you ship when they do.)*
- **Example symptom:** "Payments route straight into the acquirer's SDK v1. They EOL'd it last quarter and won't patch the recurring-billing bug. The abstraction layer is 'the SDK wrapper we wrote.' Migration means rewriting a revenue path through a still-moving target."
- **Blast radius:** Revenue continuity, roadmap sovereignty, outage chains, compliance (vendor data handling), pricing changes.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = abstracted + monitored + fallbacked; 2 = some unabstracted non-core; 1 = core calls unabstracted, deprecations watched informally; 0 = revenue on a deprecated vendor API with no path.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: wrap the top 3 vendor calls behind ports (adapters), add fallback paths where feasible, assign a vendor-risk owner + deprecation watch. Structural fix: integration abstraction for critical vendors, SLA monitoring + circuit breakers, contract/license review, documented replacement paths, vendor deprecation calendar.
- **Gold standard / target state:** External dependencies abstracted, fallbacked, monitored, and reviewed; vendor deprecations tracked and migrations planned; no revenue path is call-vendor-and-pray.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + ecosystem
- **Tools:** third-party host extraction (URL literals + env-template hosts matched against public-suffix list); vendor SDK deps in manifests; abstraction-layer detection (vendor calls confined to adapter module vs scattered); deprecation-watch hints (pinned old SDK majors via registry metadata — ECOS-02 reuse)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero third-party API dependencies` (clause-b over manifests+configs). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** External-dependency inventory — grep for third-party hosts/APIs, audit each: is it abstracted (behind a port) or called directly? Is the vendor API current (their changelog/deprecation)? Is there a fallback path? Who owns the key and contract? Is usage monitored? Rate-limit margins known?

1. Enumerate vendors: `{name, sdk_dep?, host_refs, call_sites}`.
2. Per vendor: abstracted? (call sites within one module), fallback path present? (alternate client/queue buffering), SDK currency.
3. Criticality join: vendor used on core flows (core-path import closure).
4. Vendor-side lifecycle (their changelogs) is external plane → emission text.

Preconditions: ≥1 vendor found.

## 7. Fact schema

```json
{"api05": {
  "vendors": [{"name": "stripe", "sdk": true, "abstracted": true, "on_core_flow": true, "fallback": false}],
  "direct_host_calls_unabstracted": ["api.twitter.com"],
  "stale_sdks": [{"dep": "stripe-node", "majors_behind": 2}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # vendor-risk judgment is inferential
estimated_when: >=1 vendor enumerated          # clamp [1,2]; confidence medium when manifests+hosts agree
unknown_when:   endpoints fully env-injected with no templates/SDK deps
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium; low if only URL-literal evidence
scope_limited:  private/internal APIs invisible -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: vendors abstracted, minor staleness, core flows have fallbacks or low vendor count
- `1`: unabstracted core-flow vendor ∨ stale major SDKs ∨ no fallback anywhere
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Host allowlist misses internal domains → they're listed as unknown-vendor entries, not scored

## 10. Evidence and output

### Evidence string

```
basis: "vendor-sweep {n}: unabstracted-core={list}; stale sdks={list}; fallbacks={k}/{n}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Third-party API dependency posture; package-level supply-chain risk is ECOS-03/10, integration count is API-03.
