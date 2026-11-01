# API-02 — Versioning & Breaking-Change Discipline

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for API-02. Edit this file; the legacy path [api-02_versioning-breaking-change-discipline.md](../../../specs/06_API_INTEGRATION/api-02_versioning-breaking-change-discipline.md) is a compatibility alias.
> **Category:** [API & Integration Surface](../../06_API_INTEGRATION.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/06_API_INTEGRATION/API-02_versioning-breaking-change-discipline.md`

## 1. Identity

| field | value |
|---|---|
| ID | API-02 |
| Name | Versioning & Breaking-Change Discipline |
| Category | API — API & Integration Surface |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | ⚡ ≤ 30 min — release history + versioning audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** API changes are not versioned or announced — breaking changes ship in patch/minor releases, old versions die without notice, and consumers discover changes at runtime.
- **Why it signals obsolescence:** Versioning is the social contract of an API: it says "we will not break you silently." Its absence is a trust failure that forces every consumer to freeze-and-fear updates, blocks external integrations, and argues against ever exposing the API publicly. Modern practice is explicit versioning (path/header/negotiated) + deprecation policy + release cycle.
- **Where it manifests:** No `v1`/`v2` in paths or media types, breaking field removals in minor releases, no deprecation headers/announcements, old versions deleted immediately, consumers pinned to ancient versions with no migration path.
- **Objective metric:** `# of breaking changes shipped in non-major releases (last 12 mo)`; `version currency: # of concurrently supported versions`; `deprecation-to-retirement window (days)`; `formal versioning mechanism present?`.
- **Yellow flag (warning):** Versioned, but breaking changes slip into minors occasionally; deprecation communicated informally. *(Rationale: warning — the gate exists but is leaky.)*
- **Red flag (critical):** No versioning at all, breaking changes ship without announcement, or consumers broke in the last 12 months as a result. *(Rationale: the platform cannot have external consumers or stable partner integrations — modernization foreclosed.)*
- **Example symptom:** "A partner integration broke on a Tuesday because an endpoint removed a querystring param 'in a cleanup.' The partner said 'we can't build on an API that does this.' The sales pipeline for that deal evaporated."
- **Blast radius:** Consumer trust, external integration viability, partner velocity, API monetization, ecosystem growth.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = versioned + disciplined; 2 = versioned with leaks; 1 = versioned partially / reactive; 0 = no versioning, silent breakage.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: introduce versioning at the least cost (path `v2` for the contract-breaking surface; keep `v1` alive with a retirement date). Structural fix: versioning policy (what counts as breaking), deprecation headers + documented schedule, sunset coach with migration guides, semver discipline wired into release automation.
- **Gold standard / target state:** Explicit versioning everywhere; breaking changes only in majors with deprecation windows; a deprecation calendar; zero silent consumer breakage for two years.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + gh-api (releases/tags)
- **Tools:** versioning-marker greps (`/v1/`, `Accept: application/vnd.*v[0-9]`, `X-API-Version`); deprecation machinery (`Deprecation`/`Sunset` headers, `@deprecated` route decorators); release history mining for breaking-change markers (`BREAKING`, major bumps on API-touching commits)
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** `na_when: no HTTP server surface` (API-01 clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Version audit — URL/media-type versioning presence; semantic-release discipline (do breaking changes bump major? inspect release history + CHANGELOG); deprecation mechanism (headers, docs, schedule); consumer migration practice (existence of a version retirement policy).

1. Detect URL/media-type versioning presence in routes.
2. Deprecation mechanism inventory (headers, docs, decorator support).
3. Release audit: last N releases — do breaking changes bump majors? (commit/release-note regex; heuristic flagged).
4. Consumer-migration-path hint: migration guides referenced from breaking releases.

Preconditions: API surface present.

## 7. Fact schema

```json
{"api02": {
  "url_versioning": true, "media_type_versioning": false,
  "deprecation_headers": false,
  "breaking_without_major": [{"tag": "v2.3.0", "signal": "'BREAKING' in notes"}],
  "migration_guides_linked": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # discipline is a judgment over inferred breakage
estimated_when: >=2 of {markers, deprecation, release-audit} computed   # clamp [1,2]
unknown_when:   no API surface parseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when release history rich (>20 tags)
scope_limited:  few releases -> estimated low ("history too thin")
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: versioning present ∧ minor lapses only
- `1`: no versioning scheme ∨ repeated breaking-without-major pattern ∨ no deprecation path
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limited → static markers only → confidence low

## 10. Evidence and output

### Evidence string

```
basis: "versioning-probe: url={bool}; deprecations={bool}; {k} breaking-no-major of {n} releases"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Versioning/deprecation mechanics; contract currency is API-01, consumer awareness is API-08.
