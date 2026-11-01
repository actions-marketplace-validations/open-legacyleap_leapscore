# SEC-06 — Insecure Transitive Chains

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-06 |
| Name | Insecure Transitive Chains |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | B |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none (confirmed malware cross-references ECOS-10 evidence) |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 ~2–4 h — deep scanner run + chain mapping. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The vulnerability surface hides deep in the transitive dependency graph — chains of unmaintained or suspicious packages below the surface that could carry malware, or known vulnerable paths reachable only through indirect dependencies.
- **Why it signals obsolescence:** Deep scanning is the difference between "we checked the obvious" and "we actually know what we ship." Legacy codebases usually have legacy graphs (deep, unpruned, invisible) — and a deep, unmonitored graph is where the next SolarWinds/event-stream-class event happens. (Pairs with ECOS-06/ECOS-10.)
- **Where it manifests:** Lockfiles hundreds/thousands deep, dependency trees where the vulnerable package is 8 levels down, packages that appear to be maintained yet contain modified forks, deep chains into abandoned libs (ECOS-03), scanner reports with buried reachable paths.
- **Objective metric:** `mean transitive depth of vulnerable packages`; `# of reachable vulnerabilities at depth > 5`; `% of graph from unmaintained packages`; `top-level producers of vulnerable chains`.
- **Yellow flag (warning):** Vulnerabilities only reachable through deep chains (depth > 5) into unmaintained packages, without likely exploit reachability. *(Rationale: warning — risk exists but is buried; still must be managed.)*
- **Red flag (critical):** Known malware/hijacked package confirmed in the lockfile, or a reachable critical vuln that only lives in the transitive graph and has no patch (see also ECOS-10). *(Rationale: the actual shipping software contains malicious or unpatchable code you didn't choose.)*
- **Example symptom:** "Grype reports a High-XSS reachable only via `webpack@4 → sass-loader → node-sass → nan → bindings` — a six-level chain into a package last published in 2019 with no fix. Patching it means killing a whole legacy toolchain."
- **Blast radius:** Unpatchable vulnerabilities, malware contamination, supply-chain incidents, audit credibility, compliance.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = deep-scan clean; 2 = deep-chain vulns non-reachable; 1 = reachable deep vuln below top 2 levels; 0 = malware/any-unpatchable in the shipping graph (G2-adjacent).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: use tooling to map reachable chains to top-level packages, plan removals/forks of the top offenders, add deep scanning to CI. Structural fix: prune the graph (replace deep-chain producers), vendoring review, dependency budget (ECOS-06), provenance verification, and an incident runbook for "malicious package found."
- **Gold standard / target state:** Deep scanning in CI with reachability intelligence; zero malware; vulnerable chains mapped and justified; unmaintained chains trending to zero.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + advisories
- **Tools:** `osv-scanner --experimental-local-db` over lockfiles; `npm audit --package-lock-only` full-chain mode; `pip-audit`; reachability proxy: import-closure membership of vulnerable transitive deps
- **Rate-cost:** api-budgeted (advisory sync only)
- **Ecosystems:** npm · pip · go · Maven · bundler
- **Applicability:** ECOS-02 clause-b.

## 6. Detection recipe

- **Detection method:** Deep SCA — `osv-scanner --experimental-local-db`, `pip-audit -r`, `npm audit --all`, Socket.dev for provenance chain, Grype lockfile scanning, reachability analysis (Snyk Reachable, GitHub reachability). Trace each open CVE to the top-level packages that can trigger it; check depth and reachability. Also check vendored code for sub-scanning.

1. Parse lockfile graph; enumerate transitive chains.
2. Match against advisory DBs (vuln + malware/withdrawn classes).
3. For each vulnerable transitive: `chain_depth`, `direct_parent`, `reachable_from_core_imports`.
4. Distinguish vuln-class findings from SEC-01's row by chain depth ≥ 2 (depth ≤1 belongs to SEC-01; orchestrator partitions findings).

Preconditions: parsed lockfile.

## 7. Fact schema

```json
{"sec06": {
  "transitive_total": 1316,
  "vulnerable_transitive": [{"pkg": "minimist", "version": "1.2.0", "depth": 4,
                              "via": ["mkdirp"], "reachable_from_core": true}],
  "malware_class_hits": []}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=1 scanner completed on parsed graph
estimated_when: graph partially resolvable                # clamp [1,2], confidence low
unknown_when:   no lockfile
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive lockfile surface)
scope_limited:  private transitive segment -> estimated + scope-limited
```

### Score mapping predicates

Criteria: see §3.

- `3`: no vulnerable transitives reachable in prod scope
- `2`: vulnerable transitives exist, none reachable, shallow chains only
- `1`: deep unmaintained chain into a peripheral prod path
- `0`: `any(malware_class_hits)` ∨ vulnerable transitive reachable from core imports

## 9. Gate, failure, and budget behavior

### Gate hooks

none direct; `malware_class_hits` mirrored into ECOS-10's fact record by orchestrator rule.

### Failure and budget semantics

- Budget class: `fast`
- Advisory DB stale → confidence low note with DB date

## 10. Evidence and output

### Evidence string

```
evidence: "osv-deep: {k} vulnerable transitives of {n} ({r} core-reachable); worst {pkg} depth={d} via {via}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Transitive chain quality/reachability; direct-dep vulns are SEC-01, abandonment is ECOS-03.
