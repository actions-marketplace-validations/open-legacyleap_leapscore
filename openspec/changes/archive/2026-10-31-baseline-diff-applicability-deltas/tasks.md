## 1. Contract

- [x] 1.1 Add the delta document type to `packages/contracts/src/index.ts` (two run references, verdict with blocking cause, headline decomposition, per-row differences with kinds, transition list) and verify `npm run lint` typechecks the contract package
- [x] 1.2 Define the delta kind and transition enums as closed unions and verify an unknown kind fails typechecking rather than being accepted as a string
- [x] 1.3 Confirm the delta type is not assignable to the envelope type and verify a compile-time assertion that a delta document cannot be passed where an envelope is expected

## 2. Comparability inputs

- [x] 2.1 Record the requested indicator set, score policy, fingerprint scheme version, and rubric version in `EnvelopeMeta` and verify a sealed envelope carries all four
- [x] 2.2 Verify `meta` remains sufficient for the run-history list by rendering the list without opening any report body
- [x] 2.3 Verify the new fields do not alter `score_fingerprint` by scanning one fixture twice and asserting identical fingerprints before and after the fields exist
- [x] 2.4 Implement requested-set reconstruction from full-table statuses (requested = not `not_implemented`) and verify it reproduces the recorded set exactly on a freshly sealed envelope
- [x] 2.5 Verify an envelope written before the fields existed either reconstructs its requested set or is reported as `missing-comparability-inputs`, with absence distinguishable from an empty set

## 3. Comparability verdict

- [x] 3.1 Implement subject matching and verify a cross-repo pair yields `incomparable` with cause `subject-mismatch` and no score deltas
- [x] 3.2 Implement era and rubric-version checks and verify each yields its own named blocking cause
- [x] 3.3 Implement per-row producer-version comparison and verify a single bumped detector yields `comparable-with-row-exclusions` affecting only that producer's rows
- [x] 3.4 Verify an engine-only difference does not by itself make two runs incomparable, per design D1
- [x] 3.5 Verify a requested-set difference yields `comparable-with-coverage-change` and still compares rows graded in both
- [x] 3.6 Verify identical fingerprints yield `comparable`, and that every verdict names which inputs matched and which differed

## 4. Difference computation and attribution

- [x] 4.1 Compute per-row differences over the intersection of rows graded in both runs and verify no row graded in only one run contributes a score delta
- [x] 4.2 Implement the transition vocabulary (became graded, ungraded, applicable, not applicable, implemented) and verify each is emitted instead of a score delta for its case
- [x] 4.3 Verify an applicability transition carries the row's recorded reason from `reason` / `evidencePointers`
- [x] 4.4 Implement kind classification and verify `model-change` takes precedence over `scored-change` when the producing tool version differs and the score also moved
- [x] 4.5 Verify a row moving `unknown` to `measured` with an available producer in both runs classifies as `coverage-change`, not as a code change
- [x] 4.6 Implement headline decomposition into code-attributable, coverage-attributable, model-attributable, and unattributable parts and verify the parts sum to the headline movement within rounding
- [x] 4.7 Verify a coverage-driven rise reports a zero code-attributable part with an explicit statement that no code change was measured
- [x] 4.8 Verify any rounding residual is reported as unattributable rather than folded into a named part

## 5. CLI surface

- [x] 5.1 Accept `--baseline <report.json>` and verify an unreadable, missing, or non-envelope file exits `2` before any work with no report written
- [x] 5.2 Write the delta document alongside the sealed reports and verify the output directory contains three sealed files plus the delta
- [x] 5.3 Verify the three sealed files are byte-identical with and without a baseline, including an unchanged fingerprint
- [x] 5.4 Emit the delta summary as a second stdout line after the sealed-run line and verify the sealed-run line, including the tracked URL as its final token appearing exactly once, is unchanged
- [x] 5.5 Implement the ratchet gate and verify exit `3` on a code-attributable regression beyond tolerance, exit `0` within tolerance, and no trip on coverage- or model-attributable movement
- [x] 5.6 Verify an `incomparable` verdict with a ratchet requested exits in the usage-or-refused family naming the cause, and never reports a pass
- [x] 5.7 Verify a readable-but-incomparable baseline still writes all four artifacts and records the blocking cause

## 6. Workflow and Action surface

- [x] 6.1 Add baseline and ratchet inputs to `action/action.yml` with empty defaults and verify a workflow supplying neither behaves exactly as before
- [x] 6.2 Verify a workflow that restores a previous run's uploaded report as the baseline evaluates the ratchet and fails on a code-attributable regression
- [x] 6.3 Verify a coverage-only movement does not fail the step
- [x] 6.4 Verify report artifacts are uploaded in every outcome, including a tripped ratchet and an incomparable refusal
- [x] 6.5 Verify the job summary names the blocking cause on refusal

## 7. Ingest safety

- [x] 7.1 Verify the site's ingest step skips a delta document as a non-envelope with a recorded warning and creates no run row from it
- [x] 7.2 Verify a report directory containing both an envelope and a delta document ingests the envelope and skips only the delta
- [x] 7.3 Verify existing ingest behavior for unknown-version envelopes is unchanged

## 8. Integration verification

- [x] 8.1 Verify end to end that a baselined scan of a fixture against an earlier scan of the same fixture reports a `comparable` verdict with a decomposition summing to the headline movement
- [x] 8.2 Verify the coverage-growth case end to end: a later run with a larger requested set reports `comparable-with-coverage-change`, attributes the movement to coverage, and does not trip the ratchet
- [x] 8.3 Verify a simulated era bump refuses both the comparison and the ratchet, with no numbers printed
- [x] 8.4 Verify a simulated detector version bump excludes only the affected rows from code attribution
- [x] 8.5 Run `npm run check:rubric-consistency`, `npm run check:detector-isolation`, and the existing scanner and site test suites and verify all pass with no sealed artifact changed
- [x] 8.6 Verify no funnel or envelope regression: the positioned line still closes every human-readable surface, the tracked URL appears exactly once per artifact, and every existing envelope remains readable
