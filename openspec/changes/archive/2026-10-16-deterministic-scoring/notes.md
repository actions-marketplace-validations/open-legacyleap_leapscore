# Notes — deterministic-scoring

## 1.4 killer-timeout spike (2026-10-16)

- Corpus: the `leapscore` monorepo itself, 719 tracked files (`git ls-files | wc -l`),
  local scan (`scan .`), engine-ref `spike-measure`, machine: darwin/arm64.
- Measured wall time: **0.93s** (tsx, cold), headline 19.68/Critical,
  coverage 19m/0e/9u (6 phase-1 GH-only rows unknown by design + 3 sampled slow
  detectors on the >500-file tree).
- Killer constant: **240_000ms** (`KILLER_TIMEOUT_MS` in `apps/scanner/src/scan/budget.ts`),
  ≈250× the measured wall on a 719-file monorepo — order-of-magnitude headroom per D6.
- Caveat: no .NET/Java mega-corpus was available for this spike; the dogfood
  workflow (`leapscore-scan.yml`, local-first on this repo) is the canary. If dogfood
  wall times exceed ~24s (10% of killer), revisit before release.

## Before/after headline evidence (migration plan step 2)

- Dogfood corpus (`leapscore` repo, same run): frozen **19.68** vs renormalized
  reference **51.30** — both sealed in `report.json` (`headline.score` /
  `headline.renormalized_score`), explainable per-run as designed (D5 risk 1).
- Gap drivers: 3 sampled slow detectors (ARCH-01/ARCH-08/ECOS-05 → unknown on
  >500-file trees) + 6 GH-only rows unknown in local scans, all disclosed as
  unscored under the frozen denominator instead of vanishing.
- Escape hatch: `--score-policy legacy` seals the renormalized number for one
  release; both policies verified sealing in `deterministic-scoring.test.ts` (4.2).

## Gate rule supersession

- `openspec/specs/indicator-applicability/spec.md` says gates sourced solely from
  `not_applicable`/`not_implemented` rows take that same status. D5/3.3 supersede
  it for the verdict line: any gate with **no** measured/estimated source row is
  `unevaluable` (G4/G5/G7 always; G1/G2/G3/G8/G6 when their facts are missing or
  error). The old spec needs a follow-up delta if it must stay normative.

## Fail-closed choices (spec-silent)

- Suppressed headline + `--fail-under` set → threshold trip, exit 3 (fail closed).
- Suppressed headline without `--fail-under` → exit 0, files written, stdout/HTML/MD
  print `insufficient-signal` instead of a number; reference scores stay in JSON.
- Killer trip → exit 1, **no** report files (`run-failure`, never a degraded seal).
- `LEAPSCORE_KILLER_MS` env overrides the killer (4.1 verification only).
