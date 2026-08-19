# 05 — Detection Engine Blueprint

> The engine architecture. Everything downstream of `04_V1_SCOPE.md` (the slice) and `03` (the matrix). This doc is about *how the detection happens*, not the report (that's `06`).
> Design principle (D7): orchestrating existing OSS tools, never writing bespoke analyzers in v1.

---

## 1. Two planes of the engine

The engine is two independent systems that share nothing but the scan record:

```
[ Orchestrator plane ]              [ Scanner plane ]
 input: repo URL                     per-indicator detectors
 ┌──────────────┐                    ┌──────────────────────────┐
 │ detect-eco   │  → selects         │ git plane (always)        │
 │ orchestrate  │     adapters       │ gh-api plane (always)     │
 │ budget/limit │                    │ ecosystem plane (gated)   │
 │ emit status  │                    │ static-src plane (gated)  │
 │ debounce/cc  │                    └──────────────────────────┘
 └──────┬───────┘
        │ one scan record (evidences + statuses) → scorer (02/06)
```

The **orchestrator owns policy** (budget, ecosystem selection, status assignment per `03`); the **scanners produce raw facts** (files, logs, tool JSON). The separometer: no detector decides status. The orchestrator decides status *from* facts. This keeps the statusing rule (D2/D3) in one place.

---

## 2. Input & access model

| Case | Flow |
|---|---|
| Public URL (freemium) | Validate URL → `GET /repos/{owner}/{repo}` with a **shared, low-rate token pool** (unauthenticated works but rate-limits fast) → clone via `git clone --filter=blob:none --no-checkout` (metadata fast-path; full checkout only for scans that need it) |
| Private repo (M&A App) | GitHub App with `contents:read`, `metadata:read`, `pull_requests:read`, `checks:read`, `dependabot_alerts:read`, `actions:read`, `deployments:read` scopes (exact set in `08`) → per-repo install token, scoped to that one repo and short-lived (~1 h) → same orchestration |

No credential material of the scanned repo ever touches a detector: tokens live in a `secrets` vault, injected by an operator service, revoked after the scan record is sealed.

---

## 3. The pipeline stages

```
1. Ingestion        URL normalize + validate + visibility check + lock (dedupe in-flight)
2. Fetch            git metadata shim (clone --filter blob:none) + GH API facts
3. Detect-ecosystem manifest/lockfile sniff → ecosystem + adapter selection (D8)
4. Static-phase     run the selected scanner set (tools §5) under a budget controller
5. Fact-store       raw tool output persisted (immutable), keyed by scan-id + tool + version
6. Statusing        mapper: facts → (indicator, status, 0–3, evidence/basis) using 03 rules
7. Scoring          rubric rollup (00_EXECUTIVE_RUBRIC Part 3 + gates) → report object
8. Emission         remediation text lookup from catalog; unknown-row "what it takes" text
9. Seal & delete    scan record sealed; temp clones + token + raw logs destroyed
```

Stages 1–4 are the expensive plane. 5–9 are pure data transforms, repeatable offline from the fact-store (a fact-store replay must reproduce a report bit-for-bit).

---

## 4. The budget controller (freemium viability, OQ4)

Every public scan runs inside a **policy budget**, not a wall-clock promise:

- **Wall-clock cap** (target ~1–5 min in v1) with staged progressive "dissolve": if the cap is hit, expensive detectors (jscpd, dependency-cruiser) degrade to sampled/first-N behavior and their rows drop to `estimated` + `scope-limited` note — never silently completed-lite.
- **Clone cap**: `--filter=blob:none`; forbid LFS/Fetch of blobs until a detector requires it.
- **Concurrency guard**: per-repo in-flight lock, per-IP/quota debounce at the door, max N concurrent scans per tenant/domain (hard for freemium; soft for App).
- **Detector timeouts**: each tool gets a timeout + output-size cap; oversized output → truncated fact + `scope-limited` (affects status confidence).

The budget controller is *the* place cost decisions live; it's a config surface, not baked into detectors.

---

## 5. Scanner catalog (tool → indicator, v1)

Language-agnostic plane (always):
| Tool | Feeds |
|---|---|
| GitHub API (repos, commits, issues, releases, dependabot alerts, workflows, check-runs, deployments, traffic) | ECOS-02/07, SEC-01/07, VEL-01/04/06, TEST-01/04, DOCS-08, ARCH-05 |
| `endoflife.date` API | ECOS-01/08, FE-01 |
| `gitleaks` / `trufflehog` | SEC-02 (G1) |
| `trivy`, `osv-scanner`, `pip-audit`/`npm audit`, `socket.dev` scan | SEC-01/06, ECOS-03/10 |
| `ossf/scorecard` | ECOS-10 (cross-check), plus baseline branch/CI checks |
| `syft` + license classifier (`github/licensee`) | ECOS-05 |
| `git shortlog`/`git log` mining | VEL-06, ARCH-05, DOCS-06 (TODO age) |
| CI-config parser (`.github/workflows/*.yml`, `.gitlab-ci.yml`, Jenkinsfile, azure-pipelines) | TEST-08, SEC-07/10, VEL-08, API-10(partial), TEST-01/04 proxies |
| Codebase-shape inventory (dir scan: `docs/adr`, `docs/runbooks`, `CONTRIBUTING`, `CHANGELOG`, `migrations/`, `*.tf`, `Dockerfile`, `fuzz` targets, `__init__`/`index` tests) | DOCS-01/03/04/07/08/09, DATA-01/08/09, PERF-02/06, SEC-09, TEST-03/05 |

Ecosystem plane (gated by detect-ecosystem, D8):
| Ecosystem | Tools | Feeds |
|---|---|---|
| JS/TS | `npm outdated`, `depcheck`/`knip`, `lizard`, `jscpd`, `dependency-cruiser`, `eslint`, TS `strict` scan, `mypy`-analog `typescript-eslint` rules | ECOS-02/04/06, ARCH-01/02/03/04/08/09, FE-05 |
| Python | `pip list --outdated`, `pipdeptree`, `radon`, `vulture`, `import-linter`, `mypy`/`pyright`, `pytest` config read | ECOS-02/04/06, ARCH-01/02/03/04/09 |
| Go | `go list -u -m all`, `go vet` (not run), `staticcheck`-configure check, `go mod graph` | ECOS-02/06, ARCH-probes |
| Java | `mvn versions:display-dependency-updates`/Gradle equivalents (config-only), PMD-CPD, SonarQube-cli (if permitted) | ECOS-02, ARCH-01/08 |
| (Fallback) none recognized | language-agnostic plane only; language rows → `unknown` | — |

> Rule: **no detector runs code from the target repo.** All tools take a config/cursor only. Our own tooling (`lizard`, `gitleaks`, `dependency-cruiser`) are executed as processes, never by invoking the repo's scripts. That's the sandbox boundary for v1 (detailed in `08`).

---

## 6. Statusing map (facts → status/score)

The single most important table in the engine. Per-indicator rules are in `03`; format:

```yaml
SEC-02:
  measured_when: gitleaks_report.verified.len > 0   # or clean-run ✅
  not_proven_when: gitleaks_report.clean == true and history_scan.clean
  estimated_never: true                             # secrets are never estimates
  score_0: potential_secrets.verified.any_in_core
  score_3_not_allowed_estimated: true
  evidence: "gitleaks --path {clone} → {count} verified, {top3_id}"
```

`estimated` rows are clamped 1–2 by construction (`02` §2), so the statusing map needs a `clamp: [1,2]` key per row and a `confidence` derivation hook (tool signal strength + sample coverage). A row is **never auto-`measured`** without a resolver in the statusing map.

---

## 7. Reproducibility & versioning

- Every fact in the fact-store carries: tool name, tool version, CLI flags, repo commit sha, scan-id, schema version.
- The scorer pins a **rubric version** (git sha of `../CODEDEBT_AUDIT_RUBRIC/`) so a future catalog edit re-runs scoring without re-scanning (fact-store replay).
- Report object embeds: engine sha, rubric sha, tool-version manifest, elapsed wall-clock, budget dissolved? (Y/N).

---

## 8. Failure modes & their semantic (never a silent blank)

| Failure | Behavior |
|---|---|
| Tool errors / timeout | row → `estimated`/`unknown` with `scope-limited` + `error` field; report notes the degraded coverage. Never a false 0/3 |
| Clone fails (private without perms, removed) | report aborts with a door error: "visibility/permission issue" — no partial score |
| Git history too big (blob resolution) | `--shallow-since` budget; history-dependent rows → `estimated` + `scope-limited`, evidence lists truncation |
| GH API rate limit | backoff + retry; if exhausted, API-fed rows → `unknown` "rate-limited" |
| Malicious target (weird lockfiles, gigantic trees, packaging-traps) | all craftable traps fail into `estimated`/`unknown` + `scope-limited`; the budget controller is the defense |

---

## 9. Cross-reference to other docs

- Scorer math & status language: `02`.
- Exact indicator/tier/tool matrix: `03`.
- What's in/out of v1: `04`.
- Repo report shape (what this engine emits): `06`.
- Sandbox + privilege model: `08`.
- Cost-per-scan budget (config surface): `09`.
- Sequencing of the slices: `10`.