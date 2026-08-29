# API-02 — Versioning & Breaking-Change Discipline — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (status arbitrated; matrix said measured) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 human · engine: marker + release-history mining |
| Thresholds & 0–3 criteria | see encyclopedia §API-02 |

## 1. Inputs

- **Planes:** static-src + gh-api (releases/tags)
- **Tools:** versioning-marker greps (`/v1/`, `Accept: application/vnd.*v[0-9]`, `X-API-Version`); deprecation machinery (`Deprecation`/`Sunset` headers, `@deprecated` route decorators); release history mining for breaking-change markers (`BREAKING`, major bumps on API-touching commits)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no HTTP server surface` (API-01 clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 2. Detection recipe

1. Detect URL/media-type versioning presence in routes.
2. Deprecation mechanism inventory (headers, docs, decorator support).
3. Release audit: last N releases — do breaking changes bump majors? (commit/release-note regex; heuristic flagged).
4. Consumer-migration-path hint: migration guides referenced from breaking releases.

Preconditions: API surface present.

## 3. Fact schema

```json
{"api02": {
  "url_versioning": true, "media_type_versioning": false,
  "deprecation_headers": false,
  "breaking_without_major": [{"tag": "v2.3.0", "signal": "'BREAKING' in notes"}],
  "migration_guides_linked": true}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # discipline is a judgment over inferred breakage
estimated_when: >=2 of {markers, deprecation, release-audit} computed   # clamp [1,2]
unknown_when:   no API surface parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when release history rich (>20 tags)
scope_limited:  few releases -> estimated low ("history too thin")
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §API-02. Estimated ⇒ score ∈ {1,2}:

- `2`: versioning present ∧ minor lapses only
- `1`: no versioning scheme ∨ repeated breaking-without-major pattern ∨ no deprecation path
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limited → static markers only → confidence low

## 8. Evidence string

```
basis: "versioning-probe: url={bool}; deprecations={bool}; {k} breaking-no-major of {n} releases"
```

## 9. Scope/overlaps echo

Versioning/deprecation mechanics; contract currency is API-01, consumer awareness is API-08.
