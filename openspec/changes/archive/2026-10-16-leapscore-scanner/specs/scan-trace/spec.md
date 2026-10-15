## MODIFIED Requirements

### Requirement: Trace event stream
The system SHALL stream trace events live during the scan via the scan API's NDJSON channel as an additive `trace` frame (`type:"trace"`), in addition to the existing `meta` / `progress` / `report` / `refused` frames. The channel SHALL be served by the scanner service and consumed cross-origin by the website; no website route SHALL relay or re-stream it. Each trace event SHALL carry `ts` and `elapsedMs` (ms since scan start), `label` (human-readable one-liner), `phase` (one of `ingest`, `gh`, `clone`, `sniff`, `detector`, `scoring`, `budget`, `seal`), and when applicable `detectorId`, `durationMs`, `status` (`measured` | `estimated` | `unknown` | `error`), and `errorKind` (`cap`|`crash`|`rate-limit`). The stream SHALL be backward compatible — older clients that ignore `type:"trace"` still see correct `meta`/`progress`/`report` behavior.

#### Scenario: GH detector trace appears live
- **WHEN** the unified scan finishes GH detector `VEL-06`
- **THEN** a `trace` frame is enqueued within 100ms with `phase:"detector"`, `detectorId:"VEL-06"`, `durationMs` present, and a label like `VEL-06 — 42ms · measured`, visible in the live timeline without waiting for seal

#### Scenario: Clone seam traced
- **WHEN** shallow clone starts and completes for a clone-dependent scan
- **THEN** trace frames are emitted for `phase:"clone"` start and completion, the completion label including wall time, byte size (or cap note), and commit short SHA, e.g. `Clone — 1.3s · 1.8 MB · a1b2c3d`

#### Scenario: Old client ignores trace frames
- **WHEN** a client only handles `meta`/`progress`/`report`
- **THEN** unknown `trace` frames are skipped and the scan still seals with a correct report

#### Scenario: Trace survives the origin boundary
- **WHEN** a browser on the website's origin consumes the scan API served from the scanner's origin
- **THEN** trace frames arrive in emission order with `elapsedMs` intact, and the live timeline renders them identically to a same-process consumer

### Requirement: Persistence and ordering
The persisted envelope in the scanner's store SHALL include `trace: TraceEntry[]` ordered strictly by ascending `elapsedMs` (stable for equal `elapsedMs`). `trace` SHALL be written atomically with `meta` and `report` in the same write. A missing or malformed `trace` on read SHALL be treated as `[]` and SHALL not fail the report detail render or the run-history list.

#### Scenario: Ordering guarantee
- **WHEN** trace frames were emitted as ingest (200ms), VEL-06 finish (900ms), clone start (1200ms)
- **THEN** the persisted array order is exactly that chronological order and re-renders in that order

#### Scenario: Backward compat on read
- **WHEN** a pre-change envelope without `trace` is ingested into the website's build inputs
- **THEN** the detail page renders the report normally and shows an empty scan log rather than failing

#### Scenario: Trace reaches the website only through ingest
- **WHEN** the website renders a stored run's scan log
- **THEN** the trace came from the ingested envelope, and the website performed no scan and contacted no engine
