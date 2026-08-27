## Why

Phase 1 is the fastest path to a shippable, shareable LeapScore: a GitHub-API-only scan that scores any public repo in <10s without cloning. `docs/plans/13_MVP_SLICE.md:77-80` defines it as the hero-dial step of the two-phase MVP — 6 Tier-A `measured` indicators across VEL/SEC/TEST plus repo metadata, returned before the heavy clone phase. Building Phase 1 first de-risks the virality loop (paste URL → brutal-but-believable score → screenshot), proves the GH token/budget plumbing (`docs/plans/05:4`, `docs/plans/08`), and gives the site a real provider behind `apps/site/lib/provider.ts` instead of `sample.ts` fixture data. Waiting for the full 19-indicator Phase 2 defers that loop by weeks.

## What Changes

- Engine orchestrator Phase 1 pipeline: `ingest → fetch → gh-api detectors → fact-store → scorer → report` with no `clonePath`, hard 10s budget, fail-open semantics (any GH failure → `unknown` or degraded, never blocks report).
- Rate-limited GH client with shared token bucket, per-detector `api-budgeted` handling (exhaustion → `unknown "rate-limited"` per `docs/specs/README.md:4`).
- Detectors (or GH-adapter facts) for 6 indicators: VEL-06 bus factor (`git log` shim via GH commits API + `shortlog` fallback note), VEL-09 PR hygiene (`GET /pulls`), VEL-08 manual releases (CI deploy-job audit via `GET /repos/{o}/{r}/actions/workflows` + `contents:.github/workflows`), VEL-10 branching topology (branch list API + git refs), SEC-07 patch cadence (Dependabot config + open bot PR ages), TEST-08 quality gates in CI (workflow YAML via contents API + `GET /repos/{o}/{r}/actions/workflows`).
- Minimal scorer rollup for Phase 1: 3 categories partially scored (VEL 4 rows, SEC 1 row, TEST 1 row) with `measured`/`unknown` only (no `estimated` for MVP per `13:29`), coverage bar `6/102` (or `6/19` MVP view), gates G1/G2/G3/G8 as `needs-verification` except where GH evidence suffices.
- Report contract: hero dial + coverage strip + gate cockpit (4 `needs-verification`) + category table (3 rows) per `13:90-98` W10 teaser subset; site `ReportProvider` seam swapped from fixture to live Phase 1 facts.
- New dedicated live report page at `/live` (alias `/report/live`) — query `?repo={owner}/{repo}` (`/live?repo=vercel/next.js`), renders the same W10 teaser but from live Phase-1 facts; `/report/sample` remains the illustrative django/django fixture. Shareable URL, 404 only on `snapshot_refused`.
- “Score this repo” CTA wired to live: `apps/site/components/url-box.tsx` `action="/live"` (client `router.push`), pasted URL is normalized (`github.com/o/r` → `o/r`) and navigates to `/live?repo=o/r`. Live page streams the 10s scan with visible progress (ingest → GH fetch → detectors → scorer) and then replaces the progress with the report. Rate-limit/404 shows `snapshot_refused` with retry hint instead of a blank score.
- No clone, no heavy tools (`lizard`/`jscpd`/`trivy`/`gitleaks` are Phase 2), no execution of repo code (D5).

## Capabilities

### New Capabilities
- `scan-phase-1`: GH-API-only scan pipeline, 6-indicator fact emission, Phase-1 report shape, and fail-open/budget semantics. This is the sole spec for this change.

### Modified Capabilities
<!-- No existing openspec/specs to modify — repo starts with empty spec set. Phase 2 will extend this capability. -->

## Impact

- **Packages**: `packages/engine` (orchestrator, `gh` client, budget, store, scorer partial), `packages/detectors/vel-06, vel-08, vel-09, vel-10, sec-07, test-08` manifests/schemas/detectors.
- **Site**: `apps/site/components/url-box.tsx` (Score CTA → `/live`), `apps/site/lib/provider.live.ts`, `apps/site/app/live/page.tsx` (streaming + `LiveProgress` client) + alias `/report/live`, `apps/site/app/api/scan/route.ts` (or server-action stream) for `runPhase1Scan` progress, `app/report/sample/page.tsx` stays fixture, `lib/scoring.ts`, report components.
- **APIs**: GitHub REST (`/repos`, `/pulls`, `/actions/workflows`, `contents`); token pool + rate-limit backoff.
- **Non-goals**: Phase 2 clone path, ECOS/ARCH detectors, heavy static analyzers, dual-headline MVP renorm (Phase 2), persistence beyond fact-store replay, private-repo App flow (`08`).
