# SEC-01 — Unpatched Vulnerabilities

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-01 |
| Name | Unpatched Vulnerabilities |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | **G2** — critical CVE > 14d unpatched on exposed path |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 ~2–4 h — scan runs + reachability analysis. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Known, scored vulnerabilities (OSV/CVEs) affecting the runtime, dependencies, or container images are present, and unpatched — with an age beyond acceptable exposure windows.
- **Why it signals obsolescence:** Every unpatched CVE is a *known* open door. The CVE age is a direct measure of maintenance abandonment: modern teams patch in days; obsolete systems accumulate for months. It's also the most defensible, unarguable "this codebase is obsolete" datum you can hand an executive.
- **Where it manifests:** SCA reports (Snyk/Dependabot/Trivy/OSV), image scans (Trivy/Grype/Clair), patch dashboards, CVEs on the lockfile, "no scan exists" in CI.
- **Objective metric:** `# of Critical CVEs open`; `# of High CVEs open`; `median age (days) of open Critical/High CVEs`; `# of exposed (internet-reachable) critical CVEs`.
- **Yellow flag (warning):** 1–5 High CVEs open > 30 days, or any Critical open ≤ 14 days but already in the patch queue. *(Rationale: known risk with a live fix-window — warning, not fire, provided the trend is downward.)*
- **Red flag (critical):** Any Critical CVE > 14 days on an internet-exposed path (triggers **G2**), or High CVEs accumulating with no patch process. *(Rationale: an exposed, known-critical vuln older than two weeks is a breach waiting to happen.)*
- **Example symptom:** "Trivy shows a Critical RCE in the image parser we serve user uploads with — 23 days old. The fix exists. Dependabot opened a PR; it's been sitting behind other 'priorities' for three weeks."
- **Blast radius:** Breach risk, compliance audits, customer trust, sales/due-diligence, insurance (cyber policies ask for patch cadence).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = zero open criticals, SLAs met; 2 = high CVEs 30–60 days; 1 = critical open in isolated path; 0 = exposed critical > 14 days (G2).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: patch the open Criticals/Highs in the exposure window — today; re-scan. Structural fix: a patch SLA policy (Critical ≤ 7 days, High ≤ 30), automated patching (Dependabot/Renovate auto-merge with CI as the gate), and a "no open Critical in prod" rule enforced by the security review.
- **Gold standard / target state:** Zero open Criticals; Highs < 30 days; automated scans in CI; patch SLA documented and met for 4 straight quarters.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + ecosystem advisories
- **Tools:** `trivy fs --scanners vuln --format json` (lockfile/dir mode), `osv-scanner --local`, `pip-audit -r` / `npm audit --package-lock-only`; Dependabot alerts API (`GET /repos/{o}/{r}/dependabot/alerts`, needs `security_events` token even for public repos) as enrichment
- **Rate-cost:** api-budgeted (Dependabot optional; scanners local)
- **Ecosystems:** agnostic
- **Applicability:** `na_when: zero dependency manifests` (clause-b). Else applicable.

## 6. Detection recipe

- **Detection method:** Software Composition Analysis — `trivy repo/image`, `snyk test`, `npm audit`, `pip-audit`, `osv-scanner`, `dependabot` alert dashboard, Grype. Produce a themed report: critical/high/open-days/exposure (is the affected path internet-exposed?). Filter noise (dev-only, reachability consideration).

1. Run trivy + osv-scanner over parsed lockfiles (no image build).
2. Normalize findings: `{cve, pkg, version, severity, fix_version_available, published_at}`.
3. Age = scan_date − published_at; open-days per finding.
4. Exposure path: `unknown` unless lockfile dep is imported by a core-path module (static reachability proxy; recorded as `reachability: static-proxy|unknown` — G2 conservative rule from the catalog gate conventions).
5. Dedupe across tools by (cve, pkg).

Preconditions: parsed lockfile(s).

## 7. Fact schema

```json
{"sec01": {
  "findings": [{"id": "CVE-2025-1234", "pkg": "urllib3", "severity": "CRITICAL",
                 "age_days": 41, "fix_available": true, "in_core_import_closure": true}],
  "critical_open_over_14d": 1, "high_open": 4,
  "tools": ["trivy 0.55", "osv-scanner 1.9"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  >=1 scanner completed over a parsed lockfile
estimated_when: partial lockfile coverage only            # clamp [1,2], confidence low
unknown_when:   all scanners failed / no advisories reachable
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (authoritative advisory DBs)
scope_limited:  private deps unauditable -> estimated + scope-limited
```

### Score mapping predicates

Y/R values (High>30d etc.): see §3.

- `3`: zero open High/Critical
- `2`: High findings within Yellow age band
- `1`: aged Highs or Critical with fix available but unmerged < R_DAYS
- `0`: `any(severity==CRITICAL ∧ age_days > 14 ∧ (core-closure ∨ exposure unknown))`

## 9. Gate, failure, and budget behavior

### Gate hooks

- `proven`: Critical >14d ∧ fix-unavailable-or-ignored ∧ static-reachable-from-core OR direct internet-facing marker in deploy config
- `not-proven`: no Critical open >14d
- `needs-verification`: Critical >14d with unresolvable exposure path (default per the catalog gate conventions)

### Failure and budget semantics

- Budget class: `fast`
- Advisory DB update failure → use cached DB pinned at engine build, evidence records DB date; stale >30d → confidence low

## 10. Evidence and output

### Evidence string

```
evidence: "trivy+osv: {n} open ({c} crit>{d}d, {h} high); worst {cve} on {pkg} age={a}d"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Open vulns in dependencies and their patch state; chain/malware quality of transitive graph is SEC-06.
