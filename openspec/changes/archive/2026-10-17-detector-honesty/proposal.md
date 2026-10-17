## Why

The release brief requires that "every deduction traces to a finding: file or dependency, rule, weight" — because "an open score gets scrutinised; no black boxes". Today the scanner's presence checks are real but many graded magnitudes are literals, and the provenance misreports the producer: a fully offline local scan of `packages/contracts` reports **13 rows** with `evidence.tool: "gh-api"` and the default reason line `… — evidence via gh-api — score 2.`, because `makeProvenance()` hardcodes `tool: 'gh-api'` (`apps/scanner/src/scan/detectors/common.ts:65-72`) while naming `lizard`, `jscpd`, `pyramid`, `trivy` in evidence pointers — none of which the engine ever spawns (the only binary spawned anywhere is `git`). TEST-03/05 and ARCH-05 return pure constants with zero file reads.

A report that *looks* traceable but isn't is worse than an honest `unknown`: it is the one artifact a sceptical architect will screenshot, and it blocks the brief's weights sign-off — there is nothing honest yet to sign off against. This is the critical path the `deterministic-scoring` change explicitly deferred (`proposal.md:29`, "detector measurement honesty (literals)").

## What Changes

- **Truthful provenance** — every sealed row's `evidence.tool` names the tool that actually produced the fact, with its version from the single registry; fabricated tool names (`gh-api` on local rows) and tools the build never runs are removed; evidence pointers reference real files/facts. **BREAKING** for consumers reading `evidence.tool` strings.
- **Measure-or-unknown** — implement the cheap offline measurements the specs already describe (git-log churn, test-file classification, lockfile/manifest parsing, EOL lookups); every row that cannot be measured from tree + git + vendored data becomes `unknown` with "what it takes" instead of a constant. Note: `scan-phase-2` already mandates most of this (e.g. ARCH-05 "via `git log --name-only`"), so this is largely a conformance change, not a spec invention.
- **Vendored offline data** — ship the runtime/framework EOL snapshot and a pinned advisory subset (the brief's "known-vulnerable versions from an offline database"), each with a version id and a documented refresh; snapshot versions join the fingerprint. Reconciles the `--strict` "detectors use vendored snapshots" claim (`openspec/specs/scan-local/spec.md:24`) with a tree that contains no such data.
- **Fingerprint era** — bump `fingerprint_version`; scores drop where rows demote, by design and disclosed (the `--score-policy legacy` escape hatch stays for one release).
- **Headline consequence** — state and implement the coverage-floor policy under honest demotion: demotion moves measured rows toward the floor on the large repos the release checklist must validate.
- **Report self-description** — the sealed report stops declaring `sample: true` on real runs (`packages/contracts/src/index.ts:169` types it as the literal `true`).

## Capabilities

### New Capabilities

- `measurement-honesty`: the grading guarantee — which rows may be `measured`, what provenance must record, the reclassification rule for unmeasurable rows, disclosure of unscored weight, and the fingerprint-era rule for measurement-semantics changes.
- `offline-data-snapshots`: the vendored reference datasets — contents, version ids, refresh path, fingerprint participation, and the never-guess fallback when data is absent.

### Modified Capabilities

- `indicator-applicability`: the `measured` state tightens (a fact produced by the named real tool, not an enumerable tree or a constant); the reclassification rule and its coverage accounting are added.
- `scan-phase-2`: requirements that mandate binaries the offline release cannot ship (ARCH-01 `lizard`, ARCH-08 `jscpd`, SEC-01 `trivy`+`osv-scanner`, SEC-02 `gitleaks`, SEC-06 `osv-scanner`) gain explicit offline-availability semantics; requirements already describing real measurement (ARCH-05 churn, TEST-03 classifier, TEST-05 marker grep) are unchanged in intent and become conformance targets.
- `report-envelope`: the sealed report's provenance/evidence field grammar gains truthfulness requirements, and the `sample` flag's contract is defined.

## Impact

- `apps/scanner/src/scan/detectors/*` (32 files calling `makeProvenance`; `makeDetectorProvenance` is dead code), `detectors/common.ts` (`DETECTOR_TOOL_VERSIONS` becomes the producer registry), `scoring/scorer/mvp.ts` (default `score = 2` fallback at `mvp.ts:332`, default reason template at `mvp.ts:333`), `scoring/fingerprint.ts` (`fingerprint_version`), `scoring/seal.ts` (`sample: true` at `seal.ts:215`, `top_blockers` mapping at `seal.ts:53-81`), `packages/contracts` (evidence/provenance types), `apps/scanner/src/scan/local.ts` (which detectors measure vs demote).
- Data: a new vendored snapshot directory + refresh script (size budget decided with `release-packaging`).
- Tests: provenance-registry test (no row cites a tool outside the manifest), measure-or-unknown golden fixtures, before/after coverage + headline on the dogfood corpus.
- Docs: `docs/specs/` §4 drift corrections — the demo readings in several specs assume measured facts; the reconciliation commit reconciles these back to the encyclopedias.
- Out of scope (adjacent changes): the offline-by-default posture flip (`offline-default`); .NET/VB.NET/VB6/Delphi ingestion (`legacy-stacks`); the public methodology narrative, funnel pages, and the weights sign-off itself (this change produces the honest output that sign-off must happen against); packaging and licence.
