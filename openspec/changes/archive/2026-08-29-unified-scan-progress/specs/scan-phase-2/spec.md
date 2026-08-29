## MODIFIED Requirements

### Requirement: Worker/queue clone pipeline
The system SHALL, when the requested indicator set includes any clone-dependent detector, clone the repo shallow (`--filter=blob:none`) within the unified budget via a worker/queue job (in-process queue for MVP, swappable to external queue), run manifest sniff per `{root, ecosystem}[]`, and expose the clone via read-only `readFile` to detectors. No repo code SHALL be executed. When no clone-dependent indicator is requested, the clone step SHALL be skipped and budget SHALL omit `cloneBaseMs`. The clone step SHALL NOT be surfaced as a separate "Phase 2" in UI or API.

#### Scenario: Shallow clone succeeds
- **WHEN** a unified scan for `https://github.com/vercel/next.js` with 19 requested indicators enqueues work under the ~240s unified budget
- **THEN** worker clones with `--filter=blob:none`, sniff finds `package-lock.json` at `/`, selects JS adapters, and detectors read via `readFile`, all within the same unified budget that also covers GH-API detectors

#### Scenario: No manifest falls back to agnostic plane
- **WHEN** no `package-lock.json`/`pyproject.toml`/`go.mod` found
- **THEN** ECOS/ARCH language-gated rows emit `unknown` with `unknown_measure_path`; scan still seals once at unified deadline with GH-API + file-presence rows

#### Scenario: Clone skipped when not needed
- **WHEN** requested IDs are GH-only (e.g. 6 VEL/SEC/TEST indicators)
- **THEN** scan omits clone, budget uses `base 5s` (not `cloneBase 30s`), and report seals without clone progress

### Requirement: Indicator-count-driven budget with uniform sharding
The system SHALL compute the wall-clock budget from the **requested indicator list** as a single unified value: `budgetMs = baseMs + Σ per-indicator cost` where `fast=5s`, `api-budgeted=10s`, `slow-dissolvable=40s`, `baseMs = 30s` if any `slow-dissolvable` requested else `5s`, clamped to `[10s, 240s]` for MVP (scales to larger for v1). The special-case mapping `6→10s / 13→240s` SHALL be removed; the generic formula SHALL govern. It SHALL enforce per-detector `timeoutMs`/`byteCap`, compute `budgetLease.sampleN` via uniform file-tree sharding on dissolve, and set `truncated=true` → `estimated+scope-limited` or `unknown` for `api-budgeted` exhaustion. Progress bar pct SHALL be derived from `elapsed/budgetMs` and completed cost, not from per-phase milestones. For the canonical 19 MVP indicators the result remains ~240s.

#### Scenario: Budget scales with list
- **WHEN** requested IDs = 19 MVP (mix of fast/api/slow with clone base)
- **THEN** `budgetMs` ≈ `30 + Σ costs ≈ 240s`; when requested IDs = 3 fast only → `~20s` (`5 + 3*5`)

#### Scenario: Dissolve triggers sampled run
- **WHEN** `jscpd` exceeds its per-detector slice and `sampleN` is set via sharding
- **THEN** detector honors `sampleN` + `abort`, returns `truncated=true`, scorer marks `estimated` + `scope-limited`, and final unified report includes that status

#### Scenario: Budget exceeded seals degraded report
- **WHEN** unified budget expires with `ARCH-01` still running
- **THEN** orchestrator seals once with completed rows `measured` and timed-out rows `unknown "budget-exceeded"`, status `degraded`, and `provenance` records `budgetMs` + `indicatorCount`; no intermediate report was emitted

#### Scenario: Progress reflects unified budget
- **WHEN** scan runs with 19 indicators and budget ~240s
- **THEN** progress bar advances monotonically with `elapsed/budgetMs` and remaining = `budgetMs - elapsed`, reaching 100% at budget expiry regardless of how many clone vs GH detectors remain
