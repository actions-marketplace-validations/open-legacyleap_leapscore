# ARCH-08 — Duplication Debt

> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-08 |
| Name | Duplication Debt |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — clone detector + cross-service grep. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The same logic, algorithms, or structures are copy-pasted across the codebase and/or across services, with variations drifting over time — "the same bug in 5 places."
- **Why it signals obsolescence:** Duplication is the most visible sign that code wasn't given a home to live in. Every duplicated instance multiplies fix cost, allows drift (one copy gets the fix, others don't), and inflates the surface area of every change. It's the persistence of "temporary" code that became permanent.
- **Where it manifests:** Similar functions/classes across modules, copy-pasted validation/date/price logic, identical DTOs, duplicated middleware/error handling, near-identical test fixtures, similar blocks in different languages.
- **Objective metric:** `clone/duplication % (SonarQube or jscpd)`; `# of duplicated logic clusters`; `count of near-identical files`; `cross-service duplication instances`.
- **Yellow flag (warning):** Duplication 10–20%, mostly within a module, mostly peripheral. *(Rationale: warning — extract and consolidate before it becomes a web.)*
- **Red flag (critical):** > 25% duplication, or the same core business logic duplicated across services (where a bug in one copy costs money), or duplicated security/auth logic. *(Rationale: divergent copies of critical logic are a correctness and security hazard.)*
- **Example symptom:** "The pricing discount rule exists in six places across three services. Last quarter one place got 'fixed' for a client; the other five didn't. The client's accountant noticed first."
- **Blast radius:** Fix multiplication, drift bugs, test bloat, inconsistency in business rules, security (auth duplicated, one copy weak).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 10% dup, single source of truth; 2 = 10–20% peripheral dup; 1 = dup in core logic within one service; 0 = core rules duplicated across services with drift.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run jscpd, consolidate the top clusters behind a shared library (start with the business-critical ones). Structural fix: establish a shared internal library with a review process; kill duplicates at PR time (clone scan in CI); migrate duplicated logic incrementally with tests preserving behavior.
- **Gold standard / target state:** Duplication < 10%; core business rules exist exactly once, in one owned library; clone scan in CI fails new duplication.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** `jscpd >= 4` (multi-language, min-tokens 50), PMD-CPD (Java), `dupl` (Go)
- **Rate-cost:** none
- **Ecosystems:** agnostic via jscpd
- **Applicability:** `na_when: < 10 source files` (clone ratio meaningless below floor, clause-b).

## 6. Detection recipe

- **Detection method:** Clone detection — `jscpd` (code clone detection, all languages), PMD-CPD, Simian, SonarQube duplication, `dupl` (Go), `pylint` similar; manual: two files implementing the same concept; cross-service grep for the same constant/logic string.

1. Run jscpd with engine defaults over non-vendored source; capture `clones` report JSON.
2. Compute duplication % = cloned lines / total lines; cluster count.
3. Cross-service duplication: same-token clusters spanning >1 service root (monorepo).
4. Security-critical duplication flag: clusters touching auth/crypto allowlist symbols.
5. Join largest clusters to core-path set.

Preconditions: ≥10 files.

## 7. Fact schema

```json
{"arch08": {
  "duplication_pct": 14.2,
  "clusters": [{"tokens": 380, "files": ["a/pay.py", "b/pay.py"], "cross_service": true}],
  "security_critical_dup": true,
  "lines_analyzed": 84200}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  jscpd exit clean and lines_analyzed >= MIN_LINES
estimated_when: sampled subset (budget dissolve)              # clamp [1,2], confidence low
unknown_when:   no supported language
na_when:        applicability fired (< MIN_FILES)
clamp:          [1,2]
confidence:     medium (deterministic token model)
scope_limited:  file-count cap -> estimated + scope-limited
```

### Score mapping predicates

Y/R values (10–20% / >25%): see §3.

- `3`: `duplication_pct < Y_PCT`
- `2`: Yellow band, peripheral clusters only
- `1`: duplication in core logic within one service
- `0`: `security_critical_dup` ∨ core business rules duplicated cross-service (`cross_service ∧ in_core_path ∧ tokens > R_TOKENS`)

## 9. Gate, failure, and budget behavior

### Gate hooks

none. (G6 uses VEL-03+VEL-08 only.)

### Failure and budget semantics

- Budget class: `slow-dissolvable` — the canonical dissolve example per the catalog failure conventions
- Pathological token blowups → output cap → estimated + scope-limited

## 10. Evidence and output

### Evidence string

```
evidence: "jscpd {ver}: {p}% across {n} lines; worst cluster {t} tokens ({files}); sec-crit={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Clone ratio within/across modules; duplicated data access driving coupling is DATA-02/API-03.
