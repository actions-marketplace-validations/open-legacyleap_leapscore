## 1. Scaffolding and Contracts

- [x] 1.1 Create worker/queue interface (`enqueue`, `abort`, swappable to external) with in-process Promise queue and verify unit test for enqueue/dequeue/abort passes
- [x] 1.2 Add shallow clone helper (`--filter=blob:none`, read-only `readFile` proxy counting against `byteCap`) and verify clone test with a tiny fixture repo creates `readFile` handle
- [x] 1.3 Extend `packages/engine/budget.ts` for indicator-driven lease (`budgetMs = base + Σ per-indicator cost`, `fast 5s`/`api-budgeted 10s`/`slow 40s`, clamped) and uniform sharding (`sampleN`) and verify unit test: 6 IDs → ~10s, 13 IDs → ~240s, two slow detectors receive same `sampleN`
- [x] 1.4 Update `packages/engine/detector.ts` `ScanContext` for `clonePath`/`manifests`/`budgetLease` and verify `tsc --noEmit` passes with `skipLibCheck`

## 2. Clone Pipeline + Manifest Sniff

- [x] 2.1 Implement path-scoped manifest sniff per `{root, ecosystem}[]` (package-lock.json, pyproject.toml, go.mod, Cargo.toml, pom.xml, pnpm-lock, Gemfile) with polyglot fan-out and verify sniff test on a synthetic monorepo (`frontend` JS + `services/api` Py) returns two roots
- [x] 2.2 Wire two-phase orchestrator with indicator-driven budgets (Phase 1 → `~10s` for 6, Phase 2 → `~240s` for 13, budget passed as `budgetLease` + recorded in `provenance`) and verify Phase 1 6/102 seals before Phase 2 and total wall-clock matches ` Σ cost` for a 3-indicator subset

## 3. Phase-2 Detectors — ECOS (5)

- [x] 3.1 Implement ECOS-01 runtime EOL (pin extractors `.nvmrc`/`Dockerfile`/`engines` + `endoflife.date` lookup, `days_until_eol`) and verify fixture with Node 14 EOL `is_past_eol=true` emits `measured`
- [x] 3.2 Implement ECOS-02 major drift (registry compare per direct dep, `pct_behind_1plus_major`, `core_framework_gaps`) and verify drift fixture with django 3.2 → 5.x `majors_behind=2`
- [x] 3.3 Implement ECOS-03 abandoned (lockfile closure capped 300 + registry last-release/GH archived, `abandoned` in core path) and verify abandoned load-bearing dep `months_since_release=30` maps to score 0
- [x] 3.4 Implement ECOS-05 license (`syft` SBOM dir-mode + license classifier, `copyleft_strong` + `closed_source_distribution_likely` → G8) and ECOS-07 lockfile reproducibility (`git ls-files` + `pin_ratio` + CI immutable) and verify `syft` empty-GPL fixture `copyleft_strong=[]` and lockfile `pin_ratio 96%` → score 3

## 4. Phase-2 Detectors — SEC (3) + ARCH (3) + TEST (2)

- [x] 4.1 Implement SEC-01 (`trivy` + `osv-scanner` deduped by CVE, `age_days`, `in_core_import_closure` → G2) and SEC-06 transitive depth≥2 with reachability and verify critical CVE 41d `in_core_import_closure=true` → G2 `proven`
- [x] 4.2 Implement SEC-02 secrets (`gitleaks` tree + `--all` history with `--max-depth` budget, `verified_live` via trufflehog → G1) and verify `aws-access-token` in tree → `tree_findings` + G1 `proven`
- [x] 4.3 Implement ARCH-01 (`lizard` + `radon`, `pct_over_Y`, `god_classes`, core join, dissolve via `sampleN`) and ARCH-08 (`jscpd` min-tokens 50, `duplication_pct`, `security_critical_dup`, dissolve) and verify `god_classes` fixture and `duplication_pct 14.2` with `truncated=true` → `estimated+scope-limited`
- [x] 4.4 Implement ARCH-05 churn hotspots (`git log --name-only` + bugfix regex, `churn_top10_share`, `hotspots` in core) and verify hotspot `auth/session.py` rank 1+2 in core maps to score 0
- [x] 4.5 Implement TEST-03 pyramid inversion (path/framework classifier, `e2e_share_est`, never `measured` → `estimated` clamp [1,2]) and TEST-05 skipped tests (`rg` markers + `git blame` age, `skip_ratio`) and verify `e2e 41%` → score 1 (estimated) and `skip_ratio 9%` aged 233d → score 1

## 5. Orchestrator, Scorer, Gates, API

- [x] 5.1 Extend scorer for 19 MVP rows (VEL 4 + SEC 4 + ECOS 5 + ARCH 3 + TEST 3 = 19) reusing `apps/site/lib/scoring.ts` BigInt math, coverage `19/102` (`measured:19 unknown:83`), 83 non-MVP `unknown` with `unknown_measure_path`, and verify report `coverage.measured=19` and headline excludes unknown
- [x] 5.2 Wire gates G1 (SEC-02 verified_live in tree), G2 (SEC-01 critical >14d reachable), G3 (ECOS-01 past-EOL in core deploy path), G8 (ECOS-05 copyleft strong in closed distribution) to `proven` else `needs-verification` and verify gate table shows proven when evidence suffices
- [x] 5.3 Update `/api/scan` to two-phase NDJSON (Phase 1 chunk `6/102` immediate → Phase 2 `cloning → sniffing → scanning 13 → scoring` → final `19/102` report) and verify stream for `vercel/next.js` shows Phase 1 6 then final 19

## 6. Site Wiring and Quality

- [x] 6.1 Extend `LiveReportProvider` + `LiveReportClient` for 19-row mapping, add Phase 2 progress steps `Cloning → Sniffing → Scanning 13 → Scoring` with elapsed, and verify `/live?repo=vercel/next.js` first shows `6/102` dial within 10s then `19/102` final while `/report/sample` stays 58/100
- [x] 6.2 Verify no regression in `apps/site` `score.consistency.test.ts` (still 58) and `provider.test.ts` live vs fixture toggle
- [x] 6.3 Extend `detector.contract.test.ts` for 13 new Phase-2 manifests (envelope valid, never `score`/`status`, honors `abort` + `sampleN` within 50ms) and verify `vitest run` green
- [x] 6.4 Dogfood 5 repos via two-phase scan, log `19/102` vs `degraded` and any `estimated+scope-limited`, and verify P95 wall-clock matches indicator-count budget (Phase 1 ~ `Σ 6` <10s, Phase 2 ~ `Σ 13` <240s) via mocked 3-row vs 13-row subset
