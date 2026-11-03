## 1. Contract

- [x] 1.1 Add `IdentityStatus`, `IdentityItem`, `IdentitySize`, `IdentityLanguage`, `ReportIdentity` to `packages/contracts/src/index.ts` and declare `Report.identity?: ReportIdentity` — verified by `npm run lint` typechecking the workspace with no consumer edits
- [x] 1.2 Add the identity formatting helpers to `packages/contracts/src/index.ts` (`identityValueLabel(item)` returning the `~`-marked, two-significant-figure display string, and `identityStatusLabel(item)`), following the `gateCapStatement` precedent — verified by contract unit tests covering `measured` (no marker, rounded), `estimated` (marker, rounded), and `unknown` (reason form)
- [x] 1.3 Add contract type assertions for the new block to `packages/contracts/src/type-assertions.ts` — verified by `npm test -w packages/contracts`
- [x] 1.4 Add a contract test asserting the exclusion rule: the declared identity field names contain none of `transitive`, `direct_deps`, `test_files`, `test_count`, `comment_ratio`, `loc_p95`, `max_file_loc` — verified by the new test passing and failing when a forbidden name is added

## 2. Shared identity derivation

- [x] 2.1 Define the `source-v1` scope rule as a single exported constant (inclusion extensions plus lockfile/generated/vendor exclusions) with the scope identifier string, and document the rule in the `report-identity` capability spec reference — verified by a unit test enumerating accepted and rejected sample paths
- [x] 2.2 Implement tree-shape derivation over one `walkSortedTree` result: file count, directory count, per-extension histogram, language shares with a primary language, and ecosystems/frameworks (presence-only from `ctx.manifests`) — verified by unit tests on a fixture tree asserting shares sum to the whole and that no framework entry carries a version or `support_status`
- [x] 2.3 Implement the line-magnitude ladder: read-all path, fixed-`k` stride-sample path with extension-weight extrapolation, and the `unknown` path with reason; emit `status`, `method`, `covered`, `scope` — verified by unit tests for the `files_in_scope <= k` → `measured`, `> k` → `estimated`, zero in-scope → `unknown` cases
- [x] 2.4 Extract the archetype and plane values into the identity block from the already-computed `_archMeta` and the stack census from `cachedStackCensus`, without a second classification pass — verified by a test asserting the block's archetype equals `report.snapshot.archetype` for the same scan
- [x] 2.5 Assert determinism: one unit test that derives identity twice over the same tree and compares deep equality, and one that derives over a shuffled-creation-order tree and compares against the sorted one — verified by both tests passing

## 3. Scan lanes and budget

- [x] 3.1 Add the reserved identity read allocation as a named constant in `apps/scanner/src/scan/budget.ts`, applied before the detector partition, on the `withCloneBase` precedent — verified by a budget test asserting detector byte partitions are identical with and without the identity allocation
- [x] 3.2 Wire the identity pass into `runUnifiedScan` (`orchestrator.ts`) on the remote ladder, with its own reader bound to the reserved allocation — verified by an integration test that a remote-shaped scan seals an identity block and that an identity read cap yields `unknown` with a reason instead of an error
- [x] 3.3 Wire the identity pass into `runLocalScan` (`local.ts`) on the read-all path — verified by a local scan of a fixture directory producing `measured` size values
- [x] 3.4 Confirm the identity pass never fails the run: any throw degrades to statuses of `unknown` with reasons — verified by a test injecting a read failure and asserting the run still seals

## 4. Sealing and fingerprint

- [x] 4.1 Seal the block into the report in `apps/scanner/src/scan/scoring/seal.ts` as `report.identity`, absent when the pass did not run — verified by a seal test asserting presence for a scanned target and absence when the pass is skipped
- [x] 4.2 Prove fingerprint exclusion: same content, one envelope with a measured magnitude and one with an estimated magnitude, identical `score_fingerprint` — verified by the new fingerprint test and by the existing `deterministic-scoring` suite staying green
- [x] 4.3 Prove the block is inert: sealing with and without identity leaves headline, tier, coverage, gates, category scores, and `next_band_path` byte-identical — verified by a seal snapshot comparison test

## 5. Site

- [x] 5.1 Build the identity card component reading `report.identity` and the contracts formatting helpers, rendering subject, shape, size, and stack with no `node:fs` and no `apps/scanner` import — verified by `npm run check:site-boundary` and a component test
- [x] 5.2 Place the card above the hero in `report-view.tsx` and demote the existing schema/rubric/engine/run/duration/ran grid to a collapsed provenance band below the evidence sections, keeping the raw-JSON and rerun affordances — verified by a render test asserting DOM order (card before headline, provenance after the full table) and that no provenance value precedes the headline
- [x] 5.3 Move the commit identity into the card with the linked `commit <short7>` and plain `commit unknown` forms; retain the archetype chip and its override affordance — verified by component tests for both commit forms and for chip presence
- [x] 5.4 Fold the archetype chip's read-only information into the card without adding a second source: card and chip read the same sealed value — verified by a test asserting the two render the same archetype string for one report
- [x] 5.5 Render the sample marker as the card's first line when `report.sample` is set — verified by a test on the committed fixture
- [x] 5.6 Render the absent-block case: no card, no error, report otherwise unchanged — verified by rendering a pre-change envelope fixture
- [x] 5.7 Render the suppression case: with an `insufficient-signal` headline the card still renders in full — verified by a test on a suppressed envelope
- [x] 5.8 Mirror the same placement on `/live` in `LiveReportClient.tsx` — verified by the live render test asserting card above the revealed headline

## 6. CLI and release artifacts

- [x] 6.1 Add the identity line above the verdict in `apps/scanner/src/scan/render.ts`, using the contracts helpers so the markdown and the site cannot diverge — verified by a CLI render test comparing the value strings against the contract helper output
- [x] 6.2 Include the identity line in the CLI markdown output path and the HTML output path — verified by a snapshot test over the sealed fixture
- [x] 6.3 Rebuild the shipped bundle and confirm freshness — verified by `npm run build:cli` followed by `npm run check:dist` passing

## 7. Fixtures and verification

- [x] 7.1 Regenerate the committed report fixture and `apps/site/lib/sample.ts` so one card demonstrates `measured`, `estimated`, and `unknown` — verified by the fixture typechecking against the contract and the sample page rendering all three forms
- [x] 7.2 Confirm no rubric artifact moved: `npm run check:rubric-consistency` and `npm run check:schemas` pass with no regeneration diff — verified by both commands exiting clean
- [x] 7.3 Run the full boundary and build gates from the root: `npm run lint`, `npm test`, `npm run check:site-boundary`, `npm run check:detector-isolation`, `npm run check:dist`, `npm run check:documentation-structure` — verified by all exiting clean
- [x] 7.4 End-to-end sanity: scan a real repository and a local directory, and confirm the two reports state identity with the expected statuses and the same fingerprint when the content is identical — verified by inspecting both sealed envelopes
