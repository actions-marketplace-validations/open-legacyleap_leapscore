# ECOS-09 — Version Skew Across Services

> **Category:** [Dependency & Ecosystem Health](../../01_DEPENDENCY_ECOSYSTEM.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-09 |
| Name | Version Skew Across Services |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | A |
| Default status | estimated |
| v1 flag | **PART** — only for in-repo multi-service layouts (monorepo); org-wide skew is v2 |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: ECOS` |
| Verify effort | 🔷 ~1–2 days — repo aggregation + scripting. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** In a multi-service system, the same dependency/framework exists at many different major versions across services (e.g., service A on Python 3.9, service B on 3.12; shared libraries at 3 different majors), with no coordinated upgrade strategy.
- **Why it signals obsolescence:** Skew means the "system" has no coherent platform — every service is a snowflake with its own dependency museum. It multiplies upgrade effort (one fix, N upgrades), blocks shared tooling, and signals that the org has no platform discipline. It's the system-level echo of ECOS-02.
- **Where it manifests:** Cross-repo version manifests, dependency dashboards, `renovate`/`dependabot` aggregated reports, internal platform teams' inventory, container registry image tags showing runtime variety.
- **Objective metric:** `# of distinct major versions per core dependency`; `% of services on the platform's "reference" version`; `std-dev of runtime versions`.
- **Yellow flag (warning):** 2–3 majors of a core dependency in flight, with a shared upgrade backlog. *(Rationale: tolerable drift, but it already costs you in shared fixes.)*
- **Red flag (critical):** Core dependency at 3+ distinct majors, or runtimes so varied that shared tooling/CI can't support them. *(Rationale: you're maintaining N platforms, not one — every security fix is multiplied.)*
- **Example symptom:** "A critical CVE in a shared HTTP client affects services on v2, v3, and v4. Three separate fix PRs, three rollout windows, and one service on v2 that needs an incompatible change to even accept the patch. Same fix, three times the risk."
- **Blast radius:** Security fix latency, shared-library breakage, onboarding, CI/tooling matrix explosion, platform standardization efforts.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = uniform; 2 = two majors in flight with a plan; 1 = three majors with no coordination; 0 = divergent snowflakes with no platform baseline.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: inventory the skew, pick a "platform baseline" version, and make new work use it. Structural fix: establish a platform/boilerplate team with a version cadence; migrate oldest-first on the critical path; add cross-service tests for the shared contract; sunset divergent majors with deadlines.
- **Gold standard / target state:** One supported major of every core dependency per system; upgrade cadence managed centrally; a new service starts on the platform baseline.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src (in-repo service manifests)
- **Tools:** manifest parsers run per service root; service-root detector (`*/Dockerfile`, `*/package.json`, `*/pyproject.toml`, `services/`, `apps/` conventions)
- **Rate-cost:** none
- **Ecosystems:** all gated
- **Applicability:** `na_when: single-service layout detected (one root manifest set, no sibling service dirs)` → N/A clause-b. `unknown_when: multi-service but manifests live in other repos` (org plane unreachable from URL).

## 6. Detection recipe

- **Detection method:** Aggregate manifests across repos (script it: grep `FROM | python-version | framework version` across repos), use a central platform inventory, run a single dependency scan across the org's repos and diff versions by service; count distinct majors per load-bearing dependency.

1. Detect service roots (dir containing its own runtime manifest + deploy artifact).
2. Per root: extract runtime version + framework version + shared-lib versions (ECOS-01/02 extractors, re-invoked per root).
3. Group by dependency; count distinct majors per core dep; compute share of services on the modal ("reference") version.

Preconditions: ≥2 service roots detected.

## 7. Fact schema

```json
{"ecos09": {
  "service_roots": ["services/api", "services/worker"],
  "skew": [{"dep": "python", "majors": ["3.9", "3.12"], "services_on_reference": 0.5}],
  "max_distinct_majors": {"dep": "django", "count": 3}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=2 service roots and >=80% roots yielded parseable pins
estimated_when: partial root coverage                                    # clamp [1,2], confidence low
unknown_when:   multi-service suspected but manifests outside repo scope
na_when:        single-service layout (clause-b)
clamp:          [1,2]
confidence:     medium within monorepo
```

### Score mapping predicates

Thresholds/criteria: see §3.

- `3`: `all(max_distinct_majors.count == 1)`
- `2`: `max(count) == 2` ∧ coordinated-upgrade evidence (shared bump commit across roots)
- `1`: `max(count) == 3`
- `0`: `max(count) > 3` ∨ no reference-version convergence

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `slow-dissolvable` (>12 roots → sample 12 largest by manifest size + scope-limited)
- Root-detection ambiguity → unknown with emission text listing candidate dirs

## 10. Evidence and output

### Evidence string

```
basis: "monorepo-scan: django at 3 majors across {n} services; {p}% on reference"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Per-service version skew only; single-repo major drift is ECOS-02.
