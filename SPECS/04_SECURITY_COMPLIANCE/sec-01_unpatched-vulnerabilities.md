# SEC-01 — Unpatched Vulnerabilities — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | **G2** — critical CVE > 14d unpatched on exposed path |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 human · engine: SCA run |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-01 |

## 1. Inputs

- **Planes:** static-src + ecosystem advisories
- **Tools:** `trivy fs --scanners vuln --format json` (lockfile/dir mode), `osv-scanner --local`, `pip-audit -r` / `npm audit --package-lock-only`; Dependabot alerts API (`GET /repos/{o}/{r}/dependabot/alerts`, needs `security_events` token even for public repos) as enrichment
- **Rate-cost:** api-budgeted (Dependabot optional; scanners local)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero dependency manifests` (clause-b). Else applicable.

## 2. Detection recipe

1. Run trivy + osv-scanner over parsed lockfiles (no image build).
2. Normalize findings: `{cve, pkg, version, severity, fix_version_available, published_at}`.
3. Age = scan_date − published_at; open-days per finding.
4. Exposure path: `unknown` unless lockfile dep is imported by a core-path module (static reachability proxy; recorded as `reachability: static-proxy|unknown` — G2 conservative rule from `PLANS/04` §6).
5. Dedupe across tools by (cve, pkg).

Preconditions: parsed lockfile(s).

## 3. Fact schema

```json
{"sec01": {
  "findings": [{"id": "CVE-2025-1234", "pkg": "urllib3", "severity": "CRITICAL",
                 "age_days": 41, "fix_available": true, "in_core_import_closure": true}],
  "critical_open_over_14d": 1, "high_open": 4,
  "tools": ["trivy 0.55", "osv-scanner 1.9"]}}
```

## 4. Statusing rules

```yaml
measured_when:  >=1 scanner completed over a parsed lockfile
estimated_when: partial lockfile coverage only            # clamp [1,2], confidence low
unknown_when:   all scanners failed / no advisories reachable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (authoritative advisory DBs)
scope_limited:  private deps unauditable -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values (High>30d etc.): see encyclopedia §SEC-01.

- `3`: zero open High/Critical
- `2`: High findings within Yellow age band
- `1`: aged Highs or Critical with fix available but unmerged < R_DAYS
- `0`: `any(severity==CRITICAL ∧ age_days > 14 ∧ (core-closure ∨ exposure unknown))`

## 6. Gate hooks (G2)

- `proven`: Critical >14d ∧ fix-unavailable-or-ignored ∧ static-reachable-from-core OR direct internet-facing marker in deploy config
- `not-proven`: no Critical open >14d
- `needs-verification`: Critical >14d with unresolvable exposure path (default per `PLANS/04` §6)

## 7. Failure & budget semantics

- Budget class: `fast`
- Advisory DB update failure → use cached DB pinned at engine build, evidence records DB date; stale >30d → confidence low

## 8. Evidence string

```
evidence: "trivy+osv: {n} open ({c} crit>{d}d, {h} high); worst {cve} on {pkg} age={a}d"
```

## 9. Scope/overlaps echo

Open vulns in dependencies and their patch state; chain/malware quality of transitive graph is SEC-06.
