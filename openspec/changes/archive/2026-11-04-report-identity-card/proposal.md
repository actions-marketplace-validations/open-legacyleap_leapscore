## Why

A sealed report answers *how good* the code is and almost nothing about *what the code is*. A reader meets `58 · Moderate` with no way to calibrate it: 58 for a 400k-line Python monolith from 2005 and 58 for a 400-file CLI are different achievements, and today the report renders them identically. The material already exists and is discarded — `walkSortedTree` produces the file count, `sniffEcosystems` produces the manifests, `classifyArchetype` produces archetype and planes, `scanStackCensus` produces the legacy stack census — but none of it reaches a rendered surface except an archetype chip and a run-provenance grid. Meanwhile the page currently puts the *instrument's* receipt (`schema · rubric · engine · run · duration`) above the score and the *subject's* identity nowhere, which is backwards: a reader learns how long the scan took before learning how large the repo is.

## What Changes

- **New sealed block `report.identity`** — target identity: repo, commit, scan instant, archetype + planes, file/dir counts, language mix, ecosystems, frameworks, legacy-stack census, and a single total-lines magnitude. Optional on the type so envelopes and fixtures written before it still typecheck and render.
- **A non-overlap rule governs membership.** An identity field SHALL NOT be a fact any indicator row grades. This excludes dependency mass (`ECOS-06`'s objective metric is `total transitive dependency count`, Y 100–300 / R > 300) and test-file counts (`TEST-03`'s surface): stating `611 transitive deps` above the score while `ECOS-06` grades the same number to `2/3` would make the report argue with itself.
- **LOC is one number, deliberately undecomposed.** Physical newlines over a named source-extension scope (`source-v1`), never a per-file distribution or percentile (that is `ARCH-01`) and never a code/comment/blank split (that is `DOCS-06`). It feeds nothing.
- **LOC tagging reuses three of the five row statuses** — `measured` / `estimated` / `unknown` — with `estimated` meaning "extrapolated magnitude", not the scoring clamp. `unknown` carries a `reason`; the `~` prefix and two-significant-figure rounding are derived from status at render, never stored.
- **A bounded, deterministic measurement ladder.** Local scans read every in-scope file (`measured`). Remote scans read a fixed-stride sample of `k` files over the canonical sorted walk and extrapolate by the free extension histogram (`estimated`), with `covered: { files_read, files_in_scope }` on the item; coverage-complete reads are `measured` regardless of lane, so a small repo needs no special case. Identity reserves its read allocation up front, on the `withCloneBase` precedent, instead of competing with the detector partition.
- **Identity is an orchestrator-level pass, not a detector**, following `classifyArchetype`'s precedent — it must not consume a detector's byte partition, and its cap failures must not look like detector cap failures.
- **Ordering inverted on the rendered report:** subject (identity card) → verdict (headline, coverage, blockers, band path) → evidence (gates, categories, full table) → provenance. The existing `schema · rubric · engine · run · duration · ran` grid is demoted to a collapsed provenance detail, because it describes the instrument rather than the subject.
- **`score_fingerprint` excludes the block**, following the `next_band_path` precedent. For `lines` this is a correctness requirement: a locally measured count and a remotely estimated one must not make the same commit fingerprint differently.
- **Identity never suppresses.** When the headline is withheld for `insufficient-signal`, the identity card is the only true content on the page and still renders in full.
- **Surface parity.** Site, CLI markdown, and JSON render from the same block with the same derivation rules; the CLI gains the identity line above the verdict.

## Capabilities

### New Capabilities
- `report-identity`: the identity block — membership rule, field set, three-status vocabulary, LOC definition/scope/counter, the sampling ladder and its reservation, ordering across surfaces, provenance demotion, fingerprint exclusion, and absent/unknown degradation.

### Modified Capabilities
- `report-envelope`: the sealed report gains an optional, non-fingerprinted `identity` block; absent-block degradation joins the existing absent-`trace` / absent-`next_band_path` behaviour.
- `report-rendering`: rendered section order changes to subject → verdict → evidence → provenance, and the run-provenance grid is demoted out of the header chrome.

## Impact

- **Contract:** `packages/contracts/src/index.ts` — `ReportIdentity`, `IdentityItem`, `IdentitySize`, `IdentityLanguage`, plus `Report.identity?` and its type assertions.
- **Scanner:** a new identity pass beside `classifyArchetype` in `apps/scanner/src/scan/orchestrator.ts` and `apps/scanner/src/scan/local.ts` (shared implementation, lane-specific read strategy); `apps/scanner/src/scan/budget.ts` gains a reserved base for the pass; `apps/scanner/src/scan/tree.ts` becomes the single walk shared by identity and the stack census (the walk is currently invoked eight times per scan). Sealing in `apps/scanner/src/scan/scoring/seal.ts`; `fingerprint.ts` must be provably unaffected.
- **Site:** `apps/site/components/report-view.tsx` (card above the hero, provenance demoted), a new identity component, `apps/site/app/live/LiveReportClient.tsx` (the archetype chip folds into the card), the committed fixture and `apps/site/lib/sample.ts` carry the block.
- **CLI:** `apps/scanner/src/scan/render.ts` identity line above the verdict; rebuild of the committed `dist`.
- **Rubric docs:** `docs/rubric/model/config.md` does not change — identity introduces no weight, band, or gate. No new indicator, no row, no threshold.
- **Non-goals:** popularity/vitality fields (stars, forks, contributors), history-derived fields (repo age, last-commit recency — structurally unavailable on a `--depth 1` remote clone), dependency mass, test-surface counts, per-file LOC distribution, comment-density ratios, any identity value entering the score, the band, a gate, the diff gradient, or the fingerprint.
