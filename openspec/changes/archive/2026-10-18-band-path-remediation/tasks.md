## 1. Contract

- [x] 1.1 Add the next-band path type to `packages/contracts/src/index.ts` (destination band, threshold, `points_needed`, steps with row id/name/recoverable pp/effort/quick-win text, per-class cumulative totals with arrival state, unreached-row count, terminal marker) and verify `npm run lint` typechecks the contract package
- [x] 1.2 Add the optional path field to the `Report` interface and verify an existing sealed report fixture still satisfies the type without the field present
- [x] 1.3 Confirm no contract version bump is required per design D2 and verify `assertContractVersion` accepts an envelope carrying the new field unchanged

## 2. Derivation at seal time

- [x] 2.1 Implement path derivation as a pure function over sealed rows plus the compiled registry, and verify a unit test reproduces the spec's High-seal case (score 48, destination Moderate, `points_needed` 5)
- [x] 2.2 Enforce step candidacy (`measured`/`estimated`, score 0–2) and verify a fixture with unknown and not-applicable rows yields steps only from graded rows
- [x] 2.3 Classify steps into sprint/quarter/structural from the verify-effort tag and verify each class's cumulative total and arrival state against a fixture where sprint alone falls short and sprint-plus-quarter crosses
- [x] 2.4 Emit the terminal marker at the highest band and verify no destination or steps are produced
- [x] 2.5 Suppress the path entirely for an `insufficient-signal` headline and verify the field is absent rather than empty
- [x] 2.6 Wire the derivation into the seal path (`apps/scanner/src/scan/scoring/seal.ts`) and verify a local scan's `report.json` carries the field
- [x] 2.7 Verify the field is excluded from `score_fingerprint` by scanning one fixture twice with the path enabled and disabled and asserting identical fingerprints

## 3. Rendering

- [x] 3.1 Render the path block on the site report views and verify against a persisted run that destination, distance, per-class steps, cumulative arrival, and unreached count all appear
- [x] 3.2 Render the path block in the CLI `report.html` emitter and verify the block precedes the per-deduction detail section
- [x] 3.3 Render the path block in the CLI `report.md` emitter and verify the document still closes with the methodology link, band CTA, and positioning line in that order
- [x] 3.4 Add the compact stdout clause between the status fields and the band sentence, with the tracked URL still the final token appearing exactly once, and verify on a local scan whose report carries a path
- [x] 3.5 Render the no-reachable-path and terminal-band states as explicit statements and verify neither renders an empty block
- [x] 3.6 Derive the sample fixture's path from its own rows and verify the sample still seals with `sample: true` and renders a path consistent with its rows

## 4. Band-native gate

- [x] 4.1 Parse `--fail-under-band` accepting only the public band names and verify an unrecognized name exits `2` before any work with reports unwritten
- [x] 4.2 Refuse a simultaneous numeric and band threshold per design D6 and verify the exit is `2` with a conflict message and no report files
- [x] 4.3 Evaluate the band gate after seal and verify exit `3` below the named band's threshold with all three report files present
- [x] 4.4 Verify exit `0` at or above the named threshold, including the boundary case sealing exactly at 53 for `moderate`
- [x] 4.5 Verify a suppressed headline does not satisfy a band gate, matching the existing numeric-threshold behavior
- [x] 4.6 Append the band gate's pass-or-trip state to the stdout status fields and verify it appears alongside the existing threshold field

## 5. Workflow and Action

- [x] 5.1 Update the thin CLI contract usage text in `apps/scanner/bin/scan.ts` to enumerate the band gate as mutually exclusive with the numeric one and verify `--help` output matches
- [x] 5.2 Add the band-gate input to `action/action.yml` with an empty default and pass it through only when set, and verify a workflow run without the input behaves exactly as before
- [x] 5.3 Verify a workflow run with the band gate set fails the step on a below-band seal while still uploading the report files

## 6. Integration verification

- [x] 6.1 Verify end to end that a single local scan produces a path consistent across `report.json`, `report.html`, `report.md`, and the stdout clause for the same run
- [x] 6.2 Verify the sealed score, tier, gates, coverage, and fingerprint are byte-identical with and without the path field across a fixture scan
- [x] 6.3 Run `npm run check:rubric-consistency` and `npm run check:detector-isolation` and verify both pass with no rubric or generated artifact touched
- [x] 6.4 Verify no funnel grammar regressed: the positioning line closes every human-readable surface, the tracked URL appears exactly once per artifact, and the band vocabulary reads Low/Moderate/High/Critical
