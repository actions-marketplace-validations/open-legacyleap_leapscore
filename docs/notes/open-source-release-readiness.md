# Open-Source Release — Readiness Update

**Date:** 17 Oct 2026
**Source brief:** `docs/opensource-brief.docx` (@Rajat)
**Updates:** `docs/notes/open-source-release-gap-analysis.md` (15 Oct 2026) — written before `cli-offline-scan` + `deterministic-scoring` landed. Findings B (determinism) and C (local seam) are **closed**; A (measurement honesty), D (stacks), E (small items) and §5 (site shape) remain open in updated forms below.
**Related:** `openspec/specs/scan-local`, `openspec/specs/deterministic-scoring`, `openspec/specs/report-envelope`, `openspec/specs/workflow-scan`; `openspec/changes/archive/2026-10-16-{cli-offline-scan,deterministic-scoring}`; `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md`.
**Status:** working analysis, not a decision. Logs no decisions, supersedes nothing, changes no code.

Every claim below is checkable — §9 gives the exact commands.

---

## 0. What changed since 15 Oct

Two changes landed, both explicitly motivated by the brief:

- **`cli-offline-scan`** (`908e167`, 20/20 tasks, specs synced) — `scan <path>` local entry (25 detectors, no clone, no GH-API), `--out` three-file directory (`report.json`/`report.html`/`report.md`), exit contract `0/1/2/3` with `--fail-under`, tier rename to `Low/Moderate/High/Critical` with a one-release `tier_legacy` alias, band-specific CTA + tracked URL, Action rewired to checkout-first.
- **`deterministic-scoring`** (`92f58df`, 15/15 tasks) — `score_fingerprint` (v1), frozen headline denominator, wall-clock demoted to a 240s run-failure killer, canonical sorted tree walk + wired `sampleN`, engine identity from release refs.

Their own non-goal lists define this note's scope. `cli-offline-scan` Non-Goals: *"New legacy-stack detectors (VB6/Delphi/.NET EOL tables) beyond sniff placeholders; Req 10 stays a follow-up … Vendored vuln/EOL DB update automation … Single-binary packaging; binary decision later."* `deterministic-scoring` out-of-scope: *"detector measurement honesty (literals), offline-by-default flip, site future, legacy-stack ingestion."*

---

## 1. Brief → state (the 10 requirements)

Legend: `ok` done · `~` partial · `x` not done.

| # | Requirement | Pri | State | Evidence / what remains |
|---|---|---|---|---|
| 1 | One command, no config: `leapscore scan <path>` | Must | `~` | Works as `leapscore-scan scan <path>`; `--out <dir>` is **required** (exit 2 without it, `bin/scan.ts:200`); bin is `leapscore-scan` (`apps/scanner/package.json` workspace `bin` + root `package.json` for the git-install form), not `leapscore` |
| 2 | Fully offline by default — no network in a default run | Must | `x` | Default local scan *may* make allowlisted GETs; `--strict` is the opt-*out* (`contracts ALLOWED_NETWORK_HOSTS`; `scan-local` spec). Brief demands default-quiet + explicit opt-in. Mitigating fact: **nothing currently fetches** — the `fetchImpl` seam is dead code (`local.ts:186-187`); the flip is posture + docs + tests, not a re-plumbing |
| 3 | Deterministic: same code, same version, same score | Must | `ok` | `fingerprint.ts` (`FINGERPRINT_VERSION=1`), frozen denominator (`mvp.ts:428`), `KILLER_TIMEOUT_MS=240_000` (`budget.ts:17`), killer trip → run-failure, no seal (`local.ts:295`); repeat-run fingerprint-equality tests. Caveat: >500-file trees make ARCH-01/08 + ECOS-05 `unknown` by design (`sampleN` gate) |
| 4 | Every deduction traces to a finding: file/dep, rule, weight | Must | `~` hollow | Mechanism exists (`evidence.{tool,pointers,facts}` per row; `top_blockers` carry `evidence_file`/`rule`/`weight_pp`; `seal.ts:54-80`). But most graded magnitudes are literals and provenance names tools that never run — §3.1 |
| 5 | Scoring methodology published in the repo | Must | `~` | `docs/rubric/` (13 canonical files) is publishable material; no public narrative doc; report's `METHODOLOGY_URL` points at `leapscore.dev/methodology` while the site route is `/method` → dead link; weights are "v1 asserted defaults" (`11` §4) — sign-off open |
| 6 | Score bands with stated thresholds: Low, Moderate, High, Critical | Must | `~` | CLI/JSON: `Low ≥80` / `Moderate ≥53` / `High ≥27` / `Critical <27` (`rollup.ts:96-110`), `tier_legacy` maps to sub-project strings. Site `lib/scoring.ts TIERS` and rubric `11` §3 still say **Healthy / High Risk** — migration pending by the change's own design note |
| 7 | Versioned output: JSON + HTML + Markdown | Must | `ok` | All three written every sealed run; self-contained HTML (inline CSS, no external assets); `contractVersion` + `fingerprint_version` + `report_schema: '1'`. Nits: `sample: true` hardcoded (`seal.ts:215`); no sample-report screenshot artifact in the repo yet |
| 8 | CI: GitHub Action + generic step, exit code + threshold flag | Must | `x` | Exits + `--fail-under` work. **Action cannot run as committed**: `action/dist/index.js` is gitignored and untracked, while `action.yml` declares `main: dist/index.js` and the dogfood workflow does `uses: ./action`; also shells `npx -y tsx@4` at runtime and needs workspace resolution — not self-contained, not Marketplace-publishable; npm package not publishable either (`private: true`, tsx bin). Generic-pipeline docs absent |
| 9 | Structural signals: complexity, EOL, dep age, offline vuln DB, tests, size/churn | Should | `x` | 25 local detectors exist and *gate* on real files; graded magnitudes mostly literal (complexity, dep drift, test counts, churn — no `git log`); **no vendored EOL/vuln snapshot exists anywhere**, so the "offline database" requirement has nothing behind it — §3.1 |
| 10 | Prioritise Java, .NET incl. VB.NET, VB6, Delphi | Should | `x` | `ecosystem.ts` PATTERNS: js/py/go/rust/java/ruby/php only. Zero VB6/Delphi/Pascal/Visual Basic mentions in `docs/rubric/` or scanner code (verified count 0). Java is sniffed (pom/gradle) but no detector parses Maven/Gradle dependencies. Explicitly deferred (`cli-offline-scan` Non-Goals) |

---

## 2. The brief's release checklist, mapped

| Checklist item | State | Note |
|---|---|---|
| Methodology document published and the weights signed off | **pending** | Doc absent; weights sign-off is the brief's open question. Sign-off should happen against real detector output — §3.1 |
| Score proven deterministic across repeated runs | **done** | Repeat-run fingerprint/score-equality tests; dogfood evidence in change notes |
| Test confirms a default run makes no network calls | **pending** | Only the `--strict` fetch-spy test exists (`cli-offline-scan.test.ts` §3.1). Needs the §3.2 flip first |
| Every deduction links to a specific finding | **partial** | Linkage present; content hollow where payloads are literals — §3.1 |
| HTML and Markdown reports render cleanly | **done** | Content-assertion tests + three-file uniformity; visual review not recorded |
| Result-specific next step in both report and CLI | **partial** | Report has band-specific CTA + tracked URL; CLI stdout line lacks the CTA sentence (it prints score/tier, gates, coverage, URL) |
| Apache 2.0 licence, README and CONTRIBUTING in place | **pending** | No `LICENSE`, no `CONTRIBUTING`, no root `README`; every package `private: true` |
| GitHub Action published | **blocked** | Dist untracked + runtime `npx` + public org move — §3.3 |
| Run on ≥2 real legacy codebases (.NET + Java), externally reviewed | **blocked** | .NET absent entirely; large repos trip the frozen-denominator display issue — §3.1 |

---

## 3. The three open problems

### 3.1 Measurement honesty (old Finding A, updated — still the deepest issue)

The engine's *presence checks* are real; its *grades* are mostly constants. Three tiers, by what the detector actually does:

| Tier | Detectors | What's real | What's literal |
|---|---|---|---|
| File-backed | DOCS-01/03/04/08/09, PERF-02/06, DATA-01, ECOS-06, SEC-09/10 | directory/file discovery, counts, CI-step parsing | residual magnitudes, e.g. `docs01 newest_adr_days: 40`, `docs03 newest_days: 240`, `docs04 last_verified_days: 300`, `data01 raw_sql_share: 0` |
| Presence-gated | ARCH-01/08, ECOS-01/02/03/05/07/08, SEC-01/02/06 | reads manifest/lockfile to decide a truthiness flag | every graded number: `methods_analyzed: f ? 200 : 0`, `duplication_pct: f ? 7 : 0`, `pct_behind_1plus_major: pkg ? 12 : 0`, `pin_ratio: lock ? 96 : 0`, `findings: [], tools: ['trivy']`, `history_scanned_full: true` |
| Pure constants | TEST-03, TEST-05, ARCH-05 | nothing — zero `readFile` calls | `{unit: 10, integration: 5, e2e: 2}`, `{total_tests_est: 100, skipped_total: 2}`, `{commits_analyzed: 100, churn_top10_share: 0.2}` — churn despite `git` being available and already spawned for `rev-parse` |

**Provenance names tools that never run.** `makeProvenance('trivy' | 'lizard' | 'jscpd' | 'syft' | 'pyramid' | 'endoflife.date')` — the only external binary the engine spawns is `git`. Evidence pointers therefore assert tool usage that never happened; for the brief's "no black boxes" thesis this is worse than a missing number, because it *looks* traceable.

**The frozen-denominator display tension (new, load-bearing).** `mvp.ts:428`: `frozenApplicable = applicable + unknown` — `unknown` rows count in the denominator with **zero** numerator contribution. Dogfood on this repo (719 files, 0.93s, `deterministic-scoring/notes.md`): headline **19.68/Critical** vs renormalized reference **51.30**, coverage 19m/0e/9u — 3 slow detectors `unknown` (sampleN gate) + 6 GH-only rows. Real legacy codebases all exceed 500 files, so checklist item "run on two real legacy codebases, output reviewed externally" will produce Critical-band reports driven substantially by *unmeasured*, not *bad*. Deterministic and disclosed (coverage line + `--score-policy legacy` escape hatch), but an external reviewer's first question will be exactly this. Ties directly into the honesty decision below.

**Why this is the critical path.** It gates requirements 4, 5, and 9 simultaneously, plus the two-codebase validation item. The two shapes:

- **(a) Measure-or-unknown.** Implement the cheap offline signals honestly (lockfile/manifest parsing for dep counts + drift + licenses; `git log` churn; test-file classification; vendored EOL tables for Node/Java/.NET; pinned OSV subset for vulns), and demote everything unimplemented to `unknown` + "what it takes" — exactly the Tier C/D pattern the rubric already promises. Caveat: mostly-demoted detectors fall under `COVERAGE_FLOOR = 0.5` (`mvp.ts:297`), suppressing the headline — arguably correct, but it changes what the release *shows*.
- **(b) Measure the top signals before release** (dep + churn + tests + EOL are days each), leave the rest as labelled preview.

(a) is closest to the credibility thesis; (b) is faster to a working demo. Either way, fabricated provenance must die and the frozen-denominator display policy needs a stated decision.

### 3.2 The offline-by-default inversion

Today: *de facto* offline, *de jure* the opposite. The brief mandates the reverse of the current contract:

```
  default scan today            brief requires
  ------------------            --------------
  default: allowlisted GETs  →  default: zero sockets
  --strict: zero sockets     →  opt-in flag (--online) for allowlisted GETs

  today, in practice:
    local.ts:186  fetchImpl = strict ? throwing : real fetch   <- dead code: nothing fetches
    tests         fetch-spy exists only for --strict           <- brief wants it for DEFAULT
```

Touch list when flipping: `contracts` (opt-in flag semantics; allowlist unchanged), `local.ts` default fetch, `--strict` becomes an alias/no-op (or stays as belt-and-braces), fingerprint semantic-flag era (this is what `fingerprint_version` exists for), the default-run no-network test, the README first-screen claim (*"LeapScore runs entirely on your machine. Nothing is sent anywhere unless you turn it on."*), and the Action input (`strict` → opt-in `online`). Also reconcile the claim *"strict uses vendored snapshots"* — no vendored data files exist in the tree; strict mode just emits `unknown`. The `cli-offline-scan` design says *"v1 ships a snapshot with a documented refresh note"* — reconcile claim vs artifact inside the honesty change.

### 3.3 Release shape and packaging (old §5, sharpened)

```
  apps/scanner     CLI + engine + 25 detectors  +  server.ts (287 lines — the SITE'S hosted
                   service; site streams it via NEXT_PUBLIC_SCANNER_URL, never scans itself)
  apps/site        marketing + authored sample (lib/sample.ts, 1645 lines) + persisted reports
  apps/surface     files GitHub issues from reports (internal tooling)
  packages/        contracts (shared) + detectors (102 manifests; registry.ts is a stub — unused)
  docs/            rubric (publishable) + plans/specs/notes (internal strategy)
  action/          Action wrapper (must become self-contained for Marketplace)
```

Options: **(a)** whole monorepo public (fastest; exposes plans/notes/pricing strategy history); **(b)** extract a scanner-only repo (`apps/scanner` minus `server.ts` + contracts + rubric + tooling + action + licence/README/CONTRIBUTING — needs a sync mechanism); **(c)** built-artifact release repo (hardest to maintain, rejected by default). The brief doesn't decide this ("who owns the repository" is its open question); it determines where the packaging and funnel work lands.

Hard facts underneath: `action/dist` untracked + `uses: ./action` in the dogfood workflow ⇒ **the Action as committed cannot run on a fresh checkout** (the change's "verified green" claim doesn't hold against HEAD); the action shells `npx -y tsx@4` (network + workspace resolution) ⇒ not locked-down-machine-shaped; no npm-publishable package (`private: true`, TS-run-via-tsx, no compiled output); no `LICENSE`/`CONTRIBUTING`/root `README`/`Dockerfile` anywhere; remote is `open-legacyleap/leapscore` while `github.com/Legacyleap` exists (HTTP 200) — the org move is pending.

---

## 4. Report, funnel, and site

- Renderers (`render.ts`): band-first headline, top-5 risks with evidence + rule, gates/categories detail, band CTA + tracked URL (`utm_campaign=cli-scan-v1&band=<band>`), methodology link. Matches the brief's report shape except: **positioning line absent** ("LeapScore sees the structure. The assessment understands what the code does." — grep finds it only in `docs/notes/`), and the CLI stdout line lacks the CTA sentence ("the same line … printed once").
- **`/assessment` route does not exist** on the site (routes: product, live, report/live, report/sample, rubric, method, reports; no redirects in `next.config.ts`). The flagship tracked link in every report currently has nowhere to land — "report-to-assessment click-through" is unmeasurable until a page (or redirect) exists. Same for `/methodology` vs the site's `/method`.
- Site tier names not migrated (`Healthy`/`High Risk`); `tier_legacy` is a declared one-release debt.
- Benchmarking: explicitly after first release — out of scope now. `--repo` (remote GH mode) remains for the site path; the brief neither requires nor forbids it.

## 5. Privacy posture

No telemetry, no update pings, no phone-home anywhere (the "version check" in contracts is a local envelope validation). The tracked URL is click-only ✓. Missing: the README first-screen sentence and the default-run no-network test (§3.2).

## 6. Small verified snags

1. `/methodology` 404 (report link vs site route `/method`).
2. `/assessment` missing → tracked links + click metric dead.
3. Positioning line absent from reports and README.
4. CLI stdout lacks the CTA sentence; spec drift: `scan-local` says stdout carries "top risks", impl prints gates/coverage (`seal.ts:110-119`).
5. `sample: true` hardcoded on every real report (`seal.ts:215`); site sample is a 1645-line authored fixture — no reproducible repo → screenshot path yet.
6. `--out` required + bin named `leapscore-scan` → `leapscore scan <path>` isn't zero-config yet.
7. Site/rubric band naming not migrated (§1 #6).
8. 65 drift corrections logged but unapplied (`docs/specs/README.md` §4; reconciliation unchecked at line 283) — resolve before publishing methodology.
9. `AGENTS.md` is stale (still says `packages/engine/…`; actual engine lives at `apps/scanner/src/scan/…`) — fix before strangers read it.
10. `server.ts` (the site's hosted service) is colocated with the CLI — boundary decision inside §3.3.

## 7. Open questions

**From the brief**
- Who signs off the scoring weights before release? Should happen against real detector output (§3.1), not the literals.
- Who owns the repository, and what is the issue-response SLA? For an open score, response latency is credibility.

**New here**
- Frozen-denominator display policy: is 19.68/Critical-on-your-own-repo (unknowns as zero) the release posture, or does the coverage floor / headline policy change for large repos?
- Release shape (a/b/c in §3.3) and the org move.
- Public band nomenclature: rubric/site say Healthy/High Risk; CLI/JSON say Low/High. One vocabulary, decided once.
- `cli-offline-scan` leftovers: vendored-DB refresh cadence + owner; `--format` subset for CI speed; `--fail-on degraded`.

## 8. Suggested capture shape

| Change | Covers | Depends on |
|---|---|---|
| *(decision, not a change)* release shape | repo boundary, org, ownership/SLA | — |
| `detector-honesty` | Req 4 + 9; measure-or-unknown; honest provenance; vendored EOL/vuln snapshots; frozen-denominator display decision | shape (where snapshot data lives) |
| `offline-default` | Req 2 + privacy test + README claim + Action input + fingerprint era | honesty (vendored story) |
| `legacy-stacks` | Req 10; sniff + detectors + rubric rows for .NET/VB.NET/VB6/Delphi | can run parallel |
| `release-packaging` | LICENSE/README/CONTRIBUTING, npm package, self-contained Action dist, generic CI docs, container/binary decision | shape |
| `release-funnel` | `/assessment` + `/methodology`, positioning line, stdout CTA, site tier migration | can run parallel |

Walking order: shape decision → `release-packaging` scaffold (unblocks dogfood + Marketplace) and `detector-honesty` (critical path) → `offline-default` (small) → `release-funnel` (small) → `legacy-stacks` (parallel) → two-codebase validation runs last.

## 9. Verification index

All read-only, from repo root.

```bash
# §0 — what landed
git log --oneline -4
git show 908e167 --stat | head -25
git show 92f58df --stat | head -30

# #1 — command shape
sed -n '11,27p' apps/scanner/bin/scan.ts            # usage; scan <path>; --strict conflict
sed -n '200,204p' apps/scanner/bin/scan.ts          # --out required -> exit 2
grep -n '"bin"' -A 3 package.json                   # leapscore-scan -> apps/scanner/bin/scan.ts

# #2 — offline posture
sed -n '186,187p' apps/scanner/src/scan/local.ts    # fetchImpl dead code
grep -rn 'fetch(' apps/scanner/src --include='*.ts' | grep -v __tests__   # expect only strict-fetch defs
sed -n '361,370p' packages/contracts/src/index.ts   # allowlist hosts
grep -n 'strict' apps/scanner/src/scan/__tests__/cli-offline-scan.test.ts | head

# #3 — determinism
grep -n 'FINGERPRINT_VERSION' apps/scanner/src/scan/scoring/fingerprint.ts
grep -n 'KILLER_TIMEOUT_MS\|maxFiles' apps/scanner/src/scan/budget.ts
grep -n 'frozenApplicable\|COVERAGE_FLOOR' apps/scanner/src/scan/scoring/scorer/mvp.ts
sed -n '1,30p' openspec/changes/archive/2026-10-16-deterministic-scoring/notes.md

# #4 / #9 — measurement honesty
sed -n '7p'  apps/scanner/src/scan/detectors/test03.ts
sed -n '7p'  apps/scanner/src/scan/detectors/test05.ts
sed -n '7p'  apps/scanner/src/scan/detectors/arch05.ts
sed -n '9,10p' apps/scanner/src/scan/detectors/arch01.ts
sed -n '8p'  apps/scanner/src/scan/detectors/ecos02.ts
sed -n '8p'  apps/scanner/src/scan/detectors/sec01.ts
grep -rho "makeProvenance('[^']*'" apps/scanner/src/scan/detectors/*.ts | sort -u
grep -rn 'execFile\|execSync' apps/scanner/src --include='*.ts' | grep -v __tests__
find . -path ./node_modules -prune -o -type f -name '*snapshot*' -print   # expect none (no vendored data)

# #6 — bands
sed -n '96,111p' apps/scanner/src/scan/scoring/scorer/rollup.ts
grep -n 'TIERS' -A 6 apps/site/lib/scoring.ts
grep -n 'tier_legacy' openspec/specs/report-envelope/spec.md | head -3

# #8 — Action
git check-ignore -v action/dist/index.js ; git ls-files action/ # dist IGNORED + untracked
grep -n 'npx' action/src/main.ts
grep -n 'uses: ./action' .github/workflows/leapscore-scan.yml
grep -n 'private' apps/scanner/package.json packages/contracts/package.json

# #10 — stacks
sed -n '7,20p' apps/scanner/src/scan/ecosystem.ts
grep -rni 'delphi\|vb6\|pascal\|visual basic' docs/rubric/ apps/scanner/src | wc -l   # expect 0

# §4 — report / funnel
grep -n 'METHODOLOGY_URL\|assessmentUrlForBand' apps/scanner/src/scan/render.ts
grep -n 'ASSESSMENT_BASE_URL\|ASSESSMENT_CAMPAIGN' packages/contracts/src/index.ts
find apps/site/app -name page.tsx | sort            # no /assessment, no /methodology
grep -rn 'sees the structure' --include='*.md' --include='*.ts' . 2>/dev/null | grep -v node_modules

# §6 — licence / packaging
find . -maxdepth 2 \( -iname 'LICENSE*' -o -iname 'Dockerfile*' -o -iname 'CONTRIBUTING*' \) -not -path './node_modules/*'
wc -l apps/site/lib/sample.ts                        # 1645 — authored fixture
sed -n '195,283p' docs/specs/README.md               # 65 drift corrections; reconciliation unchecked
```

## 10. Confidence

| Claim | Confidence | Would be falsified by |
|---|---|---|
| Reqs 1/3/7 + half of 8 landed | **Verified** — commits, specs, tests read | a failing test suite (I did not execute it) |
| Detector payloads are largely literal | **Verified** — source read per detector | a detector whose payload I mis-read |
| Provenance names tools never run | **Verified** — grep: only `git` is spawned | a spawn path outside `apps/scanner/src` |
| Default local scan opens no sockets *today* | **Verified by grep** | a fetch behind a dynamic import I missed |
| Frozen denominator counts unknowns as zero | **Verified** — `mvp.ts:428` + dogfood numbers in change notes | a scoring path bypassing `frozenApplicable` |
| Action cannot run on fresh checkout | **Verified** — `git check-ignore` + `git ls-files` | a workflow/build step materialising dist (none exists) |
| `/assessment` + `/methodology` dead links | **Verified in-repo** | Vercel-level redirects configured outside this repo |
| 65 drift corrections unapplied | **Verified** — counted in `docs/specs/README.md` §4 | a reconciliation commit I did not see |
| Dogfood numbers (19.68 vs 51.30) | **Recorded evidence**, not re-run | re-running the scan disagrees |
