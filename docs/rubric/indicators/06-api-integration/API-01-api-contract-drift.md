# API-01 — API Contract Drift

> **Category:** [API & Integration Surface](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | API-01 |
| Name | API Contract Drift |
| Category | API — API & Integration Surface |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into API category % |
| Verify effort | 🔶 ~2–4 h — contract inventory + diff. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Interfaces are not governed by a formal contract — no OpenAPI/Swagger/GraphQL schema/Protobuf for many/all endpoints, response shapes drift between deploys, fields appear/disappear silently, and consumers cope by sniffing.
- **Why it signals obsolescence:** A contract is the API's type system — it lets consumers, tests, generators, and mock servers depend on something stable. Its absence returns the world to "read the code, guess the shape," which is the definition of a pre-standard-era integration practice. Contract drift is also a direct cause of "it worked yesterday" integration bugs.
- **Where it manifests:** Endpoints with no schema/spec, response shapes assembled by hand (`res.json({...})` ad hoc), breaking field renames shipped in minor versions, no contract test, consumers parsing `docs/README_old.txt`, Swagger file that predates half the endpoints.
- **Objective metric:** `% of endpoints with a current, accurate contract`; `contract drift count (spec vs. actual)`; `% of clients generated from contract`; `# of undocumented endpoints`.
- **Yellow flag (warning):** Spec exists but stale/partial; some endpoints undocumented; clients hand-written. *(Rationale: warning — the contract exists in name, drift is accumulating.)*
- **Red flag (critical):** No contracts at all (or contracts so stale they're misleading), and/or breaking response changes ship freely. *(Rationale: consumers have no stable target — integration is archaeology.)*
- **Example symptom:** "The mobile app has reverse-engineered the API from logs. A deployment renamed `customerId`→`accountId` in a `1.0.x` patch. Every screen breaks at once. The 'contract' is a two-year-old OpenAPI file nobody regenerated."
- **Blast radius:** Consumer breakage, integration bugs, protocol interoperability (third-party consumers), API documentation trust, mock/test quality.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = contracts current + enforced; 2 = partial/stale coverage; 1 = mostly undocumented; 0 = no contracts, free drift.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: generate accurate specs from code (OpenAPI annotations/`apischema`, `drf-spectacular`, NestJS Swagger), validate specs vs. responses in CI. Structural fix: contract-first or contract-enforced development (spec is source of truth, generators produce clients/mocks/tests), a lint gate on spec changes.
- **Gold standard / target state:** Every endpoint covered by a current, accurate contract; clients and tests generated from it; spec drift impossible (CI enforces).

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** OpenAPI/Swagger file discovery + parse (`openapi: 3`, `swagger: 2`); route enumeration per framework (Express/Django/FastAPI/Spring/Flask/Gin annotations); validator-middleware presence (`@openapi/validator`, `pydantic` response models, drf-spectacular); client-gen artifacts (`/generated`, openapi-generator configs)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java · Go
- **Applicability:** `na_when: no HTTP server surface detected` (clause-b). Else applicable.; archetype+plane: `na_when archetype in {library, docs, agent-skills} && !has_data` (DATA) or `!has_deploy` (PERF) or `!has_server` (API) with exhaustive plane inventory — required rows never N/A

## 6. Detection recipe

- **Detection method:** Contract inventory — list all endpoints and check each against a spec (OpenAPI file exists? up to date? enforced?); diff spec vs. actual responses (OpenAPI validator middleware, `swagger-validator`, API lint `redocly lint`, spec-probe scripts); check generator usage (clients/tests generated from spec or hand-written); look for `"type":"any"`/untyped responses.

1. Parse spec file(s): endpoint+method set with schema refs; record `spec_mtime`.
2. Enumerate actual routes from framework decorators/routers.
3. Match sets: covered / spec-only (ghost endpoints) / route-only (undocumented). Fuzzy path matching (`{param}` vs `<int:pk>`).
4. Enforcement probe: is a validation middleware wired to the spec in the app bootstrap.

Preconditions: ≥1 route parseable.

## 7. Fact schema

```json
{"api01": {
  "spec_present": true, "spec_endpoints": 41, "route_total": 58,
  "undocumented": 19, "ghost": 2,
  "validator_middleware": false,
  "match_confidence": "medium"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # live responses never observed
estimated_when: routes enumerable              # clamp [1,2]; confidence medium when both sets parsed cleanly
unknown_when:   routes unparseable and no spec found
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium; low if <70% fuzzy-match confidence
scope_limited:  multi-service monorepo -> aggregate + scope-limited if truncated
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: spec present, drift below Yellow share, enforcement optional
- `1`: no spec ∧ routes exist ∨ drift above Yellow ∨ spec stale (>R_DAYS older than last route commit)
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Multiple specs → per-spec scoring, worst-of aggregated with note

## 10. Evidence and output

### Evidence string

```
basis: "contract-inventory: {u}/{n} undocumented, {g} ghost; validator wired={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Spec-vs-route currency; versioning discipline is API-02, evolution process is API-10.
