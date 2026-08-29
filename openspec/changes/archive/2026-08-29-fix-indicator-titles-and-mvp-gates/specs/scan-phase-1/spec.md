## MODIFIED Requirements

### Requirement: Gate handling in Phase 1

The system SHALL surface gates G1/G2/G3/G8 as `needs-verification` when a scan has only GH-API facts (no clone-based detector evidence), unless clone facts for the requested MVP set are present in the same unified scan — in which case the gates SHALL be evaluated via the Phase-2 predicates within that scan. No gate SHALL cap the headline at High Risk until it is `proven`; `needs-verification` is informational only. In the unified scan model (see Two-phase orchestration), there is no separate Phase-1 seal: a single terminal report is rendered once at `budgetMs` expiry or all-detectors-complete.

#### Scenario: No secrets scan yet
- **WHEN** Phase 1 has no tree/history scan
- **THEN** G1 status is `needs-verification` with requirement `needs live secrets scan`

#### Scenario: GH-only scan keeps needs-verification
- **WHEN** a scan requests only GH-API indicators (e.g. VEL-06/09/08/10, SEC-07, TEST-08) and completes without cloning
- **THEN** gates G1 (SEC-02), G2 (SEC-01), G3 (ECOS-01), G8 (ECOS-05) each report `needs-verification` with notes `needs live secrets scan` / `needs SCA+reachability` / `needs endoflife lookup` / `needs SBOM` respectively, and headline is not capped

#### Scenario: Unified scan promotes gates when clone facts present
- **WHEN** a unified scan requests the 19 MVP indicators and clone detectors emit SEC-02/ECOS-01/ECOS-05/SEC-01 facts before `budgetMs` expiry
- **THEN** G1/G3/G8/G2 are evaluated via their Phase-2 predicates in that same scan (see `scan-phase-2` gate predicates) and may become `proven` or `not-proven`, and a `proven` gate caps the verdict per `00_EXECUTIVE_RUBRIC.md Part 0`

#### Scenario: No intermediate Phase-1 seal in unified scan
- **WHEN** GH-API detectors finish early in a 19-indicator unified scan
- **THEN** the system does not render a `6/102` intermediate dial or a separate Phase-1 report; progress continues on the single unified bar until the single terminal report replaces it

### Requirement: Two-phase orchestration (worker/queue)

The system SHALL orchestrate a single unified scan covering all requested indicators under one indicator-driven budget (`cloneBaseMs + Σ per-indicator cost` as above). GH-API and clone-based detectors SHALL share the same budget and abort signal; clone (`--filter=blob:none`) and manifest sniff SHALL run within the same budget when any clone-dependent indicator is requested, otherwise the scan skips clone. Progress SHALL stream via `/api/scan` NDJSON as unified `progress` frames (pct/elapsed/remaining/completed cost) plus a single header frame with `budgetMs`/`indicatorCount`, without a separate Phase 1 / Phase 2 report. Phases SHALL NOT be surfaced in UI or API contract; they remain an internal build detail.

#### Scenario: Phase 1 seals before Phase 2
- **WHEN** user visits `/live?repo=vercel/next.js` with 19 requested indicators
- **THEN** the scan computes one unified `budgetMs` (~240s), runs GH and clone detectors under that deadline, streams unified progress, and renders the single final report once (no intermediate Phase 1 seal)

#### Scenario: Phase 2 budget exceeded degrades
- **WHEN** unified budget expires with `ARCH-01` still running
- **THEN** final report is `degraded` with completed rows `measured` and timed-out rows `unknown "budget-exceeded"` (or `estimated+scope-limited` for dissolvable), and no intermediate report was shown

#### Scenario: Budget computed from requested list
- **WHEN** requested IDs are the 19 MVP indicators (mix of fast/api/slow with clone)
- **THEN** `budgetMs` ≈ 240s and the top progress bar advances via `elapsed/budgetMs` plus completed-cost weighting, reaching 100% only at seal

#### Scenario: Clone skipped when not needed
- **WHEN** requested IDs are GH-only (e.g. 6 indicators)
- **THEN** clone is omitted, budget uses base `5s` (not `30s`), and the header frame reports the smaller `budgetMs`

