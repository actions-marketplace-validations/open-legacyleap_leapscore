# 08 — Security & Access Model (historical proposal)

> **Status:** Historical security and access design for the proposed public and private-repository product doors. The GitHub App, sandbox, token-vault, fact-store, retention, and incident-response details below are not a description of deployed infrastructure. Current scan boundaries are specified in [OpenSpec](../../openspec/specs/) and the [repository guide](../../AGENTS.md); the scanner is stateless and does not retain scan reports. Original companion plans: `01` (§3 product doors), `05` (§2 access proposal), and `06` (§7 proposed API authentication).

---

## 1. Threat model summary

| Asset | Adversary | Vector | Control |
|---|---|---|---|
| Public-freemium sandbox | Malicious repo author | Malicious lockfile/manifest/tool-trap; huge repo DoS; secrets exfil; compute abuse | No code execution from repo (v1); budget controller; tool-name allowlist; net-egress egress-policy; scan secrets none |
| GH API token pool | Repo content | Tool accidentally reading tokens out | Tokens never injected into detectors; token vault + operator boundary; every token call logged; token rotation |
| Private repo content (M&A) | Broker-side theft | App token over-scoped; retained clones; secret materials in fact-store | Per-repo install token, 1h TTL, scoped to one repo; delete-after-delivery default; sealed-report-only retention; no raw clone retention |
| Report integrity | Auditor | Tamper / stale-score claims | Report seal; freeze-on-snapshot; fact-store + rubric pinning (re-derivable); `superseded` flags |

---

## 2. Public-freemium sandbox (v1 boundary)

- **No state from the scanned repo persists in the sandbox that outlives the scan.** Clone lives in a temp dir under an anonymous mount; removed at seal.
- **No code from the target runs.** Detectors are `lizard`, `gitleaks`, `dependency-cruiser`, `knip`, `radon`, `syft`, `trivy`, `osv-scanner`, `scorecard` — processes we launch on the *tree/cursor*, never by invoking repo scripts (`05` §5 rule). No `npm test`, no `make`, no `postinstall`, no `pip install -e .`.
- **Structure hardening for tool traps** (a repo is untrusted input, even to OSS tools):
  - Wall-clock + output-size caps per detector (the budget controller, `05` §4).
  - `--filter blob:none` clone; cap LFS/large blobs; `shallow-since` for history.
  - Detectors pinned to exact sources/SHAs; dispatched through an allowlist with no `$PATH` trickery; `proc` namespaces isolate them.
  - Temp dirs `noexec`,`nosuid`; no network access from sandbox by default (GH API calls happen from the *orchestrator*, not inside the sandbox); DNS/egress policy applied if a detector legitimately needs it (endoflife.date lookups happen orchestrator-side, pre-fetch).
- **Secrets hygiene**: scanned repos may contain real secrets (that's the point of SEC-02). Findings are stored as *hashed* + redacted text; raw secret values are not written into logs or the fact-store; the report shows the file/line + prefix, not the full value.

---

## 3. GitHub App (M&A, min-viable scopes)

The App is installed by the target org (or the acquiring org, per engagement). It issues **per-repo, short-lived installation tokens** via the API; no long-lived credential is stored anywhere except the vault.

| Scope | Why |
|---|---|
| `metadata: read` | repo list, basic visibility |
| `contents: read` | clone/read source for scanning |
| `pull_requests: read` | ARCH-05 defect correlation, review coverage |
| `checks: read` | TEST-01/04 proxies, VEL-01 |
| `actions: read` | workflow runs for VEL-01/04, TEST-01/04 (B-tier) |
| `deployments: read` | VEL-03/04 deploy-frequency proxy |
| `dependabot_alerts: read` | SEC-01/07 (alerts don't require History write) |
| `issues: read` | ARCH-05 hot-spots |

Explicitly **not** requested: `administration`, `checks: write`, `contents: write`, `dependabot_secrets`, `secrets`, `security_events: write`. Principle: **read-only, per-repo, short-lived, and revocable at install time**.

### Per-scan flow (private)
1. Analyst requests a scan for a repo the App can see.
2. Operator issues a **single-repo install token**, TTL ≤ 1h, tied to that scan-id.
3. Token used only by the orchestrator (never a detector); logged use; revoked at seal.
4. Fact-store retains **the report source-of-facts for reproducibility only** — no full clone, no raw secret values (redaction rule §2), no token material.
5. **Delete-after-delivery default**: raw artifacts purged after the report is sealed and exported (configurable retention window; the sealed report + fact store are the artifact).

---

## 4. M&A analyst twist (broker-side risk)

- The broker/analyst never receives a token or clone; they receive only the sealed report object.
- Delivering `measured`-only tallies (§2 of `06`) means the report the analyst can *actually* hold never contains `estimated` rows presented as fact.
- `deep_dive_scope` rows are delivered as *what-it-takes* scopes for the *target's* security/eng team to run — the analyst drives that engagement, but the leapscore system holds no more PII than the sealed report.

---

## 5. The data lifecycle (one table)

| Stage | Data | Lifetime | Deletion trigger |
|---|---|---|---|
| Ingestion | URL, scan-id | request lifetime | — |
| Scan | temp clone + tool cache | < scan duration | at seal |
| Token | install token, TTL | ≤ 60 min | at seal / TTL |
| Fact-store | tool outputs (redacted secrets), pointers | report-expiry default (configurable; 90 d) | expiry job |
| Report | sealed object + snapshots | indefinite (audit) | explicit retention policy per engagement |
| Logs | scan events, token use, errors | retention per policy | retention job |

---

## 6. Incident response anchors (writing the rule, not the runbook)

- Any exposure of a token → rotate all App tokens + revoke install; kill in-flight scans; notify engagement.
- Any unexpected egress from the sandbox → halt scans; full forensic replay from fact-store.
- Report-compliance dispute → replay fact-store + pinned rubric to reproduce the number (`06` §8); never accept a hand-edited score.

---

## 7. Assumptions & open items

- **Assumption:** GitHub API as the only SCM in v1. GitLab/Bitbucket/Azure DevOps become *new doors* on the same engine; their App/scope models vary (git-tracked, roadmap).
- **Assumption:** the temp clone never touches a broker/analyst machine; all scanning runs in LeapScore infrastructure.
- **Open item:** on-prem / single-tenant deployment (M&A firms that refuse cloud): adds a "self-hosted engine container" mode. Gates the hardening doc (still no code execution; least-privilege App flow identical). Decide in `10`.
