# 05 — Detection Engine Blueprint (v2 — scalable to 102+N)

> The engine architecture. Everything downstream of `04_V1_SCOPE.md` (the slice) and `03` (the matrix).
> **Design principles:** D7 (orchestrate OSS tools, never write bespoke analyzers in v1) + grilling Q1-Q10 (2026-08-26): slot-ready for all 102 indicators on day 1, scalable to N future indicators of any shape (quick/intensive, AI/non-AI, delegated/handwritten).
> This doc is about *how detection happens*, not the report (that's `06`).

---

## 0. What v2 changes from v1

| v1 | v2 |
|---|---|
| ~59 A-tier detectors, rest `unknown` by omission | 102 stubs on day 1 — every indicator has `detectors/<ID>/manifest.json + schema.json + detector.ts`; C/D stubs return `unknown + whatItTakes` (SPECS reduced skeleton) |
| Budget dissolve per-detector sampling | Orchestrator-owned uniform file-tree sharding via `budgetLease.sampleN` |
| Detector decides status inline | No detector decides status — `RawFact -> scorer` pure boundary |
| Rubric thresholds read from markdown at runtime | Compiled `engine/rubric.json` + `check:rubric-consistency` lint (AGENTS.md cardinal rule) |
| Inline scoring in orchestrator | Pure scorer `Facts[] + RubricVersion -> Report` — replay without re-scan (`05:§7`) |
| `gitleaks`/`trivy`/etc. called ad-hoc | Worker isolation + read-only hydration + proxied network (no raw `fs`/`fetch` in detectors) |

**Invariant:** adding indicator 103 is one folder + one predicate; orchestrator/scheduler/budget/runner/scorer require zero edits.

---

## 1. Architecture invariant — one contract to hold all shapes

### 1.1 The detector contract (Q2)

Every detector — delegated tool, handwritten grep/AST walk, LLM call — implements the same interface. Heterogeneity lives *inside* the impl, not in the contract.

```ts
// engine/detector.ts:12
interface Detector {
  id: IndicatorId              // "SEC-02" — 1:1 with SPECS/<NN_CATEGORY>/<ID>_*.md
  tier: 'A'|'B'|'C'|'D'        // SPECS README §2 status
  budget: 'fast'|'slow-dissolvable'|'api-budgeted' // SPECS README 2.4
  planes: DataPlane[]          // ['git','gh-api','ecosystem','static-src'] — SPECS §1
  ecosystems: Ecosystem[] | 'all' // D8 gate; 'all' = language-agnostic
  nonDeterministic?: boolean   // true for AI detectors (Q3) -> exempt from bit-for-bit replay
  detect(ctx: ScanContext, abort: AbortSignal): Promise<RawFact>
}

type ScanContext = {
  clonePath: string            // read-only handle; --filter=blob:none lazy
  commitSha: string
  gh: RateLimitedGhClient      // shared token bucket (§4); only network client detectors may use
  manifests: EcosystemManifest // path-scoped: { root: string, ecosystem: Ecosystem }[] (Q4)
  budgetLease: { timeoutMs: number, byteCap: number, sampleN?: number } // orchestrator sharding
  cache: FactCache             // content-addressed, for dissolve replays
  toolVersions: Map<string,string> // pinned per SPECS 2.5
  llm?: LlmProxy               // only for nonDeterministic detectors; logs promptHash+cost
  readFile(path: string): Promise<Buffer | null> // hydration proxy — no raw fs
}

type RawFact = {
  detectorId: IndicatorId
  schemaVersion: string        // per-indicator semver (Q5) — bump + migration, not ID fork
  facts: Record<string,unknown> // validated against detectors/<ID>/schema.json (SPECS §3 envelope)
  evidencePointers: Evidence[] // file:line or endpoint — no verdict text
  provenance: { tool: string, version: string, flags: string[], durationMs: number, promptHash?: string, model?: string, tokens?: number }
  truncated: boolean           // true -> orchestrator forces scope-limited
  error?: { kind: 'timeout'|'cap'|'crash'|'rate-limit', detail: string }
  // FORBIDDEN: score, status, confidence, verdict — scorer owns those (SPECS §4/§5)
}
```

| Shape | How it fits |
|---|---|
| Delegated tool (`gitleaks`, `trivy`, `jscpd`, `osv-scanner`, `syft`, `Scorecard`) | `ToolAdapter` subshells out, captures JSON, normalizes to `facts`; `provenance.version` is the pin |
| Handwritten (grep, AST, `lizard`, `radon`) | Same interface, no subprocess |
| Quick (`fast`) | Runs unthrottled in parallel DAG |
| Intensive (`slow-dissolvable`) | Must respect `abort` + `sampleN`; returns `truncated=true` instead of silent partial -> `estimated + scope-limited` downstream |
| AI / LLM | `LlmDetector` via `ctx.llm(prompt)`; `nonDeterministic:true`, `estimated` only (Q3 clamp 1-2), stores `promptHash+model` |

**Rule:** no detector imports `rubric.json`, computes a score, or decides `measured/estimated/unknown`. The orchestrator validates the envelope and persists; the scorer decides status later (`§6`).

### 1.2 The five pipeline stages (Q1/Q6)

```
1. Ingestion        URL normalize + validate + visibility check + per-repo/per-IP lock (dedupe in-flight)
2. Fetch            git metadata shim (--filter=blob:none) + GH API facts (shared token pool / App token)
3. Detect-ecosystem path-scoped manifest sniff -> { root, ecosystem }[] + language-agnostic planes (D6/D8)
4. Static-phase     scheduler selects detectors by (plane + ecosystem match + budget) -> worker pool (runner)
5. Fact-store       append-only RawFact per (scanId, detectorId, root), validated against schema.json
6. Scoring          pure: Facts[] + rubric.json@version -> Report (06:§2) — offline, replayable
7. Emission         remediation + unknown_measure_path lookup from encyclopedia; evidence/basis rendering
8. Seal & delete    report pinned to engine+rubric+tool manifest; temp clones + tokens destroyed
```

Stages 1-5 are the expensive plane. 6-8 are pure data transforms; a fact-store replay must reproduce a report without re-scanning (except `nonDeterministic` detectors — schema-valid, not bit-for-bit).

```
[ Orchestrator plane ]                 [ Scanner plane ]
 input: repo URL                        per-indicator detectors (102 stubs)
 ┌──────────────────┐                   ┌──────────────────────────────┐
 │ ingest/fetch     │  manifests        │ git plane (always)            │
 │ detect-ecosystem │ ── selects ──►    │ gh-api plane (always)         │
 │ budget leases    │                   │ ecosystem plane (gated/r)     │
 │ scheduler/budget │  RawFacts         │ static-src plane (gated/r)    │
 │ fact-store       │ ◄── worker pool ──┤  r = per root fan-out (Q4)    │
 └────────┬─────────┘                   └──────────────────────────────┘
          │ Facts[] + rubricVersion
          ▼
   [ Scorer plane — pure, offline ]
   Facts[] + engine/rubric.json -> Report (categories, headline, gates, blockers)
```

---

## 2. Input & access model

| Case | Flow |
|---|---|
| Public URL (freemium) | Validate URL -> `GET /repos/{owner}/{repo}` via **shared low-rate token pool** -> clone `--filter=blob:none --no-checkout` (metadata fast-path; blob hydration only via `ctx.readFile`) |
| Private repo (M&A App) | GitHub App `contents:read, metadata:read, pull_requests:read, checks:read, dependabot_alerts:read, actions:read, deployments:read` (exact set in `08`) -> per-repo install token, short-lived (~1h) -> same orchestration |

Tokens live in a `secrets` vault, injected by operator, revoked after seal. Detectors never see them — they only receive `gh: RateLimitedGhClient` + `ctx.readFile`.

---

## 3. Detect-ecosystem — path-scoped (Q4)

* Sniff per manifest root: `package-lock.json`/`pyproject.toml`/`go.mod`/`pom.xml`/`Cargo.toml`/`*.csproj`/`Gemfile`/`composer.json` at `/{root}`.
* Output: `Manifest[] = { root: string, ecosystem: 'js'|'py'|'go'|'java'|..., lockfile: string, manifest: string }`.
* Agnostic detectors (`ecosystems:'all'`) run once per scan (git/gh-api/low). Ecosystem-gated detectors fan out **per matching root** (e.g., JS detector runs on `/frontend`, Python detector on `/services/api`).
* Facts are keyed `(scanId, detectorId, root)`. No manifest -> agnostic plane only; language rows become `unknown` (D6) — never penalized, never hidden.
* Fallback: no recognized manifest -> `Manifest[] = []`; polyglot repos get multiple roots naturally.

---

## 4. Budget controller (freemium viability, OQ4 — Q3 sharding)

Every public scan runs inside a **policy budget**, not a wall-clock promise. The controller owns policy; detectors own cooperation.

* **Wall-clock cap** (target 1-5 min v1) with uniform sharding: on cap, `budgetLease.sampleN` is computed from the coordinator's file-tree shard (deterministic, same sample across slow detectors). Detectors *must* honor `sampleN` + `abort`; `truncated=true` -> scorer forces `estimated + scope-limited` (SPECS 2.4) or `unknown` for `api-budgeted` exhaustion.
* **Clone cap**: `--filter=blob:none`; hydration via `ctx.readFile` counts against `byteCap`; oversized output -> truncated fact.
* **Concurrency guard**: per-repo in-flight lock, per-IP debounce at door, `min(4, os.cpus().length)` workers (tunable `BUDGET_CONCURRENCY`).
* **Detector timeouts**: each budget class gets `timeoutMs + byteCap`; violation -> `error:{kind, detail}` + `truncated`.
* **API budget**: `gh` token bucket; rate-limit exhausted -> `api-budgeted` detectors return `unknown "rate-limited"` (SPECS 2.4).

Budget decisions are config, not baked into detectors.

---

## 5. Isolation & execution model (Q8 — D5)

**Hard rule:** no detector runs code from the target repo. Our tooling (`lizard`, `gitleaks`, `dependency-cruiser`, etc.) is executed as processes; repo scripts are never invoked (`08`).

| Boundary | Mechanism | Enforcement |
|---|---|---|
| Process | `worker_threads` / child-process pool (`engine/runner.ts:1`), cgroup/mem limit, killable via `abort` | `checks:detector-isolation` bans `child_process.exec` of repo paths |
| Filesystem | Read-only `clonePath`; all reads via `ctx.readFile(path)` hydration proxy; detectors may not `import()` from clone | Lint bans raw `fs`/`import` of `clonePath/**` |
| Network | Allow-list: `gh` + `endoflife.date`/`registry` + `ctx.llm()` proxy only; direct `fetch` banned | Lint bans `fetch`/`axios`/`net` outside `engine/` |
| LLM | Via `ctx.llm(prompt)` proxy: logs `{promptHash, model, temp, tokens, cost}` to provenance; input is chunked + secret-stripped via pre-pass (`gitleaks` filter) | Redaction gate for private M&A repos (strip PII/secrets before LLM) |

Detectors violating isolation fail CI.

---

## 6. Fact-store & schemas (Q5)

* Per-indicator schema: `detectors/<ID>/schema.json` (zod/json-schema), units in keys, snake_case, validated at emission and at replay.
* Envelope: `engine/facts.ts:1` — `FactRecord = { id, root, schemaVersion, facts, evidencePointers, provenance, truncated, error? }` (Q5). Indicator-namespaced per SPECS 2.6.
* Versioning: `schemaVersion` bump + migration in `detectors/<ID>/migrate.ts` (not ID fork). Old scans pinned to old `schemaVersion` remain valid; store keeps both.
* Every fact carries: detector ID, schema version, tool name+version+flags, commit sha, scan ID, root, duration. Tool pinning per SPECS 2.5 (`gitleaks >= 8`, etc.); exact version recorded per fact (`05:§7`).

---

## 7. Scorer — pure, offline, rubric-pinned (Q6)

`engine/scorer/index.ts:1`: `scorer(Facts[], RubricVersion) -> Report` — pure function, no I/O.

1. **Compile rubric** (`scripts/compile-rubric.ts:1`): `CODEDEBT_AUDIT_RUBRIC/01_*.md...10_*.md + 11_WEIGHTS_THRESHOLDS_CONFIG.md -> engine/rubric.json` (weights `11:§1` both base + FE-active ×0.9, tier thresholds `≥80/53/27`, per-indicator Yellow/Red, gates G1-G8). CI `check:rubric-consistency` asserts derived views match canonicals (AGENTS.md cardinal rule — lint did not exist as script, now it does).

2. **N/A** (`SPECS §1`): `na_when` only on structural gates (no client -> FE rows N/A) or exhaustive enumeration (parsed lockfile proves absence). Non-exhaustive absence -> `unknown` (SPECS 2.3). Zero test files / zero CI configs are score-0 facts, not N/A.

3. **Statusing** (`SPECS §4`): `measured_when / estimated_when / unknown_when` plus `scope_limited` + `clamp [1,2]` + `confidence low|medium` (SPECS 2.1-2.2; medium iff ≥2 surfaces or exhaustive-by-construction; AI never above medium, never `measured` (Q3)).

4. **Score mapping** (`SPECS §5`): fact predicates -> `0-3` per encyclopedia criteria (`thresholds: see <ID>` — specs never restate numbers).

5. **Rollup** (`11:§2`): `Category% = (Σ applicable scores / applicable×3)×100`; N/A excluded; deep-dive rows fold in when run (B4). System `headline = Σ category% × weight` (both weight sets). `estimated` rows labeled, `unknown` excluded from numerator/denominator.

6. **Gates** (`SPECS §6`): `proven / not-proven / needs-verification`; only `proven` caps verdict at High Risk (G1-G8).

7. **Views** (`06:§6`): base report stored; `measured-only` M&A view is a query (`estimated -> unknown` re-rollup), not a re-scan — cheap re-render from same `Facts[]`.

Reproducibility: `rubricVersion = sha(rubric.json)` pinned per report (`06:§2`, `05:§7`); fact-store replay recomputes scoring without re-fetching.

---

## 8. Scanner catalog (tool -> indicator — grows without re-architecture)

Language-agnostic plane (always, `ecosystems:'all'`):

| Tool / plane | Feeds (A-tier unless noted) |
|---|---|
| GitHub API (repos, commits, issues, releases, dependabot alerts, workflows, check-runs, deployments) | ECOS-02/07, SEC-01/07, VEL-01/04/06, TEST-01/04 proxy, DOCS-08, ARCH-05 |
| `endoflife.date` API | ECOS-01/08, FE-01 |
| `gitleaks`/`trufflehog >=8` | SEC-02 (G1) |
| `trivy`, `osv-scanner`, `pip-audit`/`npm audit`, `socket.dev` | SEC-01/06, ECOS-03/10 |
| `ossf/scorecard` | ECOS-10 cross-check, branch/CI checks |
| `syft` + `github/licensee` | ECOS-05 |
| `git log`/`shortlog` mining | VEL-06, ARCH-05, DOCS-06 |
| CI-config parser (`.github/workflows/*.yml`, `.gitlab-ci.yml`, Jenkinsfile, azure-pipelines) | TEST-08, SEC-07/10, VEL-08, API-10(partial), TEST-01/04 proxies |
| Codebase-shape inventory (`docs/adr`, `docs/runbooks`, `CONTRIBUTING`, `CHANGELOG`, `migrations/`, `*.tf`, `Dockerfile`, `fuzz` targets) | DOCS-01/03/04/07/08/09, DATA-01/08/09, PERF-02/06, SEC-09, TEST-03/05 |

Ecosystem plane (gated per root, D8):

| Ecosystem | Tools | Feeds |
|---|---|---|
| JS/TS | `depcheck`/`knip`, `lizard`, `jscpd`, `dependency-cruiser`, `eslint`, TS `strict` scan | ECOS-02/04/06, ARCH-01/02/03/04/08/09, FE-05 |
| Python | `pipdeptree`, `radon`, `vulture`, `import-linter`, `mypy`/`pyright` | ECOS-02/04/06, ARCH-01/02/03/04/09 |
| Go | `go list -u -m all`, `staticcheck` config check, `go mod graph` | ECOS-02/06, ARCH-probes |
| Java | `mvn versions:display-dependency-updates`/Gradle (config-only), PMD-CPD | ECOS-02, ARCH-01/08 |
| (Fallback) none recognized | agnostic plane only; language rows -> `unknown` | — |

Add a new ecosystem: add one sniff pattern + one tool-adapter folder — no orchestrator edit.

---

## 9. Failure modes & their semantic (never a silent blank)

| Failure | Behavior |
|---|---|
| Tool error / timeout / byteCap | `RawFact { truncated:true, error }` -> scorer emits `estimated`/`unknown` + `scope-limited`; never false 0/3 |
| Clone fails (private without perms, removed) | Abort with door error — no partial score |
| History too big (blob budget) | `--shallow-since`; history rows -> `estimated + scope-limited`, evidence lists truncation |
| GH API rate limit | Backoff+retry; exhausted -> `api-budgeted` rows -> `unknown "rate-limited"` |
| Malicious target (crafted lockfiles, gigantic trees) | Traps fail into `estimated`/`unknown` + `scope-limited`; budget controller is the defense |
| AI cost/latency blow-up | `ctx.llm` proxy enforces `timeoutMs` + `tokenCap`; exceeded -> `truncated + error` -> `unknown` |
| LLM non-determinism | Fact stored with `promptHash+model+temp`; replay asserts schema, not bit-for-bit |

---

## 10. Adding indicator N+1 — the one-folder rule (Q9)

```
1. Encyclopedia row: CODEDEBT_AUDIT_RUBRIC/<NN>_<CATEGORY>/ID_*.md (canonical thresholds)
2. npm run compile:rubric  -> engine/rubric.json  (+ check:rubric-consistency)
3. SPEC: SPECS/<NN_CATEGORY>/ID_*.md (§0-§9, thresholds: see <ID>)
4. Detector: detectors/<ID>/{manifest.json, detector.ts, schema.json, migrate.ts?}
5. Predicate: engine/scorer/predicates/<ID>.ts  (SPECS §5: facts -> 0-3)
6. Fixtures: detectors/<ID>/__tests__/fixtures/{healthy,degraded}/
```

Forbidden edits: `engine/{orchestrator,scheduler,budget,runner,store,s part of, scorer/index}.ts`. CI asserts this (new dummy indicator must not require those edits).

---

## 11. Quality gates (Q10)

* `check:rubric-consistency` — `engine/rubric.json` matches canonicals (AGENTS.md derived-view lint).
* `check:schemas` — every `detectors/<ID>/schema.json` validates its `SPECS §3` envelope.
* `check:detector-isolation` — no raw `fs`/`fetch`/`child_process.exec(repoPath)` outside `engine/runner.ts`.
* `detector.contract.test.ts:1` — iterates 102 manifests; asserts `detect()` respects envelope, never returns score/status, honors `abort` within 50ms, AI sets `nonDeterministic:true`.
* Per-detector `healthy/degraded` fixture pairs — minimal synthetic clones.
* Pre-v1 spot-check (`11:§4.1`): 5-10 real repos vs. expected `measured/estimated/unknown` split — blocking before v1 cut.

---

## 12. Cross-reference

* Scorer math & status language: `02_TRUST_SCORING_MODEL.md`.
* Exact indicator/tier/tool matrix: `03_ENGINEERABILITY_MATRIX.md` (derived view of encyclopedia + specs).
* Slice & gating rule: `04_V1_SCOPE.md`.
* Report shape: `06_DATA_MODEL_API.md` (§4 row contract: `measured->evidence`, `estimated->basis+confidence clamp 1-2`, `unknown->unknown_measure_path`).
* Sandbox + privilege model: `08_SECURITY_ACCESS_MODEL.md`.
* Cost-per-scan budget config surface: `09_MONETIZATION_TIERS.md`.
* Sequencing: `10_ROADMAP.md`.
* Canonical rubric: `CODEDEBT_AUDIT_RUBRIC/11_WEIGHTS_THRESHOLDS_CONFIG.md` + `01_*.md...10_*.md` + `00_EXECUTIVE_RUBRIC.md`.
* Implementation specs (per-indicator canonical): `SPECS/README.md` + `SPECS/<NN_CATEGORY>/<ID>_*.md` (102 files).
