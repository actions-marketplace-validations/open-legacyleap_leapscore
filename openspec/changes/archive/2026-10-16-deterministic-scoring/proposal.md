## Why

The open-source release brief requires determinism — "same code, same version, same score" — because an inspectable score that wobbles between runs will not be trusted. Today the wall-clock budget is the scan's control loop: a `setTimeout` aborts detectors mid-run, degraded rows become `unknown`, and the headline renormalizes around whatever finished in time. The score is therefore a function of machine speed, and identical inputs produce different headlines on different machines.

## What Changes

- Demote the wall-clock deadline from control loop to pathological-repo safety net: deterministic bounding (sorted file walk, wired `sampleN`, per-detector byte budgets) becomes the mechanism that keeps large repos tractable; the timeout becomes a generous killer that fails the run loudly instead of degrading it silently.
- Split the sealed artifact into a deterministic scored payload and a per-run envelope: add a `score_fingerprint` (hash over sorted facts, rubric/engine/detector/snapshot versions, and semantic flags) while `runId`, `scanned_at`, durations, and trace timings stay unique per run and out of the fingerprint.
- Resolve engine identity from the released version, not the consumer's working tree (`git rev-parse` in the caller's checkout), so two people running the same release produce the same fingerprint.
- Decide the `unknown`-row policy for the headline (renormalize as today, freeze the denominator, or suppress the headline below a coverage floor), including how gates behave when their source rows are `unknown` under offline runs.
- Define which score `--fail-under` gates on (`score` vs the currently dead `canonical_score`) and which exit code a killer-timeout trip produces.

## Capabilities

### New Capabilities

- `deterministic-scoring`: the fingerprint guarantee itself — same target content plus same scanner version and flags yields the same fingerprint; what is fingerprinted vs excluded; the repeat-run test contract.

### Modified Capabilities

- `scan-phase-2`: the indicator-count-driven budget requirement changes — deterministic bounding replaces the deadline as the scaling mechanism; `sampleN` is wired from file count through the lease; wall-clock abort becomes run failure, not row degradation.
- `report-envelope`: envelope contents change — scored payload vs run envelope field classification; `score_fingerprint` field; engine identity from release version; `canonical_score` given a defined consumer (or removed).
- `workflow-scan`: `--fail-under` gates on a defined score; killer-timeout exit code and reporting behavior.

## Impact

- `apps/scanner/src/scan/local.ts`, `orchestrator.ts` (scan fan-out, abort handling), `budget.ts` (sampleN wiring, killer timeout), `detector.ts` (lease contract), `scoring/seal.ts` + `scoring/scorer/mvp.ts` (fingerprint, unknown policy, canonical score), `bin/scan.ts` (exit codes, gated score), `packages/contracts` (envelope + fingerprint fields).
- Tests: the repeat-run test in `cli-offline-scan.test.ts` upgrades from headline-equality to fingerprint-equality; new tests for sorted-walk stability and killer-timeout failure mode.
- Out of scope (referenced, not solved here): detector measurement honesty (literals), offline-by-default flip, site future, legacy-stack ingestion.
