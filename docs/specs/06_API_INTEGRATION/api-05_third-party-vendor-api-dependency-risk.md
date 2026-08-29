# API-05 — Third-Party & Vendor API Dependency Risk — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B·unknown) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 human · engine: vendor sweep |
| Thresholds & 0–3 criteria | see encyclopedia §API-05 |

## 1. Inputs

- **Planes:** static-src + ecosystem
- **Tools:** third-party host extraction (URL literals + env-template hosts matched against public-suffix list); vendor SDK deps in manifests; abstraction-layer detection (vendor calls confined to adapter module vs scattered); deprecation-watch hints (pinned old SDK majors via registry metadata — ECOS-02 reuse)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero third-party API dependencies` (clause-b over manifests+configs). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Enumerate vendors: `{name, sdk_dep?, host_refs, call_sites}`.
2. Per vendor: abstracted? (call sites within one module), fallback path present? (alternate client/queue buffering), SDK currency.
3. Criticality join: vendor used on core flows (core-path import closure).
4. Vendor-side lifecycle (their changelogs) is external plane → emission text.

Preconditions: ≥1 vendor found.

## 3. Fact schema

```json
{"api05": {
  "vendors": [{"name": "stripe", "sdk": true, "abstracted": true, "on_core_flow": true, "fallback": false}],
  "direct_host_calls_unabstracted": ["api.twitter.com"],
  "stale_sdks": [{"dep": "stripe-node", "majors_behind": 2}]}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # vendor-risk judgment is inferential
estimated_when: >=1 vendor enumerated          # clamp [1,2]; confidence medium when manifests+hosts agree
unknown_when:   endpoints fully env-injected with no templates/SDK deps
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium; low if only URL-literal evidence
scope_limited:  private/internal APIs invisible -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §API-05. Estimated ⇒ score ∈ {1,2}:

- `2`: vendors abstracted, minor staleness, core flows have fallbacks or low vendor count
- `1`: unabstracted core-flow vendor ∨ stale major SDKs ∨ no fallback anywhere
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Host allowlist misses internal domains → they're listed as unknown-vendor entries, not scored

## 8. Evidence string

```
basis: "vendor-sweep {n}: unabstracted-core={list}; stale sdks={list}; fallbacks={k}/{n}"
```

## 9. Scope/overlaps echo

Third-party API dependency posture; package-level supply-chain risk is ECOS-03/10, integration count is API-03.
