# ARCH-12 — Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions)

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for ARCH-12. Edit this file; the legacy path [arch-12_duplicated-cross-cutting-concerns.md](../../../specs/02_ARCHITECTURE_CODE/arch-12_duplicated-cross-cutting-concerns.md) is a compatibility alias.
> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/02_ARCHITECTURE_CODE/ARCH-12_duplicated-cross-cutting-concerns.md`

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-12 |
| Name | Duplicated Cross-Cutting Concerns (auth, logging, error handling, transactions) |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES (deep-dive tier) |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: ARCH` |
| Verify effort | 🔷 ~1–2 days — grep analysis + route-coverage test. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Cross-cutting concerns — authentication, authorization, logging, error mapping, transaction boundaries, validation — are implemented ad hoc in every call site instead of as shared, testable infrastructure (middleware/interceptors/decorators).
- **Why it signals obsolescence:** Cross-cutting concerns are where security and compliance bugs live, and ad-hoc implementation means: inconsistent coverage (one route forgets auth), duplicated and drifted logic, and no single place to add a security control or a trace. Modern frameworks provide interceptors/middleware precisely to centralize these.
- **Where it manifests:** Auth checked manually at the top of N controllers (and missed in a few), logging calls sprinkled with inconsistent context, try/catch duplication, transaction management inside every service method, validation hand-rolled per endpoint.
- **Objective metric:** `# of manual auth check sites`; `% of endpoints covered by shared middleware`; `# of duplicated error-mapping blocks`; `# of un-caught/unmapped exception paths`.
- **Yellow flag (warning):** Some duplication of cross-cutting code; manual auth in a few non-critical routes. *(Rationale: warning — the drift is seeded.)*
- **Red flag (critical):** Manual security checks in core routes (with known coverage gaps), or no centralized error/logging infrastructure at all. *(Rationale: this is where a missed check becomes a breach.)*
- **Example symptom:** "Auth is a copy-pasted `if (!session) redirect` block at the top of 80 controllers — and three new ones forgot it. A pentest finds an unauthenticated admin endpoint that's been public for 14 months."
- **Blast radius:** Security coverage, compliance, error-handling consistency, observability quality, developer discipline.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = centralized + enforced; 2 = mostly centralized, gaps; 1 = manual checks in core; 0 = missed coverage in security-sensitive paths.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: audit for missing shared middleware and missed auth sites; move the top repeated concern (auth) to framework middleware. Structural fix: centralize each concern (authN/authZ, logging, error mapping, validation, transactions) into one owned infrastructure layer with tests; wire via framework interceptors; add security tests that assert every endpoint enforces auth.
- **Gold standard / target state:** Every cross-cutting concern implemented once, in infrastructure, enforced by framework; a security test walks all routes asserting auth coverage; zero manual auth in controllers.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** AST-grep matcher packs: manual auth checks (session/permission guards at function tops) vs middleware/interceptor registrations; duplicated error-mapping catch blocks (same mapping body token-hash); transaction boilerplate per service method; validation hand-rolling per endpoint
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java (framework-aware: Express/Nest, Django DRF, Spring); Go heuristic low
- **Applicability:** `na_when: no HTTP/route surface detected` (pure CLI/batch repo, clause-b).

## 6. Detection recipe

- **Detection method:** Grep/pattern analysis — count manual auth checks vs. middleware; error-handling duplication (catch blocks with the same mapping); transaction boilerplate per method; trace/log-context consistency (from PERF-01/API-07). Tools: SonarQube rules, custom greps, security review sampling.

1. Enumerate route/endpoint definitions; detect framework middleware chain presence.
2. Count manual guard sites inside handlers vs middleware-covered routes.
3. Token-hash catch/error-mapping blocks → duplicate clusters.
4. Transaction begin/commit boilerplate frequency in service methods.

Preconditions: route enumeration parseable.

## 7. Fact schema

```json
{"arch12": {
  "endpoints": 84,
  "middleware_coverage_pct": 61.9,
  "manual_auth_sites": [{"file": "controllers/admin.js", "endpoint": "/admin/x"}],
  "dup_error_mappers": 7,
  "tx_boilerplate_methods": 22}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # coverage-gap judgment is inferential
estimated_when: >=2 of {middleware-coverage, auth-sites, error-mapper} probes ran   # clamp [1,2]
unknown_when:   routes unparseable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all three probes ran on a supported framework
scope_limited:  sampled endpoint set -> estimated + scope-limited
```

### Score mapping predicates

Criteria: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: mostly centralized (`coverage_pct >= Y_COV`), few manual sites outside core
- `1`: manual security checks in core-route set ∨ `coverage_pct < Y_COV`
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none (missed-coverage breach risk stays with SEC-04's row).

### Failure and budget semantics

- Budget class: `fast`
- Unrecognized framework → middleware detection heuristic-only → confidence low

## 10. Evidence and output

### Evidence string

```
basis: "crosscut-probe: middleware covers {p}% of {n} endpoints; manual auth sites {k}; dup mappers {m}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Shared-infrastructure duplication; auth-*coverage* gaps are SEC-04, error-*semantics* are API-07.
