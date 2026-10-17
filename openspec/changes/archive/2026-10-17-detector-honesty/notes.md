# Notes — detector-honesty

Measure-or-unknown cutover evidence (design D2/D6/D7). Baseline = commit `92f58df`
(deterministic-scoring); "before" rows are the **baseline engine** scanned over the
**current** `leapscore` working tree, "after" rows the **detector-honesty engine**
over the same tree (dogfood corpus, local scan, `--strict`, darwin/arm64).

## 1. Before/after headline + coverage (weights sign-off evidence, D7.4)

| | before (`92f58df`) | after (this change) |
|---|---|---|
| headline | `19.68`/Critical (sealed) | `12.78`/Critical — **`insufficient-signal`** |
| renormalized ref | `51.30` | `48.15` |
| coverage | `19m / 0e / 9u` + 3 N/A | `12m / 1e / 14u` + 4 N/A |
| `fingerprint_version` | `1` | `2` |
| `score_fingerprint` | `c3ad6c381827…` | `2e79dc468f6f…` |
| rows citing `gh-api` | **10** (ECOS-01/02/03/07, SEC-01/06/02, ARCH-05, TEST-03/05) | **0** |
| row-level pointer names a file | rare | every file-derived fact (1.5) |
| `provenance.tool_manifest` | `[]` | 12 real producers |
| `provenance.snapshot_versions` | absent | `eol-snapshot`, `advisory-snapshot` |

Coverage floor (D6): `measured + estimated = 13` against `requested 27 × 0.5 = 13.5`
→ the headline is suppressed to `insufficient-signal` (**state matches the rule**,
task 4.5). This is the honest thin-signal outcome — the number is still sealed in
`headline.score`/`canonical_score`, and the 14 unmeasured rows are listed with their
what-it-takes notes. `--score-policy legacy` restores a number for one release.

## 2. Per-row movement, every demoted row (D7.4)

Dogfood (`leapscore`) before → after; demoted rows bolded with their what-it-takes.

| row | before | after | note |
|---|---|---|---|
| **ARCH-01** | `unknown` (sampled) | **`unknown`** | run a complexity analyzer (cyclomatic complexity + LOC per method, e.g. lizard/radon) over non-vendored source and join offenders to the core-path set — the offline release ships no such analyzer |
| **ARCH-08** | `unknown` (sampled) | **`unknown`** | run a token-based duplication analyzer (min-tokens 50, e.g. jscpd) to compute duplication_pct and security-critical duplicate clusters — the offline release ships no such analyzer |
| **SEC-06** | `measured 2` (gh-api) | **`unknown`** | resolve depth≥2 transitive chains out of the lockfile against an advisory source with import-closure reachability — the offline release ships no transitive-chain resolver (depth≤1 vulns are SEC-01) |
| VEL-06/08/09/10, SEC-07, TEST-08 | `unknown` | **`unknown`** | GH-API rows stay unmeasured in local scans; never graded from a constant |
| ECOS-01 runtime EOL | `measured 2` (gh-api) | `unknown` | no runtime pin in the tree (declares `engines`-less root manifest) |
| ECOS-02 major drift | `measured 2` (gh-api) | `unknown` | 2 direct deps both unresolvable against the vendored package table |
| ECOS-03 abandoned | `measured 2` (gh-api) | `unknown` | same 2 deps unresolvable → no last-release to judge |
| ECOS-05 license | `unknown` | `unknown` | none of the 2 direct deps is covered by the package-metadata table |
| ECOS-07 lockfile | `measured 2` (gh-api) | `measured 1` | real: 1/2 manifests locked, pin_ratio 100% |
| SEC-01 vulns | `measured 2` (gh-api) | `measured 3` | real: 0 open high/critical from the advisory snapshot |
| SEC-02 secrets | `measured 2` (gh-api) | `measured 2` | real: clean tree, 1 history-only finding (disclosed) |
| ARCH-05 churn | `measured 2` (gh-api) | `unknown` | history too thin: 40 commits / 48d (< 200 commits or < 180d) |
| TEST-03 pyramid | `measured 2` (gh-api) | `estimated 2` | test-classify heuristic, clamp [1,2]; never measured |
| TEST-05 skipped | `measured 3` (gh-api) | `measured 3` | real: 0/243 skipped (0%) |
| ECOS-06 bloat | `measured 1` | `measured 2` | real: 477 transitives, 0 duplicates |
| ECOS-08 lock-in | `measured 2` | `not_applicable` | no framework-class dependency (spec `na_when`) |

Small-repo fixture (CLI `cli-offline-scan.test.ts`) keeps a number: `measured`+
`estimated` clears the floor (the 6 GH-only unknowns are the only unknowns).

## 3. Golden fixtures (D7.2)

`apps/scanner/src/scan/__tests__/detector-honesty.test.ts` re-derives each graded
number from a fixture: ARCH-05 over a 205-commit/205-day git repo (bugfix regex +
`--name-only`), TEST-03/05 pyramid, ECOS-02/05/06/07 lockfile facts, ECOS-05
unknown-on-uncovered-licenses, ECOS-08 N/A-on-empty-frameworks, ECOS-01 offline
EOL resolution (**fetch spy asserts zero sockets**), SEC-01 advisory match naming
`CVE-2020-8203`, SEC-02 tree rule + G1 evaluable offline, doc-age real mtime read,
and a demotion fixture asserting ARCH-01/ARCH-08/SEC-06 + GH-only rows stay
`unknown` with no score. Provenance registry: `provenance-registry.test.ts`.

## 4. Fail-closed / disclosure choices

- SEC-02 runs the built-in documented rule pack offline; `wider_scanners_run: []`
  discloses the absent gitleaks/trufflehog widening, and history that was not
  scanned is stated (`history_scanned_full`), never assumed clean (G1 still
  evaluable offline).
- `estimated` rows carry the spec clamp and count toward the coverage floor (D6);
  `unknown` rows carry a refresh/re-run hint and never a permissive default.
- Snapshot version ids join provenance + the fingerprint, so a dataset refresh is
  a visible score input (`snapshotVersions()` hashed in `computeScoreFingerprint`).

## 5. Corpus caveat

The dogfood repo is itself thin-signal (2 private direct deps, 48-day history, no
ADR/runbooks), so after this change its local headline is `insufficient-signal`.
That is the rule doing its job on this corpus, not a regression; the release
checklist corpora (estates with declared runtimes, real lockfiles and ≥6mo of
history) are where the cheap signals land and the headline stays a number. The
floor value is a tunable constant owned with the weights sign-off (D6).
