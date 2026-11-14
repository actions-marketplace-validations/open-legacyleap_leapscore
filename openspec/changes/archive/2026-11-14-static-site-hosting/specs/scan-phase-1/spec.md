## REMOVED Requirements

### Requirement: Dedicated live report page

**Reason**: The site is now a static artifact served from GitHub Pages, and it no longer consumes the scanner's scan API. A page that streams NDJSON cross-origin requires a hosted site origin, a browser client, and a reachable scanner; none of those belong to a server-free presentation surface whose only scan paths are the local CLI and CI. The scanner keeps its `/scan` service and its `meta → progress → trace → report | refused` frame contract — this removes the website's consumer, not the producer.

**Migration**: Delete `/live`, its `/report/live` alias, the live client, the scanner client configuration, and the `NEXT_PUBLIC_SCANNER_URL` build input. Visitors who want a real scan run the local CLI, whose install command is the home page's primary call to action. Sealed reports are viewed as committed samples (`sample-reports`) or in the artifact the CLI writes.

### Requirement: Score-this-repo CTA → live scan with progress

**Reason**: The CTA exists only to navigate to the live page. With no live page there is no destination, and a repository input that cannot produce a score is a broken promise on a marketing surface.

**Migration**: Remove the repository input from the home page. The nearest equivalent affordance is a copyable install command, which is already the primary call to action.

### Requirement: Scan timeline events

**Reason**: This requirement describes how a browser client turns `progress` frames into a timeline. There is no browser client. The scanner still emits the same optional `milestone` and `completedIds` fields on `progress` frames, and the sealed `trace` still carries the narrative, so the frame contract is unchanged and remains available to any future consumer.

**Migration**: No producer change. Delete the client-side timeline. The sealed `trace` renders as the scan log on the sample report detail and in the CLI's own artifacts.

## MODIFIED Requirements

### Requirement: Two-phase orchestration (worker/queue)

The system SHALL orchestrate a single unified scan covering all requested indicators under one indicator-driven budget (`cloneBaseMs + Σ per-indicator cost` as above). The scan SHALL be orchestrated inside the scanner service, never in a presentation surface. GH-API and clone-based detectors SHALL share the same budget and abort signal; clone (`--filter=blob:none`) and manifest sniff SHALL run within the same budget when any clone-dependent indicator is requested, otherwise the scan skips clone. Progress SHALL stream via the scanner's scan API NDJSON as unified `progress` frames (pct/elapsed/remaining/completed cost) plus a single header frame with `budgetMs`/`indicatorCount`, without a separate Phase 1 / Phase 2 report. Phases SHALL NOT be surfaced in the API contract; they remain an internal build detail.

#### Scenario: Phase 1 seals before Phase 2
- **WHEN** a unified scan is requested with 19 indicators
- **THEN** the scanner computes one unified `budgetMs` (~240s), runs GH and clone detectors under that deadline, streams unified progress, and produces one terminal report (no intermediate Phase 1 seal)

#### Scenario: Phase 2 budget exceeded degrades
- **WHEN** unified budget expires with `ARCH-01` still running
- **THEN** final report is `degraded` with completed rows `measured` and timed-out rows `unknown "budget-exceeded"` (or `estimated+scope-limited` for dissolvable), and no intermediate report was produced

#### Scenario: Budget computed from requested list
- **WHEN** requested IDs are the 19 MVP indicators (mix of fast/api/slow with clone)
- **THEN** `budgetMs` ≈ 240s and the emitted `progress` frames advance via `elapsed/budgetMs` plus completed-cost weighting, reaching 100% only at seal

#### Scenario: Clone skipped when not needed
- **WHEN** requested IDs are GH-only (e.g. 6 indicators)
- **THEN** clone is omitted, budget uses base `5s` (not `30s`), and the header frame reports the smaller `budgetMs`

#### Scenario: Orchestration is not hosted by the website
- **WHEN** a unified scan is in flight
- **THEN** no website process holds scan state, opens a clone, or performs a GH-API call; the scanner service completes or degrades the scan independently of whether any client is still listening
