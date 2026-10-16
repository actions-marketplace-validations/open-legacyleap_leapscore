## 1. Deterministic bounding

- [x] 1.1 Sort all file-tree enumeration at the seam (`ecosystem`, `archetype`, `docs01`, `sec09`, `perf02` walks) and verify existing detector tests still pass unchanged
- [x] 1.2 Walk the target tree once per scan in canonical sorted order, derive `fileCount` to `computeSampleN`, and thread `sampleN` through every slow detector's lease before fan-out; verify `lease().sampleN` is set on a fixture exceeding the shard threshold
- [x] 1.3 Partition byte budgets per detector instead of the shared running counter and verify two detectors can no longer exhaust each other's budget in a contention test
- [x] 1.4 Spike: measure scan wall-times on a real .NET/Java corpus to set the killer-timeout constant; record the value and corpus in the change notes

## 2. Fingerprint and envelope split

- [x] 2.1 Introduce per-detector tool versions (bumped on detector change) replacing the hardcoded `phase2: 1.0`, and verify versions appear in provenance output
- [x] 2.2 Add `score_fingerprint` (SHA-256, `fingerprint_version: 1`) over sorted facts with timings normalized out plus rubric/engine/detector/snapshot versions and semantic flags; verify identical fixture scanned twice yields identical fingerprints with differing `runId`s
- [x] 2.3 Resolve `engineSha7` from release metadata / `--engine-ref` instead of the consumer's working tree and verify two checkouts of the same release produce the same engine identity
- [x] 2.4 Extend the repeat-run CLI test from headline-equality to fingerprint-equality and verify it passes

## 3. Unknown policy and gating

- [x] 3.1 Implement frozen-denominator headline with `unknown` rows disclosed as unscored, keep the renormalized computation as reference, and give `canonical_score` its defined consumer; verify fixture before/after scores are explainable per-run
- [x] 3.2 Suppress the headline with an `insufficient-signal` verdict when measured rows fall below the coverage floor (default: half of requested), keeping reference scores in JSON; verify a thin-signal fixture suppresses instead of printing a number
- [x] 3.3 Report gates with unevaluable sources as unevaluable in the verdict line (never silently uncapped), and verify an offline run with `unknown` gate inputs shows the unevaluable state
- [x] 3.4 Point `--fail-under` at the frozen headline and verify the threshold-trip test seals at the gated score with exit 3

## 4. Killer timeout and rollout

- [x] 4.1 Demote the wall-clock budget to a run-failure killer (exit 1, `budget-exceeded`, no headline) and verify a forced killer trip writes no report and exits 1
- [x] 4.2 Add the `--score-policy frozen|legacy` escape hatch for one release and verify both policies seal on the fixture corpus
- [x] 4.3 Run the full scanner suite plus the dogfood workflow and verify green before requesting review
