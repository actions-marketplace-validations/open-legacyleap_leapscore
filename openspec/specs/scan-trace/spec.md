## Purpose

Exhaustive live tracing that makes every engine seam observable while a scan runs and persists the full trace with the report for later inspection without re-running.

## Requirements

### Requirement: Trace event stream
The system SHALL stream trace events live during the scan via the existing `GET /api/scan?repo=` NDJSON channel as an additive `trace` frame (`type:"trace"`), in addition to the existing `meta` / `progress` / `report` frames. Each trace event SHALL carry `ts` and `elapsedMs` (ms since scan start), `label` (human-readable one-liner), `phase` (one of `ingest`, `gh`, `clone`, `sniff`, `detector`, `scoring`, `budget`, `seal`), and when applicable `detectorId`, `durationMs`, `status` (`measured` | `estimated` | `unknown` | `error`), and `errorKind` (`cap`|`crash`|`rate-limit`). The stream SHALL be backward compatible — older clients that ignore `type:"trace"` still see correct `meta`/`progress`/`report` behavior.

#### Scenario: GH detector trace appears live
- **WHEN** the unified scan finishes GH detector `VEL-06`
- **THEN** a `trace` frame is enqueued within 100ms with `phase:"detector"`, `detectorId:"VEL-06"`, `durationMs` present, and a label like `VEL-06 — 42ms · measured`, visible in the live timeline without waiting for seal

#### Scenario: Clone seam traced
- **WHEN** shallow clone starts and completes for a clone-dependent scan
- **THEN** trace frames are emitted for `phase:"clone"` start and completion, the completion label including wall time, byte size (or cap note), and commit short SHA, e.g. `Clone — 1.3s · 1.8 MB · a1b2c3d`

#### Scenario: Old client ignores trace frames
- **WHEN** a client only handles `meta`/`progress`/`report`
- **THEN** unknown `trace` frames are skipped and the scan still seals with a correct report

### Requirement: Exhaustive coverage

The trace SHALL be exhaustive across all traceable seams for the requested indicator set. At minimum the trace SHALL cover: (a) ingest/normalize + snapshot refusal path if applicable, (b) every requested GH detector start/finish with duration and outcome, (c) budget construction (`budgetMs` + breakdown) and any budget abort, (d) clone start/completion/failure + sniff/ecosystem manifest count when clone is requested, (e) every requested clone detector start/finish with outcome, (f) scoring and gate evaluation, (g) seal status with measured/unknown counts. No seam SHALL be omitted because it succeeded fast — fast successes are still traced. The trace SHALL be retained verbatim (no sampling or cap) up to the full requested indicator count plus seams; unbounded growth beyond ~200 entries SHALL be truncated oldest-first with a single `… N earlier entries truncated` sentinel, never dropping the seal entry.

#### Scenario: Full indicator set traced end-to-end
- **WHEN** a scan requests 31 indicators (GH + clone)
- **THEN** the persisted trace contains at least one entry per detector (31) plus seams (ingest, budget, clone, sniff, scoring, seal) — ≥37 entries — with each detector entry carrying `status` reflecting its row status

#### Scenario: Failed detector still traced
- **WHEN** `SEC-07` times out with `cap`
- **THEN** its trace entry carries `status:"unknown"` and `errorKind:"cap"` and the timeline shows the failure inline rather than silently omitting it

### Requirement: Live timeline rendering with primary/secondary

The live page (`/live?repo=`) SHALL render trace frames live as an append-only timeline below the top progress bar. The timeline SHALL show milestone-phase rows (`phase` in `ingest|gh|clone|sniff|scoring|budget|seal`) as the primary list by default, and per-detector rows (`phase:"detector"`) SHALL be grouped behind an expandable secondary affordance (e.g. `Show detector trace (31)`) that toggles to reveal all detector rows without hiding milestones. The timeline SHALL remain visible while scanning and SHALL collapse to the same component in a collapsed state after Reveal (accessible via the sealed report's "Scan log" affordance). The retained trace SHALL be persisted verbatim as the file's `trace` array and re-rendered on `/reports/[runId]`.

#### Scenario: Milestones primary live
- **WHEN** a scan is mid-flight and 3 milestones + 5 detector finishes have streamed
- **THEN** the timeline shows the 3 milestones by default, with an affordance `Show detector trace (5)` that on click reveals the 5 detector rows inline; milestones stay visible both before and after expand

#### Scenario: Persisted trace reopens
- **WHEN** the user navigates to `/reports/<runId>` for a prior scan
- **THEN** the page renders the stored `trace` array with the same primary/secondary grouping as live, without invoking the engine

### Requirement: Persistence and ordering
The persisted envelope at `apps/site/reports/<runId>.json` SHALL include `trace: TraceEntry[]` ordered strictly by ascending `elapsedMs` (stable for equal `elapsedMs`). `trace` SHALL be written atomically with `meta` and `report` in the same file write as today; a missing or malformed `trace` on read SHALL be treated as `[]` and SHALL not fail the detail page render or the list page.

#### Scenario: Ordering guarantee
- **WHEN** trace frames were emitted as ingest (200ms), VEL-06 finish (900ms), clone start (1200ms)
- **THEN** the persisted array order is exactly that chronological order and re-renders in that order

#### Scenario: Backward compat on read
- **WHEN** a pre-change envelope without `trace` is loaded on `/reports/<runId>`
- **THEN** the detail page renders the report normally and shows an empty scan log rather than a 500
