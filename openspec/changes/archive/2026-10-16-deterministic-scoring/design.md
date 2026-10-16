## Context

See proposal.md (Why) for motivation. Current state shaping the approach:

- `apps/scanner/src/scan/budget.ts:14-21` — a `setTimeout` aborts one shared `AbortSignal`; all 25 local detectors race it under `Promise.all` (`local.ts:226-240`). Unfinished work becomes `unknown`/`cap` (`local.ts:253`), and `mvp.ts:383-404` renormalizes weights around whatever measured, so machine speed moves the headline.
- `computeSampleN` (`budget.ts:39-44`) is deterministic but never wired: `createBudgetControllerForIndicators` takes no `sampleN`, so `lease().sampleN` is always `undefined` and the `sampleN` branches in `arch01/arch08/ecos05` are dead.
- `seal.ts:157,165,196,207` bakes wall-clock (`scanned_at`, `id`, trace timings, `durationMs`) and consumer-tree identity (`engineSha7` via `git rev-parse` in the caller's checkout) into `report.json`.
- `canonical_score` is computed (`mvp.ts:440`, `seal.ts:177`) but has no consumer — no flag, renderer, test, or site usage. `--fail-under` gates on renormalized `score` (`bin/scan.ts:407-414`).
- `readdir` calls in `ecosystem.ts:60`, `archetype.ts:42`, `docs01.ts:16`, `sec09.ts:14`, `perf02.ts:14` are unsorted — harmless while detectors count-or-literal, load-bearing the moment anything samples or truncates.
- `detector.ts:16` already anticipates a `nonDeterministic` exemption for AI detectors; `detector.ts:24` carries `sampleN?: number` in the lease type.

## Goals / Non-Goals

**Goals:**

- Same target content + same scanner release + same flags yields the same fingerprint on any machine, testable as fingerprint-equality on repeat runs.
- Large/pathological repos stay tractable through deterministic bounds, with the wall-clock budget demoted to a run-failure killer.
- Every `unknown` row's effect on the headline is a stated policy, including gate behavior when gate inputs are `unknown`.

**Non-Goals:**

- Detector measurement honesty (literal payloads), offline-by-default flip, site future, legacy-stack ingestion — referenced as adjacent changes, not designed here.
- Snapshot freshness policy for vendored EOL/vuln data (belongs to the offline change; this design only requires snapshot versions join the fingerprint).

## Decisions

### D1: Deterministic bounding replaces the deadline as the scaling mechanism

Before detectors fan out, walk the file tree once, sort canonically, derive `fileCount → computeSampleN → lease.sampleN` for all slow detectors, and hand every detector the same sorted walk (no independent unsorted walks). Partition the byte budget per detector instead of one shared running counter (`local.ts:82-91` today lets whichever detector runs first eat the 4MB).

- Alternative (rejected): keep the shared counter but serialize detectors. Fixes the race but keeps throughput hostage to the slowest detector with no bound on large repos.
- Alternative (rejected): keep wall-clock with a fixed seed per run. Still machine-dependent; determinism theater.

### D2: `sampleN` means first-N of the canonical sorted walk

First-500-sorted, not stride sampling. Simpler, reproducible, trivially testable ("same tree → same shard"). Stride is fairer on huge repos but adds a second mechanism to specify and verify.

- `sampleN` exceeding detectors report `truncated: true` with `cap/sampled` detail (as the existing dead branches already do) — deterministic truncation, scored as `unknown` with "what it takes", never silent.

### D3: Fingerprint over the scored payload; envelope stays unique per run

New `score_fingerprint`: hash over sorted facts (with `provenance.durationMs` normalized out — `facts.ts:23` still requires the field, so normalize at hash time, not in the fact), `rubric_version`, `engine_version`, per-detector tool versions, snapshot versions, and semantic flags (`--strict`, indicator set, archetype). Excluded: `runId`, `scanned_at`, `durationMs`, trace timings, `engineSha7`-as-resolved-today.

- `runId` stays unique-per-run (dedup/upload need it). Fingerprint is a separate field, less disruptive than content-derived runIds.
- Prerequisite with teeth: per-detector tool versions must become real — today `local.ts:197` hardcodes `phase2: 1.0` and every detector reports version `1`, so the fingerprint's version component is meaningless until versions are bumped per detector change.

### D4: Engine identity from the release, not the consumer's tree

`engineSha7` resolves from release metadata (build-stamped version + `--engine-ref` override, which the dogfood workflow already passes) instead of `git rev-parse` in the caller's checkout. Same release → same identity → same fingerprint.

### D5: Unknown policy — freeze with floor, renormalized score retained for reference

Recommend (ii)+(iii) hybrid: freeze the denominator (unknowns contribute disclosed "unscored" rather than vanishing), suppress the headline below a coverage floor with an explicit "insufficient signal" verdict instead of a number, and keep the renormalized computation as a reference field alongside the now-defined `canonical_score`. Rationale: pure renormalization (today) lets offline mode systematically look safer; pure freezing without a floor prints confident numbers over thin signal.

- Gate corollary (decided here, not deferred): gates whose source rows are all `unknown`/`not_implemented`/`not_applicable` already degrade per `mvp.ts:424-439` — extend the rule so a gate that *would have* capped the tier on missing data is reported as unevaluable in the verdict line, never silently uncapped.

### D6: `--fail-under` gates on the frozen headline; killer timeout is exit 1

`--fail-under` compares against the frozen headline (the number printed and banded), with the reference scores available in JSON for policy authors. The demoted wall-clock killer (generous, e.g. order-of-magnitude above the largest measured real estate — spike required) exits 1 with `budget-exceeded` as run failure: no partial report, no `unknown`-and-continue. `exit 3` remains purely the threshold trip.

## Risks / Trade-offs

- [Risk] Frozen denominator + honest unknowns lowers or suppresses scores on estates where today's renormalization flatters → Mitigation: ship the reference scores in JSON from day one so the change is explainable per-run, not a mystery drop.
- [Risk] Killer-timeout value picked blind breaks CI on the largest real legacy estate → Mitigation: measurement spike on a real .NET/Java corpus before fixing the number; dogfood workflow is the canary.
- [Risk] Per-detector versioning is new process (every detector edit must bump) → Mitigation: versions join the fingerprint only after the bump discipline lands; until then fingerprint covers rubric+engine+flags and documents the gap.
- [Risk] Sorted single walk changes archetype/ecosystem results subtly (order-dependent first-match today) → Mitigation: pin current outputs on fixtures before the change; any diff must be explainable as ordering, not logic.
- [Risk] `score_fingerprint` hash input drifts as fields are added → Mitigation: version the fingerprint scheme itself (`fingerprint_version: 1`) so verifiers can distinguish eras.

## Migration Plan

1. Land bounding + fingerprint additively: new fields, new tests, no behavior change to headline or exits.
2. Flip `unknown` policy and `--fail-under` target behind the fingerprint evidence (before/after on fixtures + dogfood corpus).
3. Demote the killer timeout last, after the spike sets the value.
4. Rollback at each step is additive: fingerprint/envelope additions are additive; the policy flip is the only flag-worthy cutover (recommend a `--score-policy frozen|legacy` escape hatch for one release).

## Open Questions

- Killer timeout value (needs the corpus spike; does not change specs, design, or task breakdown — only a constant).
- Coverage floor percentage for headline suppression (same: a constant, default proposed in specs deltas).
- Fingerprint hash algorithm (SHA-256 default; any stable hash works — recorded in `fingerprint_version`).
