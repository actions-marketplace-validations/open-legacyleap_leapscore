## 1. Truthful provenance (additive, no score change)

- [x] 1.1 Replace the hardcoded `tool: 'gh-api'` in `makeProvenance()` with the real producer name (adopt or delete the dead `makeDetectorProvenance()`), and verify a local `scan packages/contracts` produces zero rows with `evidence.tool === 'gh-api'`
- [x] 1.2 Extend the evidence shape to `{tool, tool_version, pointers[], facts}` with `tool` drawn from the runnable-producer registry in `detectors/common.ts`, rename names that imply unrun binaries (`lockfile+rg` → `lockfile-parse`), and verify the registry is the single source for tool names and versions
- [x] 1.3 Populate `report.provenance.tool_manifest` with the producers that actually ran, and verify every row's evidence producer appears in it and the manifest is non-empty for a measured scan
- [x] 1.4 Add the provenance-registry test (fails when any sealed row cites a producer outside the runnable set), and verify it fails on a deliberately fabricated row and passes on a real fixture scan
- [x] 1.5 Point file-derived evidence pointers at enumerated target paths and document the non-file basis for git-derived facts, and verify a row's pointer names the file its fact came from

## 2. Cheap measurements (measure)

- [x] 2.1 Implement ARCH-05 churn from `git log --name-only` + bugfix regex (`churn_top10_share`, `hotspots`), and verify against a golden fixture with a known history
- [x] 2.2 Implement the TEST-03 test-file classifier emitting `estimated` (never `measured`) and TEST-05 marker grep + blame age, and verify the pyramid fixture scores per the ARCH/TEST predicate
- [x] 2.3 Implement lockfile/manifest parsing for ECOS-02 pin-drift, ECOS-06 dependency counts, and ECOS-07 lockfile integrity across the ecosystems the sniffer detects, and verify an unsupported ecosystem yields `unknown` rather than a partial guess
- [x] 2.4 Implement ECOS-05 direct-dependency license facts and ECOS-08 framework/support facts from manifest + snapshot, and verify transitive-license absence yields `unknown`
- [x] 2.5 Replace or omit the residual literal magnitudes (`newest_adr_days`, `newest_days`, `last_verified_days`, `destructive_ops`) with real reads, and verify a scan of a fixture with known dates produces the real values

## 3. Vendored offline data

- [x] 3.1 Build the runtime/framework end-of-life snapshot with a version id and a documented refresh script, and verify ECOS-01/ECOS-08 resolve from it with no socket opened
- [x] 3.2 Build the pinned advisory subset for the parsed ecosystems with a version id and refresh script, and verify SEC-01 measures a known-affected locked dependency offline, naming the advisory id
- [x] 3.3 Record snapshot version ids in provenance and join them to the fingerprint, and verify a dataset refresh changes the fingerprint while identical data does not
- [x] 3.4 Implement the absent-data fallback (`unknown` + refresh/re-run hint, never a default), and verify an unknown runtime and an uncovered package both yield `unknown` in a strict run

## 4. Demotion, SEC-02 scanner, era, coverage

- [x] 4.1 Ship the built-in documented secret rule set for SEC-02 over the tree (and git history where available), with `gitleaks`/`trufflehog` widening when present and explicit history-unscanned disclosure, and verify G1 is evaluable on an offline scan
- [x] 4.2 Demote ARCH-01, ARCH-08, and SEC-06 to `unknown` with "what it takes", remove the `: 2` fallback in `scoreMvp`, and verify no row is `measured` from a constant
- [x] 4.3 Ensure GH-only rows in local scans are `unknown`/`not_implemented`, never graded from a constant, and verify a local scan's six GH-only rows carry no score
- [x] 4.4 Bump `fingerprint_version` for the measurement-semantics change, and verify pre/post fingerprints differ while repeat-run fingerprint equality still holds
- [x] 4.5 Implement the coverage rule that counts `estimated` toward the coverage floor, and verify on the dogfood corpus that the headline state matches the rule (number vs `insufficient-signal`)

## 5. Report, fixtures, and rollout

- [x] 5.1 Remove the hardcoded `sample: true` and its literal contract type, and verify a real scan reports not-sample while the authored site fixture is still marked
- [x] 5.2 Regenerate the site fixture reports and rubric-derived artifacts and verify `npm run check:rubric-consistency` passes
- [x] 5.3 Run the full scanner suite plus the dogfood workflow green, and record before/after coverage and headline per demoted row in the change notes
- [x] 5.4 Produce the before/after honesty numbers as a notes section the weights sign-off can be held against, and verify the notes name every demoted row with its "what it takes"
