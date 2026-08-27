## Why

Phase 1 scores 6 GH-API rows in <10s, but the MVP promise (`docs/plans/13_MVP_SLICE.md:27`) is 19 Tier-A `measured` rows with dual headline, coverage bar, and proven gates G1/G2/G3/G8. Without Phase 2, 13 high-variance rows (ECOS/SEC/ARCH/TEST) stay `unknown`, the headline is honest-partial, and the wow-factor heavy tools (`lizard`, `jscpd`) never run. Adding a worker/queue clone scan under a 4-min budget completes the reversible cut.

## What Changes

- **Worker/queue clone scan (Phase 2):** shallow `--filter=blob:none` clone + manifest sniff (`package-lock.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`) per `docs/specs/README.md` and `docs/plans/05:120` path-scoped `{root, ecosystem}[]`; selects adapter set, falls back to agnostic plane when no manifest.
- **13 detectors (local tools, D5 no execution):**
  - `ECOS-01` runtime EOL (`endoflife.date` API + pin extractors), `ECOS-02` major drift (registry compare), `ECOS-03` abandoned (registry + GH archived), `ECOS-05` license (`syft` + licensee), `ECOS-07` lockfile reproducibility (pin ratio + CI immutable)
  - `SEC-01` unpatched vulns (`trivy` + `osv-scanner` over lockfiles, deduplicated by CVE), `SEC-06` transitive chains (`osv-scanner` depth≥2 + import-closure reachability), `SEC-02` secrets (`gitleaks` tree + history `--all` with rotation-age)
  - `ARCH-01` complexity (`lizard` + `radon`), `ARCH-08` duplication (`jscpd` token 50), `ARCH-05` churn hotspots (`git log --name-only` + GH issue bug regex)
  - `TEST-03` pyramid inversion (file-path classifier), `TEST-05` skipped tests (`rg` markers + `git blame` age)
- **Two-phase orchestration:** Phase 1 GH-API seals hero dial within an **indicator-count-driven budget** (`base + Σ per-indicator cost` for the 6 requested IDs → ~10s); Phase 2 enqueues clone job via worker/queue and runs under an **indicator-count-driven budget** (`clone base 30s + Σ per-indicator cost` for the 13 requested IDs → ~4-min, scales to 59-row v1) with uniform file-tree sharding (`budgetLease.sampleN`) and `truncated=true` → `estimated+scope-limited`. Fail-open: any tool timeout/cap → `unknown`/`estimated`, never blocks Phase 1 report. Example: 6 fast/api-budgeted rows → ~10s; 13 mixed (5 fast ×5s + 5 api-budgeted ×10s + 3 slow-dissolvable ×40s + 30s clone) → ~240s.
- **Scorer & report for 19:** rolls up VEL 4 + SEC 4 + ECOS 5 + ARCH 3 + TEST 3 = 19 `measured` rows; remaining 83 `unknown` with `unknown_measure_path`; coverage `19/102`, dual headline honest-partial handled in site; gates G1/G2/G3/G8 proven when evidence suffices else `needs-verification`.
- **API/site streaming:** `/api/scan` now two-phase NDJSON (Phase 1 events → Phase 2 clone progress `cloning → sniffing → scanning` → final 19-row report); `/live` reuses same stream with step list and elapsed, shareable URL unchanged.

## Capabilities

### New Capabilities
- `scan-phase-2`: Clone pipeline, manifest sniff, 13 tool adapters, 4-min budget with sharding, fact-store extension, and 19-row scorer/report. This is the primary spec for the change.

### Modified Capabilities
- `scan-phase-1`: Extend Phase-1 GH-API scan to two-phase orchestration (Phase 1 immediate dial + Phase 2 worker/queue clone), update coverage from `6/102` to `19/102`, and make `/api/scan` two-phase streaming. Existing 6 rows unchanged; only orchestration, coverage, and streaming requirements are delta.

## Impact

- **Packages:** `packages/engine` (orchestrator two-phase, `budget.ts` sharding, `gh.ts` still GH-only, `store.ts` fact-store, `scorer/phase2`), `packages/detectors/{ecos-*,sec-*,arch-*,test-*}` 13 manifests/schemas/detectors, `packages/engine/detectors` adapters for `lizard`, `jscpd`, `trivy`, `osv-scanner`, `gitleaks`, `syft`.
- **Site:** `apps/site/app/api/scan/route.ts` (two-phase stream), `apps/site/app/live/LiveReportClient.tsx` (Phase 2 progress steps), `apps/site/lib/provider.live.ts` (19-row mapping), `apps/site/components/*` (coverage 19).
- **APIs:** GH REST (Phase 1) + local FS + `endoflife.date`/registry reads (Phase 2, no new external APIs beyond those already pinned in specs).
- **Non-goals:** v1 59-row full, C/D rows, private-repo App flow, `M&A` measured-only view (OQ2), `estimated` rows (still 0 in MVP).
