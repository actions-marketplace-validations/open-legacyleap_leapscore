# Open-Source Release — Gap Analysis

**Date:** 15 Oct 2026
**Source brief:** `LeapScore — Open-Source Release Brief.docx` (@Rajat)
**Scope:** a reading of the brief against the current repo. Evidence-forward gap analysis.
**Status:** working analysis, not a decision. Logs no decisions, supersedes nothing, changes no code.
**Related docs:** `docs/plans/00_MASTER_INDEX.md` (decisions log), `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` (weights/thresholds), `openspec/specs/scan-phase-1`, `openspec/specs/scan-phase-2`.

Every claim below is checkable — §8 gives the exact commands. Claims marked **(hypothesis)** are not verified and need a spike.

---

## 0. The premise the brief rests on

> "The base version proves the analysis works."

This is the load-bearing assumption of the release. This document tests it, and finds it does not hold in the form open source requires. See §4 Finding A.

---

## 1. The brief, compressed

```
  leapscore            -->   $0 Assessment    -->   Explayn / modernisation
  free, self-serve           sales-led,             paid
  runs locally               MCM-backed
  "what is risky"            "what the code does"
       |
       |  open source, Apache 2.0, offline, deterministic
       v
  positioning line (verbatim, README + end of every report):
  "LeapScore sees the structure. The assessment understands what the code does."
```

| # | Requirement | Pri | State today |
|---|---|---|---|
| 1 | One command, no config: `leapscore scan <path>` | Must | x  entry point is `leapscore-scan --repo owner/repo --out <path>` |
| 2 | Fully offline by default — no network in a default run | Must | x  GH API + network clone are the default path |
| 3 | Deterministic: same code, same version, same score | Must | x  wall-clock deadline is the control loop |
| 4 | Every deduction traces to a finding: file/dep, rule, weight | Must | x  deductions trace to literals (Finding A) |
| 5 | Scoring methodology published in the repo | Must | ~  `docs/rubric/` exists; needs a public narrative |
| 6 | Score bands with stated thresholds | Must | ~  exists as `tierForScore()`; naming differs |
| 7 | Versioned output: JSON for machines, HTML + MD for people | Must | ~  JSON exists; no HTML/MD renderer outside the Next.js site |
| 8 | CI: GitHub Action + generic step, exit code + threshold flag | Must | ~  exit code only for refusals; no threshold flag |
| 9 | Structural signals only (complexity, EOL, dep age, offline CVE DB, tests, size/churn) | Should | ~  partial; churn is a literal (Finding A) |
| 10 | Prioritise Java, .NET incl. VB.NET, VB6, Delphi | Should | x  ingestion sniffs js/py/go/rust/java/ruby/php only |

Legend: `ok` done | `~` partial | `x` not done.

---

## 2. The three inversions

The brief reads like a packaging brief (requirements 1, 2, 7). Two of the three inversions are architectural.

```
+-------------+-------------------------------+------------------------------+
|             |  TODAY (base version)         |  BRIEF (releasable)          |
+-------------+-------------------------------+------------------------------+
|  Input      |  github.com/o/r URL           |  leapscore scan <path>       |
|             |  GH API + network shallow     |  offline, no network calls   |
|             |  clone                        |                              |
|  Control    |  wall-clock deadline,         |  deterministic               |
|             |  10s-240s, time-based         |  same code + version         |
|             |  degradation to `unknown`     |  => same score               |
|  Evidence   |  plausible constants behind   |  every deduction -> finding  |
|             |  fabricated tool provenance   |  (file/dep, rule, weight)    |
+-------------+-------------------------------+------------------------------+
```

---

## 3. What a scan does today

```
leapscore-scan --repo owner/repo --out x.json      (packages/engine/bin/scan.ts)
   |
   +-- ingestRepoUrl()        GET api.github.com/repos/o/r            [NETWORK]
   |
   +-- phase 1, 6 detectors   api.github.com                          [NETWORK]
   |     VEL-06 VEL-08 VEL-09 VEL-10 SEC-07 TEST-08
   |
   +-- shallowClone()         git clone --filter=blob:none --depth 1  [NETWORK]
   |     |
   |     +-- sniffEcosystems()      js/py/go/rust/java/ruby/php
   |     +-- classifyArchetype()
   |     +-- phase 2, 25 detectors -> clonePath + readFile
   |
   +-- sealScan() -> scoreMvp() -> rollup -> tierForScore()
   |     output: { report, meta, trace } as JSON
   |
   exit 0 | 2 (refusal reasons only)
```

Requested set is `EXPANDED_IDS` — 31 detector rows of the 102 in the rubric (`orchestrator.ts:44-49`). `scoreMvp` expands to all 102 and appends `not_implemented` stubs for the remaining 71, so **coverage accounting is honest about the 71**. That part is a credit, not a gap.

---

## 4. Findings

### Finding A — the score is mostly placeholder (highest severity)

`packages/engine/detectors/` holds 31 detectors. Many genuinely locate real files — `docs01` really finds the ADR directory, `data01` really counts migrations, `ecos06` really counts transitive duplicates, `docs09` really counts CI doc steps. But the **numeric payloads that drive the score are literals**.

| Detector | Evidence (file:line) | What is literal |
|---|---|---|
| TEST-03 | `detectors/test03.ts:7` | `{ unit: 10, integration: 5, e2e: 2, e2e_share_est: 0.2 }` — no file read at all |
| ARCH-01 | `detectors/arch01.ts:9` | `methods_analyzed: f ? 200 : 0, pct_over_Y: 1, god_classes: []` — reads `package.json` only to decide `f` is truthy |
| ARCH-05 | `detectors/arch05.ts:7` | `{ commits_analyzed: 100, churn_top10_share: 0.2, hotspots: [] }` — "Code Churn vs. Defect Hot Spots" |
| ARCH-08 | `detectors/arch08.ts:9` | `duplication_pct: f ? 7 : 0` |
| ECOS-01 | `detectors/ecos01.ts:8` | runtime entry hardcoded to `node 20.11`, `days_until_eol: 60` |
| ECOS-02 | `detectors/ecos02.ts:8` | `direct_deps_total: pkg ? 10 : 0, pct_behind_1plus_major: pkg ? 12 : 0` |
| ECOS-03 | `detectors/ecos03.ts:8` | `load_bearing_total: lock ? 10 : 0` |
| ECOS-05 | `detectors/ecos05.ts:9` | `packages_total: pkg ? 20 : 0` |
| ECOS-07 | `detectors/ecos07.ts:8` | `pin_ratio: lock ? 96 : 0` |
| ECOS-08 | `detectors/ecos08.ts:29` | `coupling_share: 0.1` |
| SEC-01 | `detectors/sec01.ts:8` | `findings: [], tools: ['trivy']` |
| SEC-02 | `detectors/sec02.ts:8` | `tree_findings: [], history_scanned_full: true` |
| SEC-06 | `detectors/sec06.ts:8` | `transitive_total: lock ? 20 : 0` |
| SEC-07 | `detectors/sec07.ts:68` | mixed — `open_bot_prs` computed from GH, `lockfile_age_days: 12` hardcoded |
| DOCS-01 | `detectors/docs01.ts:30` | `newest_adr_days: adrCount ? 40 : 9999` |
| DOCS-03 | `detectors/docs03.ts:22` | `newest_days: count ? 240 : 9999` |
| DOCS-04 | `detectors/docs04.ts:18` | `last_verified_days: docsPresent.length ? 300 : 9999` |

**Provenance names tools that never run.** `provenance.tool` reports `trivy`, `gitleaks`, `osv`, `syft`, `lizard`, `jscpd`, `endoflife.date`, `registry`, `pyramid`. The only external binary the engine spawns is `git` (`clone.ts:25`, `clone.ts:39`, `seal.ts:90`). Evidence pointers therefore assert `{ endpoint: 'trivy', detail: 'scanned' }` when trivy was never executed.

**Two related symptoms.**

- `seal.ts:231` hardcodes `sample: true` on every real report.
- The published sample report is a 1,645-line hand-authored fixture (`apps/site/lib/sample.ts`), not engine output. So README requirement "a sample report screenshot" currently has no reproducible path from repo -> screenshot.

**Why this is the strategy's problem, not a backlog item.** The brief's thesis is that an open score earns trust by being inspectable: "A proprietary score is a vendor's opinion. An open one can become the number architects quote." The first thing a sceptical architect does after cloning is open a detector. `pct_behind_1plus_major: pkg ? 12 : 0` is the exact artefact that converts "open method" into "vendor's opinion, now with source available." Requirement 4 asks that every deduction trace to a file, a rule, and a weight; today it traces to a literal.

**Consequence.** Requirement 5 (publish the methodology) is unsafe to execute before this is resolved. Publishing a rubric and shipping an engine that does not implement it damages the credibility the release exists to create.

### Finding B — determinism fights the budget design

Requirement 3 vs. `budget.ts`. The budget is not a safety net, it is the **control loop**: a wall-clock abort whose expiry degrades rows to `unknown`, and `unknown` rows are excluded from the score:

```
same commit, same version, two machines             (numbers illustrative)
  fast CI box    [####################]  31/31 finish -> 31 measured  -> score 61
  slow laptop    [#############.......]  budget ends -> 24 measured,
                                          7 unknown   -> fewer applicable
                                                          categories
                                                          renormalized
                                                      -> score 58
```

The renormalization path is explicit: `rollup.ts:110` filters `status !== 'unknown'`, `mvp.ts` derives `applicableCats` as categories with at least one measured row, then `renormalizeWeights(applicableCats, BASE_WEIGHTS)` rescales to 100. Fewer rows measured does not merely lower confidence — it **reweights the headline**.

**Non-determinism also leaks into the output payload:** `id: ls_${Date.now()}` (`seal.ts:206`), `scanned_at` (`orchestrator.ts:401`), and `engineSha7` resolved via `git rev-parse --short HEAD` **in the consumer's working tree** (`seal.ts:91`), so two people running the same engine version get different `runId`s.

**Good news.** `computeSampleN()` in `budget.ts` already produces a deterministic shard count for slow detectors. The deterministic discipline exists in one function; it is simply not the controlling mechanism.

**Consequence.** Requirement 3 cannot be satisfied by adding a flag. The deadline must be demoted to a pathological-repo safety net, with deterministic sampling as the control.

### Finding C — offline is half-built already

The seam exists. `shallowClone()` returns `{ clonePath, readFile, commitSha, cleanup }` (`clone.ts`), and every phase-2 detector consumes `ctx.clonePath` + `ctx.readFile`. Point that handle at a user-supplied directory and phase 2 runs offline with no detector changes.

What breaks is phase 1:

```
  phase 1  (6 detectors, GH API)      api.github.com/repos/...      [network]
    VEL-06  commits                     -> offline: local `git log`?           (hypothesis)
    VEL-08  .github/workflows           -> offline: file exists in tree        (hypothesis)
    VEL-09  pull requests               -> offline: needs server history       (likely drop)
    VEL-10  branches                    -> offline: `git branch`              (hypothesis)
    SEC-07  dependabot/renovate config  -> offline: file exists in tree        (hypothesis)
    TEST-08 .github/workflows           -> offline: file exists in tree        (hypothesis)
  phase 2  (25 detectors, clone)      -> offline once clonePath is local        (verified)
```

Several GH-API detectors reach for the API to read **files that exist on disk** — SEC-07 looks for `dependabot.yml`/`renovate.json`; VEL-08 and TEST-08 read CI workflow YAML. VEL-09 (PR cadence) genuinely needs a server and is the clearest candidate for `unknown`. This triage needs a spike, not an assumption.

**Also offline, per requirement 9:** "known-vulnerable versions from an offline database." A new artifact with a hard tension — a pinned snapshot is what makes the result deterministic, and a stale snapshot is what makes it wrong. Bundle size, refresh cadence, and snapshot versioning all become release decisions. **(hypothesis)** OSV-style offline DB is the likely source; unverified.

### Finding D — customer stacks are absent at the ingestion layer

`ecosystem.ts` sniffs exactly seven ecosystems: `js, py, go, rust, java, ruby, php`. No `.csproj`, `.sln`, `packages.config`, `.vbproj` (no .NET, no VB.NET), and no `.dpr` / `.dfm` (no Delphi). Requirement 10 lists these as the audience: "Prioritise the stacks our customers run."

Two layers, not one:

1. **Ingestion** — add project-file patterns for .NET/VB.NET.
2. **Detection** — VB6 and Delphi frequently have no package manager at all, so this needs a *language* detector (file extensions + project files), not another `PATTERNS` entry.

And the rubric itself has no VB6/Delphi content — `VB6`, `Delphi`, and `Pascal` appear nowhere in `docs/rubric/`. Requirement 10 may therefore be an indicator-design change, which under the cardinal rule means editing the encyclopedia rows **and** the matching rows in `00_EXECUTIVE_RUBRIC.md` Part 2, then recompiling.

### Finding E — the genuinely small items

Real work, but days rather than the critical path.

| Requirement | State | Note |
|---|---|---|
| 5 methodology | ~ | `docs/rubric/` is already an encyclopedia; needs a public-facing narrative, not new research |
| 6 bands | ~ | `seal.ts:100` returns `Healthy / Moderate / High Risk / Critical`; the brief says `Low / Moderate / High / Critical`. Public wording decision. |
| 7 HTML + MD | x | JSON exists as `{ report, meta, trace }`; no HTML/MD renderer outside the Next.js React site |
| 8 threshold flag | x | `exitCodeForReason()` (`bin/scan.ts:90`) maps *refusal* reasons to 2; no score threshold |
| 1 one command | x | `bin/scan.ts:13` usage requires `--repo owner/repo` and `--out <path>` |
| licence | x | no `LICENSE` file anywhere; root `package.json` is `"private": true` |
| packaging | x | entry point is `tsx` over TypeScript inside an npm workspace — the opposite of "fewest steps on a locked-down machine" |

### Finding F — the engine hand-rolls a canonical weight table

`scorer/mvp.ts:360` declares a local `BASE_WEIGHTS` record. `rubric.json.weights.base` already carries identical values, compiled from `11_WEIGHTS_THRESHOLDS_CONFIG.md` §1 by `compile-rubric.ts`. This is a hand-authored duplicate of canonical data, which the cardinal rule forbids. Values match today, so it is a latent drift risk rather than a current bug.

Related: `rubric.json.weights.feActive` exists (FE 10%, other nine ×0.9) but has no functional reader in the engine or site scoring path — the only match in the tree is a comment at `scorer/index.ts:3`. Worth confirming whether FE-active weighting is reachable at all in `scoreMvp`.

---

## 5. Scope the brief does not raise: the site's centre of gravity

The brief does not say what happens to `apps/site`. Its out-of-scope list answers it implicitly:

```
  out of scope (brief):  hosted SaaS  |  uploading or storing customer code anywhere
        |
        |  but in the repo today:
        v
  apps/site   /live             server-side GH API + clone of the target repo
              /reports/[runId]  persisted runs on our infrastructure
              /api/scan         NDJSON stream (meta -> progress -> report)
  packages/engine/surface/      11 files — files GitHub issues into a repo
```

For the enterprise the brief targets, "the vendor's server clones your repo and stores a report" is precisely the objection. That was the right MVP; it is now the opposite of the stated positioning.

```
  TODAY                              BRIEF
  site (Next.js)  <-- centre         CLI  <-- centre
    /live  hosted GH scan              leapscore scan <path>
    /reports  persisted runs           JSON + HTML + MD
    /api/scan NDJSON                   exit code + threshold
    surface/ files GH issues           README + methodology + licence
    engine/bin/scan.ts --repo          site = landing page + assessment link
```

This is a large scope decision hiding in a document that reads like a packaging brief.

---

## 6. Open questions

**Raised by the brief**

- **Who signs off the scoring weights before release?** Add: sign-off should happen against real detector output, not the current literals — otherwise the rubric is signed while the shipped score does not implement it.
- **Who owns the repository, and how fast do we respond to issues?** For an open score, response latency *is* credibility. A stale thread about a wrong score undoes the play.

**Not raised by the brief, and arguably larger**

- **Publishing the rubric is the real "what are we giving away" decision.** The brief's argument is code-shaped ("LeapScore does not use MCM"). But requirement 5 publishes 102 indicators, the weights, the thresholds, and the scoring model — the thing that makes a score quotable in a steering committee, and the thing that is hardest to change later. Is that sanctioned above the build level?
- **What does the report say when most rows are unmeasured?** The rubric already designs for this (Tier C/D rows emit `unknown` + "what it takes to measure"). Offline, more rows land there. Is the release an honest-but-partial score, or a suppressed headline below a coverage floor? That choice shapes the whole report.
- **Is honest-narrow acceptable as the release?** Three paths, different engineering:
  - **(a)** ship only detectors that truly measure; let coverage be visibly low
  - **(b)** implement the real tools for the top signals before release
  - **(c)** ship explicitly labelled preview

  (a) is closest to what the rubric already promises and to the credibility thesis. (c) is fastest.

---

## 7. Threads, in the order I would pull them

1. **Measurement honesty** — which of the 31 detectors can measure something real offline, and which should drop to `unknown` and say so. Gates requirements 3, 4, and 5 simultaneously.
2. **Determinism re-architecture** — demote the deadline to a safety net; make deterministic sampling the control. `computeSampleN()` is the seed.
3. **`clonePath` inversion** — `leapscore scan <path>`, plus triage of the 6 GH detectors into re-source-locally / needs-server / drop-to-unknown.
4. **Site and funnel decision** — what `/live`, `/reports`, and `surface/` become, if anything.
5. **Stacks** — .NET/VB6/Delphi at both the sniffer and the rubric layer.
6. **Packaging, licence, report renderers** — the honest short list, once 1-3 land.

---

## 8. Verification index

Every claim above is reproducible with read-only commands.

```bash
# Finding A — literal payloads and fabricated provenance
grep -n "const facts" packages/engine/detectors/*.ts
sed -n '7p'  packages/engine/detectors/test03.ts
sed -n '9p'  packages/engine/detectors/arch01.ts
sed -n '8p'  packages/engine/detectors/ecos02.ts
sed -n '7p'  packages/engine/detectors/arch05.ts
sed -n '8p'  packages/engine/detectors/ecos07.ts
sed -n '8p'  packages/engine/detectors/sec01.ts

# Finding A — only `git` is ever spawned
grep -rn "execFile\|execSync\|child_process" packages/engine --include='*.ts' | grep -v node_modules

# Finding A — sample flag and hand-authored sample report
grep -n "sample: true" packages/engine/seal.ts
wc -l apps/site/lib/sample.ts

# Finding B — deadline as control loop; unknown excluded; weights renormalized
sed -n '110p' packages/engine/scorer/rollup.ts
grep -n "applicableCats\|renormalizeWeights\|BASE_WEIGHTS" packages/engine/scorer/mvp.ts
grep -n "computeSampleN" packages/engine/budget.ts

# Finding B — non-deterministic output fields
grep -n "Date.now().toString(36)" packages/engine/seal.ts
grep -n "scanned_at" packages/engine/orchestrator.ts
sed -n '89,92p' packages/engine/seal.ts

# Finding C — the local-path seam
sed -n '1,20p' packages/engine/clone.ts

# Finding D — ecosystem coverage
grep -n "ecosystem:" packages/engine/ecosystem.ts
grep -rn "VB6\|Delphi\|Pascal" docs/rubric/ | wc -l    # expect 0

# Finding E — CLI shape, refusal-only exit codes, tier names
sed -n '13,25p' packages/engine/bin/scan.ts
sed -n '90,92p' packages/engine/bin/scan.ts
sed -n '99,101p' packages/engine/seal.ts
if [ -n "$(find . -maxdepth 1 -iname 'LICENSE*' -print -quit)" ]; then echo 'LICENSE present'; else echo 'no LICENSE file'; fi

# Finding F — hand-rolled canonical duplicate; feActive has no functional reader
sed -n '360p' packages/engine/scorer/mvp.ts
node -e "console.log(JSON.stringify(require('./packages/engine/rubric.json').weights,null,2))"
grep -rn -e "feActive" -e "fe_active" -e "FE-active" packages/engine apps/site/lib --include='*.ts'

# Requested-set size (31 of 102)
grep -n "EXPANDED_IDS\|TRANCHE_A_IDS\|phase1Ids\|phase2MvpIds" packages/engine/orchestrator.ts | head
```

---

## 9. Confidence and what would falsify this

| Claim | Confidence | Would be falsified by |
|---|---|---|
| Detector magnitudes are literals | **Verified** — read in full or from source lines | a detector whose payload I mis-read |
| Named tools are never invoked | **Verified** — single spawn site is `git` | a spawn path outside `packages/engine` |
| Deadline degradation changes the headline | **Verified** — code path read end to end | an outer pin that freezes the score |
| Phase 2 runs offline against a local path | **Verified** — `clonePath` + `readFile` seam | a detector that re-derives from the network |
| GH detectors can be re-sourced locally | **Hypothesis** | spike on VEL-08 / SEC-07 / TEST-08 / VEL-10 |
| Offline CVE DB is OSV-shaped | **Hypothesis** | unverified; no artefact in repo |
| `feActive` unreachable in `scoreMvp` | **Verified by grep**, not by execution | a call path through a compiled/generated file |
| Site is off-strategy for the brief | **Judgment**, not a fact | a business decision that keeps the hosted path |
